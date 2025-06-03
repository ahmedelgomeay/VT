/**
 * NpmNotesEditorIntegration - Module to integrate npm-based Tiptap editor with Notes Manager
 */

import { loadBundle } from './bundleLoader.js';

// Import the bundled editor
let createTiptapEditor;

// We'll load the bundled editor dynamically
async function loadTiptapEditor() {
  try {
    // Try to load the bundled editor
    createTiptapEditor = await loadBundle('tiptapEditor');
    
    if (!createTiptapEditor) {
      throw new Error('Tiptap editor bundle loaded but editor function not found');
    }
    
    return true;
  } catch (error) {
    console.error('Error loading Tiptap editor:', error);
    
    // Fallback to direct import for development
    try {
      const module = await import('./npm-tiptap-editor.js');
      createTiptapEditor = module.default;
      return true;
    } catch (fallbackError) {
      console.error('Failed to load fallback editor:', fallbackError);
      return false;
    }
  }
}

export class NpmNotesEditorIntegration {
  constructor() {
    this.editors = new Map(); // Store editors by tabId
    this.initialized = false;
  }

  /**
   * Initialize the editor integration
   */
  async init() {
    // Import the CSS once
    if (!this.initialized) {
      await this.loadCSS();
      this.initialized = true;
    }
  }

  /**
   * Load required CSS
   */
  async loadCSS() {
    // Load Font Awesome if not already present
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const fontAwesome = document.createElement('link');
      fontAwesome.rel = 'stylesheet';
      fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
      document.head.appendChild(fontAwesome);
    }
    
    // Load the bundled editor
    return await loadTiptapEditor();
  }

  /**
   * Create an editor for a tab content
   * @param {string} tabId - The ID of the tab
   * @param {HTMLElement} tabContent - The tab content element
   * @param {string} initialContent - Initial content for the editor
   * @param {function} onUpdate - Callback when content changes
   */
  async createEditorForTab(tabId, tabContent, initialContent = '', onUpdate = null) {
    // Make sure editor is loaded
    if (!createTiptapEditor) {
      await loadTiptapEditor();
      if (!createTiptapEditor) {
        console.error('Failed to load Tiptap editor');
        return null;
      }
    }
    
    // If an editor already exists for this tab, destroy it first
    if (this.editors.has(tabId)) {
      this.destroyEditorForTab(tabId);
    }
    
    // Create a div to replace the textarea
    const editorContainer = document.createElement('div');
    editorContainer.className = 'notes-editor-container';
    editorContainer.style.width = '100%';
    editorContainer.style.maxWidth = '100%';
    editorContainer.style.overflowWrap = 'break-word';
    
    // Check for textarea, create one if it doesn't exist
    let textarea = tabContent.querySelector('.notes-textarea');
    if (!textarea) {
      // If there's no textarea, we'll create one or use an existing container
      if (tabContent.children.length === 0) {
        // Create a new textarea if the tab content is empty
        textarea = document.createElement('textarea');
        textarea.className = 'notes-textarea';
        textarea.value = initialContent || '';
        tabContent.appendChild(textarea);
      } else {
        // Use the existing content element directly
        tabContent.innerHTML = ''; // Clear existing content
        
        // Create a temporary textarea for conversion
        textarea = document.createElement('textarea');
        textarea.className = 'notes-textarea';
        textarea.value = initialContent || '';
        tabContent.appendChild(textarea);
      }
    }
    
    // Now we should have a textarea
    if (textarea) {
      // Save the content from the textarea
      const savedContent = textarea.value || initialContent;
      
      // Replace the textarea with our container
      textarea.parentNode.replaceChild(editorContainer, textarea);
      
      // Create the editor
      const editor = createTiptapEditor({
        content: savedContent,
        placeholder: 'Write your notes here...',
        autofocus: tabContent.classList.contains('active')
      });
      
      // Initialize the editor
      editor.init(editorContainer);
      
      // Add update event listener
      if (onUpdate) {
        editor.on('update', (content) => {
          onUpdate(tabId, content);
        });
      }
      
      // Store the editor reference
      this.editors.set(tabId, editor);
      
      return editor;
    }
    
    console.error('Failed to create editor for tab', tabId);
    return null;
  }
  
  /**
   * Get the content from an editor
   * @param {string} tabId - The ID of the tab
   * @returns {string} The editor content
   */
  getEditorContent(tabId) {
    const editor = this.editors.get(tabId);
    if (editor) {
      return editor.getContent();
    }
    return '';
  }
  
  /**
   * Set the content of an editor
   * @param {string} tabId - The ID of the tab
   * @param {string} content - The content to set
   */
  setEditorContent(tabId, content) {
    const editor = this.editors.get(tabId);
    if (editor) {
      editor.setContent(content);
    }
  }
  
  /**
   * Destroy an editor for a tab
   * @param {string} tabId - The ID of the tab
   */
  destroyEditorForTab(tabId) {
    const editor = this.editors.get(tabId);
    if (editor) {
      editor.destroy();
      this.editors.delete(tabId);
    }
  }
  
  /**
   * Destroy all editors
   */
  destroyAllEditors() {
    this.editors.forEach((editor) => {
      editor.destroy();
    });
    this.editors.clear();
  }
} 