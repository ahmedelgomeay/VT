import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import './npm-tiptap-editor.css';

/**
 * Helper function to escape HTML special characters
 * @param {string} text - The text to escape
 * @returns {string} - The escaped text
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Creates a new Tiptap editor
 * @param {Object} options - Editor options
 * @returns {Object} - Editor instance and utilities
 */
export default function createTiptapEditor(options = {}) {
  const {
    content = '',
    placeholder = 'Write something...',
    editable = true,
    autofocus = false,
  } = options;

  let editor = null;
  let toolbarElement = null;
  let editorElement = null;
  const listeners = new Map();

  /**
   * Creates the editor toolbar
   * @returns {HTMLElement} - The toolbar element
   */
  const createToolbar = () => {
    const toolbar = document.createElement('div');
    toolbar.className = 'tiptap-toolbar';

    // Undo/Redo group
    const historyGroup = document.createElement('div');
    historyGroup.className = 'tiptap-button-group';

    // Undo
    const undoBtn = document.createElement('button');
    undoBtn.className = 'tiptap-button';
    undoBtn.innerHTML = '<i class="fas fa-undo"></i>';
    undoBtn.title = 'Undo';
    undoBtn.addEventListener('click', () => {
      editor.chain().focus().undo().run();
    });
    historyGroup.appendChild(undoBtn);

    // Redo
    const redoBtn = document.createElement('button');
    redoBtn.className = 'tiptap-button';
    redoBtn.innerHTML = '<i class="fas fa-redo"></i>';
    redoBtn.title = 'Redo';
    redoBtn.addEventListener('click', () => {
      editor.chain().focus().redo().run();
    });
    historyGroup.appendChild(redoBtn);

    // Text formatting buttons
    const formatGroup = document.createElement('div');
    formatGroup.className = 'tiptap-button-group';

    // Bold
    const boldBtn = document.createElement('button');
    boldBtn.className = 'tiptap-button';
    boldBtn.innerHTML = '<i class="fas fa-bold"></i>';
    boldBtn.title = 'Bold';
    boldBtn.addEventListener('click', () => {
      editor.chain().focus().toggleBold().run();
    });
    formatGroup.appendChild(boldBtn);

    // Italic
    const italicBtn = document.createElement('button');
    italicBtn.className = 'tiptap-button';
    italicBtn.innerHTML = '<i class="fas fa-italic"></i>';
    italicBtn.title = 'Italic';
    italicBtn.addEventListener('click', () => {
      editor.chain().focus().toggleItalic().run();
    });
    formatGroup.appendChild(italicBtn);

    // Underline
    const underlineBtn = document.createElement('button');
    underlineBtn.className = 'tiptap-button';
    underlineBtn.innerHTML = '<i class="fas fa-underline"></i>';
    underlineBtn.title = 'Underline';
    underlineBtn.addEventListener('click', () => {
      editor.chain().focus().toggleUnderline().run();
    });
    formatGroup.appendChild(underlineBtn);

    // Strikethrough
    const strikeBtn = document.createElement('button');
    strikeBtn.className = 'tiptap-button';
    strikeBtn.innerHTML = '<i class="fas fa-strikethrough"></i>';
    strikeBtn.title = 'Strikethrough';
    strikeBtn.addEventListener('click', () => {
      editor.chain().focus().toggleStrike().run();
    });
    formatGroup.appendChild(strikeBtn);

    // Highlight
    const highlightBtn = document.createElement('button');
    highlightBtn.className = 'tiptap-button';
    highlightBtn.innerHTML = '<i class="fas fa-highlighter"></i>';
    highlightBtn.title = 'Highlight';
    highlightBtn.addEventListener('click', () => {
      editor.chain().focus().toggleHighlight().run();
    });
    formatGroup.appendChild(highlightBtn);

    // Heading buttons
    const headingGroup = document.createElement('div');
    headingGroup.className = 'tiptap-button-group';

    // Paragraph
    const paragraphBtn = document.createElement('button');
    paragraphBtn.className = 'tiptap-button';
    paragraphBtn.innerHTML = 'P';
    paragraphBtn.title = 'Paragraph';
    paragraphBtn.addEventListener('click', () => {
      editor.chain().focus().setParagraph().run();
    });
    headingGroup.appendChild(paragraphBtn);

    // H1
    const h1Btn = document.createElement('button');
    h1Btn.className = 'tiptap-button';
    h1Btn.innerHTML = 'H1';
    h1Btn.title = 'Heading 1';
    h1Btn.addEventListener('click', () => {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    });
    headingGroup.appendChild(h1Btn);

    // H2
    const h2Btn = document.createElement('button');
    h2Btn.className = 'tiptap-button';
    h2Btn.innerHTML = 'H2';
    h2Btn.title = 'Heading 2';
    h2Btn.addEventListener('click', () => {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    });
    headingGroup.appendChild(h2Btn);

    // List buttons
    const listGroup = document.createElement('div');
    listGroup.className = 'tiptap-button-group';

    // Bullet list
    const bulletListBtn = document.createElement('button');
    bulletListBtn.className = 'tiptap-button';
    bulletListBtn.innerHTML = '<i class="fas fa-list-ul"></i>';
    bulletListBtn.title = 'Bullet List';
    bulletListBtn.addEventListener('click', () => {
      editor.chain().focus().toggleBulletList().run();
    });
    listGroup.appendChild(bulletListBtn);

    // Ordered list
    const orderedListBtn = document.createElement('button');
    orderedListBtn.className = 'tiptap-button';
    orderedListBtn.innerHTML = '<i class="fas fa-list-ol"></i>';
    orderedListBtn.title = 'Ordered List';
    orderedListBtn.addEventListener('click', () => {
      editor.chain().focus().toggleOrderedList().run();
    });
    listGroup.appendChild(orderedListBtn);

    // Code and blockquote buttons
    const mediaGroup = document.createElement('div');
    mediaGroup.className = 'tiptap-button-group';

    // Code
    const codeBtn = document.createElement('button');
    codeBtn.className = 'tiptap-button';
    codeBtn.innerHTML = '<i class="fas fa-code"></i>';
    codeBtn.title = 'Code';
    codeBtn.addEventListener('click', () => {
      editor.chain().focus().toggleCode().run();
    });
    mediaGroup.appendChild(codeBtn);

    // Blockquote
    const blockquoteBtn = document.createElement('button');
    blockquoteBtn.className = 'tiptap-button';
    blockquoteBtn.innerHTML = '<i class="fas fa-quote-right"></i>';
    blockquoteBtn.title = 'Blockquote';
    blockquoteBtn.addEventListener('click', () => {
      editor.chain().focus().toggleBlockquote().run();
    });
    mediaGroup.appendChild(blockquoteBtn);

    // Add all groups to toolbar
    toolbar.appendChild(historyGroup);
    toolbar.appendChild(formatGroup);
    toolbar.appendChild(headingGroup);
    toolbar.appendChild(listGroup);
    toolbar.appendChild(mediaGroup);

    // Update active states based on editor state
    editor.on('selectionUpdate', () => {
      updateToolbarState();
    });
    
    editor.on('transaction', () => {
      updateToolbarState();
    });

    // Update toolbar button states
    const updateToolbarState = () => {
      // History buttons
      undoBtn.disabled = !editor.can().undo();
      redoBtn.disabled = !editor.can().redo();
      
      // Format buttons
      boldBtn.classList.toggle('is-active', editor.isActive('bold'));
      italicBtn.classList.toggle('is-active', editor.isActive('italic'));
      underlineBtn.classList.toggle('is-active', editor.isActive('underline'));
      strikeBtn.classList.toggle('is-active', editor.isActive('strike'));
      highlightBtn.classList.toggle('is-active', editor.isActive('highlight'));
      
      // Heading buttons
      paragraphBtn.classList.toggle('is-active', editor.isActive('paragraph'));
      h1Btn.classList.toggle('is-active', editor.isActive('heading', { level: 1 }));
      h2Btn.classList.toggle('is-active', editor.isActive('heading', { level: 2 }));
      
      // List buttons
      bulletListBtn.classList.toggle('is-active', editor.isActive('bulletList'));
      orderedListBtn.classList.toggle('is-active', editor.isActive('orderedList'));
      
      // Other buttons
      codeBtn.classList.toggle('is-active', editor.isActive('code'));
      blockquoteBtn.classList.toggle('is-active', editor.isActive('blockquote'));
    };

    return toolbar;
  };

  /**
   * Initializes the editor
   * @param {HTMLElement} element - The container element
   */
  const init = (container) => {
    if (!container) {
      console.error('Container element is required');
      return;
    }

    // Create editor container
    editorElement = document.createElement('div');
    editorElement.className = 'tiptap-editor';

    // Create editor instance
    editor = new Editor({
      element: editorElement,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2],
          },
          history: {
            depth: 100,
            newGroupDelay: 500,
          },
          bulletList: {
            keepMarks: true,
            keepAttributes: true,
          },
          orderedList: {
            keepMarks: true,
            keepAttributes: true,
          },
        }),
        Placeholder.configure({
          placeholder,
          emptyEditorClass: 'is-editor-empty',
          emptyNodeClass: 'is-empty',
          showOnlyWhenEditable: true,
          showOnlyCurrent: true, // Only show placeholder on current node
        }),
        Underline,
        Highlight.configure({
          multicolor: false,
        }),
      ],
      content,
      editable,
      autofocus,
      onUpdate: ({ editor }) => {
        // Get the updated content
        const updatedContent = editor.getHTML();
        
        // Ensure there's always at least one paragraph for proper placeholder display
        if (editor.isEmpty) {
          // Set a minimal paragraph without affecting the isEmpty state
          editor.view.dom.querySelector('.ProseMirror').style.minHeight = '150px';
        }
        
        // Notify listeners
        if (listeners.has('update')) {
          listeners.get('update')(updatedContent);
        }
      },
    });

    // Create and add toolbar
    toolbarElement = createToolbar();
    
    // Create a container for the toolbar to ensure it stays visible
    const toolbarContainer = document.createElement('div');
    toolbarContainer.className = 'tiptap-toolbar-container';
    toolbarContainer.appendChild(toolbarElement);
    
    // Add components to container
    container.appendChild(toolbarContainer);
    container.appendChild(editorElement);
    
    // Add event listener for key combinations
    editorElement.addEventListener('keydown', (e) => {
      // Handle Ctrl+A
      if (e.ctrlKey && e.key === 'a') {
        console.log('Ctrl+A detected');
        // Let the select all happen normally
        
        // But set up a listener for the delete/backspace that might follow
        const handleDelete = (deleteEvent) => {
          if (deleteEvent.key === 'Delete' || deleteEvent.key === 'Backspace') {
            console.log('Delete after Ctrl+A detected');
            
            // Prevent the editor from becoming completely empty
            setTimeout(() => {
              if (editor.isEmpty) {
                editor.commands.clearContent(false);
                editor.commands.focus();
              }
            }, 0);
          }
          
          // Remove this listener after first keypress
          editorElement.removeEventListener('keydown', handleDelete);
        };
        
        // Add temporary listener for the next keypress
        editorElement.addEventListener('keydown', handleDelete);
      }
    });

    // Initialize the editor
    editor.init(editorContainer);
    
    // Add a class to the ProseMirror element for better CSS targeting
    const proseMirror = editorElement.querySelector('.ProseMirror');
    if (proseMirror) {
      proseMirror.classList.add('tiptap-content');
      
      // Set minimum height to ensure consistency
      proseMirror.style.minHeight = '150px';
    }
  };

  /**
   * Gets the editor content
   * @returns {string} - The editor content as HTML
   */
  const getContent = () => {
    return editor ? editor.getHTML() : '';
  };

  /**
   * Sets the editor content
   * @param {string} html - The HTML content to set
   */
  const setContent = (html) => {
    if (editor) {
      editor.commands.setContent(html);
    }
  };

  /**
   * Adds an event listener
   * @param {string} event - The event name
   * @param {Function} callback - The callback function
   */
  const on = (event, callback) => {
    listeners.set(event, callback);
  };

  /**
   * Destroys the editor
   */
  const destroy = () => {
    if (editor) {
      editor.destroy();
      editor = null;
    }
    
    if (toolbarElement && toolbarElement.parentNode) {
      toolbarElement.parentNode.removeChild(toolbarElement);
    }
    
    if (editorElement && editorElement.parentNode) {
      editorElement.parentNode.removeChild(editorElement);
    }
    
    listeners.clear();
  };

  return {
    init,
    getContent,
    setContent,
    on,
    destroy,
  };
} 