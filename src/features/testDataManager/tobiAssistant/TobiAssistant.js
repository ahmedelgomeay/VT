/**
 * @fileoverview TOBi Assistant - Interactive TOBi icon for the VOIS Test Data Extension
 * 
 * This module provides functionality for the TOBi chatbot icon, including
 * hover effects and simulated AI interaction with search capabilities.
 * 
 * @author VOIS Test Data Extension Team
 * @version 1.1.0
 */

import ToastManager from "../../../utils/ToastManager.js";

/**
 * TobiAssistant class responsible for managing the TOBi icon interactions
 * and AI-like search functionality
 */
class TobiAssistant {
    /**
     * Creates an instance of TobiAssistant.
     * 
     * @constructor
     */
    constructor() {
        this.tobiIcon = document.getElementById('tobiIcon');
        this.tobiContainer = document.getElementById('tobiContainer');
        this.tobiTooltip = this.tobiContainer.querySelector('.tobi-tooltip');
        
        this.responses = [
            "I can help you find test data!",
            "Need help with test accounts?",
            "Looking for specific test data?",
            "I'm TOBi, your test data assistant!",
            "Try searching for 'admin' or 'user'",
            "Need help with Vodafone services?",
            "I can assist with your testing needs!"
        ];
        
        this.aiPrompts = [
            "How can I help you today?",
            "What are you looking for today?",
            "I can search through test data for you",
            "Need specific information? Just ask!"
        ];
        
        this.isAnimating = false;
        this.isListening = false;
        this.aiMode = false;
        this.testQueryCount = 0; // Counter for sequential test responses
        this.conversationHistory = []; // Store conversation history
        this.storageKey = 'tobiConversationHistory'; // Key for Chrome storage
    }

    /**
     * Initializes the TobiAssistant functionality.
     */
    init() {
        this.setupEventListeners();
        this.occasionallyAnimate();
        this.createAiChatInterface();
        this.loadConversationHistory(); // Load history on initialization
    }

    /**
     * Sets up event listeners for TOBi interactions.
     */
    setupEventListeners() {
        this.tobiContainer.addEventListener('click', () => this.handleClick());
        
        // Close chat if clicked outside
        document.addEventListener('click', (event) => {
            const isClickInsideChat = this.chatContainer.contains(event.target);
            const isClickOnIcon = this.tobiContainer.contains(event.target);
            
            if (!isClickInsideChat && !isClickOnIcon && this.aiMode) {
                this.toggleChatInterface(false);
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
        
        // Create chat header
        const chatHeader = document.createElement('div');
        chatHeader.className = 'tobi-chat-header';
        chatHeader.innerHTML = `
            <img src="../../assets/icons/tobi-VF.png" alt="TOBi" class="tobi-chat-icon">
            <span>TOBi Assistant</span>
            <div class="tobi-header-buttons">
                <button class="tobi-chat-clear" title="Clear Chat"><i class="fas fa-trash-alt"></i></button>
                <button class="tobi-chat-close">&times;</button>
            </div>
        `;
        
        // Create chat messages area
        this.chatMessages = document.createElement('div');
        this.chatMessages.className = 'tobi-chat-messages';
        
        // Create chat input area
        const chatInputArea = document.createElement('div');
        chatInputArea.className = 'tobi-chat-input-area';
        
        this.chatInput = document.createElement('input');
        this.chatInput.type = 'text';
        this.chatInput.className = 'tobi-chat-input';
        this.chatInput.placeholder = 'Ask TOBi about test data...';
        
        const sendButton = document.createElement('button');
        sendButton.className = 'tobi-chat-send';
        sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        
        // Append elements
        chatInputArea.appendChild(this.chatInput);
        chatInputArea.appendChild(sendButton);
        
        this.chatContainer.appendChild(chatHeader);
        this.chatContainer.appendChild(this.chatMessages);
        this.chatContainer.appendChild(chatInputArea);
        
        document.body.appendChild(this.chatContainer);
        
        // Add event listeners for chat interface
        chatHeader.querySelector('.tobi-chat-close').addEventListener('click', () => {
            this.toggleChatInterface(false);
        });
        
        chatHeader.querySelector('.tobi-chat-clear').addEventListener('click', () => {
            this.clearChat();
        });
        
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
        
        // Add welcome message
        // This will be handled by loadConversationHistory now if there's no saved history
    }

    /**
     * Toggles the visibility of the chat interface.
     * 
     * @param {boolean} show - Whether to show or hide the interface
     */
    toggleChatInterface(show) {
        this.chatContainer.style.display = show ? 'flex' : 'none';
        this.aiMode = show;
        
        if (show) {
            this.chatInput.focus();
        }
    }

    /**
     * Adds a message from the bot to the chat interface.
     * 
     * @param {string} message - The message to add
     */
    addBotMessage(message) {
        this.conversationHistory.push({ sender: 'bot', message });
        this.saveConversationHistory();
        this._addMessageToUI('bot', message);
    }

    /**
     * Adds a message from the user to the chat interface.
     * 
     * @param {string} message - The message to add
     */
    addUserMessage(message) {
        this.conversationHistory.push({ sender: 'user', message });
        this.saveConversationHistory();
        this._addMessageToUI('user', message);
    }

    /**
     * Adds a message to the chat UI without saving to history.
     * Internal helper method.
     * 
     * @param {string} sender - 'user' or 'bot'
     * @param {string} message - The message text
     */
    _addMessageToUI(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.className = `tobi-chat-message ${sender}-message`;

        if (sender === 'bot') {
            messageElement.innerHTML = `
                <div class="tobi-chat-avatar">
                    <img src="../../assets/icons/tobi-VF.png" alt="TOBi">
                </div>
                <div class="tobi-chat-bubble">${message}</div>
            `;
        } else {
        messageElement.innerHTML = `
            <div class="tobi-chat-bubble">${message}</div>
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
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    /**
     * Processes the user's query and generates a response.
     */
    processUserQuery() {
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
            return "I'm TOBi, Vodafone's AI assistant! I'm here to help you find test data for your projects.";
        }
        
        // Check for help requests
        if (this.isHelpRequest(lowercaseQuery)) {
            return "I can help you find test data across different environments. Just ask me something like 'find users in Dev' or 'search for premium accounts'.";
        }
        
        // Check for being an agent
        if (this.isAgent(lowercaseQuery)) {
            return this.getRandomAgent();
        }
        
        // Check for date inquiries
        if (this.isDateQuery(lowercaseQuery)) {
            return this.getCurrentDate();
        }
        
        // Check for time inquiries
        if (this.isTimeQuery(lowercaseQuery)) {
            return this.getCurrentTime();
        }
        
        // Check for day inquiries
        if (this.isDayQuery(lowercaseQuery)) {
            return this.getCurrentDay();
        }
        
        // Check for emotional queries
        if (this.isEmotionalQuery(lowercaseQuery)) {
            return this.getRandomEmotionalResponse();
        }
        
        // Check for test inquiries
        if (this.isTestQuery(lowercaseQuery)) {
            return this.getTestResponse();
        }
        
        // Check for motivation queries
        if (this.isMotivationQuery(lowercaseQuery)) {
            return this.getRandomMotivationQuote();
        }
        
        // Fallback response
        return "I'm not sure I understand. Try asking me to find specific test data or ask for help.";
    }

    /**
     * Checks if a query is a greeting.
     * 
     * @param {string} query - The query to check
     * @returns {boolean} - Whether the query is a greeting
     */
    isGreeting(query) {
        const greetings = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'tobi'];
        return greetings.includes(query.toLowerCase());
    }

    /**
     * Gets a random greeting response.
     * 
     * @returns {string} - A random greeting
     */
    getRandomGreeting() {
        const greetings = [
            "Hello! How can I help you with test data today?",
            "Hi there! I'm TOBi, ready to assist with your test data needs.",
            "Hey! What kind of test data are you looking for?",
            "Greetings! How can I assist you with finding test data?"
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
        const thankYouPhrases = ['thank', 'thanks', 'thx', 'appreciate', 'thank you', 'great', 'awesome', 'fantastic', 'wonderful', 'fabulous', 'magnificent', 'superb', 'excellent', 'terrific', 'incredible',];
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
     * Checks if a query is about being an agent.
     * 
     * @param {string} query - The query to check
     * @returns {boolean} - Whether the query is about being an agent
     */
    isAgent(query) {
        const agentPhrases = ['customer care', 'customer service', 'agent'];
        return agentPhrases.some(phrase => query.includes(phrase));
    }

    /**
     * Gets a random response about being an agent.
     * 
     * @returns {string} - A random response
     */
    getRandomAgent() {
        const responses = [
            "You can think of me as your front-line assistant for test data!",
            "I'm here to assist you, like a helpful agent for test data queries.",
            "I can help you with your test data needs, just like a customer care agent would with service inquiries."
        ];

        return responses[Math.floor(Math.random() * responses.length)];
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
     * Checks if a query is asking for the current date.
     *
     * @param {string} query - The query to check
     * @returns {boolean} - Whether the query is a date query
     */
    isDateQuery(query) {
        const datePhrases = ['date', "today's date", 'current date', 'what is the date', 'date today', 'the date'];
        return datePhrases.some(phrase => query.includes(phrase));
    }

    /**
     * Gets the current date formatted as a string.
     *
     * @returns {string} - The formatted current date
     */
    getCurrentDate() {
        const today = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return "Today's date is " + today.toLocaleDateString(undefined, options) + ".";
    }

    /**
     * Checks if a query is asking for the current time.
     *
     * @param {string} query - The query to check
     * @returns {boolean} - Whether the query is a time query
     */
    isTimeQuery(query) {
        const timePhrases = ['time', 'current time', 'what time is it', 'time now', 'the time'];
        return timePhrases.some(phrase => query.includes(phrase));
    }

    /**
     * Gets the current time formatted as a string.
     *
     * @returns {string} - The formatted current time
     */
    getCurrentTime() {
        const now = new Date();
        const options = { hour: '2-digit', minute: '2-digit', hour12: true };
        return "The current time is " + now.toLocaleTimeString(undefined, options) + ".";
    }

    /**
     * Checks if a query is asking for the current day of the week.
     *
     * @param {string} query - The query to check
     * @returns {boolean} - Whether the query is a day query
     */
    isDayQuery(query) {
        const dayPhrases = ['day', "today's day", 'current day', 'what day is it', 'day today', 'the day', 'what day of the week'];
        return dayPhrases.some(phrase => query.includes(phrase));
    }

    /**
     * Gets the current day of the week formatted as a string.
     *
     * @returns {string} - The formatted current day of the week
     */
    getCurrentDay() {
        const today = new Date();
        const options = { weekday: 'long' };
        return "Today is " + today.toLocaleDateString(undefined, options) + ".";
    }

    /**
     * Checks if a query is asking for emotional support.
     *
     * @param {string} query - The query to check
     * @returns {boolean} - Whether the query is an emotional support query
     */
    isEmotionalQuery(query) {
        const emotionalPhrases = ['sad', 'unhappy', 'not happy', 
            'angry', 'stressed', 'anxious', 'worried', 'feeling down', 
            'depressed', 'frustrated', 'overwhelmed', 'difficult time', 
            'tough day', 'need to talk', 'not good', 'not great', 'not okay'];
        return emotionalPhrases.some(phrase => query.includes(phrase));
    }

    /**
     * Gets a random emotional support response.
     *
     * @returns {string} - A random supportive message
     */
    getRandomEmotionalResponse() {
        const responses = [
            "I'm sorry to hear that you're feeling this way. Please know that you're not alone. 💌",
            "It sounds like you're going through a tough time. Sending you some positive energy. ✨",
            "I'm here for you if you need someone to listen. 💬",
            "Don't forget to be kind to yourself during difficult moments. 💕",
            "It's okay to not be okay. Remember to take things one step at a time. 💪",
            "Hang in there. Things can get better. 🌈"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    /**
     * Checks if a query is related to testing.
     *
     * @param {string} query - The query to check
     * @returns {boolean} - Whether the query is a test query
     */
    isTestQuery(query) {
        return query.toLowerCase() === 'test';
    }

    /**
     * Gets a response related to testing.
     *
     * @returns {string} - A test-related response
     */
    getTestResponse() {
        const responses = [
            "Hi! It looks like you're testing—everything's working. How can I help you today?",
            "Still here—test successful! Let me know if you need anything.",
            "Loud and clear—test received! What's next?",
            "Yep, test confirmed again. Ready when you are!"
        ];
        const response = responses[this.testQueryCount % responses.length];
        this.testQueryCount++;
        return response;
    }

    /**
     * Checks if a query is asking for a motivational quote.
     *
     * @param {string} query - The query to check
     * @returns {boolean} - Whether the query is a motivation query
     */
    isMotivationQuery(query) {
        const motivationPhrases = ['motivate me', 'motivation', 'quote', 'inspiration', 'inspire me'];
        return motivationPhrases.some(phrase => query.includes(phrase));
    }

    /**
     * Gets a random motivational quote.
     *
     * @returns {string} - A random motivational quote
     */
    getRandomMotivationQuote() {
        const quotes = [
            "The only way to do great work is to love what you do. - Steve Jobs",
            "Believe you can and you're halfway there. - Theodore Roosevelt",
            "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
            "Strive not to be a success, but rather to be of value. - Albert Einstein",
            "The mind is everything. What you think you become. - Buddha",
            "Either you run the day, or the day runs you. - Jim Rohn",
            "The best and most beautiful things in the world cannot be seen or even touched - they must be felt with the heart. - Helen Keller",
            "The only limit to our realization of tomorrow will be our doubts of today. - Franklin D. Roosevelt",
            "Do what you can, with what you have, where you are. - Theodore Roosevelt",
            "The only impossible journey is the one you never begin. - Tony Robbins"
        ];
        return quotes[Math.floor(Math.random() * quotes.length)];
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
     * Gets a random response from the responses array.
     * 
     * @returns {string} - A random response message
     */
    getRandomResponse() {
        const randomIndex = Math.floor(Math.random() * this.responses.length);
        return this.responses[randomIndex];
    }

    /**
     * Animates the TOBi icon with a bounce effect.
     */
    animateTobiIcon() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.tobiIcon.classList.add('active');
        
        setTimeout(() => {
            this.tobiIcon.classList.remove('active');
            this.isAnimating = false;
        }, 1500);
    }

    /**
     * Occasionally animates the TOBi icon to attract attention.
     */
    occasionallyAnimate() {
        // Animate every 30-60 seconds
        const randomInterval = Math.floor(Math.random() * 30000) + 30000;
        
        setTimeout(() => {
            if (!this.aiMode) {
                this.animateTobiIcon();
            }
            this.occasionallyAnimate(); // Schedule the next animation
        }, randomInterval);
    }

    /**
     * Clears all messages from the chat interface.
     */
    clearChat() {
        this.chatMessages.innerHTML = '';
        this.chatInput.textContent = '';
        this.conversationHistory = []; // Clear history array
        this.saveConversationHistory(); // Save empty state
        this.testQueryCount = 0; // Reset test query counter
        // Optionally add a new welcome message after clearing
        this._addMessageToUI('bot', this.getRandomAiPrompt());
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
     * Loads the saved conversation history from Chrome storage.
     */
    loadConversationHistory() {
        chrome.storage.local.get([this.storageKey], (result) => {
            if (chrome.runtime.lastError) {
                console.error('Error loading conversation history:', chrome.runtime.lastError);
                return;
            }

            this.conversationHistory = result[this.storageKey] || [];

            // Display loaded messages
            if (this.conversationHistory.length > 0) {
                this.conversationHistory.forEach(msg => {
                    this._addMessageToUI(msg.sender, msg.message);
                });
            } else {
                // Add initial welcome message if no history is loaded
                this._addMessageToUI('bot', this.getRandomAiPrompt());
            }
        });
    }
}

// Initialize TOBi Assistant when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const tobiAssistant = new TobiAssistant();
    tobiAssistant.init();
});

// Ensure initial environment style is applied on load

export default TobiAssistant; 