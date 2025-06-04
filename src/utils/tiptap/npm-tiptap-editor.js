import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
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
 * Tries to parse and format JSON
 * @param {string} text - The text to check and format
 * @returns {string|null} - Formatted JSON or null if not valid JSON
 */
function tryFormatJSON(text) {
  text = text.trim();
  
  // Quick check if it looks like JSON (starts with { or [ and ends with } or ])
  if (
    !(
      (text.startsWith('{') && text.endsWith('}')) || 
      (text.startsWith('[') && text.endsWith(']'))
    )
  ) {
    return null;
  }
  
  try {
    // Try to parse the JSON
    const parsed = JSON.parse(text);
    // Format it with indentation
    const formatted = JSON.stringify(parsed, null, 2);
    return formatted;
  } catch (e) {
    // Not valid JSON
    return null;
  }
}

/**
 * Creates a new Tiptap editor
 * @param {Object} options - Editor options
 * @returns {Object} - Editor instance and utilities
 */
export default function createTiptapEditor(options = {}) {
  const {
    content = '',
    placeholder = '', // Keep parameter for backward compatibility
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
    if (!editor) {
      console.error('Cannot create toolbar: editor is not initialized');
      return document.createElement('div');
    }
    
    const toolbar = document.createElement('div');
    toolbar.className = 'tiptap-toolbar';

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

    // Heading buttons
    const headingGroup = document.createElement('div');
    headingGroup.className = 'tiptap-button-group';

    // Paragraph
    const paragraphBtn = document.createElement('button');
    paragraphBtn.className = 'tiptap-button tiptap-text-button';
    paragraphBtn.innerHTML = 'P';
    paragraphBtn.title = 'Paragraph';
    paragraphBtn.addEventListener('click', () => {
      editor.chain().focus().setParagraph().run();
    });
    headingGroup.appendChild(paragraphBtn);

    // H1
    const h1Btn = document.createElement('button');
    h1Btn.className = 'tiptap-button tiptap-text-button';
    h1Btn.innerHTML = 'H1';
    h1Btn.title = 'Heading 1';
    h1Btn.addEventListener('click', () => {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    });
    headingGroup.appendChild(h1Btn);

    // H2
    const h2Btn = document.createElement('button');
    h2Btn.className = 'tiptap-button tiptap-text-button';
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

    // Highlight and special formatting
    const specialGroup = document.createElement('div');
    specialGroup.className = 'tiptap-button-group';

    // Highlight color dropdown container
    const highlightContainer = document.createElement('div');
    highlightContainer.className = 'tiptap-dropdown-container';
    
    // Highlight button that shows the dropdown
    const highlightBtn = document.createElement('button');
    highlightBtn.className = 'tiptap-button';
    highlightBtn.innerHTML = '<i class="fas fa-highlighter"></i>';
    highlightBtn.title = 'Highlight';
    
    // Highlight color dropdown
    const highlightDropdown = document.createElement('div');
    highlightDropdown.className = 'tiptap-dropdown';
    
    // Define highlight colors
    const highlightColors = [
      { name: 'yellow', color: '#FEF08A', title: 'Yellow' },
      { name: 'blue', color: '#BAE6FD', title: 'Blue' },
      { name: 'green', color: '#BBF7D0', title: 'Green' },
      { name: 'pink', color: '#FBCFE8', title: 'Pink' },
      { name: 'red', color: '#FCA5A5', title: 'Red' },
      { name: 'purple', color: '#DDD6FE', title: 'Purple' },
    ];
    
    // Create color buttons
    highlightColors.forEach(highlightColor => {
      const colorBtn = document.createElement('button');
      colorBtn.className = 'tiptap-color-button';
      colorBtn.style.backgroundColor = highlightColor.color;
      colorBtn.title = highlightColor.title;
      colorBtn.addEventListener('click', () => {
        editor.chain().focus().toggleHighlight({ color: highlightColor.color }).run();
        highlightDropdown.style.display = 'none';
      });
      highlightDropdown.appendChild(colorBtn);
    });
    
    // Default yellow highlight for the main button
    highlightBtn.addEventListener('click', (e) => {
      if (highlightDropdown.style.display === 'flex') {
        highlightDropdown.style.display = 'none';
      } else {
        highlightDropdown.style.display = 'flex';
        // Position dropdown below the button
        const buttonRect = highlightBtn.getBoundingClientRect();
        highlightDropdown.style.top = `${buttonRect.height}px`;
        highlightDropdown.style.left = '0';
      }
      e.stopPropagation();
    });
    
    // Close dropdown when clicking elsewhere
    document.addEventListener('click', () => {
      highlightDropdown.style.display = 'none';
    });
    
    highlightContainer.appendChild(highlightBtn);
    highlightContainer.appendChild(highlightDropdown);
    specialGroup.appendChild(highlightContainer);

    // Code
    const codeBtn = document.createElement('button');
    codeBtn.className = 'tiptap-button';
    codeBtn.innerHTML = '<i class="fas fa-code"></i>';
    codeBtn.title = 'Code';
    codeBtn.addEventListener('click', () => {
      editor.chain().focus().toggleCode().run();
    });
    specialGroup.appendChild(codeBtn);

    // Blockquote
    const blockquoteBtn = document.createElement('button');
    blockquoteBtn.className = 'tiptap-button';
    blockquoteBtn.innerHTML = '<i class="fas fa-quote-right"></i>';
    blockquoteBtn.title = 'Blockquote';
    blockquoteBtn.addEventListener('click', () => {
      editor.chain().focus().toggleBlockquote().run();
    });
    specialGroup.appendChild(blockquoteBtn);

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

    // Add all groups to toolbar in the order they should appear
    toolbar.appendChild(formatGroup);
    toolbar.appendChild(headingGroup);
    toolbar.appendChild(listGroup);
    toolbar.appendChild(specialGroup);
    toolbar.appendChild(historyGroup);

    // Update toolbar button states initially
    const updateToolbarState = () => {
      // History buttons
      undoBtn.disabled = !editor.can().undo();
      redoBtn.disabled = !editor.can().redo();
      
      // Format buttons
      boldBtn.classList.toggle('is-active', editor.isActive('bold'));
      italicBtn.classList.toggle('is-active', editor.isActive('italic'));
      underlineBtn.classList.toggle('is-active', editor.isActive('underline'));
      strikeBtn.classList.toggle('is-active', editor.isActive('strike'));
      
      // Highlight button - check if any highlight is active
      const isHighlightActive = editor.isActive('highlight');
      highlightBtn.classList.toggle('is-active', isHighlightActive);
      
      // Update highlight button color indicator if a specific color is active
      if (isHighlightActive) {
        const attrs = editor.getAttributes('highlight');
        if (attrs && attrs.color) {
          // Show active color with a small indicator
          highlightBtn.style.borderBottom = `3px solid ${attrs.color}`;
        } else {
          // Default yellow highlight
          highlightBtn.style.borderBottom = '3px solid #FEF08A';
        }
      } else {
        // Remove color indicator when highlight is not active
        highlightBtn.style.borderBottom = 'none';
      }
      
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
    
    // Update toolbar when selection changes
    editor.on('selectionUpdate', updateToolbarState);
    editor.on('transaction', updateToolbarState);
    
    // Initial state update
    updateToolbarState();

    return toolbar;
  };

  /**
   * Initializes the editor
   * @param {HTMLElement} container - The container element
   */
  const init = (container) => {
    try {
      if (!container) {
        console.error('Container element is required');
        return;
      }
  
      // Create editor container
      editorElement = document.createElement('div');
      editorElement.className = 'tiptap-editor';
      
      // Create a container for the toolbar to ensure it stays visible
      const toolbarContainer = document.createElement('div');
      toolbarContainer.className = 'tiptap-toolbar-container';
      
      // Add editor element to container
      container.appendChild(toolbarContainer);
      container.appendChild(editorElement);
  
      try {
        // Create editor instance first
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
            Underline,
            Highlight.configure({
              multicolor: true,
              HTMLAttributes: {
                class: 'highlight',
              },
            }),
          ],
          content,
          editable,
          autofocus,
          onUpdate: ({ editor }) => {
            // Get the updated content
            const updatedContent = editor.getHTML();
            
            // Notify listeners
            if (listeners.has('update')) {
              listeners.get('update')(updatedContent);
            }
          },
        });
        
        // Now that editor is created, create the toolbar
        if (editor) {
          toolbarElement = createToolbar();
          toolbarContainer.appendChild(toolbarElement);
          
          // Set minimum height to ensure consistency
          editorElement.style.minHeight = '150px';
          
          // After the editor is created
          try {
            editor.on('create', () => {
              // Add event listener for key combinations
              const editorDOM = editor.view?.dom;
              if (editorDOM) {
                editorDOM.classList.add('tiptap-content');
                editorDOM.style.minHeight = '150px';
                
                // Add paste event handler for JSON detection
                editorDOM.addEventListener('paste', (e) => {
                  // Don't handle paste if inside a code block already
                  if (editor.isActive('codeBlock')) {
                    return;
                  }
                  
                  // Get clipboard text
                  const clipboardData = e.clipboardData || window.clipboardData;
                  if (!clipboardData || !clipboardData.getData) return;
                  
                  const text = clipboardData.getData('text/plain');
                  if (!text) return;
                  
                  // Try to format as JSON
                  const formattedJSON = tryFormatJSON(text);
                  if (formattedJSON) {
                    // Prevent default paste - this must be called BEFORE any editor commands
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Insert as code block with JSON styling
                    setTimeout(() => {
                      editor.chain()
                        .focus()
                        .toggleCodeBlock()
                        .insertContent(formattedJSON)
                        .run();
                      
                      // Apply JSON-specific styling
                      setTimeout(() => {
                        if (editor && editor.view && editor.view.dom) {
                          const codeBlocks = editor.view.dom.querySelectorAll('pre');
                          if (codeBlocks.length > 0) {
                            // Add class to the most recently added code block
                            const lastCodeBlock = codeBlocks[codeBlocks.length - 1];
                            lastCodeBlock.classList.add('json-block');
                          }
                        }
                      }, 0);
                    }, 0);
                  }
                });
                
                editorDOM.addEventListener('keydown', (e) => {
                  // Handle Ctrl+A
                  if (e.ctrlKey && e.key === 'a') {
                    // Let the select all happen normally
                    
                    // But set up a listener for the delete/backspace that might follow
                    const handleDelete = (deleteEvent) => {
                      if (deleteEvent.key === 'Delete' || deleteEvent.key === 'Backspace') {
                        // Prevent the editor from becoming completely empty
                        setTimeout(() => {
                          if (editor && editor.isEmpty) {
                            editor.commands.clearContent(false);
                            editor.commands.focus();
                          }
                        }, 0);
                      }
                      
                      // Remove this listener after first keypress
                      editorDOM.removeEventListener('keydown', handleDelete);
                    };
                    
                    // Add temporary listener for the next keypress
                    editorDOM.addEventListener('keydown', handleDelete);
                  }
                });
              }
            });
          } catch (eventError) {
            console.error('Error setting up editor events:', eventError);
          }
        } else {
          console.error('Failed to create editor instance');
        }
      } catch (editorError) {
        console.error('Error creating TipTap editor instance:', editorError);
        return;
      }
    } catch (error) {
      console.error('Error initializing TipTap editor:', error);
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