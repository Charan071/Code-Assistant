import { useState, useEffect } from 'react';
import styles from './FileExplorer.module.css';

// Icons
const FolderIcon = ({ isOpen }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
);

const FileIcon = ({ name }) => {
  const getFileColor = (filename) => {
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return '#f7df1e';
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return '#3178c6';
    if (filename.endsWith('.py')) return '#3776ab';
    if (filename.endsWith('.css')) return '#264de4';
    if (filename.endsWith('.json')) return '#5a5a5a';
    if (filename.endsWith('.html')) return '#e34c26';
    if (filename.endsWith('.md')) return '#6cc644';
    return '#a0a0a0';
  };

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={getFileColor(name)} strokeWidth="2">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
      <polyline points="13 2 13 9 20 9"></polyline>
    </svg>
  );
};

const ChevronIcon = ({ isOpen }) => (
  <svg 
    width="14" 
    height="14" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    style={{ 
      transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
      transition: 'transform 0.2s ease'
    }}
  >
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const CollapseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="11 17 6 12 11 7"></polyline>
    <polyline points="18 17 13 12 18 7"></polyline>
  </svg>
);

const ExpandIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="13 17 18 12 13 7"></polyline>
    <polyline points="6 17 11 12 6 7"></polyline>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const MoreIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1"></circle>
    <circle cx="12" cy="5" r="1"></circle>
    <circle cx="12" cy="19" r="1"></circle>
  </svg>
);

// Default file tree with unique IDs
const createDefaultFileTree = () => ({
  id: 'root',
  name: 'project',
  type: 'folder',
  children: [
    {
      id: 'src',
      name: 'src',
      type: 'folder',
      children: [
        { id: 'app-js', name: 'App.js', type: 'file', content: '// Sample React App\nimport React from \'react\';\n\nfunction App() {\n  return (\n    <div className="App">\n      <h1>Hello World</h1>\n    </div>\n  );\n}\n\nexport default App;' },
        { id: 'index-js', name: 'index.js', type: 'file', content: '// Entry point\nimport React from \'react\';\nimport ReactDOM from \'react-dom\';\nimport App from \'./App\';\n\nReactDOM.render(<App />, document.getElementById(\'root\'));' },
        { id: 'utils-js', name: 'utils.js', type: 'file', content: '// Utility functions\nexport const formatDate = (date) => {\n  return new Date(date).toLocaleDateString();\n};\n\nexport const capitalize = (str) => {\n  return str.charAt(0).toUpperCase() + str.slice(1);\n};' }
      ]
    },
    {
      id: 'components',
      name: 'components',
      type: 'folder',
      children: [
        { id: 'header-jsx', name: 'Header.jsx', type: 'file', content: '// Header Component\nimport React from \'react\';\n\nconst Header = ({ title }) => {\n  return (\n    <header>\n      <h1>{title}</h1>\n    </header>\n  );\n};\n\nexport default Header;' },
        { id: 'footer-jsx', name: 'Footer.jsx', type: 'file', content: '// Footer Component\nimport React from \'react\';\n\nconst Footer = () => {\n  return (\n    <footer>\n      <p>&copy; 2024 My App</p>\n    </footer>\n  );\n};\n\nexport default Footer;' }
      ]
    },
    {
      id: 'styles',
      name: 'styles',
      type: 'folder',
      children: [
        { id: 'app-css', name: 'App.css', type: 'file', content: '/* Main App Styles */\n.App {\n  text-align: center;\n  padding: 20px;\n}\n\nh1 {\n  color: #333;\n  font-size: 2rem;\n}' },
        { id: 'index-css', name: 'index.css', type: 'file', content: '/* Global Styles */\n* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: Arial, sans-serif;\n}' }
      ]
    },
    { id: 'package-json', name: 'package.json', type: 'file', content: '{\n  "name": "my-app",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  }\n}' },
    { id: 'readme-md', name: 'README.md', type: 'file', content: '# My Project\n\nThis is a sample project created with Code Maestro.\n\n## Features\n- React components\n- Modern CSS\n- Clean architecture' }
  ]
});

const FileTreeItem = ({ 
  item, 
  onFileClick, 
  selectedFile, 
  level = 0, 
  onDelete,
  onRename,
  onAddFile,
  onAddFolder,
  parentPath = ''
}) => {
  const [isOpen, setIsOpen] = useState(level === 0);
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(item.name);
  const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;

  const handleClick = (e) => {
    if (isRenaming) return;
    if (item.type === 'folder') {
      setIsOpen(!isOpen);
    } else {
      onFileClick(item);
    }
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirm(`Delete ${item.name}?`)) {
      onDelete(item.id, currentPath);
    }
    setShowMenu(false);
  };

  const handleRenameStart = (e) => {
    e.stopPropagation();
    setIsRenaming(true);
    setShowMenu(false);
  };

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (newName.trim() && newName !== item.name) {
      onRename(item.id, newName.trim(), currentPath);
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = (e) => {
    if (e) e.stopPropagation();
    setNewName(item.name);
    setIsRenaming(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRenameSubmit(e);
    } else if (e.key === 'Escape') {
      handleRenameCancel(e);
    }
  };

  return (
    <div>
      <div 
        className={`${styles.treeItem} ${selectedFile?.id === item.id ? styles.selected : ''} ${isRenaming ? styles.renaming : ''}`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {item.type === 'folder' && !isRenaming && (
          <span className={styles.chevron}>
            <ChevronIcon isOpen={isOpen} />
          </span>
        )}
        <span className={styles.icon}>
          {item.type === 'folder' ? (
            <FolderIcon isOpen={isOpen} />
          ) : (
            <FileIcon name={item.name} />
          )}
        </span>
        
        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} className={styles.renameForm}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRenameCancel}
              onKeyDown={handleKeyDown}
              className={styles.renameInput}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </form>
        ) : (
          <span className={styles.name}>{item.name}</span>
        )}

        {!isRenaming && item.name !== 'project' && (
          <div className={styles.itemActions}>
            <button 
              className={styles.menuButton}
              onClick={handleMenuClick}
              title="More actions"
            >
              <MoreIcon />
            </button>
            {showMenu && (
              <div className={styles.contextMenu} onClick={(e) => e.stopPropagation()}>
                <button className={styles.menuItem} onClick={handleRenameStart}>
                  <EditIcon />
                  <span>Rename</span>
                </button>
                {item.type === 'folder' && (
                  <>
                    <button className={styles.menuItem} onClick={(e) => {
                      e.stopPropagation();
                      onAddFile(item.id, currentPath);
                      setShowMenu(false);
                    }}>
                      <PlusIcon />
                      <span>New File</span>
                    </button>
                    <button className={styles.menuItem} onClick={(e) => {
                      e.stopPropagation();
                      onAddFolder(item.id, currentPath);
                      setShowMenu(false);
                    }}>
                      <FolderIcon />
                      <span>New Folder</span>
                    </button>
                  </>
                )}
                <div className={styles.menuDivider}></div>
                <button className={`${styles.menuItem} ${styles.danger}`} onClick={handleDelete}>
                  <TrashIcon />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {item.type === 'folder' && isOpen && item.children && (
        <div className={styles.children}>
          {item.children.map((child) => (
            <FileTreeItem 
              key={child.id} 
              item={child} 
              onFileClick={onFileClick} 
              selectedFile={selectedFile}
              level={level + 1}
              onDelete={onDelete}
              onRename={onRename}
              onAddFile={onAddFile}
              onAddFolder={onAddFolder}
              parentPath={currentPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function FileExplorer({ onFileSelect, selectedFile, isCollapsed, onToggleCollapse }) {
  const [fileTree, setFileTree] = useState(null);
  const [counter, setCounter] = useState(1000);

  // Load file tree from localStorage or use default
  useEffect(() => {
    try {
      const saved = localStorage.getItem('codeAssistantFileTree');
      if (saved) {
        setFileTree(JSON.parse(saved));
      } else {
        setFileTree(createDefaultFileTree());
      }
    } catch (error) {
      console.error('Failed to load file tree:', error);
      setFileTree(createDefaultFileTree());
    }
  }, []);

  // Save file tree to localStorage
  useEffect(() => {
    if (fileTree) {
      try {
        localStorage.setItem('codeAssistantFileTree', JSON.stringify(fileTree));
      } catch (error) {
        console.error('Failed to save file tree:', error);
      }
    }
  }, [fileTree]);

  const findNodeById = (node, id) => {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  const updateNode = (node, id, updater) => {
    if (node.id === id) {
      return updater(node);
    }
    if (node.children) {
      return {
        ...node,
        children: node.children.map(child => updateNode(child, id, updater))
      };
    }
    return node;
  };

  const deleteNodeFromTree = (node, id) => {
    if (node.children) {
      const filtered = node.children.filter(child => child.id !== id);
      return {
        ...node,
        children: filtered.map(child => deleteNodeFromTree(child, id))
      };
    }
    return node;
  };

  const handleAddFile = (parentId, parentPath) => {
    const fileName = prompt('Enter file name:');
    if (!fileName || !fileName.trim()) return;

    const newFile = {
      id: `file-${counter}`,
      name: fileName.trim(),
      type: 'file',
      content: `// New file: ${fileName}\n`
    };

    setCounter(counter + 1);
    setFileTree(updateNode(fileTree, parentId, (node) => ({
      ...node,
      children: [...(node.children || []), newFile]
    })));
  };

  const handleAddFolder = (parentId, parentPath) => {
    const folderName = prompt('Enter folder name:');
    if (!folderName || !folderName.trim()) return;

    const newFolder = {
      id: `folder-${counter}`,
      name: folderName.trim(),
      type: 'folder',
      children: []
    };

    setCounter(counter + 1);
    setFileTree(updateNode(fileTree, parentId, (node) => ({
      ...node,
      children: [...(node.children || []), newFolder]
    })));
  };

  const handleDelete = (id, path) => {
    setFileTree(deleteNodeFromTree(fileTree, id));
    
    // Clear selection if deleted file was selected
    if (selectedFile && selectedFile.id === id) {
      onFileSelect(null);
    }
  };

  const handleRename = (id, newName, path) => {
    setFileTree(updateNode(fileTree, id, (node) => ({
      ...node,
      name: newName
    })));

    // Update selected file if it was renamed
    if (selectedFile && selectedFile.id === id) {
      onFileSelect({ ...selectedFile, name: newName });
    }
  };

  const handleAddRootFile = () => {
    handleAddFile('root', 'project');
  };

  const handleAddRootFolder = () => {
    handleAddFolder('root', 'project');
  };

  if (!fileTree) return null;

  return (
    <div className={`${styles.container} ${isCollapsed ? styles.collapsed : ''}`}>
      {!isCollapsed && (
        <>
          <div className={styles.header}>
            <span className={styles.title}>Explorer</span>
            <div className={styles.headerActions}>
              <button 
                className={styles.iconButton}
                onClick={handleAddRootFile}
                title="New File"
              >
                <PlusIcon />
              </button>
              <button 
                className={styles.iconButton}
                onClick={handleAddRootFolder}
                title="New Folder"
              >
                <FolderIcon />
              </button>
              <button 
                className={styles.collapseButton}
                onClick={onToggleCollapse}
                title="Collapse Explorer"
              >
                <CollapseIcon />
              </button>
            </div>
          </div>
          <div className={styles.tree}>
            <FileTreeItem 
              item={fileTree} 
              onFileClick={onFileSelect} 
              selectedFile={selectedFile}
              onDelete={handleDelete}
              onRename={handleRename}
              onAddFile={handleAddFile}
              onAddFolder={handleAddFolder}
            />
          </div>
        </>
      )}
      {isCollapsed && (
        <div className={styles.collapsedView}>
          <button 
            className={styles.expandButton}
            onClick={onToggleCollapse}
            title="Expand Explorer"
          >
            <ExpandIcon />
          </button>
        </div>
      )}
    </div>
  );
}
