// api.js — Centralised API calls to the FastAPI backend

const BASE_URL = 'http://127.0.0.1:8000';

// Health check
export async function checkHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error('Server is not reachable');
  return res.json();
}

// POST /sync-drive — Sync documents from Google Drive
export async function syncDrive(folderId = null) {
  const body = folderId ? { folder_id: folderId } : {};
  const res = await fetch(`${BASE_URL}/sync-drive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Sync failed');
  return data;
}

// POST /query — Ask a question
export async function queryRAG(question, topK = 5) {
  const res = await fetch(`${BASE_URL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, top_k: topK }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Query failed');
  return data;
}
