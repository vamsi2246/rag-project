from fastapi import FastAPI
from pydantic import BaseModel
from main import index, get_embedding
from api.llm import generate_answer

app = FastAPI()

class Query(BaseModel):
    question: str

@app.post("/ask")
def ask(q: Query):
    query_embedding = get_embedding([q.question])[0]
    results = index.search(query_embedding)

    context = "\n".join(results)
    answer = generate_answer(context, q.question)

    return {"answer": answer}