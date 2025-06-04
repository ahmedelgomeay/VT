/**
 * @fileoverview Notes Manager - A utility for managing notes with tabs functionality
 * for the VOIS Test Data Extension.
 * 
 * This module provides a floating notes button and a notes container with tabs
 * where users can create, rename, and manage multiple notes, saved to local storage.
 * 
 * @author VOIS Test Data Extension Team
 * @version 1.0.0
 */

import ToastManager from "../../../utils/ToastManager.js";
import { NpmNotesEditorIntegration } from "../../../utils/tiptap/NpmNotesEditorIntegration.js";

/**
 * Storage keys for managing notes data in Chrome storage
 * @constant {Object}
 */
const STORAGE_KEYS = {
  NOTES_DATA: 'notesData',
  ACTIVE_TAB: 'activeNotesTab',
  FULLSCREEN_STATE: 'notesFullscreenState'
};

/**
 * NotesManager class responsible for creating and managing the notes functionality
 */
class NotesManager {
  /**
   * Creates an instance of NotesManager.
   * 
   * @constructor
   */
  constructor() {
    // Initialize state variables
    this.isNotesVisible = false;
    this.notesData = [];
    this.activeTabId = null;
    this.isRenamingTab = false;
    this.renamingTabId = null;
    this.autoSaveTimeout = null;
    this.autoSaveDelay = 1000; // Auto-save after 1 second of inactivity
    this.lastToggleTime = 0; // Track last time notes was toggled
    this.toggleCooldown = 300; // Cooldown period in ms to prevent rapid toggles
    this.isFullscreen = false; // Track fullscreen state

    // Initialize the TipTap editor integration
    this.editorIntegration = new NpmNotesEditorIntegration();

    // Initialize DOM elements
    this.notesBtn = null;
    this.notesContainer = null;
    this.notesMainContent = null;
    this.notesTabs = null;
    this.newTabBtn = null;
    this.tabRenameInput = null;
    this.notesInfo = null;
    this.fullscreenBtn = null;
    this.closeBtn = null;

    // Bind methods to preserve 'this' context
    this.toggleNotes = this.toggleNotes.bind(this);
    this.createNewTab = this.createNewTab.bind(this);
    this.saveNotes = this.saveNotes.bind(this);
    this.deleteTab = this.deleteTab.bind(this);
    this.switchTab = this.switchTab.bind(this);
    this.showRenameInput = this.showRenameInput.bind(this);
    this.renameTab = this.renameTab.bind(this);
    this.cancelRename = this.cancelRename.bind(this);
    this.generateTabId = this.generateTabId.bind(this);
    this.autoSave = this.autoSave.bind(this);
    this.handleEditorUpdate = this.handleEditorUpdate.bind(this);
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
    this.toggleFullscreen = this.toggleFullscreen.bind(this);
    this.closeNotes = this.closeNotes.bind(this);
  }

  /**
   * Initializes the NotesManager functionality.
   * This is the main entry point after creating an instance.
   */
  init() {
    this.createNotesButton();
    this.createNotesContainer();
    this.loadNotesData();
    this.setupEventListeners();
    
    // Don't initialize the editor integration until notes are opened
    // this.editorIntegration.init();
    
    // Ensure notes are not visible initially
    this.isNotesVisible = false;
    this.notesContainer.classList.remove('active');
  }

  /**
   * Creates the floating notes button and adds it to the DOM.
   */
  createNotesButton() {
    // Create notes button if it doesn't exist
    if (!document.getElementById('notesBtn')) {
      const notesBtn = document.createElement('button');
      notesBtn.id = 'notesBtn';
      notesBtn.innerHTML = '<i class="fas fa-sticky-note"></i>';
      notesBtn.setAttribute('data-tooltip', 'Notes');
      notesBtn.setAttribute('data-position', 'left');
      document.body.appendChild(notesBtn);
      this.notesBtn = notesBtn;
    } else {
      this.notesBtn = document.getElementById('notesBtn');
    }
  }

  /**
   * Creates the notes container with all its components and adds it to the DOM.
   */
  createNotesContainer() {
    // Create container if it doesn't exist
    if (!document.getElementById('notesContainer')) {
      // Main container
      const notesContainer = document.createElement('div');
      notesContainer.id = 'notesContainer';
      notesContainer.className = 'notes-container';

      // Header
      const notesHeader = document.createElement('div');
      notesHeader.className = 'notes-header';

      const notesTitle = document.createElement('h3');
      notesTitle.className = 'notes-title';
      notesTitle.textContent = 'Notes';

      const notesActions = document.createElement('div');
      notesActions.className = 'notes-actions';

      // Fullscreen button
      const fullscreenBtn = document.createElement('button');
      fullscreenBtn.className = 'notes-action-btn notes-fullscreen-btn';
      fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
      fullscreenBtn.title = 'Toggle fullscreen';
      fullscreenBtn.setAttribute('data-tooltip', 'Toggle fullscreen');
      notesActions.appendChild(fullscreenBtn);

      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.className = 'notes-action-btn notes-close-btn';
      closeBtn.innerHTML = '<i class="fas fa-times"></i>';
      closeBtn.title = 'Close notes';
      notesActions.appendChild(closeBtn);

      notesHeader.appendChild(notesTitle);
      notesHeader.appendChild(notesActions);

      // Main content area with tabs sidebar and notes content
      const notesMainContent = document.createElement('div');
      notesMainContent.className = 'notes-main-content';

      // Tabs navigation (now on the left side)
      const notesTabs = document.createElement('div');
      notesTabs.className = 'notes-tabs';

      // New tab button (now at the bottom of the sidebar)
      const newTabBtn = document.createElement('div');
      newTabBtn.className = 'new-tab-btn';
      newTabBtn.innerHTML = '<i class="fas fa-plus"></i>';
      newTabBtn.title = 'Add new tab';
      notesTabs.appendChild(newTabBtn);

      // Notes content area
      const notesContent = document.createElement('div');
      notesContent.className = 'notes-content';

      // Add tabs and content to main content
      notesMainContent.appendChild(notesTabs);
      notesMainContent.appendChild(notesContent);

      // Footer with info text
      const notesFooter = document.createElement('div');
      notesFooter.className = 'notes-footer';

      const notesInfo = document.createElement('div');
      notesInfo.className = 'notes-info';
      notesInfo.textContent = 'Notes are auto-saved, Happy Testing!';

      notesFooter.appendChild(notesInfo);

      // Tab rename input
      const tabRenameInput = document.createElement('div');
      tabRenameInput.className = 'tab-rename-input';

      const tabRenameTitle = document.createElement('div');
      tabRenameTitle.className = 'tab-rename-title';
      tabRenameTitle.textContent = 'Rename Tab';

      const tabRenameField = document.createElement('input');
      tabRenameField.className = 'tab-rename-field';
      tabRenameField.type = 'text';
      tabRenameField.placeholder = 'Enter tab name';

      const tabRenameButtons = document.createElement('div');
      tabRenameButtons.className = 'tab-rename-buttons';

      const tabRenameSave = document.createElement('button');
      tabRenameSave.className = 'tab-rename-btn tab-rename-save';
      tabRenameSave.textContent = 'Save';

      const tabRenameCancel = document.createElement('button');
      tabRenameCancel.className = 'tab-rename-btn tab-rename-cancel';
      tabRenameCancel.textContent = 'Cancel';

      tabRenameButtons.appendChild(tabRenameSave);
      tabRenameButtons.appendChild(tabRenameCancel);

      tabRenameInput.appendChild(tabRenameTitle);
      tabRenameInput.appendChild(tabRenameField);
      tabRenameInput.appendChild(tabRenameButtons);

      // Assemble all components
      notesContainer.appendChild(notesHeader);
      notesContainer.appendChild(notesMainContent);
      notesContainer.appendChild(notesFooter);
      notesContainer.appendChild(tabRenameInput);

      document.body.appendChild(notesContainer);

      // Store references to DOM elements
      this.notesContainer = notesContainer;
      this.notesMainContent = notesMainContent;
      this.notesTabs = notesTabs;
      this.notesContent = notesContent;
      this.newTabBtn = newTabBtn;
      this.notesInfo = notesInfo;
      this.tabRenameInput = tabRenameInput;
      this.tabRenameField = tabRenameField;
      this.tabRenameSave = tabRenameSave;
      this.tabRenameCancel = tabRenameCancel;
      this.fullscreenBtn = fullscreenBtn;
      this.closeBtn = closeBtn;
    } else {
      // Get existing elements if they already exist
      this.notesContainer = document.getElementById('notesContainer');
      this.notesMainContent = this.notesContainer.querySelector('.notes-main-content');
      this.notesTabs = this.notesContainer.querySelector('.notes-tabs');
      this.notesContent = this.notesContainer.querySelector('.notes-content');
      this.newTabBtn = this.notesTabs.querySelector('.new-tab-btn');
      this.notesInfo = this.notesContainer.querySelector('.notes-info');
      this.tabRenameInput = this.notesContainer.querySelector('.tab-rename-input');
      this.tabRenameField = this.tabRenameInput.querySelector('.tab-rename-field');
      this.tabRenameSave = this.tabRenameInput.querySelector('.tab-rename-save');
      this.tabRenameCancel = this.tabRenameInput.querySelector('.tab-rename-cancel');
      this.fullscreenBtn = this.notesContainer.querySelector('.notes-fullscreen-btn');
      this.closeBtn = this.notesContainer.querySelector('.notes-close-btn');
    }
  }

  /**
   * Sets up all event listeners for the notes functionality.
   */
  setupEventListeners() {
    // Notes button click
    this.notesBtn.addEventListener('click', this.toggleNotes);
    
    // New tab button click
    this.newTabBtn.addEventListener('click', this.createNewTab);
    
    // Save button in rename modal
    this.tabRenameSave.addEventListener('click', this.renameTab);
    
    // Cancel button in rename modal
    this.tabRenameCancel.addEventListener('click', this.cancelRename);
    
    // Enter key in rename field
    this.tabRenameField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.renameTab();
      } else if (e.key === 'Escape') {
        this.cancelRename();
      }
    });
    
    // Fullscreen button
    this.fullscreenBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event from bubbling up
      this.toggleFullscreen();
    });
    
    // Close button
    this.closeBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event from bubbling up
      this.closeNotes();
    });
    
    // Tab keyboard navigation
    this.notesTabs.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        
        const tabs = Array.from(this.notesTabs.querySelectorAll('.notes-tab'));
        const activeTabIndex = tabs.findIndex(tab => tab.classList.contains('active'));
        
        let newIndex;
        if (e.key === 'ArrowUp') {
          newIndex = activeTabIndex > 0 ? activeTabIndex - 1 : tabs.length - 1;
        } else {
          newIndex = activeTabIndex < tabs.length - 1 ? activeTabIndex + 1 : 0;
        }
        
        if (tabs[newIndex]) {
          this.switchTab(tabs[newIndex].dataset.tabId);
        }
      }
    });
    
    // Outside click handler to close notes if needed
    document.addEventListener('click', this.handleOutsideClick);
    
    // Set up tab scrolling
    this.setupTabDragScrolling();
  }

  /**
   * Sets up touch and mouse drag scrolling for tabs
   */
  setupTabDragScrolling() {
    let isDown = false;
    let startY;
    let scrollTop;
    const tabs = this.notesTabs;
    
    // Mouse Events
    tabs.addEventListener('mousedown', (e) => {
      // Only if not on a tab element itself or new tab button
      if (e.target.closest('.notes-tab') || e.target.closest('.new-tab-btn')) {
        return;
      }
      
      isDown = true;
      startY = e.pageY - tabs.offsetTop;
      scrollTop = tabs.scrollTop;
      tabs.classList.add('active-scrolling');
    });
    
    tabs.addEventListener('mouseleave', () => {
      isDown = false;
      tabs.classList.remove('active-scrolling');
    });
    
    tabs.addEventListener('mouseup', () => {
      isDown = false;
      tabs.classList.remove('active-scrolling');
    });
    
    tabs.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const y = e.pageY - tabs.offsetTop;
      const walk = (y - startY) * 2; // Scroll speed multiplier
      tabs.scrollTop = scrollTop - walk;
    });
    
    // Touch Events
    tabs.addEventListener('touchstart', (e) => {
      // Only if not on a tab element itself or new tab button
      if (e.target.closest('.notes-tab') || e.target.closest('.new-tab-btn')) {
        return;
      }
      
      isDown = true;
      startY = e.touches[0].pageY - tabs.offsetTop;
      scrollTop = tabs.scrollTop;
      tabs.classList.add('active-scrolling');
    }, { passive: true });
    
    tabs.addEventListener('touchend', () => {
      isDown = false;
      tabs.classList.remove('active-scrolling');
    });
    
    tabs.addEventListener('touchcancel', () => {
      isDown = false;
      tabs.classList.remove('active-scrolling');
    });
    
    tabs.addEventListener('touchmove', (e) => {
      if (!isDown) return;
      const y = e.touches[0].pageY - tabs.offsetTop;
      const walk = (y - startY) * 2;
      tabs.scrollTop = scrollTop - walk;
    }, { passive: true });
  }

  /**
   * Handles outside clicks to hide the notes panel
   * @param {Event} e - The click event
   */
  handleOutsideClick(e) {
    // If notes is not visible or we're in rename mode or we clicked inside notes, do nothing
    if (!this.isNotesVisible || this.isRenamingTab || e.target.closest('#notesContainer') || e.target.closest('#notesBtn')) {
      return;
    }

    this.closeNotes();
  }

  /**
   * Handles editor content updates
   * @param {string} tabId - The ID of the tab that changed
   * @param {string} content - The new content
   */
  handleEditorUpdate(tabId, content) {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    
    this.autoSaveTimeout = setTimeout(() => {
      this.autoSave(tabId, content);
    }, this.autoSaveDelay);
  }

  /**
   * Auto-saves the content of a specific editor
   * @param {string} tabId - The ID of the tab that changed
   * @param {string} content - The content to save
   */
  autoSave(tabId, content) {
    if (!tabId) return;
    
    // Find tab index
    const tabIndex = this.notesData.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) return;
    
    // Update content and timestamp
    this.notesData[tabIndex].content = content;
    this.notesData[tabIndex].timestamp = Date.now();
    
    // Save to storage
    this.saveNotesDataToStorage().then(() => {
      console.log(`Auto-saved notes for tab "${this.notesData[tabIndex].title}"`);
    });
  }

  /**
   * Loads notes data from Chrome storage.
   */
  async loadNotesData() {
    try {
      // Get data from Chrome storage
      const result = await chrome.storage.local.get([
        STORAGE_KEYS.NOTES_DATA,
        STORAGE_KEYS.ACTIVE_TAB,
        STORAGE_KEYS.FULLSCREEN_STATE
      ]);
      
      // Initialize notes data
      this.notesData = result[STORAGE_KEYS.NOTES_DATA] || [];
      this.activeTabId = result[STORAGE_KEYS.ACTIVE_TAB] || null;
      this.isFullscreen = result[STORAGE_KEYS.FULLSCREEN_STATE] || false;
      
      // Apply fullscreen class if needed
      if (this.isFullscreen && this.notesContainer) {
        this.notesContainer.classList.add('fullscreen');
        if (this.fullscreenBtn) {
          this.fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
          this.fullscreenBtn.title = 'Exit fullscreen';
        }
      }
      
      // Create default tab if no data exists
      if (this.notesData.length === 0) {
        const defaultTab = {
          id: this.generateTabId(),
          title: 'Notes',
          content: '',
          timestamp: Date.now()
        };
        
        this.notesData.push(defaultTab);
        this.activeTabId = defaultTab.id;
        
        // Save default tab to storage
        await this.saveNotesDataToStorage();
      }
      
      // Render tabs and content
      this.renderTabs();
      this.renderTabContents();
      
      // Activate the tab
      this.activateTab(this.activeTabId);
    } catch (error) {
      console.error('Error loading notes data:', error);
      ToastManager.showToast('Error loading notes data', ToastManager.FAILURE_TOAST);
    }
  }

  /**
   * Renders all tabs based on the notes data.
   */
  renderTabs() {
    // Clear existing tabs except the new tab button
    const tabElements = this.notesTabs.querySelectorAll('.notes-tab');
    tabElements.forEach(tab => tab.remove());
    
    // Remove the new tab button temporarily
    if (this.newTabBtn.parentNode) {
      this.newTabBtn.parentNode.removeChild(this.newTabBtn);
    }
    
    // Add the tabs
    this.notesData.forEach(tab => {
      const tabElement = this.createTabElement(tab);
      this.notesTabs.appendChild(tabElement);
    });
    
    // Add the new tab button back at the end
    this.notesTabs.appendChild(this.newTabBtn);
  }

  /**
   * Creates a tab element for the tab navigation.
   * 
   * @param {Object} tab - The tab data object
   * @returns {HTMLElement} The created tab element
   */
  createTabElement(tab) {
    const tabElement = document.createElement('div');
    tabElement.className = 'notes-tab';
    tabElement.dataset.tabId = tab.id;
    
    const tabTitle = document.createElement('span');
    tabTitle.className = 'notes-tab-title';
    tabTitle.textContent = tab.title;
    
    const tabClose = document.createElement('span');
    tabClose.className = 'notes-tab-close';
    tabClose.innerHTML = '<i class="fas fa-times"></i>';
    
    tabElement.appendChild(tabTitle);
    tabElement.appendChild(tabClose);
    
    // Event listeners
    tabElement.addEventListener('click', (e) => {
      // Prevent event bubbling
      e.stopPropagation();
      
      // Ignore if close button clicked
      if (!e.target.closest('.notes-tab-close')) {
        this.switchTab(tab.id);
      }
    });
    
    // Double click to rename
    tabElement.addEventListener('dblclick', (e) => {
      // Prevent event bubbling
      e.stopPropagation();
      
      // Ignore if close button clicked
      if (!e.target.closest('.notes-tab-close')) {
        this.showRenameInput(tab.id);
      }
    });
    
    // Close button click
    tabClose.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteTab(tab.id);
    });
    
    return tabElement;
  }

  /**
   * Renders the content areas for all tabs.
   */
  renderTabContents() {
    // Clear existing content
    this.notesContent.innerHTML = '';
    
    // Create content for each tab
    this.notesData.forEach(tab => {
      const contentElement = document.createElement('div');
      contentElement.className = 'tab-content';
      contentElement.dataset.tabId = tab.id;
      
      const textarea = document.createElement('textarea');
      textarea.className = 'notes-textarea';
      textarea.placeholder = 'Write your notes here...';
      textarea.value = tab.content || '';
      
      contentElement.appendChild(textarea);
      this.notesContent.appendChild(contentElement);
    });
    
    // Activate the active tab
    if (this.activeTabId && this.notesData.some(tab => tab.id === this.activeTabId)) {
      this.activateTab(this.activeTabId);
    } else if (this.notesData.length > 0) {
      this.activateTab(this.notesData[0].id);
    }
  }

  /**
   * Activates a specific tab and shows its content.
   * @param {string} tabId - The ID of the tab to activate
   */
  activateTab(tabId) {
    // Update the active tab ID
    this.activeTabId = tabId;
    
    // Update active class on tabs
    const tabs = this.notesTabs.querySelectorAll('.notes-tab');
    tabs.forEach(tab => {
      if (tab.dataset.tabId === tabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Update active class on tab contents
    const tabContents = this.notesContent.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
      if (content.dataset.tabId === tabId) {
        content.classList.add('active');
        
        // Check if editorIntegration is initialized
        if (this.editorIntegration && this.editorIntegration.editors) {
          // Create editor for this tab if it doesn't exist yet, with a small delay
          setTimeout(async () => {
            if (!this.editorIntegration.editors.has(tabId)) {
              const tabData = this.notesData.find(tab => tab.id === tabId);
              if (tabData) {
                await this.editorIntegration.createEditorForTab(
                  tabId, 
                  content, 
                  tabData.content,
                  this.handleEditorUpdate
                );
              }
            }
          }, 10);
        }
      } else {
        content.classList.remove('active');
      }
    });
    
    // Save active tab to storage
    chrome.storage.local.set({ [STORAGE_KEYS.ACTIVE_TAB]: tabId });
  }

  /**
   * Switches to a tab by ID.
   * 
   * @param {string} tabId - The ID of the tab to switch to
   */
  switchTab(tabId) {
    this.activateTab(tabId);
  }

  /**
   * Creates a new tab with a default title.
   */
  createNewTab() {
    const newTab = {
      id: this.generateTabId(),
      title: `Tab ${this.notesData.length + 1}`,
      content: '',
      timestamp: Date.now()
    };
    
    // Add to notes data
    this.notesData.push(newTab);
    
    // Render the new tab
    const tabElement = this.createTabElement(newTab);
    this.notesTabs.insertBefore(tabElement, this.newTabBtn);
    
    // Create content for the new tab
    const contentElement = document.createElement('div');
    contentElement.className = 'tab-content';
    contentElement.dataset.tabId = newTab.id;
    
    const textarea = document.createElement('textarea');
    textarea.className = 'notes-textarea';
    textarea.placeholder = 'Write your notes here...';
    
    contentElement.appendChild(textarea);
    this.notesContent.appendChild(contentElement);
    
    // Activate the new tab
    this.switchTab(newTab.id);
    
    // Only create editor if editorIntegration is initialized
    if (this.editorIntegration && this.editorIntegration.initialized) {
      // Create the rich text editor for this tab with a small delay to ensure DOM is updated
      setTimeout(async () => {
        await this.editorIntegration.createEditorForTab(
          newTab.id, 
          contentElement, 
          newTab.content, 
          this.handleEditorUpdate
        );
      }, 10);
    }
    
    // Save to storage
    this.saveNotesDataToStorage();
  }

  /**
   * Deletes a tab by ID.
   * 
   * @param {string} tabId - The ID of the tab to delete
   */
  deleteTab(tabId) {
    // Don't delete if it's the only tab
    if (this.notesData.length <= 1) {
      ToastManager.showToast('Oops! You cannot delete the only tab', ToastManager.FAILURE_TOAST);
      return;
    }
    
    // Find the tab index
    const tabIndex = this.notesData.findIndex(tab => tab.id === tabId);
    
    if (tabIndex !== -1) {
      // Remove from data
      this.notesData.splice(tabIndex, 1);
      
      // Remove from DOM
      const tabElement = this.notesTabs.querySelector(`.notes-tab[data-tab-id="${tabId}"]`);
      if (tabElement) {
        tabElement.remove();
      }
      
      const contentElement = this.notesContent.querySelector(`.tab-content[data-tab-id="${tabId}"]`);
      if (contentElement) {
        contentElement.remove();
      }
      
      // If active tab was deleted, activate another tab
      if (this.activeTabId === tabId) {
        // Activate the next tab, or the previous if there is no next
        const newActiveTab = this.notesData[Math.min(tabIndex, this.notesData.length - 1)];
        this.activateTab(newActiveTab.id);
      }
      
      // Save to storage
      this.saveNotesDataToStorage();
      
    }
  }

  /**
   * Shows the rename input for a specific tab.
   * 
   * @param {string} tabId - The ID of the tab to rename
   */
  showRenameInput(tabId) {
    const tab = this.notesData.find(t => t.id === tabId);
    
    if (tab) {
      this.isRenamingTab = true;
      this.renamingTabId = tabId;
      
      // Set the input value to current tab title
      this.tabRenameField.value = tab.title;
      
      // Show the rename input
      this.tabRenameInput.classList.add('active');
      
      // Focus the input
      setTimeout(() => {
        this.tabRenameField.focus();
        this.tabRenameField.select();
      }, 100);
    }
  }

  /**
   * Renames the currently selected tab.
   */
  renameTab() {
    if (!this.isRenamingTab || !this.renamingTabId) {
      return;
    }
    
    const newTitle = this.tabRenameField.value.trim();
    
    if (newTitle === '') {
      ToastManager.showToast('Tab name cannot be empty', ToastManager.FAILURE_TOAST);
      return;
    }
    
    // Find the tab
    const tabIndex = this.notesData.findIndex(tab => tab.id === this.renamingTabId);
    
    if (tabIndex !== -1) {
      // Update the title
      this.notesData[tabIndex].title = newTitle;
      
      // Update the DOM
      const tabElement = this.notesTabs.querySelector(`.notes-tab[data-tab-id="${this.renamingTabId}"]`);
      if (tabElement) {
        const titleElement = tabElement.querySelector('.notes-tab-title');
        if (titleElement) {
          titleElement.textContent = newTitle;
        }
      }
      
      // Save to storage
      this.saveNotesDataToStorage();
    
    }
    
    // Hide the rename input
    this.cancelRename();
  }

  /**
   * Cancels the tab rename operation.
   */
  cancelRename() {
    this.isRenamingTab = false;
    this.renamingTabId = null;
    this.tabRenameInput.classList.remove('active');
  }

  /**
   * Saves all notes content from the editors to the notes data
   */
  saveNotes() {
    if (!this.notesData || !this.notesContent) return;
    
    // Check if editorIntegration is initialized and has editors
    if (!this.editorIntegration || !this.editorIntegration.editors) return;
    
    // Get all tab IDs that have editors
    const tabIds = Array.from(this.editorIntegration.editors.keys());
    
    // Loop through each tab with an editor
    tabIds.forEach(tabId => {
      // Get content from editor
      const content = this.editorIntegration.getEditorContent(tabId);
      
      // Find the tab in the notes data
      const tabIndex = this.notesData.findIndex(tab => tab.id === tabId);
      
      if (tabIndex !== -1) {
        // Update the content
        this.notesData[tabIndex].content = content;
        this.notesData[tabIndex].timestamp = Date.now();
      }
    });
    
    // Save to storage
    this.saveNotesDataToStorage();
  }

  /**
   * Saves the notes data to Chrome storage
   * @returns {Promise} A promise that resolves when data is saved
   */
  saveNotesDataToStorage() {
    return chrome.storage.local.set({ [STORAGE_KEYS.NOTES_DATA]: this.notesData });
  }

  /**
   * Generates a unique ID for a new tab
   * @returns {string} A unique ID
   */
  generateTabId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  /**
   * Toggles the visibility of the notes panel
   */
  toggleNotes() {
    // Check if we need to enforce cooldown
    const now = Date.now();
    if (now - this.lastToggleTime < this.toggleCooldown) {
      return; // Ignore rapid toggling
    }
    this.lastToggleTime = now;
    
    // Toggle notes visibility
    this.isNotesVisible = !this.isNotesVisible;
    
    if (this.isNotesVisible) {
      // Show notes
      this.notesContainer.classList.add('active');
      
      // If in fullscreen mode, add the fullscreen class
      if (this.isFullscreen) {
        this.notesContainer.classList.add('fullscreen');
        document.body.style.overflow = 'hidden'; // Prevent body scrolling
      }
      
      // Initialize the TipTap editor integration if not already initialized
      if (!this.editorIntegration.initialized) {
        this.editorIntegration.init().then(() => {
          // Initialize editors for all tabs with a small delay to ensure DOM is updated
          setTimeout(async () => {
            const tabContents = this.notesContent.querySelectorAll('.tab-content');
            for (const content of tabContents) {
              const tabId = content.dataset.tabId;
              if (tabId && content.classList.contains('active')) {
                const tabData = this.notesData.find(tab => tab.id === tabId);
                if (tabData) {
                  await this.editorIntegration.createEditorForTab(
                    tabId, 
                    content, 
                    tabData.content,
                    this.handleEditorUpdate
                  );
                }
              }
            }
          }, 10);
        });
      } else {
        // Initialize editors for all tabs with a small delay to ensure DOM is updated
        setTimeout(async () => {
          const tabContents = this.notesContent.querySelectorAll('.tab-content');
          for (const content of tabContents) {
            const tabId = content.dataset.tabId;
            if (tabId && content.classList.contains('active')) {
              const tabData = this.notesData.find(tab => tab.id === tabId);
              if (tabData) {
                await this.editorIntegration.createEditorForTab(
                  tabId, 
                  content, 
                  tabData.content,
                  this.handleEditorUpdate
                );
              }
            }
          }
        }, 10);
      }
      
    } else {
      // Hide notes
      this.saveNotes();
      // Only destroy editors if they exist
      if (this.editorIntegration && this.editorIntegration.editors) {
        this.editorIntegration.destroyAllEditors();
      }
      this.notesContainer.classList.remove('active');
      
      // If in fullscreen mode, exit fullscreen when closing
      if (this.isFullscreen) {
        document.body.style.overflow = ''; // Restore body scrolling
        
        // Delay removing fullscreen class until after closing animation
        setTimeout(() => {
          this.notesContainer.classList.remove('fullscreen');
        }, 300);
      }
    }
  }

  /**
   * Toggles fullscreen mode for the notes panel
   */
  toggleFullscreen() {
    // Update fullscreen state
    this.isFullscreen = !this.isFullscreen;
    
    // Save fullscreen state
    chrome.storage.local.set({ [STORAGE_KEYS.FULLSCREEN_STATE]: this.isFullscreen });
    
    // Apply appropriate classes and styles
    if (this.isFullscreen) {
      // Enter fullscreen mode
      this.notesContainer.classList.add('fullscreen');
      this.fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
      this.fullscreenBtn.title = 'Exit fullscreen';
      document.body.style.overflow = 'hidden'; // Prevent body scrolling
    } else {
      // Exit fullscreen mode
      this.notesContainer.classList.remove('fullscreen');
      this.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
      this.fullscreenBtn.title = 'Enter fullscreen';
      document.body.style.overflow = ''; // Restore body scrolling
    }
    
    // Make sure notes container stays visible
    if (!this.isNotesVisible) {
      this.isNotesVisible = true;
      this.notesContainer.classList.add('active');
    }
    
    // Refresh the editors to adjust to new size
    setTimeout(() => {
      if (this.activeTabId) {
        const editor = this.editorIntegration?.editors?.get(this.activeTabId);
        if (editor) {
          // Force a re-render by getting and setting content
          const content = editor.getContent();
          editor.setContent(content);
        }
      }
    }, 100);
  }

  /**
   * Closes the notes panel
   */
  closeNotes() {
    // Only proceed if the notes are visible
    if (!this.isNotesVisible) return;
    
    // Save notes before closing
    this.saveNotes();
    
    // Destroy all editors if editor integration is initialized
    if (this.editorIntegration && this.editorIntegration.editors) {
      this.editorIntegration.destroyAllEditors();
    }
    
    // Hide notes panel
    this.notesContainer.classList.remove('active');
    this.isNotesVisible = false;
    
    // Handle fullscreen state
    if (this.isFullscreen) {
      // Reset fullscreen state
      this.isFullscreen = false;
      // Save the updated fullscreen state to storage
      chrome.storage.local.set({ [STORAGE_KEYS.FULLSCREEN_STATE]: false });
      
      // Update button appearance
      this.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
      this.fullscreenBtn.title = 'Enter fullscreen';
      
      // Restore body scrolling
      document.body.style.overflow = '';
      
      // Delay removing fullscreen class until after closing animation
      setTimeout(() => {
        this.notesContainer.classList.remove('fullscreen');
      }, 300);
    }
  }
}

// Create and initialize the NotesManager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check if this is a new tab - if it's a new blank tab, we'll see specific patterns in the URL
  const isNewTab = window.location.href === 'about:blank' || 
                  window.location.href === 'chrome://newtab/' ||
                  window.location.href.includes('chrome://newtab') ||
                  window.location.href.startsWith('chrome-search://');
  
  // Check if notes were in fullscreen mode before closing
  chrome.storage.local.get([STORAGE_KEYS.FULLSCREEN_STATE], (result) => {
    const wasFullscreen = result[STORAGE_KEYS.FULLSCREEN_STATE] || false;
    
    // Initialize NotesManager but don't show it automatically for new tabs
    const notesManager = new NotesManager();
    
    // If it was in fullscreen, prepare container before initialization
    if (wasFullscreen) {
      // We'll set up the fullscreen class after initialization
      notesManager.isFullscreen = true;
    }
    
    // Initialize manager
    notesManager.init();
    
    // If it was in fullscreen, open notes and apply fullscreen
    if (wasFullscreen) {
      // Delayed execution to ensure all styles are applied
      setTimeout(() => {
        // Apply fullscreen directly to container before making it visible
        document.body.style.overflow = 'hidden'; // Prevent body scrolling
        notesManager.notesContainer.classList.add('fullscreen');
        notesManager.fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
        notesManager.fullscreenBtn.title = 'Exit fullscreen';
        
        // Force layout recalculation for proper rendering
        notesManager.notesContainer.style.display = 'none';
        setTimeout(() => {
          notesManager.notesContainer.style.display = 'flex';
          
          // Then make notes visible
          setTimeout(() => {
            notesManager.isNotesVisible = true;
            notesManager.notesContainer.classList.add('active');
            
            // Initialize the TipTap editor integration
            if (!notesManager.editorIntegration.initialized) {
              notesManager.editorIntegration.init().then(() => {
                // Initialize editors with a delay
                setTimeout(async () => {
                  const tabContents = notesManager.notesContent.querySelectorAll('.tab-content');
                  for (const content of tabContents) {
                    const tabId = content.dataset.tabId;
                    if (tabId && content.classList.contains('active')) {
                      const tabData = notesManager.notesData.find(tab => tab.id === tabId);
                      if (tabData) {
                        await notesManager.editorIntegration.createEditorForTab(
                          tabId, 
                          content, 
                          tabData.content,
                          notesManager.handleEditorUpdate
                        );
                      }
                    }
                  }
                }, 100);
              });
            }
          }, 50);
        }, 10);
      }, 100);
    }
  });
});

export default NotesManager; 