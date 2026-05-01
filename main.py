from data.store import load_text
from processing.chunker import chunk_text
from embedding.model import get_embedding
from search.faiss_index import FAISSIndex

# Step 1: Load data
text = load_text()

# Step 2: Chunk
chunks = chunk_text(text)

# Step 3: Embeddings
embeddings = get_embedding(chunks)

# Step 4: Create index
dim = len(embeddings[0])
index = FAISSIndex(dim)

index.add(embeddings, chunks)

# Step 5: Query
query = input("Ask something: ")

query_embedding = get_embedding([query])[0]

results = index.search(query_embedding)

print("\nTop Results:")
for r in results:
    print("-", r)