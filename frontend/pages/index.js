import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from '../styles/Home.module.css';

// Icon components
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

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);

// Code Block Component with Copy Button
const CodeBlock = ({ language, children }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    const code = String(children).replace(/\n$/, '');
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeBlockHeader}>
        <span className={styles.codeBlockLanguage}>
          {language || 'plaintext'}
        </span>
        <button 
          className={`${styles.codeBlockCopy} ${copied ? styles.copied : ''}`}
          onClick={copyCode}
        >
          {copied ? (
            <>
              <CheckIcon />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <CopyIcon />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <div className={styles.codeBlockContent}>
        <code>{children}</code>
      </div>
    </div>
  );
};

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('codellama:latest');
  const [availableModels, setAvailableModels] = useState([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const chatContainerRef = useRef(null);
  const streamBufferRef = useRef('');
  const streamTimerRef = useRef(null);

  // Updated template prompts
  const suggestions = [
    { text: "Write a Python function to calculate factorial recursively", icon: <CodeIcon /> },
    { text: "Debug this code: def add(a,b) return a+b", icon: <BugIcon /> },
    { text: "Explain quicksort algorithm with code example", icon: <LightbulbIcon /> },
    { text: "Create a binary search tree implementation", icon: <SearchIcon /> }
  ];

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

  const sendMessage = async (messageText = null) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    // Hide suggestions after first message
    setShowSuggestions(false);

    const userMessage = { role: 'user', content: textToSend };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setIsStreaming(true);
    setStreamingContent('');
    streamBufferRef.current = '';

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

      // OPTIMIZED STREAMING: Batch updates to reduce re-renders
      const updateInterval = 50; // Update UI every 50ms instead of every chunk
      let lastUpdateTime = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('[DEBUG] Stream completed');
          // Final update with any remaining buffered content
          if (streamBufferRef.current) {
            setStreamingContent(streamBufferRef.current);
          }
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
                // Add to buffer instead of immediate state update
                streamBufferRef.current += data.content;
                
                // Throttled UI update: only update every 50ms
                const now = Date.now();
                if (now - lastUpdateTime >= updateInterval) {
                  setStreamingContent(streamBufferRef.current);
                  lastUpdateTime = now;
                }
              }

              if (data.done) {
                console.log('[DEBUG] Streaming done');
                const assistantMessage = { 
                  role: 'assistant', 
                  content: streamBufferRef.current 
                };
                setMessages([...updatedMessages, assistantMessage]);
                setStreamingContent('');
                streamBufferRef.current = '';
                setIsStreaming(false);
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
      streamBufferRef.current = '';
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
      
      if (streamBufferRef.current) {
        const assistantMessage = { 
          role: 'assistant', 
          content: streamBufferRef.current + '\n\n[Response stopped by user]'
        };
        setMessages([...messages, assistantMessage]);
        setStreamingContent('');
        streamBufferRef.current = '';
      }
    }
  };

  const clearChat = () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
      setMessages([]);
      setShowSuggestions(true);
      setStreamingContent('');
      streamBufferRef.current = '';
    }
  };

  const regenerateResponse = async () => {
    if (messages.length < 2) return;
    
    // Remove last assistant message and regenerate
    const newMessages = messages.slice(0, -1);
    setMessages(newMessages);
    
    // Get the last user message
    const lastUserMessage = newMessages[newMessages.length - 1];
    if (lastUserMessage && lastUserMessage.role === 'user') {
      await sendMessage(lastUserMessage.content);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Insert template text into input instead of executing
  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    // Focus on the input field
    document.querySelector('textarea')?.focus();
  };

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
          {/* CHAT PANEL */}
          <div className={styles.chatPanel}>
            {/* Header with actions */}
            <div className={styles.chatHeader}>
              <div className={styles.headerLeft}>
                <img src="/logo.png" alt="Logo" className={styles.headerLogo} />
                <span className={styles.headerTitle}>Code Maestro</span>
              </div>
              <div className={styles.headerActions}>
                {messages.length > 0 && (
                  <>
                    <button
                      onClick={regenerateResponse}
                      className={styles.headerButton}
                      disabled={loading || messages.length < 2}
                      title="Regenerate last response"
                    >
                      <RefreshIcon />
                    </button>
                    <button
                      onClick={clearChat}
                      className={styles.headerButton}
                      disabled={loading}
                      title="Clear chat"
                    >
                      <TrashIcon />
                    </button>
                  </>
                )}
              </div>
            </div>

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

              {/* Suggested prompts */}
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

              {/* Chat messages */}
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
                              <CodeBlock language={language}>
                                {children}
                              </CodeBlock>
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
                          h1({children}) {
                            return <h1 className={styles.heading1}>{children}</h1>;
                          },
                          h2({children}) {
                            return <h2 className={styles.heading2}>{children}</h2>;
                          },
                          h3({children}) {
                            return <h3 className={styles.heading3}>{children}</h3>;
                          },
                          blockquote({children}) {
                            return <blockquote className={styles.blockquote}>{children}</blockquote>;
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
                
                {/* Streaming message */}
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
                              <CodeBlock language={language}>
                                {children}
                              </CodeBlock>
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
                          h1({children}) {
                            return <h1 className={styles.heading1}>{children}</h1>;
                          },
                          h2({children}) {
                            return <h2 className={styles.heading2}>{children}</h2>;
                          },
                          h3({children}) {
                            return <h3 className={styles.heading3}>{children}</h3>;
                          },
                          blockquote({children}) {
                            return <blockquote className={styles.blockquote}>{children}</blockquote>;
                          },
                        }}
                      >
                        {streamingContent}
                      </ReactMarkdown>
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
        </div>
      </main>
    </div>
  );
}
