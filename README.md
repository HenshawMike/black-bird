# 🐦‍⬛ BLACK BIRD

> A local-first AI-powered IDE built with React, FastAPI, and Ollama — runs entirely on your machine.

---

## ✨ Features

- **AI Chat Panel** — Ask questions about your codebase, powered by local Ollama models
- **Live Codebase Indexing** — Fast parallel indexer with caching (`FastIndexer`) using `nomic-embed-text` embeddings
- **GitHub OAuth** — Authentication via Supabase + GitHub
- **Model Selector** — Auto-detects installed Ollama models at runtime
- **Ollama Status Indicator** — Shows live Ollama connection status in the UI
- **IDE Shell** — VS Code-inspired UI with file explorer, tabs, terminal panel, and status bar
- **Settings Page** — Configure your environment from within the app

---

## 🏗️ Architecture

```
black-bird/
├── src/                    # React frontend (Vite + TypeScript)
│   ├── components/
│   │   ├── MainIDE.tsx     # Main IDE shell
│   │   ├── AuthScreen.tsx  # GitHub login screen
│   │   └── SettingsPage.tsx
│   ├── services/
│   │   └── ai.ts           # API client for core backend
│   └── lib/
│       └── supabase.ts     # Supabase client
│
└── backend/
    ├── auth/               # Auth microservice (Node.js / Express)
    │   └── src/index.ts    # /auth/verify endpoint
    └── core/               # Core AI service (Python / FastAPI)
        ├── main.py         # REST API (chat, models, status)
        └── indexer.py      # FastIndexer — parallel codebase indexer
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) |
| pnpm | latest | `npm i -g pnpm` |
| Python | ≥ 3.11 | [python.org](https://python.org) |
| Ollama | latest | [ollama.ai](https://ollama.ai) |

### 1. Clone & Install

```bash
git clone https://github.com/your-username/black-bird.git
cd black-bird

# Frontend
pnpm install

# Core backend
cd backend/core
python -m venv venv
.\venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

### 2. Environment Variables

Copy and fill in the `.env` files:

```bash
# Root .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# backend/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
AUTH_SERVICE_URL=http://localhost:3001
OLLAMA_API_URL=http://localhost:11434
```

### 3. Pull an Ollama Model

```bash
ollama serve          # Start Ollama
ollama pull gemma3:1b # Pull a model (~800MB)
```

### 4. Start Everything

```bash
# Terminal 1 — Frontend
pnpm dev

# Terminal 2 — Core backend (AI + Indexer)
cd backend/core
.\venv\Scripts\python.exe main.py

# Terminal 3 — Auth service (optional, needed for token verification)
cd backend/auth
pnpm install && pnpm dev
```

---

## 🔌 API Endpoints (Core Service — port 3002)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | None | Health check |
| `GET` | `/ai/status` | None | Check if Ollama is running |
| `GET` | `/ai/models` | None | List installed Ollama models |
| `POST` | `/ai/chat` | JWT | Send a message, get AI response |

### Chat Request Body
```json
{
  "message": "What does the indexer do?",
  "model": "gemma3:1b"
}
```

---

## 🧠 How the AI Chat Works

1. User sends a message from the IDE chat panel
2. Core service queries the **FastIndexer** for relevant code context (RAG)
3. Context + message are sent to **Ollama** as an augmented prompt
4. Response is returned and stored locally in SQLite

---

## ⚡ FastIndexer

The `FastIndexer` provides fast, incremental codebase indexing:

- **Multi-threaded** — uses `ThreadPoolExecutor` with up to 16 workers
- **Cached** — skips unchanged files using `mtime + size` hashing (`.fastindexer_cache.json`)
- **Watched** — re-indexes files on save via `watchdog`
- **First run:** ~30 seconds for a typical project
- **Subsequent runs:** < 3 seconds (cache hit)

---

## 🔐 Authentication

- GitHub OAuth via **Supabase Auth**
- JWT is decoded locally if the auth microservice is offline (graceful fallback)
- No GitHub tokens are stored — only Supabase session JWTs are used

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Vite, Framer Motion |
| Styling | CSS Modules |
| Backend (Core) | Python, FastAPI, uvicorn, httpx |
| Backend (Auth) | Node.js, Express, TypeScript |
| AI Runtime | Ollama (local LLM) |
| Embeddings | `nomic-embed-text` via Ollama |
| Vector DB | ChromaDB (local) |
| Auth | Supabase + GitHub OAuth |
| DB | SQLite (conversation history) |
