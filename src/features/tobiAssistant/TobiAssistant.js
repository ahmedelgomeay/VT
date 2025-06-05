import ToastManager from "../../utils/ToastManager.js";

/**
 * TobiAssistant class responsible for managing the TOBi icon interactions
 * and AI-like search functionality with proper positioning
 */
class TobiAssistant {
    /**
     * Creates an instance of TobiAssistant.
     * 
     * @constructor
     */
    constructor() {
        this.tobiContainer = null;
        this.tobiIcon = null;
        this.tobiTooltip = null;
        this.chatContainer = null;
        this.chatMessages = null;
        this.chatInput = null;
        
        // Inspector properties
        this.inspectorActive = false;
        
        this.responses = [
            "Need help with Locating Elements?",
        ];
        
        this.aiPrompts = [
            "Hi I'm TOBi, How can I help you today?",
            "Greetings I'm TOBi, What are you looking for today?",
            "Hello I'm TOBi, Need specific information? Just ask!"
        ];
        
        this.isAnimating = false;
        this.aiMode = false;
        this.testQueryCount = 0; // Counter for sequential test responses
        this.conversationHistory = []; // Store conversation history
        this.storageKey = 'tobiConversationHistory'; // Key for Chrome storage
        this.animationTimerId = null;
        this.isFullscreen = true; // Set fullscreen mode as default
    }

    /**
     * Initializes the TobiAssistant functionality.
     */
    init() {
        this.createTobiUI();
        this.setupEventListeners();
        this.createAiChatInterface();
        this.loadConversationHistory();
        this.setupInspectorMessageListener();
        
        // Check if Tobi animations should be disabled
        chrome.storage.local.get(['tobiAnimationsDisabled', 'performanceModeEnabled'], (result) => {
            const isPerformanceModeEnabled = result.performanceModeEnabled;
            const isTobiAnimationsDisabled = result.tobiAnimationsDisabled;
            
            if (!isTobiAnimationsDisabled && !isPerformanceModeEnabled) {
                this.startOccasionalAnimation();
                console.log('TOBi Assistant animations enabled');
            } else {
                console.log('TOBi Assistant animations disabled');
            }
        });
    }
    
    /**
     * Creates the TOBi UI elements and adds them to the DOM.
     */
    createTobiUI() {
        // Create TOBi container
        this.tobiContainer = document.createElement('div');
        this.tobiContainer.className = 'tobi-container';
        this.tobiContainer.id = 'tobiContainer';
        
        // Create TOBi icon
        this.tobiIcon = document.createElement('img');
        this.tobiIcon.src = "../../assets/icons/tobi-VF.png";
        this.tobiIcon.alt = "TOBi";
        this.tobiIcon.className = 'tobi-icon';
        this.tobiIcon.id = 'tobiIcon';
        
        // Use data-tooltip attribute instead of separate tooltip div
        this.tobiContainer.setAttribute('data-tooltip', "Hi! I'm TOBi, Vodafone's chatbot.");
        
        // Assemble and add to DOM
        this.tobiContainer.appendChild(this.tobiIcon);
        document.body.appendChild(this.tobiContainer);
    }

    /**
     * Sets up event listeners for TOBi interactions.
     */
    setupEventListeners() {
        if (this.tobiContainer) {
            this.tobiContainer.addEventListener('click', () => this.handleClick());
        }
        
        // Close chat if clicked outside
        document.addEventListener('click', (event) => {
            if (this.chatContainer && this.tobiContainer) {
                const isClickInsideChat = this.chatContainer.contains(event.target);
                const isClickOnIcon = this.tobiContainer.contains(event.target);
                
                if (!isClickInsideChat && !isClickOnIcon && this.aiMode) {
                    this.toggleChatInterface(false);
                }
            }
        });
    }

    /**
     * Creates the AI chat interface for TOBi.
     */
    createAiChatInterface() {
        // Create chat container
        this.chatContainer = document.createElement('div');
        this.chatContainer.className = 'tobi-chat-container';
        this.chatContainer.style.display = 'none'; // Explicitly hide on creation
        
        // Add fullscreen class by default
        this.chatContainer.classList.add('fullscreen');
        
        // Create chat header
        const chatHeader = document.createElement('div');
        chatHeader.className = 'tobi-chat-header';
        chatHeader.innerHTML = `
            <img src="../../assets/icons/tobi-VF.png" alt="TOBi" class="tobi-chat-icon">
            <span>TOBi Assistant</span>
            <div class="tobi-header-buttons">
                <button class="tobi-chat-inspect" title="Highlight Page Elements"><i class="fas fa-search"></i></button>
                <button class="tobi-chat-clear" title="Clear Chat"><i class="fas fa-trash-alt"></i></button>
                <button class="tobi-chat-close" title="Close Chat">&times;</button>
            </div>
        `;
        
        // Create chat messages area
        this.chatMessages = document.createElement('div');
        this.chatMessages.className = 'tobi-chat-messages';
        
        // Create chat input area
        const chatInputArea = document.createElement('form');
        chatInputArea.className = 'tobi-chat-input-area';
        chatInputArea.onsubmit = (e) => {
            e.preventDefault();
            this.processUserQuery();
            return false;
        };
        
        this.chatInput = document.createElement('input');
        this.chatInput.type = 'text';
        this.chatInput.className = 'tobi-chat-input';
        this.chatInput.placeholder = 'Type here to talk to TOBi...';
        this.chatInput.autocomplete = 'off';
        
        const sendButton = document.createElement('button');
        sendButton.type = 'submit';
        sendButton.className = 'tobi-chat-send';
        sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        
        // Append elements
        chatInputArea.appendChild(this.chatInput);
        chatInputArea.appendChild(sendButton);
        
        this.chatContainer.appendChild(chatHeader);
        this.chatContainer.appendChild(this.chatMessages);
        this.chatContainer.appendChild(chatInputArea);
        
        document.body.appendChild(this.chatContainer);
        
        // Add event listeners for chat interface - using direct reference for reliability
        const closeButton = chatHeader.querySelector('.tobi-chat-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                console.log('Close button clicked');
                this.toggleChatInterface(false);
            });
        }
        
        const clearButton = chatHeader.querySelector('.tobi-chat-clear');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                console.log('Clear button clicked');
                this.clearChat();
            });
        }
        
        const inspectButton = chatHeader.querySelector('.tobi-chat-inspect');
        if (inspectButton) {
            inspectButton.addEventListener('click', () => {
                console.log('Inspect button clicked');
                this.toggleInspector();
            });
        }
        
        sendButton.addEventListener('click', () => {
            this.processUserQuery();
        });
        
        this.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.processUserQuery();
            }
        });
        
        // Initially hide the chat interface
        this.toggleChatInterface(false);
    }

    /**
     * Toggles the chat interface visibility
     * @param {boolean} show - Whether to show or hide the chat interface
     */
    toggleChatInterface(show) {
        if (this.chatContainer) {
            if (show) {
                console.log('Opening TOBi chat interface');
                this.chatContainer.style.display = 'flex';
                this.chatInput.focus();
                this.scrollToBottom();
                this.aiMode = true;
                
                // Always apply fullscreen styles
                document.body.style.overflow = 'hidden'; // Prevent body scrolling
                
                // Add a welcome message with random AI prompt when opened
                if (this.chatMessages.children.length === 0) {
                    this.addBotMessage(this.getRandomAiPrompt());
                }
                
                // If Notes Manager is open, close it to avoid overlap
                const notesContainer = document.getElementById('notesContainer');
                if (notesContainer && notesContainer.classList.contains('active')) {
                    // Find the notes button and trigger a click to close it
                    const notesBtn = document.getElementById('notesBtn');
                    if (notesBtn) {
                        notesBtn.click();
                    } else {
                        // Fallback: just remove the active class
                        notesContainer.classList.remove('active');
                    }
                }
            } else {
                console.log('Closing TOBi chat interface');
                this.chatContainer.style.display = 'none';
                this.aiMode = false;
                
                // Restore body scrolling when closing
                document.body.style.overflow = '';
            }
        }
    }

    /**
     * Converts an HTML element or string to a code-formatted text representation.
     * 
     * @param {HTMLElement|string} content - HTML element or string to convert
     * @returns {string} - The code-formatted text representation
     */
    formatHTMLAsCode(content) {
        let htmlString = '';
        
        // If content is an HTML element, get its outerHTML
        if (content instanceof HTMLElement) {
            htmlString = content.outerHTML;
        } 
        // If content is likely an HTML string
        else if (typeof content === 'string' && (content.includes('<') && content.includes('>'))) {
            htmlString = content;
        }
        // Otherwise, just return the content as is
        else {
            return content;
        }
        
        // Format as code block with backticks
        return `\`\`\`html\n${htmlString}\n\`\`\``;
    }

    /**
     * Adds a message from the bot to the chat interface.
     * 
     * @param {string|HTMLElement} message - The message to add
     */
    addBotMessage(message) {
        // Format HTML elements as code if needed
        if (message instanceof HTMLElement) {
            message = this.formatHTMLAsCode(message);
        }
        
        this.conversationHistory.push({ sender: 'bot', message });
        this.saveConversationHistory();
        this.addMessageToUI('bot', message);
    }

    /**
     * Adds a message from the user to the chat interface.
     * 
     * @param {string|HTMLElement} message - The message to add
     */
    addUserMessage(message) {
        // Format HTML elements as code if needed
        if (message instanceof HTMLElement) {
            message = this.formatHTMLAsCode(message);
        }
        
        this.conversationHistory.push({ sender: 'user', message });
        this.saveConversationHistory();
        this.addMessageToUI('user', message);
    }

    /**
     * Escapes HTML characters to prevent rendering of HTML tags.
     * 
     * @param {string} html - The HTML string to escape
     * @returns {string} - The escaped HTML string
     */
    escapeHTML(html) {
        if (!html) return '';
        return html
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Renders markdown-style code blocks in text.
     * Handles various code blocks and basic markdown formatting.
     * 
     * @param {string} text - Text that may contain markdown code blocks
     * @returns {string} - HTML with formatted code blocks and markdown
     */
    renderMarkdown(text) {
        if (!text) return '';
        
        // First escape HTML in the entire text
        let escapedText = this.escapeHTML(text);
        
        // Handle code blocks with language specification
        escapedText = escapedText.replace(/```(\w*)\n([\s\S]*?)\n```/g, (match, language, code) => {
            return `<pre><code class="language-${language || 'plaintext'}">${code}</code></pre>`;
        });
        
        // Handle inline code
        escapedText = escapedText.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Handle basic markdown
        // Bold
        escapedText = escapedText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // Italic
        escapedText = escapedText.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // Images - must handle these before links
        escapedText = escapedText.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" loading="lazy">');
        
        // Links
        escapedText = escapedText.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // Bullet lists (simple implementation)
        escapedText = escapedText.replace(/^\s*-\s+(.+)$/gm, '<li>$1</li>');
        escapedText = escapedText.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        // Numbered lists (simple implementation)
        escapedText = escapedText.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');
        escapedText = escapedText.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');
        
        // Auto-link URLs (for URLs not already formatted as markdown links)
        escapedText = escapedText.replace(/(?<!["|'|\(])(https?:\/\/[^\s]+)(?!["|'|\)])/g, '<a href="$1" target="_blank">$1</a>');
        
        // Simple paragraphs
        escapedText = escapedText.replace(/\n\n/g, '</p><p>');
        escapedText = '<p>' + escapedText + '</p>';
        
        // Clean up empty paragraphs and fix paragraph nesting
        escapedText = escapedText.replace(/<p>\s*<\/p>/g, '');
        escapedText = escapedText.replace(/<p>(<ul>|<ol>)/g, '$1');
        escapedText = escapedText.replace(/(<\/ul>|<\/ol>)<\/p>/g, '$1');
        
        return escapedText;
    }

    /**
     * Adds a message to the chat UI.
     * 
     * @param {string} sender - 'user' or 'bot'
     * @param {string} message - The message text
     */
    addMessageToUI(sender, message) {
        if (!this.chatMessages) return;
        
        // Render markdown and code blocks
        const renderedMessage = this.renderMarkdown(message);
        
        const messageElement = document.createElement('div');
        messageElement.className = `tobi-chat-message ${sender}-message`;

        if (sender === 'bot') {
            messageElement.innerHTML = `
                <div class="tobi-chat-avatar">
                    <img src="../../assets/icons/tobi-VF.png" alt="TOBi">
                </div>
                <div class="tobi-chat-bubble">${renderedMessage}</div>
            `;
        } else {
            messageElement.innerHTML = `
                <div class="tobi-chat-bubble">${renderedMessage}</div>
                <div class="tobi-chat-avatar user">
                    <i class="fas fa-user"></i>
                </div>
            `;
        }
        
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }

    /**
     * Scrolls the chat messages to the bottom.
     */
    scrollToBottom() {
        if (this.chatMessages) {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }

    /**
     * Processes the user's query and generates a response.
     */
    processUserQuery() {
        if (!this.chatInput) return;
        
        const query = this.chatInput.value.trim();
        
        if (!query) return;
        
        if (query.toLowerCase() === 'clear') {
            this.clearChat();
            return;
        }
        
        // Add user message to chat
        this.addUserMessage(query);
        
        // Clear input
        this.chatInput.value = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Process the query with a slight delay to simulate thinking
        setTimeout(() => {
            this.hideTypingIndicator();
            
            // Generate AI response
            const response = this.generateAiResponse(query);
            this.addBotMessage(response);
        }, 1000);
    }

    /**
     * Shows a typing indicator in the chat.
     */
    showTypingIndicator() {
        if (!this.chatMessages) return;
        
        const typingElement = document.createElement('div');
        typingElement.className = 'tobi-chat-message bot-message typing-indicator';
        typingElement.innerHTML = `
            <div class="tobi-chat-avatar">
                <img src="../../assets/icons/tobi-VF.png" alt="TOBi">
            </div>
            <div class="tobi-chat-bubble">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </div>
        `;
        
        this.chatMessages.appendChild(typingElement);
        this.scrollToBottom();
    }

    /**
     * Hides the typing indicator in the chat.
     */
    hideTypingIndicator() {
        if (!this.chatMessages) return;
        
        const typingIndicator = this.chatMessages.querySelector('.typing-indicator');
        if (typingIndicator) {
            this.chatMessages.removeChild(typingIndicator);
        }
    }

    /**
     * Generates an AI-like response based on the user's query.
     * 
     * @param {string} query - The user's query
     * @returns {string} - The AI response
     */
    generateAiResponse(query) {
        const lowercaseQuery = query.toLowerCase();
        
        // Check for greetings
        if (this.isGreeting(lowercaseQuery)) {
            return this.getRandomGreeting();
        }
        
        // Check for thank you
        if (this.isThankYou(lowercaseQuery)) {
            return this.getRandomYoureWelcome();
        }
        
        // Check for questions about TOBi
        if (this.isAboutTobi(lowercaseQuery)) {
            return "I'm TOBi, Vodafone's AI assistant! I'm here to help you with locator generation!";
        }
        
        // Check for help requests
        if (this.isHelpRequest(lowercaseQuery)) {
            return "I can help you inspect elements on the page.";
        }
        
        // Add other response types as needed
        
        // Fallback response
        return "I'm not sure I understand. I am still under development.";
    }

    /**
     * Checks if a query is a greeting.
     * 
     * @param {string} query - The query to check
     * @returns {boolean} - Whether the query is a greeting
     */
    isGreeting(query) {
        const greetings = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'tobi'];
        return greetings.some(greeting => query.includes(greeting));
    }

    /**
     * Gets a random greeting response.
     * 
     * @returns {string} - A random greeting
     */
    getRandomGreeting() {
        const greetings = [
            "Hello! How can I help you today?",
            "Hi there! I'm TOBi, ready to assist you.",
            "Greetings! How can I assist you today?"
        ];
        
        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    /**
     * Checks if a query is a thank you message.
     * 
     * @param {string} query - The query to check
     * @returns {boolean} - Whether the query is a thank you
     */
    isThankYou(query) {
        const thankYouPhrases = ['thank', 'thanks', 'thx', 'appreciate', 'thank you'];
        return thankYouPhrases.some(phrase => query.includes(phrase));
    }

    /**
     * Gets a random "you're welcome" response.
     * 
     * @returns {string} - A random response
     */
    getRandomYoureWelcome() {
        const responses = [
            "You're welcome! Happy to help.",
            "Anytime! Let me know if you need anything else.",
            "No problem at all! That's what I'm here for.",
            "Glad I could assist! Need anything else?"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    /**
     * Checks if a query is about TOBi.
     * 
     * @param {string} query - The query to check
     * @returns {boolean} - Whether the query is about TOBi
     */
    isAboutTobi(query) {
        const aboutPhrases = ['who are you', 'what are you', 'what is tobi', 'who is tobi', 'about you'];
        return aboutPhrases.some(phrase => query.includes(phrase));
    }

    /**
     * Checks if a query is a help request.
     * 
     * @param {string} query - The query to check
     * @returns {boolean} - Whether the query is a help request
     */
    isHelpRequest(query) {
        const helpPhrases = ['help', 'assist', 'how do i', 'how to', 'what can you do'];
        return helpPhrases.some(phrase => query.includes(phrase));
    }

    /**
     * Gets a random AI prompt.
     * 
     * @returns {string} - A random AI prompt
     */
    getRandomAiPrompt() {
        return this.aiPrompts[Math.floor(Math.random() * this.aiPrompts.length)];
    }

    /**
     * Handles click events on the TOBi icon.
     */
    handleClick() {
        if (this.aiMode) {
            this.toggleChatInterface(false);
            return;
        }
        
        this.toggleChatInterface(true);
        this.animateTobiIcon();
    }

    /**
     * Animates the TOBi icon with a bounce effect.
     */
    animateTobiIcon() {
        if (this.isAnimating || !this.tobiIcon) return;
        
        this.isAnimating = true;
        this.tobiIcon.classList.add('active');
        
        setTimeout(() => {
            if (this.tobiIcon) {
                this.tobiIcon.classList.remove('active');
            }
            this.isAnimating = false;
        }, 1500);
    }

    /**
     * Starts the occasional animation of the TOBi icon.
     */
    startOccasionalAnimation() {
        // Check if we're in low performance mode
        if (document.body.classList.contains('low-performance-mode')) {
            return; // Don't schedule animations in low performance mode
        }
        
        // Animate every 30-60 seconds
        const randomInterval = Math.floor(Math.random() * 30000) + 30000;
        
        // Store the timer ID so it can be cancelled if needed
        this.animationTimerId = setTimeout(() => {
            if (!this.aiMode && !document.body.classList.contains('low-performance-mode')) {
                this.animateTobiIcon();
            }
            this.startOccasionalAnimation(); // Schedule the next animation
        }, randomInterval);
    }

    /**
     * Stops the occasional animation of the TOBi icon.
     */
    stopOccasionalAnimation() {
        if (this.animationTimerId) {
            clearTimeout(this.animationTimerId);
            this.animationTimerId = null;
        }
    }

    /**
     * Clears all messages from the chat interface.
     */
    clearChat() {
        if (!this.chatMessages) return;
        
        this.chatMessages.innerHTML = '';
        if (this.chatInput) {
            this.chatInput.value = '';
        }
        this.conversationHistory = []; // Clear history array
        this.saveConversationHistory(); // Save empty state
        this.testQueryCount = 0; // Reset test query counter
        
        // Add a new welcome message with random AI prompt after clearing
        this.addBotMessage(this.getRandomAiPrompt());
    }

    /**
     * Loads the saved conversation history from Chrome storage.
     */
    loadConversationHistory() {
        chrome.storage.local.get([this.storageKey], (result) => {
            if (result[this.storageKey]) {
                this.conversationHistory = result[this.storageKey];
                // Restore conversation in UI
                this.conversationHistory.forEach(message => {
                    this.addMessageToUI(message.sender, message.message);
                });
                this.scrollToBottom();
            }
        });
    }

    /**
     * Saves the current conversation history to Chrome storage.
     */
    saveConversationHistory() {
        chrome.storage.local.set({ [this.storageKey]: this.conversationHistory }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving conversation history:', chrome.runtime.lastError);
            }
        });
    }

    /**
     * Public method to display an HTML element as code in the Tobi chat.
     * This allows external components to send HTML to Tobi.
     * 
     * @param {HTMLElement|string} htmlElement - The HTML element or HTML string to display
     * @param {boolean} asUser - Whether to display as user message (default: false)
     */
    displayHTMLAsCode(htmlElement, asUser = false) {
        // Open the chat if it's not already open
        if (!this.aiMode) {
            this.toggleChatInterface(true);
        }
        
        // Add message about removed locator functionality
        this.addBotMessage("Element inspection functionality has been simplified to only highlight elements without displaying locators.");
    }

    /**
     * DOM Inspector Functionality
     * Uses message passing to communicate with DomInspector.js running in active tab
     */
    
    /**
     * Toggles the DOM inspector mode on/off
     */
    toggleInspector() {
        if (this.inspectorActive) {
            this.deactivateInspector();
        } else {
            this.activateInspector();
        }
    }
    
    /**
     * Activates the DOM inspector on the active tab using DomInspector.js
     */
    activateInspector() {
        // First, inject the DomInspector.js into the active tab if needed
        this.injectDomInspectorToActiveTab().then(() => {
            // Send message to the injected DomInspector in the active tab
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "activate-inspector"
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error('Error activating inspector:', chrome.runtime.lastError);
                            this.addBotMessage('❌ Could not activate inspector. Make sure you have a webpage open and refresh the page if needed.');
                            return;
                        }

                        if (response && response.success === false) {
                            console.error('Error from DomInspector:', response.error);
                            this.addBotMessage('❌ Could not activate inspector. Please refresh the page and try again.');
                            return;
                        }

                        this.inspectorActive = true;
                        
                        // Update icon state
                        const inspectButton = this.chatContainer?.querySelector('.tobi-chat-inspect');
                        if (inspectButton) {
                            inspectButton.classList.add('active');
                            inspectButton.title = 'Stop Inspecting';
                        }
                        
                        // Show notification
                        this.addBotMessage('🔍 Inspector mode activated! Switch to the webpage tab, hover over elements to highlight them. Right-click or press Escape to exit inspector mode.');
                        
                        console.log('TOBi Inspector activated on active tab');
                    });
                } else {
                    this.addBotMessage('❌ No active tab found. Please open a webpage and try again.');
                }
            });
        }).catch((error) => {
            console.error('Error injecting DomInspector:', error);
            this.addBotMessage('❌ Could not inject inspector into the page. Please refresh the page and try again.');
        });
    }
    
    /**
     * Deactivates the DOM inspector on the active tab
     */
    deactivateInspector() {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "deactivate-inspector"
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Error deactivating inspector:', chrome.runtime.lastError);
                    }
                });
            }
        });
        
        this.inspectorActive = false;
        
        // Update icon state
        const inspectButton = this.chatContainer?.querySelector('.tobi-chat-inspect');
        if (inspectButton) {
            inspectButton.classList.remove('active');
            inspectButton.title = 'Highlight Page Elements';
        }
        
        // Show notification
        this.addBotMessage('✅ Inspector mode Deactivated.');
        
        console.log('TOBi Inspector Deactivated');
    }
    
    /**
     * Injects the DomInspector.js script into the active tab
     */
    async injectDomInspectorToActiveTab() {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (!tabs[0]) {
                    reject(new Error('No active tab found'));
                    return;
                }
                
                const tabId = tabs[0].id;
                
                // Check if the tab is a valid web page (not chrome:// or extension pages)
                if (tabs[0].url.startsWith('chrome://') || tabs[0].url.startsWith('chrome-extension://')) {
                    reject(new Error('Cannot inject into chrome:// or extension pages'));
                    return;
                }
                
                // Inject just the basic DomInspector script
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['src/features/tobiAssistant/DomInspector.js']
                }, (inspectorResults) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        console.log('DomInspector.js injected successfully into active tab');
                        resolve(inspectorResults);
                    }
                });
            });
        });
    }
    
    /**
     * Handles messages from the DomInspector running in active tab
     */
    setupInspectorMessageListener() {
        // Listen for messages from DomInspector in content scripts
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === "inspector-deactivated") {
                this.inspectorActive = false;
                const inspectButton = this.chatContainer?.querySelector('.tobi-chat-inspect');
                if (inspectButton) {
                    inspectButton.classList.remove('active');
                    inspectButton.title = 'Highlight Page Elements';
                }
                this.addBotMessage('✅ Inspector mode deactivated.');
                sendResponse({success: true});
            } else if (message.action === "inspector-error") {
                this.handleInspectorError(message.message);
                sendResponse({success: true});
            }
            return true; // Keep message channel open for async response
        });
    }
    
    /**
     * Handles inspector error messages
     */
    handleInspectorError(errorMessage) {
        console.error('Inspector error:', errorMessage);
        
        // Deactivate inspector if it was active
        if (this.inspectorActive) {
            this.inspectorActive = false;
            const inspectButton = this.chatContainer?.querySelector('.tobi-chat-inspect');
            if (inspectButton) {
                inspectButton.classList.remove('active');
                inspectButton.title = 'Highlight Page Elements';
            }
        }
        
        // Display error message to user
        this.addBotMessage(errorMessage);
    }
}

// Create and initialize the TobiAssistant when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the TobiAssistant
    const tobiAssistant = new TobiAssistant();
    
    // Initialize the assistant (always fullscreen)
    tobiAssistant.init();
});

export default TobiAssistant; 