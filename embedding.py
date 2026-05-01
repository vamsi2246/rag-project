"""
embedding.py — Text Extraction, Chunking & Embeddings
======================================================
Handles the full document processing pipeline:
1. Extract text from various file formats (PDF, DOCX, TXT)
2. Split text into overlapping chunks for better retrieval
3. Generate vector embeddings using sentence-transformers
"""

import io
import numpy as np
from PyPDF2 import PdfReader
from docx import Document
from sentence_transformers import SentenceTransformer


# ──────────────────────────────────────────────
# Lazy-loaded embedding model (loaded once, reused)
# ──────────────────────────────────────────────
_model = None


def get_embedding_model() -> SentenceTransformer:
    """
    Load the sentence-transformer model (lazy initialization).
    The model is loaded only once and cached in memory.

    Returns:
        SentenceTransformer: The loaded embedding model.
    """
    global _model
    if _model is None:
        print("🔄 Loading embedding model (all-MiniLM-L6-v2)...")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        print("✅ Embedding model loaded!\n")
    return _model


# ──────────────────────────────────────────────
# Text Extraction (PDF, DOCX, TXT)
# ──────────────────────────────────────────────
def extract_text_from_pdf(content_bytes: bytes) -> str:
    """Extract text from a PDF file's raw bytes."""
    reader = PdfReader(io.BytesIO(content_bytes))
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text)
    return "\n".join(pages)


def extract_text_from_docx(content_bytes: bytes) -> str:
    """Extract text from a DOCX file's raw bytes."""
    doc = Document(io.BytesIO(content_bytes))
    paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
    return "\n".join(paragraphs)


def extract_text_from_txt(content_bytes: bytes) -> str:
    """Decode plain text bytes to a string."""
    return content_bytes.decode("utf-8", errors="replace")


def extract_text(filename: str, content_bytes: bytes, mime_type: str) -> str:
    """
    Extract text from a file based on its MIME type or extension.

    Args:
        filename: The name of the file (used for extension fallback).
        content_bytes: The raw file content as bytes.
        mime_type: The MIME type of the file.

    Returns:
        Extracted text as a string.

    Raises:
        ValueError: If the file format is not supported.
    """
    # Determine the parser based on MIME type
    if mime_type == "application/pdf" or filename.lower().endswith(".pdf"):
        return extract_text_from_pdf(content_bytes)

    elif (
        mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        or filename.lower().endswith(".docx")
    ):
        return extract_text_from_docx(content_bytes)

    elif (
        mime_type in ("text/plain", "application/vnd.google-apps.document")
        or filename.lower().endswith(".txt")
    ):
        return extract_text_from_txt(content_bytes)

    else:
        raise ValueError(f"Unsupported file format: {filename} ({mime_type})")


# ──────────────────────────────────────────────
# Text Chunking (word-boundary aware, with overlap)
# ──────────────────────────────────────────────
def chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> list[str]:
    """
    Split text into overlapping chunks using word boundaries.

    Instead of cutting mid-word (character-based splitting), this function
    splits on word boundaries for cleaner chunks. The chunk_size and overlap
    are measured in *words* (approximate token count).

    Args:
        text: The full text to split.
        chunk_size: Target number of words per chunk (default: 500).
        overlap: Number of overlapping words between chunks (default: 100).

    Returns:
        A list of text chunks. Empty list if input text is empty.
    """
    # Split into words
    words = text.split()
    if not words:
        return []

    chunks = []
    start = 0
    step = chunk_size - overlap  # How far to advance the window each iteration

    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])

        # Only add non-empty chunks
        if chunk.strip():
            chunks.append(chunk)

        start += step

    return chunks


# ──────────────────────────────────────────────
# Embedding Generation
# ──────────────────────────────────────────────
def get_embeddings(texts: list[str]) -> np.ndarray:
    """
    Convert a list of text chunks into vector embeddings.

    Args:
        texts: List of text strings to embed.

    Returns:
        numpy.ndarray: Matrix of shape (len(texts), embedding_dim).
    """
    model = get_embedding_model()
    embeddings = model.encode(texts, show_progress_bar=True)
    return np.array(embeddings, dtype=np.float32)


# ──────────────────────────────────────────────
# Full Document Processing Pipeline
# ──────────────────────────────────────────────
def process_documents(
    files: list[tuple[str, bytes, str]],
    chunk_size: int = 500,
    overlap: int = 100,
) -> tuple[list[str], np.ndarray]:
    """
    Process a list of files through the full pipeline:
    extract text → chunk → generate embeddings.

    Args:
        files: List of (filename, content_bytes, mime_type) tuples.
        chunk_size: Words per chunk (default: 500).
        overlap: Overlap between chunks (default: 100).

    Returns:
        A tuple of (all_chunks, all_embeddings):
        - all_chunks: List of text chunk strings.
        - all_embeddings: numpy array of shape (num_chunks, embedding_dim).

    Raises:
        ValueError: If no text could be extracted from any files.
    """
    all_chunks = []

    for filename, content_bytes, mime_type in files:
        try:
            # Step 1: Extract text
            text = extract_text(filename, content_bytes, mime_type)
            if not text.strip():
                print(f"  ⚠ No text found in: {filename}")
                continue

            # Step 2: Chunk the text
            chunks = chunk_text(text, chunk_size, overlap)
            print(f"  📄 {filename} → {len(chunks)} chunk(s)")
            all_chunks.extend(chunks)

        except Exception as e:
            print(f"  ✗ Error processing {filename}: {e}")

    if not all_chunks:
        raise ValueError("No text chunks were created from the provided files.")

    # Step 3: Generate embeddings for all chunks
    print(f"\n🔢 Generating embeddings for {len(all_chunks)} chunk(s)...")
    all_embeddings = get_embeddings(all_chunks)
    print(f"✅ Embeddings generated! Shape: {all_embeddings.shape}\n")

    return all_chunks, all_embeddings
