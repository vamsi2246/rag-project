from openai import OpenAI

client = OpenAI(api_key="YOUR_API_KEY")

def generate_answer(context, query):
    prompt = f"""
    Answer using only this context:
    {context}

    Question: {query}
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content