import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import Head from 'next/head';
import hljs from 'highlight.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from '../styles/Home.module.css';

// Icon components to replace emojis
const CodeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>
);

const BugIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2v4"></path>
    <path d="M16 2v4"></path>
    <rect x="6" y="4" width="12" height="16" rx="2"></rect>
    <path d="M2 8h20"></path>
    <path d="M2 16h20"></path>
  </svg>
);

const LightbulbIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
    <path d="M9 18h6"></path>
    <path d="M10 22h4"></path>
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

// Copy icon (outline)
const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

// Check icon (tick mark, outline)
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const LANGUAGE_ROTATION = ['Python', 'JavaScript', 'TypeScript', 'SQL', 'C++', 'Go', 'Rust', 'Ruby', 'C#', 'Swift'];
const PLACEHOLDER_CODE = '';
const CODE_PLACEHOLDER_TEXT = 'Your code will appear here...';
const SUPPORTED_EDITOR_LANGUAGES = new Set([
  'cpp',
  'csharp',
  'css',
  'go',
  'html',
  'java',
  'javascript',
  'json',
  'kotlin',
  'php',
  'plaintext',
  'python',
  'ruby',
  'rust',
  'shell',
  'sql',
  'swift',
  'typescript'
]);

const LANGUAGE_NORMALIZATION_MAP = {
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  'c++': 'cpp',
  'c#': 'csharp',
  cs: 'csharp',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  shell: 'shell',
  plaintext: 'plaintext',
  text: 'plaintext'
};

const LANGUAGE_LABEL_MAP = {
  cpp: 'C++',
  csharp: 'C#',
  css: 'CSS',
  go: 'Go',
  html: 'HTML',
  java: 'Java',
  javascript: 'JavaScript',
  json: 'JSON',
  kotlin: 'Kotlin',
  php: 'PHP',
  plaintext: 'Plain Text',
  python: 'Python',
  ruby: 'Ruby',
  rust: 'Rust',
  shell: 'Shell',
  sql: 'SQL',
  swift: 'Swift',
  typescript: 'TypeScript'
};

const normalizeEditorLanguage = (lang = '') => {
  const safeValue = lang.trim().toLowerCase();
  const mapped = LANGUAGE_NORMALIZATION_MAP[safeValue] || safeValue;
  return SUPPORTED_EDITOR_LANGUAGES.has(mapped) ? mapped : 'plaintext';
};

const formatLanguageLabel = (lang = 'plaintext') => {
  const normalized = normalizeEditorLanguage(lang);
  return LANGUAGE_LABEL_MAP[normalized] || normalized.toUpperCase();
};

const detectLanguageFromPrompt = (text = '') => {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('python') || lowerText.includes('def ') || lowerText.includes('import ')) {
    return 'python';
  } else if (
    lowerText.includes('javascript') ||
    lowerText.includes('const ') ||
    lowerText.includes('function ') ||
    lowerText.includes('=>')
  ) {
    return 'javascript';
  } else if (lowerText.includes('typescript') || lowerText.includes('interface ') || lowerText.includes(': string')) {
    return 'typescript';
  } else if (lowerText.includes('java') && !lowerText.includes('javascript')) {
    return 'java';
  } else if (lowerText.includes('c++') || lowerText.includes('cpp') || lowerText.includes('#include')) {
    return 'cpp';
  } else if (lowerText.includes('c#') || lowerText.includes('csharp')) {
    return 'csharp';
  } else if (lowerText.includes('rust') || lowerText.includes('fn ') || lowerText.includes('let mut')) {
    return 'rust';
  } else if (lowerText.includes('go') || lowerText.includes('golang') || lowerText.includes('func ')) {
    return 'go';
  } else if (lowerText.includes('sql') || lowerText.includes('select ') || lowerText.includes('insert into')) {
    return 'sql';
  } else if (lowerText.includes('ruby') || lowerText.includes('puts ') || lowerText.includes('end')) {
    return 'ruby';
  } else if (lowerText.includes('html') || lowerText.includes('<div') || lowerText.includes('<html')) {
    return 'html';
  } else if (lowerText.includes('css') || lowerText.includes('font-family') || lowerText.includes('color:')) {
    return 'css';
  } else if (lowerText.includes('php') || lowerText.includes('<?php')) {
    return 'php';
  } else if (lowerText.includes('json') || lowerText.includes('"') && lowerText.includes('{')) {
    return 'json';
  } else if (lowerText.includes('swift') || lowerText.includes('import swiftui')) {
    return 'swift';
  }

  return 'plaintext';
};

const detectLanguageFromCode = (codeText = '') => {
  try {
    if (!codeText.trim()) {
      return 'plaintext';
    }
    const result = hljs.highlightAuto(codeText);
    return normalizeEditorLanguage(result.language || 'plaintext');
  } catch (error) {
    console.error('[ERROR] highlight.js detection failed:', error);
    return 'plaintext';
  }
};

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [code, setCode] = useState(PLACEHOLDER_CODE);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('codellama:latest');
  const [availableModels, setAvailableModels] = useState([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [detectedLanguage, setDetectedLanguage] = useState('plaintext');
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const [rotatingLanguage, setRotatingLanguage] = useState(LANGUAGE_ROTATION[0]);
  const [copied, setCopied] = useState(false); // NEW: Copy state
  
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Updated template prompts (non-executing)
  const suggestions = [
    { text: "Write a Python function to calculate factorial recursively", icon: <CodeIcon /> },
    { text: "Debug this code: def add(a,b) return a+b", icon: <BugIcon /> },
    { text: "Explain quicksort algorithm with code example", icon: <LightbulbIcon /> },
    { text: "Create a binary search tree implementation", icon: <SearchIcon /> }
  ];

  // Language icon mapping
  const getLanguageIcon = (lang) => {
    const normalized = normalizeEditorLanguage(lang);
    const icons = {
      python: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-2c0-.83.67-1.5 1.5-1.5h2c.83 0 1.5.67 1.5 1.5v2c0 .83-.67 1.5-1.5 1.5h-2c-.83 0-1.5-.67-1.5-1.5zm0-6v-2c0-.83.67-1.5 1.5-1.5h2c.83 0 1.5.67 1.5 1.5v2c0 .83-.67 1.5-1.5 1.5h-2c-.83 0-1.5-.67-1.5-1.5z"/>
        </svg>
      ),
      javascript: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="20" rx="2"/>
          <path d="M8 12h8M12 8v8"/>
        </svg>
      ),
      typescript: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M8 9h8M12 9v6M10 15h4" />
        </svg>
      ),
      java: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7v10l10 5 10-5V7z"/>
          <polyline points="12 12 12 17"/>
        </svg>
      ),
      cpp: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9 12h6M12 9v6"/>
        </svg>
      ),
      csharp: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M9 9h3M9 15h3M15 9v6M17 10v4" />
        </svg>
      ),
      rust: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7v10l10 5 10-5V7z"/>
        </svg>
      ),
      go: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
        </svg>
      ),
      sql: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="6" rx="7" ry="3" />
          <path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6" />
        </svg>
      ),
      json: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 8v4l-2 2 2 2v4M17 8v4l2 2-2 2v4" />
        </svg>
      ),
      html: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16v16H4z" />
          <path d="M8 9h8M8 13h5" />
        </svg>
      ),
      css: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 4h12l-1 14-5 2-5-2-1-14z" />
          <path d="M9 8h6M9 12h5" />
        </svg>
      ),
      ruby: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3l7 5-7 13-7-13 7-5z" />
        </svg>
      ),
      swift: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 8c2 4 6 7 10 8-3-2-5-5-6-7 2 2 5 4 8 5 1-3 0-6-2-9 3 2 5 5 6 9-1 5-5 7-10 7-3 0-6-1-8-3" />
        </svg>
      ),
      plaintext: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 9h8M8 13h6M8 17h4" />
        </svg>
      ),
      shell: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h12l4 4v8H4z" />
          <path d="M8 14h4M8 10h2" />
        </svg>
      ),
      default: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M9 12h6M12 9v6" />
        </svg>
      )
    };
    return icons[normalized] || icons.default;
  };

  // Smooth scroll to bottom
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  useEffect(() => {
    if (!isEditorEmpty) {
      return;
    }

    const intervalId = setInterval(() => {
      setRotatingLanguage((prev) => {
        const currentIndex = LANGUAGE_ROTATION.indexOf(prev);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % LANGUAGE_ROTATION.length;
        return LANGUAGE_ROTATION[nextIndex];
      });
    }, 1600);

    return () => clearInterval(intervalId);
  }, [isEditorEmpty]);

  useEffect(() => {
    const trimmedCode = (code || '').trim();
    const normalizedPlaceholder = PLACEHOLDER_CODE.trim();
    const editorIsEmpty = !trimmedCode || trimmedCode === normalizedPlaceholder;

    setIsEditorEmpty(editorIsEmpty);

    if (editorIsEmpty) {
      setDetectedLanguage('plaintext');
      return;
    }

    setDetectedLanguage(detectLanguageFromCode(code));
  }, [code]);

  // Fetch available models
  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch('http://localhost:8000/models');
      const data = await response.json();
      if (data.available && data.models.length > 0) {
        setAvailableModels(data.models);
        if (data.models.length > 0 && !data.models.includes(model)) {
          setModel(data.models[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setAvailableModels(['codellama:latest', 'llama3.1:8b', 'llama3.2:latest']);
    }
  };

  // Extract code blocks from markdown
  const extractCode = (text) => {
    const codeMatch = text.match(/```([\w]*)\n([\s\S]*?)```/);
    if (codeMatch) {
      const lang = codeMatch[1] || 'plaintext';
      setDetectedLanguage(normalizeEditorLanguage(lang));
      return codeMatch[2];
    }
    return null;
  };

  // Real-time code extraction during streaming
  useEffect(() => {
    if (streamingContent) {
      const extractedCode = extractCode(streamingContent);
      if (extractedCode) {
        setCode(extractedCode);
      }
    }
  }, [streamingContent]);

  const sendMessage = async (messageText = null) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    // Detect language from user input
    const detected = normalizeEditorLanguage(detectLanguageFromPrompt(textToSend));
    setDetectedLanguage(detected);

    // Hide suggestions after first message
    setShowSuggestions(false);

    const userMessage = { role: 'user', content: textToSend };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setIsStreaming(true);
    setStreamingContent('');

    console.log('[DEBUG] Sending streaming request...', { model, messageCount: updatedMessages.length });

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('http://localhost:8000/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          model: model,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      console.log('[DEBUG] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('[ERROR] Backend error:', errorData);
        throw new Error(errorData.detail || 'Failed to get response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('[DEBUG] Stream completed');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                throw new Error(data.error);
              }

              if (data.content) {
                accumulatedContent += data.content;
                setStreamingContent(accumulatedContent);
              }

              if (data.done) {
                console.log('[DEBUG] Streaming done');
                const assistantMessage = { 
                  role: 'assistant', 
                  content: accumulatedContent 
                };
                setMessages([...updatedMessages, assistantMessage]);
                setStreamingContent('');
                setIsStreaming(false);
                
                const finalCode = extractCode(accumulatedContent);
                if (finalCode) {
                  setCode(finalCode);
                }
              }
            } catch (parseError) {
              console.error('[ERROR] Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[DEBUG] Stream aborted by user');
      } else {
        console.error('[ERROR] Streaming failed:', error);
        const errorMessage = { 
          role: 'assistant', 
          content: `Error: ${error.message}. Make sure Ollama is running and the selected model is available.` 
        };
        setMessages([...updatedMessages, errorMessage]);
      }
      setStreamingContent('');
      setIsStreaming(false);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
      setIsStreaming(false);
      
      if (streamingContent) {
        const assistantMessage = { 
          role: 'assistant', 
          content: streamingContent + '\n\n[Response stopped by user]'
        };
        setMessages([...messages, assistantMessage]);
        setStreamingContent('');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Updated: Insert template text into input instead of executing
  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    // Optional: Focus on the input field
    document.querySelector('textarea')?.focus();
  };

  const clearChat = () => {
    setMessages([]);
    setStreamingContent('');
    setCode(PLACEHOLDER_CODE);
    setDetectedLanguage('plaintext');
    setIsEditorEmpty(true);
    setRotatingLanguage(LANGUAGE_ROTATION[0]);
    setShowSuggestions(true);
  };

  // NEW: Copy code with state change
  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    
    // Revert back to "Copy" after 2.5 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2500);
  };

  const handleEditorChange = (value) => {
    setCode(value ?? '');
  };

  const languageLabel = isEditorEmpty ? rotatingLanguage : formatLanguageLabel(detectedLanguage);
  const languageIconKey = isEditorEmpty ? normalizeEditorLanguage(rotatingLanguage) : detectedLanguage;

  return (
    <div className={styles.container}>
      <Head>
        <title>Code Maestro - AI Code Assistant</title>
        <meta name="description" content="Premium AI-Powered Code Assistant" />
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </Head>

      <main className={styles.main}>
        <div className={styles.workspace}>
          {/* LEFT PANEL - Chat Area (55%) */}
          <div className={styles.chatPanel}>
            <div className={styles.chatContainer} ref={chatContainerRef}>
              {/* Welcome message when chat is empty */}
              {messages.length === 0 && !streamingContent && (
                <div className={styles.welcomeSection}>
                  <div className={styles.logoContainer}>
                    <img 
                      src="/logo.png" 
                      alt="Code Maestro" 
                      className={styles.logo}
                    />
                  </div>
                  <h1 className={styles.welcomeTitle}>Code Maestro</h1>
                  <p className={styles.welcomeSubtitle}>Your AI-powered coding assistant</p>
                </div>
              )}

              {/* Suggested prompts - NOW THEY PREFILL INPUT */}
              {showSuggestions && messages.length === 0 && !streamingContent && (
                <div className={styles.suggestionsContainer}>
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      className={styles.suggestionPill}
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      disabled={loading}
                    >
                      <span className={styles.suggestionIcon}>{suggestion.icon}</span>
                      <span>{suggestion.text}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Chat messages - Wallpaper style with Markdown */}
              <div className={styles.messagesFlow}>
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`${styles.messageWrapper} ${styles.fadeInUp} ${
                      msg.role === 'user' ? styles.userMessage : styles.assistantMessage
                    }`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className={styles.messageContent}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({node, inline, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '');
                            const language = match ? match[1] : null;
                            
                            return !inline ? (
                              <pre className={styles.codeBlock}>
                                <code className={language ? `language-${language}` : ''} {...props}>
                                  {children}
                                </code>
                              </pre>
                            ) : (
                              <code className={styles.inlineCode} {...props}>
                                {children}
                              </code>
                            );
                          },
                          p({children}) {
                            return <p className={styles.paragraph}>{children}</p>;
                          },
                          ul({children}) {
                            return <ul className={styles.list}>{children}</ul>;
                          },
                          ol({children}) {
                            return <ol className={styles.orderedList}>{children}</ol>;
                          },
                          li({children}) {
                            return <li className={styles.listItem}>{children}</li>;
                          },
                          strong({children}) {
                            return <strong className={styles.bold}>{children}</strong>;
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
                
                {/* Streaming message with typewriter effect */}
                {isStreaming && streamingContent && (
                  <div className={`${styles.messageWrapper} ${styles.fadeInUp} ${styles.assistantMessage}`}>
                    <div className={styles.streamingIndicator}>
                      <span className={styles.streamingDot}></span>
                      <span className={styles.streamingText}>Generating</span>
                    </div>
                    <div className={styles.messageContent}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({node, inline, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '');
                            const language = match ? match[1] : null;
                            
                            return !inline ? (
                              <pre className={styles.codeBlock}>
                                <code className={language ? `language-${language}` : ''} {...props}>
                                  {children}
                                </code>
                              </pre>
                            ) : (
                              <code className={styles.inlineCode} {...props}>
                                {children}
                              </code>
                            );
                          },
                          p({children}) {
                            return <p className={styles.paragraph}>{children}</p>;
                          },
                          ul({children}) {
                            return <ul className={styles.list}>{children}</ul>;
                          },
                          ol({children}) {
                            return <ol className={styles.orderedList}>{children}</ol>;
                          },
                          li({children}) {
                            return <li className={styles.listItem}>{children}</li>;
                          },
                          strong({children}) {
                            return <strong className={styles.bold}>{children}</strong>;
                          },
                        }}
                      >
                        {streamingContent}
                      </ReactMarkdown>
                      <span className={styles.typingCursor}></span>
                    </div>
                  </div>
                )}
                
                {loading && !streamingContent && (
                  <div className={`${styles.messageWrapper} ${styles.fadeInUp}`}>
                    <div className={styles.aiBubble}>
                      <div className={styles.thinkingContainer}>
                        <span className={styles.thinkingDot}></span>
                        <span className={styles.thinkingDot}></span>
                        <span className={styles.thinkingDot}></span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className={styles.inputSection}>
              <div className={styles.inputContainer}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Send a message"
                  className={styles.messageInput}
                  rows={1}
                  disabled={loading}
                />
                <div className={styles.inputControls}>
                  <select 
                    value={model} 
                    onChange={(e) => setModel(e.target.value)}
                    className={styles.modelDropdown}
                    disabled={loading}
                  >
                    {availableModels.length > 0 ? (
                      availableModels.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))
                    ) : (
                      <>
                        <option value="codellama:latest">CodeLlama</option>
                        <option value="llama3.1:8b">Llama 3.1</option>
                        <option value="llama3.2:latest">Llama 3.2</option>
                      </>
                    )}
                  </select>
                  
                  {loading ? (
                    <button 
                      onClick={stopStreaming}
                      className={`${styles.sendButton} ${styles.stopButton}`}
                      title="Stop generation"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <rect x="6" y="6" width="12" height="12" fill="currentColor" rx="2"/>
                      </svg>
                    </button>
                  ) : (
                    <button 
                      onClick={() => sendMessage()}
                      disabled={!input.trim()}
                      className={styles.sendButton}
                      title="Send message"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - Code Output (45%) */}
          <div className={styles.codePanel}>
            <div className={styles.codeContainer}>
              <div className={styles.codeHeader}>
                <div className={`${styles.languageTag} ${isEditorEmpty ? styles.languageRotating : ''}`}>
                  <span className={styles.languageIcon}>
                    {getLanguageIcon(languageIconKey)}
                  </span>
                  <span>{languageLabel}</span>
                </div>
                <button 
                  onClick={copyCode}
                  className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
                  title={copied ? "Copied!" : "Copy code"}
                >
                  <span className={styles.copyIcon}>
                    {copied ? <CheckIcon /> : <CopyIcon />}
                  </span>
                  <span className={styles.copyText}>
                    {copied ? 'Copied' : 'Copy code'}
                  </span>
                </button>
              </div>
              <div className={styles.codeEditorWrapper}>
                <Editor
                  height="100%"
                  defaultLanguage={detectedLanguage}
                  language={detectedLanguage}
                  theme="vs-dark"
                  value={code}
                  onChange={handleEditorChange}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: 'on',
                    tabSize: 2,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Monaco', monospace",
                    padding: { top: 16, bottom: 16 },
                    placeholder: CODE_PLACEHOLDER_TEXT
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
