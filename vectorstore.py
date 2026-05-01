"""
vectorstore.py — FAISS Vector Store
=====================================
Manages the FAISS index for similarity search. Supports adding vectors,
searching for nearest neighbors, and saving/loading the index to/from disk.
"""

import os
import json
import faiss
import numpy as np


class VectorStore:
    """
    A wrapper around FAISS IndexFlatL2 that also stores the original
    text chunks alongside their vector embeddings.

    Usage:
        store = VectorStore(dimension=384)
        store.add(embeddings, chunks)
        results = store.search(query_vector, k=5)
        store.save("faiss_store")
        store = VectorStore.load("faiss_store")
    """

    def __init__(self, dimension: int):
        """
        Initialize an empty vector store.

        Args:
            dimension: The size of each embedding vector
                       (384 for all-MiniLM-L6-v2).
        """
        self.dimension = dimension
        self.index = faiss.IndexFlatL2(dimension)  # L2 (Euclidean) distance
        self.chunks: list[str] = []                # Parallel list of text chunks

    def add(self, embeddings: np.ndarray, chunks: list[str]) -> None:
        """
        Add embeddings and their corresponding text chunks to the store.

        Args:
            embeddings: numpy array of shape (n, dimension).
            chunks: List of n text strings matching the embeddings.

        Raises:
            ValueError: If embeddings and chunks have different lengths.
        """
        if len(embeddings) != len(chunks):
            raise ValueError(
                f"Mismatch: {len(embeddings)} embeddings vs {len(chunks)} chunks"
            )

        # Ensure correct dtype for FAISS
        embeddings = np.array(embeddings, dtype=np.float32)
        self.index.add(embeddings)
        self.chunks.extend(chunks)

    def search(self, query_embedding: np.ndarray, k: int = 5) -> list[dict]:
        """
        Find the top-k most similar chunks to a query embedding.

        Args:
            query_embedding: A single embedding vector (1D array).
            k: Number of results to return (default: 5).

        Returns:
            A list of dicts, each containing:
            - "text": The matched chunk text.
            - "score": The L2 distance (lower = more similar).
            - "index": The position in the store.

        Raises:
            ValueError: If the store is empty.
        """
        if self.index.ntotal == 0:
            raise ValueError(
                "Vector store is empty. Run /sync-drive first to load documents."
            )

        # Don't request more results than we have
        k = min(k, self.index.ntotal)

        # Reshape to (1, dimension) for FAISS
        query = np.array([query_embedding], dtype=np.float32)
        distances, indices = self.index.search(query, k)

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < len(self.chunks):  # Safety check
                results.append({
                    "text": self.chunks[idx],
                    "score": float(dist),
                    "index": int(idx),
                })

        return results

    def save(self, directory: str = "faiss_store") -> None:
        """
        Save the FAISS index and text chunks to disk.

        Creates two files:
        - faiss_index.bin — the FAISS index binary
        - chunks.json — the text chunks as a JSON array

        Args:
            directory: Path to the save directory (created if needed).
        """
        os.makedirs(directory, exist_ok=True)

        # Save FAISS index
        index_path = os.path.join(directory, "faiss_index.bin")
        faiss.write_index(self.index, index_path)

        # Save text chunks
        chunks_path = os.path.join(directory, "chunks.json")
        with open(chunks_path, "w", encoding="utf-8") as f:
            json.dump(self.chunks, f, ensure_ascii=False, indent=2)

        # Save metadata
        meta_path = os.path.join(directory, "metadata.json")
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump({
                "dimension": self.dimension,
                "num_vectors": self.index.ntotal,
                "num_chunks": len(self.chunks),
            }, f, indent=2)

        print(f"💾 Vector store saved to '{directory}/' "
              f"({self.index.ntotal} vectors, {len(self.chunks)} chunks)")

    @classmethod
    def load(cls, directory: str = "faiss_store") -> "VectorStore":
        """
        Load a previously saved vector store from disk.

        Args:
            directory: Path to the directory containing saved files.

        Returns:
            A populated VectorStore instance.

        Raises:
            FileNotFoundError: If the save directory or files don't exist.
        """
        index_path = os.path.join(directory, "faiss_index.bin")
        chunks_path = os.path.join(directory, "chunks.json")

        if not os.path.exists(index_path) or not os.path.exists(chunks_path):
            raise FileNotFoundError(
                f"No saved vector store found in '{directory}/'. "
                "Run /sync-drive first to create one."
            )

        # Load FAISS index
        index = faiss.read_index(index_path)

        # Load text chunks
        with open(chunks_path, "r", encoding="utf-8") as f:
            chunks = json.load(f)

        # Load metadata to get dimension
        meta_path = os.path.join(directory, "metadata.json")
        if os.path.exists(meta_path):
            with open(meta_path, "r", encoding="utf-8") as f:
                meta = json.load(f)
                dimension = meta["dimension"]
        else:
            dimension = index.d  # Fallback: get dimension from FAISS index

        # Reconstruct the VectorStore
        store = cls(dimension)
        store.index = index
        store.chunks = chunks

        print(f"📂 Vector store loaded from '{directory}/' "
              f"({store.index.ntotal} vectors, {len(store.chunks)} chunks)")

        return store

    def clear(self) -> None:
        """Reset the store — remove all vectors and chunks."""
        self.index = faiss.IndexFlatL2(self.dimension)
        self.chunks = []
        print("🗑️  Vector store cleared.")

    def __len__(self) -> int:
        """Return the number of vectors in the store."""
        return self.index.ntotal

    def __repr__(self) -> str:
        return (
            f"VectorStore(dimension={self.dimension}, "
            f"vectors={self.index.ntotal}, chunks={len(self.chunks)})"
        )
