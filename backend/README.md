# Black-bird Backend Services

This directory contains the backend infrastructure for the Black-bird IDE, split into two primary services:

## 1. Auth Service (Node.js)
Handles Supabase JWT validation and session security.

### Setup
1. `cd auth`
2. `cp .env.example .env` (Add your Supabase credentials)
3. `pnpm install`
4. `pnpm dev`

## 2. Core Service (Python)
Handles AI orchestration, local workspace indexing (with Chroma DB), and settings persistence.

### Setup
1. `cd core`
2. `cp .env.example .env`
3. `./venv/Scripts/python main.py`

## Development Order
1. Start the **Auth Service** first (Port 3001).
2. Start the **Core Service** second (Port 3002).
3. The Frontend will communicate with the Core Service, which validates auth via the Auth Service.
