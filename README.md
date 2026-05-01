# 📚 RAG Project — Retrieval-Augmented Generation API

A complete end-to-end **Retrieval-Augmented Generation (RAG)** backend built with Python and FastAPI. It syncs documents from Google Drive, processes them into vector embeddings, and answers user questions using relevant context + an LLM.

---

## ✨ Features

- **Google Drive Integration** — Fetch PDF, TXT, DOCX, and Google Docs from a shared folder
- **Smart Text Processing** — Extract text from multiple formats, split into overlapping word-boundary chunks
- **Vector Embeddings** — Generate embeddings using `all-MiniLM-L6-v2` (sentence-transformers)
- **FAISS Vector Search** — Fast similarity search with save/load persistence
- **LLM-Powered Answers** — Context-aware answers via OpenAI GPT-4o-mini
- **RESTful API** — Clean FastAPI endpoints with automatic Swagger documentation

---

## 🏗️ Architecture

```
User Query
    │
    ▼
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐
│  /query  │───▶│ embedding.py │───▶│vectorstore.py│───▶│  rag.py  │
│ endpoint │    │ (embed query)│    │(FAISS search)│    │(LLM call)│
└──────────┘    └──────────────┘    └──────────────┘    └──────────┘
                                                              │
                                                              ▼
                                                         Answer + Sources
```

```
┌──────────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────────┐
│ /sync-drive  │───▶│ drive.py │───▶│ embedding.py │───▶│vectorstore.py│
│   endpoint   │    │(download)│    │(extract/chunk│    │ (FAISS store)│
└──────────────┘    └──────────┘    │   /embed)    │    └──────────────┘
                                    └──────────────┘
```

---

## 📁 Project Structure

```
rag-project/
├── main.py            # FastAPI app — /sync-drive, /query, /health endpoints
├── drive.py           # Google Drive integration (auth, list, download)
├── embedding.py       # Text extraction, chunking, and embeddings
├── vectorstore.py     # FAISS vector store with save/load
├── rag.py             # Retrieval + LLM answer generation
├── requirements.txt   # Python dependencies
├── .env               # Environment variables (API keys, folder ID)
├── .gitignore         # Git ignore rules
└── faiss_store/       # Auto-generated FAISS index files (after sync)
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- A Google Cloud service account with Drive API enabled
- An OpenAI API key

### 1. Clone the Repository

```bash
git clone https://github.com/vamsi2246/rag-project.git
cd rag-project
```

### 2. Create & Activate Virtual Environment

```bash
python -m venv venv
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate         # Windows
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the project root (or edit the existing one):

```env
OPENAI_API_KEY=sk-your-openai-api-key
GOOGLE_APPLICATION_CREDENTIALS=your-service-account.json
GOOGLE_DRIVE_FOLDER_ID=your-drive-folder-id
```

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key for GPT-4o-mini |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to your Google Cloud service account JSON file |
| `GOOGLE_DRIVE_FOLDER_ID` | The ID of the Google Drive folder to sync (from the folder URL) |

### 5. Share Your Drive Folder

Share the Google Drive folder with your service account email:
```
your-service-account@your-project.iam.gserviceaccount.com
```
Grant **Viewer** access.

### 6. Run the Server

```bash
uvicorn main:app --reload
```

The API will be available at `http://127.0.0.1:8000`

---

## 📡 API Endpoints

### `GET /health` — Health Check

Check if the server is running and whether the FAISS index is loaded.

```bash
curl http://127.0.0.1:8000/health
```

**Response:**
```json
{
  "status": "healthy",
  "index_loaded": false,
  "index_size": 0,
  "dimension": 384
}
```

---

### `POST /sync-drive` — Sync Documents from Google Drive

Fetch files from the configured Drive folder, process them, and build the FAISS index.

```bash
curl -X POST http://127.0.0.1:8000/sync-drive
```

Or with a custom folder ID:

```bash
curl -X POST http://127.0.0.1:8000/sync-drive \
  -H "Content-Type: application/json" \
  -d '{"folder_id": "your-folder-id-here"}'
```

**Response:**
```json
{
  "message": "✅ Drive sync completed successfully!",
  "files_processed": 3,
  "chunks_created": 42,
  "index_size": 42
}
```

---

### `POST /query` — Ask a Question

Ask a question and get an answer based on the synced documents.

```bash
curl -X POST http://127.0.0.1:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main topic of the documents?", "top_k": 5}'
```

**Response:**
```json
{
  "answer": "Based on the documents, the main topic is...",
  "sources": [
    {"text": "relevant chunk text...", "score": 0.45, "index": 3},
    {"text": "another relevant chunk...", "score": 0.52, "index": 7}
  ],
  "num_results": 5
}
```

---

## 📖 Interactive API Docs

FastAPI provides automatic interactive documentation:

- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **FastAPI** | Web framework for REST API |
| **FAISS** | Vector similarity search |
| **sentence-transformers** | Text embeddings (all-MiniLM-L6-v2) |
| **OpenAI API** | LLM for answer generation (GPT-4o-mini) |
| **Google Drive API** | Document fetching |
| **PyPDF2** | PDF text extraction |
| **python-docx** | DOCX text extraction |

---

## 🔄 How It Works

1. **Sync** (`/sync-drive`):
   - Connects to Google Drive via service account
   - Downloads all PDF, TXT, DOCX, and Google Docs files
   - Extracts text from each file
   - Splits text into overlapping chunks (500 words, 100 word overlap)
   - Generates vector embeddings for each chunk
   - Stores embeddings + chunks in a FAISS index (saved to disk)

2. **Query** (`/query`):
   - Converts the user's question into a vector embedding
   - Searches FAISS for the top-k most similar chunks
   - Combines the retrieved chunks into a context prompt
   - Sends the prompt to GPT-4o-mini for answer generation
   - Returns the answer along with source chunks

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
