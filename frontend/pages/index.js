import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [code, setCode] = useState('// Your code here...\n');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('codellama:latest');
  const [availableModels, setAvailableModels] = useState([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // Fetch available models on component mount
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
    const codeMatch = text.match(/```[\w]*\n([\s\S]*?)```/);
    return codeMatch ? codeMatch[1] : null;
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

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setIsStreaming(true);
    setStreamingContent('');

    console.log('[DEBUG] Sending streaming request...', { model, messageCount: updatedMessages.length });

    try {
      // Create abort controller for cancellation
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

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('[DEBUG] Stream completed');
          break;
        }

        // Decode the chunk
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
                // Add the complete message
                const assistantMessage = { 
                  role: 'assistant', 
                  content: accumulatedContent 
                };
                setMessages([...updatedMessages, assistantMessage]);
                setStreamingContent('');
                setIsStreaming(false);
                
                // Extract final code
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
      
      // Save whatever was streamed so far
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

  const clearChat = () => {
    setMessages([]);
    setStreamingContent('');
    setCode('// Your code here...\n');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    // Could add a toast notification here
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Code Maestro - AI Code Assistant</title>
        <meta name="description" content="Code Maestro - Real-time AI-Powered Code Assistant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>🎼 Code Maestro</h1>
          <p className={styles.subtitle}>Real-time AI Code Assistant with Streaming</p>
        </div>

        <div className={styles.workspace}>
          {/* Chat Section */}
          <div className={styles.chatSection}>
            <div className={styles.controlBar}>
              <div className={styles.modelSelector}>
                <label>Model:</label>
                <select 
                  value={model} 
                  onChange={(e) => setModel(e.target.value)}
                  className={styles.select}
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
              </div>
              
              <button 
                onClick={clearChat} 
                className={styles.clearButton}
                disabled={loading}
              >
                Clear Chat
              </button>
            </div>

            <div className={styles.chatMessages}>
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={msg.role === 'user' ? styles.userMessage : styles.assistantMessage}
                >
                  <div className={styles.messageHeader}>
                    <strong>{msg.role === 'user' ? '👤 You' : '🤖 AI'}</strong>
                  </div>
                  <pre className={styles.messageContent}>{msg.content}</pre>
                </div>
              ))}
              
              {/* Streaming message with typewriter effect */}
              {isStreaming && streamingContent && (
                <div className={styles.assistantMessage}>
                  <div className={styles.messageHeader}>
                    <strong>🤖 AI</strong>
                    <span className={styles.streamingIndicator}>●</span>
                  </div>
                  <pre className={styles.messageContent}>
                    {streamingContent}
                    <span className={styles.cursor}>▊</span>
                  </pre>
                </div>
              )}
              
              {loading && !streamingContent && (
                <div className={styles.assistantMessage}>
                  <div className={styles.messageHeader}>
                    <strong>🤖 AI</strong>
                  </div>
                  <pre className={styles.messageContent}>
                    <span className={styles.thinkingDots}>Thinking</span>
                  </pre>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className={styles.inputArea}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me to write code, debug, or explain... (Shift+Enter for new line)"
                className={styles.textarea}
                rows={3}
                disabled={loading}
              />
              <div className={styles.buttonGroup}>
                {loading ? (
                  <button 
                    onClick={stopStreaming}
                    className={`${styles.button} ${styles.stopButton}`}
                  >
                    ⏹ Stop
                  </button>
                ) : (
                  <button 
                    onClick={sendMessage} 
                    disabled={!input.trim()}
                    className={styles.button}
                  >
                    ▶ Send
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Code Editor Section */}
          <div className={styles.editorSection}>
            <div className={styles.editorHeader}>
              <h3>Code Editor</h3>
              <button 
                onClick={copyCode}
                className={styles.copyButton}
                title="Copy code"
              >
                📋 Copy
              </button>
            </div>
            <Editor
              height="100%"
              defaultLanguage="python"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value)}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
                tabSize: 2,
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
