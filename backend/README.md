# Backend - FastAPI Server

## Setup

1. Install dependencies:
pip install -r requirements.txt

2. Start the server:
uvicorn main:app --reload

The API will be available at: http://localhost:8000

## Endpoints

- GET / - API information
- GET /health - Health check
- GET /models - List available Ollama models
- POST /chat - Send chat messages
