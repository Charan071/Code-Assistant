from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import requests
import json
import asyncio

app = FastAPI(title="Code Maestro API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    model: Optional[str] = "codellama:latest"
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2000
    stream: Optional[bool] = True

class ChatResponse(BaseModel):
    response: str
    model: str

# System prompts
CODE_GENERATION_PROMPT = """You are an expert programmer assistant. 
When asked to write code:
- Provide clean, well-commented code
- Use best practices and design patterns
- Explain your approach briefly
- Include error handling where appropriate
"""

DEBUG_PROMPT = """You are an expert debugging assistant.
When analyzing code or errors:
- Identify the root cause of issues
- Explain why errors occur
- Provide corrected code
- Suggest improvements
"""

async def stream_ollama(messages: List[Message], model: str = "codellama:latest", 
                       temperature: float = 0.7):
    """
    Stream responses from Ollama API - KEY OPTIMIZATION!
    """
    try:
        print(f"[DEBUG] Streaming from Ollama with model: {model}")
        
        # Build the prompt with system context
        system_msg = CODE_GENERATION_PROMPT
        if any("error" in msg.content.lower() or "debug" in msg.content.lower() 
               for msg in messages):
            system_msg = DEBUG_PROMPT
        
        # Format messages for Ollama
        formatted_messages = [{"role": "system", "content": system_msg}]
        for msg in messages:
            formatted_messages.append({"role": msg.role, "content": msg.content})
        
        # Prepare Ollama request with streaming enabled
        ollama_request = {
            "model": model,
            "messages": formatted_messages,
            "stream": True,  # KEY: Enable streaming!
            "options": {
                "temperature": temperature,
                "num_predict": 2000,  # Max tokens
            }
        }
        
        print("[DEBUG] Sending streaming request to Ollama...")
        
        # Stream responses from Ollama
        with requests.post(
            "http://localhost:11434/api/chat",
            json=ollama_request,
            stream=True,
            timeout=120
        ) as response:
            
            if response.status_code != 200:
                print(f"[ERROR] Ollama error: {response.text}")
                yield f"data: {json.dumps({'error': 'Ollama API error'})}\n\n"
                return
            
            # Stream each chunk as it arrives
            for line in response.iter_lines():
                if line:
                    try:
                        chunk = json.loads(line)
                        content = chunk.get("message", {}).get("content", "")
                        
                        if content:
                            # Send each chunk in SSE format
                            yield f"data: {json.dumps({'content': content, 'done': False})}\n\n"
                        
                        # Check if streaming is complete
                        if chunk.get("done", False):
                            yield f"data: {json.dumps({'content': '', 'done': True})}\n\n"
                            print("[DEBUG] Streaming completed")
                            break
                            
                    except json.JSONDecodeError as e:
                        print(f"[ERROR] Failed to parse chunk: {e}")
                        continue
                    
                    # Small delay to prevent overwhelming the client
                    await asyncio.sleep(0.001)
        
    except requests.Timeout:
        print("[ERROR] Request timeout")
        yield f"data: {json.dumps({'error': 'Request timeout'})}\n\n"
    except requests.RequestException as e:
        print(f"[ERROR] Connection error: {str(e)}")
        yield f"data: {json.dumps({'error': f'Connection error: {str(e)}'})}\n\n"
    except Exception as e:
        print(f"[ERROR] Unexpected error: {str(e)}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

def call_ollama(messages: List[Message], model: str = "codellama:latest", 
                temperature: float = 0.7) -> str:
    """
    Non-streaming fallback for compatibility
    """
    try:
        print(f"[DEBUG] Calling Ollama (non-streaming) with model: {model}")
        
        system_msg = CODE_GENERATION_PROMPT
        if any("error" in msg.content.lower() or "debug" in msg.content.lower() 
               for msg in messages):
            system_msg = DEBUG_PROMPT
        
        formatted_messages = [{"role": "system", "content": system_msg}]
        for msg in messages:
            formatted_messages.append({"role": msg.role, "content": msg.content})
        
        ollama_request = {
            "model": model,
            "messages": formatted_messages,
            "stream": False,
            "options": {
                "temperature": temperature
            }
        }
        
        response = requests.post(
            "http://localhost:11434/api/chat",
            json=ollama_request,
            timeout=120
        )
        
        if response.status_code != 200:
            raise Exception(f"Ollama error: {response.text}")
        
        response_data = response.json()
        content = response_data.get("message", {}).get("content", "")
        return content
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Routes
@app.get("/")
async def root():
    return {
        "message": "Code Maestro API",
        "version": "2.0.0",
        "features": ["streaming", "typewriter-effect"],
        "endpoints": {
            "/chat": "POST - Send chat messages",
            "/chat/stream": "POST - Send chat messages (streaming)",
            "/health": "GET - Check API health",
            "/models": "GET - List available models"
        }
    }

@app.get("/health")
async def health_check():
    """Check if Ollama is running"""
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        return {
            "status": "healthy" if response.status_code == 200 else "unhealthy",
            "ollama": "running" if response.status_code == 200 else "not running"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/models")
async def list_models():
    """List available Ollama models"""
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            data = response.json()
            models = [model.get("name", "") for model in data.get("models", [])]
            return {"models": models, "available": True}
        else:
            return {"models": [], "available": False, "error": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    STREAMING endpoint - Returns Server-Sent Events (SSE)
    This is the FAST version!
    """
    try:
        print(f"[DEBUG] Received streaming chat request with {len(request.messages)} messages")
        
        if not request.messages:
            raise HTTPException(status_code=400, detail="Messages cannot be empty")
        
        return StreamingResponse(
            stream_ollama(
                messages=request.messages,
                model=request.model,
                temperature=request.temperature
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
        
    except Exception as e:
        print(f"[ERROR] Streaming endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Non-streaming endpoint for compatibility
    """
    try:
        print(f"[DEBUG] Received chat request with {len(request.messages)} messages")
        
        if not request.messages:
            raise HTTPException(status_code=400, detail="Messages cannot be empty")
        
        response = call_ollama(
            messages=request.messages,
            model=request.model,
            temperature=request.temperature
        )
        
        return ChatResponse(response=response, model=request.model)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Chat endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
