"""
rag.py — Retrieval-Augmented Generation
=========================================
Combines retrieved context chunks with the user's query to generate
an answer using an LLM (OpenAI GPT-4o-mini by default).
"""

import os
from openai import OpenAI


def _get_openai_client() -> OpenAI:
    """Create an OpenAI client using the API key from environment variables."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        raise ValueError(
            "OPENAI_API_KEY is not set or still has the placeholder value. "
            "Set it in your .env file with a valid OpenAI API key."
        )
    return OpenAI(api_key=api_key)


def build_prompt(query: str, context_chunks: list[str]) -> str:
    """
    Build a RAG prompt by combining the user's question with
    the retrieved context chunks.
    """
    numbered = []
    for i, chunk in enumerate(context_chunks, start=1):
        numbered.append(f"[Chunk {i}]\n{chunk}")

    context = "\n\n".join(numbered)

    return f"""You are a helpful assistant that answers questions based ONLY on the provided context.
If the answer cannot be found in the context, say "I don't have enough information to answer this question."

─── CONTEXT ───
{context}

─── QUESTION ───
{query}

─── ANSWER ───"""


def generate_answer(
    query: str,
    context_chunks: list[str],
    model: str = "gpt-4o-mini",
    temperature: float = 0.3,
) -> str:
    """
    Generate an answer by sending a RAG prompt to the OpenAI API.

    Args:
        query: The user's question.
        context_chunks: Relevant text chunks from the vector store.
        model: OpenAI model to use (default: gpt-4o-mini).
        temperature: Sampling temperature (default: 0.3).

    Returns:
        The LLM's answer as a string.
    """
    prompt = build_prompt(query, context_chunks)
    client = _get_openai_client()

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a precise assistant that answers questions "
                               "strictly based on the given context.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=temperature,
            max_tokens=1024,
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        raise RuntimeError(f"LLM API call failed: {e}") from e
