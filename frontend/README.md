# Code Assistant - Frontend

A modern AI-powered code assistant interface built with Next.js and React.

## Features

- **AI Chat Interface** - Interactive chat with AI code assistant
- **Monaco Code Editor** - Full-featured code editor with syntax highlighting
- **Syntax Highlighted Code Blocks** - Color-coded code snippets in chat responses using highlight.js
- **Inline Code Support** - Single backticks for inline code, triple backticks for code blocks
- **Model Selection** - Choose from multiple AI models (CodeLlama, Llama 3.1, Llama 3.2)
- **Real-time Streaming** - See AI responses as they're generated
- **Copy & Insert** - Easy code manipulation from chat responses

## Setup

### Prerequisites

- Node.js 16.x or higher
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open your browser and navigate to:

```
http://localhost:3000
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Tech Stack

- **Next.js 14** - React framework
- **React 18** - UI library
- **Monaco Editor** - Code editor component
- **highlight.js** - Syntax highlighting for code blocks
- **react-markdown** - Markdown rendering
- **remark-gfm** - GitHub Flavored Markdown support

## Project Structure

```
frontend/
├── components/          # React components
│   ├── ChatPanel.js    # AI chat interface
│   ├── CodeEditor.js   # Monaco code editor
│   └── FileExplorer.js # File navigation
├── pages/              # Next.js pages
│   ├── index.js        # Main application page
│   └── _app.js         # App wrapper
├── styles/             # CSS modules
├── public/             # Static assets
└── package.json        # Dependencies
```

## Backend Connection

The frontend connects to the backend API at `http://localhost:8000`. Ensure the backend server is running before using the application.

## License

MIT
