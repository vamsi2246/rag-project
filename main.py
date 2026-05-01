"""
main.py — FastAPI Application
===============================
POST /sync-drive  →  Fetch files from Google Drive, process, store in FAISS
POST /query       →  Answer questions using retrieved context + LLM
GET  /health      →  Health check with index status

Run with:
  source venv/bin/activate
  uvicorn main:app --reload
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from drive import fetch_all_files
from embedding import process_documents, get_embeddings
from vectorstore import VectorStore
from rag import generate_answer

# ── Load .env first ────────────────────────────────────────────
load_dotenv()

# ── Global vector store ────────────────────────────────────────
EMBEDDING_DIM = 384
vector_store = VectorStore(EMBEDDING_DIM)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load saved FAISS index on startup if it exists."""
    global vector_store
    try:
        vector_store = VectorStore.load("faiss_store")
        print(f"🚀 Loaded existing index: {vector_store}")
    except FileNotFoundError:
        print("ℹ️  No saved index found. Use POST /sync-drive to create one.")
    yield
    print("👋 Shutting down RAG server.")


# ── FastAPI app ────────────────────────────────────────────────
app = FastAPI(
    title="RAG API",
    description="Retrieval-Augmented Generation backend with Google Drive integration.",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow the React dev server to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response models ──────────────────────────────────
class SyncRequest(BaseModel):
    folder_id: str | None = Field(
        default=None,
        description="Drive folder ID. Falls back to GOOGLE_DRIVE_FOLDER_ID env var.",
    )


class SyncResponse(BaseModel):
    message: str
    files_processed: int
    chunks_created: int
    index_size: int


class QueryRequest(BaseModel):
    question: str = Field(..., description="The question to answer.")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of chunks to retrieve.")


class QueryResponse(BaseModel):
    answer: str
    sources: list[dict]
    num_results: int


class HealthResponse(BaseModel):
    status: str
    index_loaded: bool
    index_size: int
    dimension: int


# ── POST /sync-drive ───────────────────────────────────────────
@app.post("/sync-drive", response_model=SyncResponse)
def sync_drive(request: SyncRequest = SyncRequest()):
    """
    Fetch files from Google Drive, extract text, create embeddings,
    and store in the FAISS vector store.
    """
    global vector_store

    folder_id = request.folder_id or os.getenv("GOOGLE_DRIVE_FOLDER_ID")
    if not folder_id or folder_id == "your_drive_folder_id_here":
        raise HTTPException(
            status_code=400,
            detail=(
                "No folder ID provided. Set GOOGLE_DRIVE_FOLDER_ID in .env "
                "or pass folder_id in the request body."
            ),
        )

    try:
        files = fetch_all_files(folder_id)
        if not files:
            raise HTTPException(
                status_code=404,
                detail="No supported files found in the Drive folder.",
            )

        chunks, embeddings = process_documents(files)
        vector_store.clear()
        vector_store.add(embeddings, chunks)
        vector_store.save("faiss_store")

        return SyncResponse(
            message="✅ Drive sync completed successfully!",
            files_processed=len(files),
            chunks_created=len(chunks),
            index_size=len(vector_store),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")


# ── POST /query ────────────────────────────────────────────────
@app.post("/query", response_model=QueryResponse)
def query(request: QueryRequest):
    """
    Embed the question, search FAISS for relevant chunks,
    and generate an answer using the LLM.
    """
    global vector_store

    if len(vector_store) == 0:
        raise HTTPException(
            status_code=400,
            detail="Vector store is empty. Run POST /sync-drive first to load documents.",
        )

    try:
        query_embedding = get_embeddings([request.question])[0]
        results = vector_store.search(query_embedding, k=request.top_k)
        context_chunks = [r["text"] for r in results]
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


# ── GET /health ────────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse)
def health():
    """Check server status and vector store info."""
    return HealthResponse(
        status="healthy",
        index_loaded=len(vector_store) > 0,
        index_size=len(vector_store),
        dimension=vector_store.dimension,
    )