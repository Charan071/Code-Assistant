import { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './ChatPanel.module.css';
import { useState } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

// Icons
const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const InsertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M7 11L12 6L17 11M12 18V7"/>
  </svg>
);

const StopIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="6" y="6" width="12" height="12" fill="currentColor" rx="2"/>
  </svg>
);

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

// Code Block with Copy and Insert
const CodeBlock = ({ language, children, onInsert, blockIndex }) => {
  const [copied, setCopied] = useState(false);
  const [inserted, setInserted] = useState(false);
  const codeRef = useRef(null);

  const codeText = String(children).replace(/\n$/, '');

  useEffect(() => {
    if (codeRef.current) {
      if (language) {
        try {
          hljs.highlightElement(codeRef.current);
        } catch (error) {
          console.error('Highlighting error:', error);
        }
      }
    }
  }, [language, children]);

  const copyCode = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertCode = () => {
    onInsert(codeText);
    setInserted(true);
    setTimeout(() => setInserted(false), 2000);
  };

  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeHeader}>
        <span className={styles.codeLang}>{language || 'code'}</span>
        <div className={styles.codeActions}>
          <button className={styles.codeButton} onClick={insertCode} title="Insert at cursor">
            {inserted ? <><CheckIcon /><span>Inserted</span></> : <><InsertIcon /><span>Insert</span></>}
          </button>
          <button className={styles.codeButton} onClick={copyCode} title="Copy to clipboard">
            {copied ? <><CheckIcon /><span>Copied</span></> : <><CopyIcon /><span>Copy</span></>}
          </button>
        </div>
      </div>
      <div className={styles.codeContent}>
        <pre>
          <code ref={codeRef} className={language ? `language-${language}` : ''}>
            {children}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default function ChatPanel({ 
  messages, 
  streamingContent, 
  isStreaming, 
  loading, 
  input, 
  onInputChange, 
  onSend, 
  onStop, 
  model, 
  onModelChange, 
  availableModels,
  onInsertCode,
  isCollapsed,
  onToggleCollapse
}) {
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const codeBlockCounterRef = useRef(0);

  useEffect(() => {
    if (chatContainerRef.current && !isCollapsed) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, streamingContent, isCollapsed]);

  // Reset code block counter when messages change
  useEffect(() => {
    codeBlockCounterRef.current = 0;
  }, [messages, streamingContent]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  if (isCollapsed) {
    return (
      <div className={styles.collapsedContainer}>
        <button 
          className={styles.expandButton}
          onClick={onToggleCollapse}
          title="Show AI Assistant"
        >
          <ChevronLeftIcon />
          <span>AI Assistant</span>
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <SparkleIcon />
          <span className={styles.title}>AI Assistant</span>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.modelBadge}>
            <div className={styles.statusDot}></div>
            <span>{model.split(':')[0]}</span>
          </div>
          <button 
            className={styles.collapseButton}
            onClick={onToggleCollapse}
            title="Hide AI Assistant"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <div className={styles.messagesContainer} ref={chatContainerRef}>
        {messages.length === 0 && !streamingContent && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconWrapper}>
              <SparkleIcon />
            </div>
            <h3 className={styles.emptyTitle}>AI-Powered Code Assistant</h3>
            <p className={styles.emptyText}>Ask questions, get explanations, or use the action buttons in the editor</p>
            <div className={styles.quickTips}>
              <div className={styles.tip}>💡 Select code and click "Explain"</div>
              <div className={styles.tip}>🐛 Click "Debug" to find issues</div>
              <div className={styles.tip}>✨ Click "Refactor" to improve code</div>
            </div>
          </div>
        )}

        <div className={styles.messages}>
          {messages.map((msg, idx) => (
            <div key={idx} className={styles.messageWrapper}>
              {msg.role === 'user' ? (
                <div className={styles.userMessage}>
                  <div className={styles.userBubble}>
                    <div className={styles.bubbleContent}>
                      {msg.content}
                    </div>
                  </div>
                  <div className={styles.userLabel}>You</div>
                </div>
              ) : (
                <div className={styles.aiMessage}>
                  <div className={styles.aiLabel}>
                    <SparkleIcon />
                    <span>AI</span>
                  </div>
                  <div className={styles.aiResponse}>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({node, inline, className, children, ...props}) {
                          const match = /language-(\w+)/.exec(className || '');
                          const childText = String(children);
                          
                          // Use inline code (single backticks) for single tokens or short expressions
                          // Use fenced code blocks (triple backticks) for multi-line or substantial code snippets
                          if (inline) {
                            // Single backtick - always render as inline code
                            return <code className={styles.inlineCode} {...props}>{children}</code>;
                          } else {
                            // Triple backticks - render as code block
                            const blockIndex = codeBlockCounterRef.current++;
                            return (
                              <CodeBlock 
                                language={match ? match[1] : null} 
                                onInsert={onInsertCode}
                                blockIndex={blockIndex}
                              >
                                {children}
                              </CodeBlock>
                            );
                          }
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
              )}
            </div>
          ))}

          {isStreaming && streamingContent && (
            <div className={styles.messageWrapper}>
              <div className={styles.aiMessage}>
                <div className={styles.aiLabel}>
                  <div className={styles.streamingIconWrapper}>
                    <SparkleIcon />
                  </div>
                  <span>AI</span>
                  <div className={styles.streamingDots}>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                  </div>
                </div>
                <div className={styles.aiResponse}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({node, inline, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '');
                        const childText = String(children);
                        
                        // Use inline code (single backticks) for single tokens or short expressions
                        // Use fenced code blocks (triple backticks) for multi-line or substantial code snippets
                        if (inline) {
                          // Single backtick - always render as inline code
                          return <code className={styles.inlineCode} {...props}>{children}</code>;
                        } else {
                          // Triple backticks - render as code block
                          const blockIndex = codeBlockCounterRef.current++;
                          return (
                            <CodeBlock 
                              language={match ? match[1] : null} 
                              onInsert={onInsertCode}
                              blockIndex={blockIndex}
                            >
                              {children}
                            </CodeBlock>
                          );
                        }
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
            </div>
          )}

          {loading && !streamingContent && (
            <div className={styles.messageWrapper}>
              <div className={styles.aiMessage}>
                <div className={styles.aiLabel}>
                  <div className={styles.streamingIconWrapper}>
                    <SparkleIcon />
                  </div>
                  <span>AI</span>
                </div>
                <div className={styles.thinkingContainer}>
                  <span className={styles.thinkingText}>Analyzing your request</span>
                  <div className={styles.thinkingDots}>
                    <span className={styles.thinkingDot}></span>
                    <span className={styles.thinkingDot}></span>
                    <span className={styles.thinkingDot}></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className={styles.inputSection}>
        <div className={styles.inputContainer}>
          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your code..."
            className={styles.input}
            rows={1}
            disabled={loading}
          />
          <div className={styles.controls}>
            <select 
              value={model} 
              onChange={(e) => onModelChange(e.target.value)}
              className={styles.modelSelect}
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
                onClick={onStop}
                className={`${styles.sendButton} ${styles.stopButton}`}
                title="Stop generation"
              >
                <StopIcon />
              </button>
            ) : (
              <button 
                onClick={onSend}
                disabled={!input.trim()}
                className={styles.sendButton}
                title="Send message"
              >
                <SendIcon />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
