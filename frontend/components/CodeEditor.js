import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import styles from './CodeEditor.module.css';

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// Action Icons
const ExplainIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const BugIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m8 2 1.88 1.88"></path>
    <path d="M14.12 3.88 16 2"></path>
    <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"></path>
    <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"></path>
    <path d="M12 20v-9"></path>
    <path d="M6.53 9C4.6 8.8 3 7.1 3 5"></path>
    <path d="M6 13H2"></path>
    <path d="M3 21c0-2.1 1.7-3.9 3.8-4"></path>
    <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"></path>
    <path d="M22 13h-4"></path>
    <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"></path>
  </svg>
);

const RefactorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 3 21 3 21 8"></polyline>
    <line x1="4" y1="20" x2="21" y2="3"></line>
    <polyline points="21 16 21 21 16 21"></polyline>
    <line x1="15" y1="15" x2="21" y2="21"></line>
    <line x1="4" y1="4" x2="9" y2="9"></line>
  </svg>
);

const ImproveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v20"></path>
    <path d="m15 19-3 3-3-3"></path>
    <path d="m19 15 3-3-3-3"></path>
    <path d="M2 12h20"></path>
    <path d="m5 9-3 3 3 3"></path>
    <path d="m9 5 3-3 3 3"></path>
  </svg>
);

const TestIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
    <polyline points="17 21 17 13 7 13 7 21"></polyline>
    <polyline points="7 3 7 8 15 8"></polyline>
  </svg>
);

export default function CodeEditor({ file, theme, onAiAction, editorRef }) {
  const [code, setCode] = useState(file?.content || '// Select a file from the explorer');
  const [saved, setSaved] = useState(true);
  const monacoRef = useRef(null);

  const handleEditorDidMount = (editor) => {
    monacoRef.current = editor;
    // Expose editor to parent
    if (editorRef) {
      editorRef.current = editor;
    }
  };

  const handleEditorChange = (value) => {
    setCode(value);
    setSaved(false);
    
    // Auto-save to localStorage after 1 second of inactivity
    if (file) {
      const timeoutId = setTimeout(() => {
        saveToLocalStorage(file.name, value);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  };

  const saveToLocalStorage = (filename, content) => {
    try {
      const savedFiles = JSON.parse(localStorage.getItem('codeAssistantFiles') || '{}');
      savedFiles[filename] = {
        content,
        lastModified: new Date().toISOString()
      };
      localStorage.setItem('codeAssistantFiles', JSON.stringify(savedFiles));
      setSaved(true);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };

  const manualSave = () => {
    if (file) {
      saveToLocalStorage(file.name, code);
    }
  };

  const getLanguage = (filename) => {
    if (!filename) return 'javascript';
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'javascript';
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript';
    if (filename.endsWith('.py')) return 'python';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.json')) return 'json';
    if (filename.endsWith('.html')) return 'html';
    if (filename.endsWith('.md')) return 'markdown';
    return 'plaintext';
  };

  const handleAction = (action) => {
    const currentCode = monacoRef.current?.getValue() || code;
    onAiAction(action, currentCode, file?.name);
  };

  // Update code when file changes and load from localStorage if available
  useEffect(() => {
    if (file?.content) {
      // Check localStorage first
      try {
        const savedFiles = JSON.parse(localStorage.getItem('codeAssistantFiles') || '{}');
        if (savedFiles[file.name]) {
          setCode(savedFiles[file.name].content);
          setSaved(true);
        } else {
          setCode(file.content);
          setSaved(true);
        }
      } catch (error) {
        setCode(file.content);
        setSaved(true);
      }
    }
  }, [file]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.fileInfo}>
          <span className={styles.fileName}>
            {file?.name || 'Untitled'}
            {!saved && <span className={styles.unsavedIndicator}>●</span>}
          </span>
        </div>
        <div className={styles.actions}>
          <button 
            className={styles.actionButton}
            onClick={manualSave}
            title="Save (Auto-saves every 1s)"
            disabled={saved}
          >
            <SaveIcon />
            <span>{saved ? 'Saved' : 'Save'}</span>
          </button>
          <button 
            className={styles.actionButton}
            onClick={() => handleAction('explain')}
            title="Explain code"
          >
            <ExplainIcon />
            <span>Explain</span>
          </button>
          <button 
            className={styles.actionButton}
            onClick={() => handleAction('debug')}
            title="Debug code"
          >
            <BugIcon />
            <span>Debug</span>
          </button>
          <button 
            className={styles.actionButton}
            onClick={() => handleAction('refactor')}
            title="Refactor code"
          >
            <RefactorIcon />
            <span>Refactor</span>
          </button>
          <button 
            className={styles.actionButton}
            onClick={() => handleAction('improve')}
            title="Improve code"
          >
            <ImproveIcon />
            <span>Improve</span>
          </button>
          <button 
            className={styles.actionButton}
            onClick={() => handleAction('test')}
            title="Write tests"
          >
            <TestIcon />
            <span>Tests</span>
          </button>
        </div>
      </div>
      <div className={styles.editorWrapper}>
        <MonacoEditor
          height="100%"
          language={getLanguage(file?.name)}
          value={code}
          theme="vs-dark"
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
          }}
        />
      </div>
    </div>
  );
}
