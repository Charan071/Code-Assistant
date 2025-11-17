# Code Maestro

> A real-time AI-powered code assistant with streaming responses and typewriter effects

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green)
![Next.js](https://img.shields.io/badge/Next.js-14.0-black)
![React](https://img.shields.io/badge/React-18.2-blue)

**Code Maestro** is a modern, real-time AI code assistant that leverages local LLMs through Ollama to help you write, debug, and understand code. With streaming responses and a sleek interface, it feels like having a senior developer pair programming with you.

## ✨ Features

- 🚀 **Instant Streaming Responses** - See AI responses character-by-character as they're generated
- ⌨️ **Typewriter Effect** - Professional streaming animation with animated cursor
- 💻 **Integrated Code Editor** - Monaco editor with syntax highlighting
- 🔄 **Real-time Code Extraction** - Code appears in editor as it's being generated
- ⏹️ **Stop Anytime** - Cancel long-running requests with one click
- 🎨 **Modern UI** - Dark theme with smooth animations and gradients
- 📱 **Fully Responsive** - Works seamlessly on desktop and mobile
- 🔌 **Local & Private** - All processing happens on your machine via Ollama

## 🎥 Demo

```
User: Write a fibonacci function in Python
AI: [Streaming response with typewriter effect...]
```

Code appears in editor in real-time as the AI generates it!

## 🏗️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Server-Sent Events** - Real-time streaming communication
- **Ollama** - Local LLM inference
- **Asyncio** - Asynchronous streaming

### Frontend
- **Next.js 14** - React framework with SSR
- **React Hooks** - Modern state management
- **Monaco Editor** - VSCode's editor component
- **CSS Animations** - Smooth typewriter and cursor effects

## 📋 Prerequisites

- **Python 3.8+**
- **Node.js 18+** and npm
- **Ollama** - [Install from ollama.ai](https://ollama.ai)
- **CodeLlama model** or any other Ollama model

## 🚀 Quick Start

### 1. Install Ollama and Models

```bash
# Install Ollama from https://ollama.ai

# Pull CodeLlama (or any other model)
ollama pull codellama:latest

# Start Ollama server
ollama serve
```

### 2. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python main.py
```

Backend will run on http://localhost:8000

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on http://localhost:3000

### 4. Test Everything

```bash
# From project root
python test_backend.py
```

## 📖 Usage

1. Open http://localhost:3000 in your browser
2. Select your preferred model from the dropdown
3. Type your coding question or request
4. Watch as the AI streams its response in real-time!
5. Code blocks automatically appear in the editor

### Example Prompts

- "Write a Python function to calculate factorial"
- "Debug this code: [paste your code]"
- "Explain how quicksort works"
- "Convert this JavaScript to TypeScript"
- "Write unit tests for this function"

## 🎯 Key Features Explained

### Server-Sent Events (SSE)

The backend uses SSE to stream responses token-by-token:

```python
@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    return StreamingResponse(
        stream_ollama(messages=request.messages),
        media_type="text/event-stream"
    )
```

### Real-time Code Extraction

Code blocks are extracted and displayed as they stream:

```javascript
useEffect(() => {
  if (streamingContent) {
    const extractedCode = extractCode(streamingContent);
    if (extractedCode) {
      setCode(extractedCode);
    }
  }
}, [streamingContent]);
```

### Typewriter Effect

CSS animations create the smooth cursor effect:

```css
.cursor {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
```

## 📁 Project Structure

```
CodeAssistant/
├── backend/
│   ├── main.py              # FastAPI server with streaming
│   ├── requirements.txt     # Python dependencies
│   └── README.md
├── frontend/
│   ├── pages/
│   │   ├── index.js         # Main chat interface
│   │   └── _app.js
│   ├── styles/
│   │   └── Home.module.css  # Styling with animations
│   ├── package.json
│   └── README.md
├── test_backend.py          # Backend test suite
└── UPGRADE_COMPLETE.md      # Upgrade documentation
```

## 🔧 Configuration

### Backend Configuration

Edit `backend/main.py`:

```python
# Change Ollama URL
OLLAMA_URL = "http://localhost:11434"

# Adjust streaming options
"options": {
    "temperature": 0.7,      # Creativity (0.0-1.0)
    "num_predict": 2000,     # Max tokens
}
```

### Frontend Configuration

Edit `frontend/pages/index.js`:

```javascript
// Change backend URL
const BACKEND_URL = 'http://localhost:8000';

// Available models
const DEFAULT_MODELS = [
  'codellama:latest',
  'llama3.1:8b', 
  'llama3.2:latest'
];
```

## 🎨 Customization

### Change Color Theme

Edit `frontend/styles/Home.module.css`:

```css
/* Primary gradient */
background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);

/* Message bubbles */
background: linear-gradient(135deg, #1e293b 0%, #26282f 100%);
```

### Add New Models

1. Pull model in Ollama: `ollama pull llama3.1`
2. Model will automatically appear in dropdown

### Modify System Prompts

Edit `backend/main.py`:

```python
CODE_GENERATION_PROMPT = """Your custom prompt here"""
DEBUG_PROMPT = """Your custom debug prompt"""
```

## 🐛 Troubleshooting

### Streaming Not Working

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Check backend health
curl http://localhost:8000/health

# Run test suite
python test_backend.py
```

### Slow Response Times

- Use smaller models (e.g., `codellama:7b` instead of `codellama:34b`)
- Reduce `max_tokens` in backend
- Ensure Ollama has enough RAM (8GB+ recommended)

### Editor Not Updating

- Check browser console for errors
- Verify code blocks use triple backticks: \`\`\`python
- Clear browser cache

### CORS Errors

- Verify frontend URL is in `allow_origins` in `backend/main.py`
- Check browser console for specific CORS error

## 📊 Performance

| Metric | Before | After |
|--------|--------|-------|
| Time to First Token | 10-30s | <1s |
| Response Feel | Blocky | Smooth |
| Code Visibility | End only | Real-time |
| User Experience | Waiting | Interactive |

## 🚀 Deployment

### Backend (e.g., on a VPS)

```bash
# Install dependencies
pip install -r requirements.txt

# Run with Gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

### Frontend (e.g., Vercel)

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai) - Local LLM inference
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python framework
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor
- [Next.js](https://nextjs.org/) - React framework

## 📧 Contact

**Chara**
- Portfolio: [Add your portfolio URL]
- GitHub: [Add your GitHub URL]
- LinkedIn: [Add your LinkedIn URL]

---

**Built with ❤️ and ☕**

*Show off your real-time AI skills!*
