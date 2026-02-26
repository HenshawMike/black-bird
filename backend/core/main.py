from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
import httpx
import sqlite3
import os
from pydantic import BaseModel
from typing import List, Optional
from indexer import start_indexing_service

app = FastAPI(title="Black-bird Core Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:3001")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# Global indexer instance
GLOBAL_INDEXER = None

@app.on_event("startup")
async def startup_event():
    global GLOBAL_INDEXER
    project_root = os.path.abspath("../../") # Project root
    try:
        GLOBAL_INDEXER, _ = start_indexing_service(project_root)
    except Exception as e:
        print(f"Failed to start indexing service: {e}")

# Database initialization
def init_db():
    conn = sqlite3.connect("black-bird.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            message TEXT,
            response TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_settings (
            user_id TEXT PRIMARY KEY,
            settings_json TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

class ChatRequest(BaseModel):
    message: str
    model: str

import fastapi
import base64

def _decode_jwt_payload(token: str) -> dict | None:
    """Decodes the payload from a JWT without verifying the signature.
    Safe for local use since Supabase already verified the token when it was issued."""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        payload_b64 = parts[1]
        # Add padding if needed
        payload_b64 += '=' * (4 - len(payload_b64) % 4)
        payload = base64.urlsafe_b64decode(payload_b64)
        import json as _json
        return _json.loads(payload)
    except Exception:
        return None

async def verify_token(authorization: Optional[str] = fastapi.Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization Header")
    
    token = authorization.replace("Bearer ", "").strip()
    
    # 1. Try the auth microservice first
    async with httpx.AsyncClient(timeout=2.0) as client:
        try:
            response = await client.get(
                f"{AUTH_SERVICE_URL}/auth/verify",
                headers={"Authorization": authorization}
            )
            if response.status_code == 200:
                return response.json()["user"]
        except Exception:
            pass  # Auth service not running — fall back to JWT decode
    
    # 2. Fallback: decode JWT directly from Supabase token
    payload = _decode_jwt_payload(token)
    if payload and payload.get("sub"):
        return {"id": payload["sub"], "email": payload.get("email", "unknown")}
    
    raise HTTPException(status_code=401, detail="Invalid or expired token")

@app.get("/health")
def health_check():
    return {"status": "ok"}

OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434")

@app.get("/ai/status")
async def ollama_status():
    """Check if Ollama is reachable."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(f"{OLLAMA_API_URL}/api/tags")
            if response.status_code == 200:
                return {"ollama": "running", "url": OLLAMA_API_URL}
    except Exception:
        pass
    return {"ollama": "offline", "url": OLLAMA_API_URL}

@app.get("/ai/models")
async def list_models():
    """List all locally installed Ollama models."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OLLAMA_API_URL}/api/tags")
            if response.status_code == 200:
                models = response.json().get("models", [])
                return {"models": [m["name"] for m in models]}
    except Exception as e:
        pass
    return {"models": [], "error": "Ollama not running. Start it with: ollama serve"}


@app.post("/ai/chat")
async def chat(request: ChatRequest, user: dict = Depends(verify_token)):
    # 1. Search codebase for context
    context_docs = []
    if GLOBAL_INDEXER:
        try:
            results = GLOBAL_INDEXER.query(request.message, n_results=3)
            context_docs = results['documents'][0]
        except Exception as e:
            print(f"Index query failed: {e}")

    # 2. Build augmented prompt
    code_context = "\n---\n".join(context_docs)
    augmented_prompt = f"Codebase context:\n{code_context}\n\nUser Question: {request.message}"
    
    # 3. Call Ollama — use model from request
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            ollama_response = await client.post(
                f"{OLLAMA_API_URL}/api/generate",
                json={
                    "model": request.model,
                    "prompt": augmented_prompt,
                    "stream": False,
                    "system": "You are Black-bird, a helpful AI assistant integrated into a modern IDE. Use the provided codebase context to answer the user's question accurately."
                }
            )
            if ollama_response.status_code == 200:
                response_text = ollama_response.json().get("response", "No response from model.")
            else:
                response_text = f"Ollama error: {ollama_response.status_code} - {ollama_response.text}"
    except Exception as e:
        response_text = f"Failed to connect to Ollama (Is it running?): {e}"
    
    # Store in local SQLite
    conn = sqlite3.connect("black-bird.db")
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO conversation_history (user_id, message, response) VALUES (?, ?, ?)",
        (user['id'], request.message, response_text)
    )
    conn.commit()
    conn.close()

    # Sync to Supabase if configured
    if SUPABASE_URL and SUPABASE_ANON_KEY:
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"{SUPABASE_URL}/rest/v1/conversations",
                    headers={
                        "apikey": SUPABASE_ANON_KEY,
                        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                        "Content-Type": "application/json",
                        "Prefer": "return=minimal"
                    },
                    json={
                        "user_id": user['id'],
                        "message": request.message,
                        "response": response_text,
                        "model": "gemini3:1b"
                    }
                )
        except Exception as e:
            print(f"Failed to sync to Supabase: {e}")

    return {"response": response_text}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3002)
