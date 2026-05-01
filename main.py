"""
main.py — FastAPI Application
===============================
The entry point for the RAG backend. Provides three endpoints:

  POST /sync-drive  →  Fetch files from Google Drive, process, and store in FAISS
  POST /query       →  Answer user questions using retrieved context + LLM
  GET  /health      →  Health check with index status

Run with:
  uvicorn main:app --reload
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from drive import fetch_all_files
from embedding import process_documents, get_embeddings
from vectorstore import VectorStore
from rag import generate_answer


# ──────────────────────────────────────────────
# Load environment variables from .env file
# ──────────────────────────────────────────────
load_dotenv()

# Embedding dimension for all-MiniLM-L6-v2
EMBEDDING_DIM = 384

# Global vector store instance
vector_store = VectorStore(EMBEDDING_DIM)


# ──────────────────────────────────────────────
# Startup: try to load a previously saved index
# ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load saved FAISS index on startup if it exists."""
    global vector_store
    try:
        vector_store = VectorStore.load("faiss_store")
        print(f"🚀 Loaded existing index: {vector_store}")
    except FileNotFoundError:
        print("ℹ️  No saved index found. Use POST /sync-drive to create one.")
    yield  # App runs here
    print("👋 Shutting down RAG server.")


# ──────────────────────────────────────────────
# FastAPI App
# ──────────────────────────────────────────────
app = FastAPI(
    title="RAG API",
    description=(
        "A Retrieval-Augmented Generation backend that syncs documents from "
        "Google Drive, stores them as vector embeddings in FAISS, and answers "
        "questions using an LLM."
    ),
    version="1.0.0",
    lifespan=lifespan,
)


# ──────────────────────────────────────────────
# Request / Response Models
# ──────────────────────────────────────────────
class SyncRequest(BaseModel):
    """Request body for the /sync-drive endpoint."""
    folder_id: str | None = Field(
        default=None,
        description="Google Drive folder ID. Falls back to GOOGLE_DRIVE_FOLDER_ID env var.",
    )

class SyncResponse(BaseModel):
    """Response from the /sync-drive endpoint."""
    message: str
    files_processed: int
    chunks_created: int
    index_size: int

class QueryRequest(BaseModel):
    """Request body for the /query endpoint."""
    question: str = Field(..., description="The question to answer.")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of chunks to retrieve.")

class QueryResponse(BaseModel):
    """Response from the /query endpoint."""
    answer: str
    sources: list[dict]
    num_results: int

class HealthResponse(BaseModel):
    """Response from the /health endpoint."""
    status: str
    index_loaded: bool
    index_size: int
    dimension: int


# ──────────────────────────────────────────────
# POST /sync-drive — Sync documents from Google Drive
# ──────────────────────────────────────────────
@app.post("/sync-drive", response_model=SyncResponse)
def sync_drive(request: SyncRequest = SyncRequest()):
    """
    Fetch files from a Google Drive folder, extract text, create
    embeddings, and store everything in the FAISS vector store.
    """
    global vector_store

    # Determine folder ID
    folder_id = request.folder_id or os.getenv("GOOGLE_DRIVE_FOLDER_ID")
    if not folder_id or folder_id == "your_drive_folder_id_here":
        raise HTTPException(
            status_code=400,
            detail="No folder ID provided. Set GOOGLE_DRIVE_FOLDER_ID in .env "
                   "or pass folder_id in the request body.",
        )

    try:
        # Step 1: Fetch files from Google Drive
        files = fetch_all_files(folder_id)
        if not files:
            raise HTTPException(
                status_code=404,
                detail="No supported files found in the Drive folder.",
            )

        # Step 2: Process documents (extract → chunk → embed)
        chunks, embeddings = process_documents(files)

        # Step 3: Clear old data and store new embeddings
        vector_store.clear()
        vector_store.add(embeddings, chunks)

        # Step 4: Save to disk for persistence
        vector_store.save("faiss_store")

        return SyncResponse(
            message="✅ Drive sync completed successfully!",
            files_processed=len(files),
            chunks_created=len(chunks),
            index_size=len(vector_store),
        )

    except HTTPException:
        raise  # Re-raise FastAPI exceptions as-is
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")


# ──────────────────────────────────────────────
# POST /query — Ask a question
# ──────────────────────────────────────────────
@app.post("/query", response_model=QueryResponse)
def query(request: QueryRequest):
    """
    Answer a question using RAG:
    1. Embed the question
    2. Search FAISS for relevant chunks
    3. Generate an answer using the LLM
    """
    global vector_store

    # Check if the index has data
    if len(vector_store) == 0:
        raise HTTPException(
            status_code=400,
            detail="Vector store is empty. Run POST /sync-drive first.",
        )

    try:
        # Step 1: Embed the user's question
        query_embedding = get_embeddings([request.question])[0]

        # Step 2: Search for relevant chunks
        results = vector_store.search(query_embedding, k=request.top_k)

        # Step 3: Extract the text chunks for the LLM
        context_chunks = [r["text"] for r in results]

        # Step 4: Generate answer using RAG
        answer = generate_answer(request.question, context_chunks)

        return QueryResponse(
            answer=answer,
            sources=results,
            num_results=len(results),
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


# ──────────────────────────────────────────────
# GET /health — Health check
# ──────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse)
def health():
    """Check the API status and vector store info."""
    return HealthResponse(
        status="healthy",
        index_loaded=len(vector_store) > 0,
        index_size=len(vector_store),
        dimension=vector_store.dimension,
    )