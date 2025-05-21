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
import testData from "../../../data/testData.js";

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
        this.searchBox = document.getElementById('searchBox');
        this.resultsContainer = document.getElementById('results');
        this.environmentSelect = document.getElementById('environmentSelect');
        
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
    }

    /**
     * Initializes the TobiAssistant functionality.
     */
    init() {
        this.setupEventListeners();
        this.occasionallyAnimate();
        this.createAiChatInterface();
    }

    /**
     * Updates the CSS class of the environment select dropdown to match the selected environment.
     */
    updateEnvironmentStyles() {
        const selectedEnvironment = this.environmentSelect.value.toLowerCase();
        const environmentClasses = ['dev-selected', 'testing-selected', 'staging-selected', 'production-selected'];

        // Remove all existing environment classes
        environmentClasses.forEach(className => {
            this.environmentSelect.classList.remove(className);
        });

        // Add the class for the currently selected environment
        if (selectedEnvironment) {
            this.environmentSelect.classList.add(`${selectedEnvironment}-selected`);
        }
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
        this.addBotMessage(this.getRandomAiPrompt());
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
        const messageElement = document.createElement('div');
        messageElement.className = 'tobi-chat-message bot-message';
        messageElement.innerHTML = `
            <div class="tobi-chat-avatar">
                <img src="../../assets/icons/tobi-VF.png" alt="TOBi">
            </div>
            <div class="tobi-chat-bubble">${message}</div>
        `;
        
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }

    /**
     * Adds a message from the user to the chat interface.
     * 
     * @param {string} message - The message to add
     */
    addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'tobi-chat-message user-message';
        messageElement.innerHTML = `
            <div class="tobi-chat-bubble">${message}</div>
            <div class="tobi-chat-avatar user">
                <i class="fas fa-user"></i>
            </div>
        `;
        
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
        
        // Add user message to chat
        this.addUserMessage(query);
        
        // Clear input
        this.chatInput.value = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        let environmentChanged = false;
        const lowercaseQuery = query.toLowerCase();

        // Check for environment change keywords and update select
        const environments = ['dev', 'testing', 'staging', 'production'];
        for (const env of environments) {
            if (lowercaseQuery.includes(env)) {
                if (this.environmentSelect.value !== env) {
                    const capitalizedEnv = env.charAt(0).toUpperCase() + env.slice(1);
                    this.environmentSelect.value = capitalizedEnv;
                    this.updateEnvironmentStyles(); // Update styles after changing value
                    this.addBotMessage(`Okay, I've set the environment to ${capitalizedEnv}.`);
                    environmentChanged = true;
                }
                // Keep checking in case multiple environments are mentioned, though unlikely.
                // The last one found will be set.
            }
        }
        
        // Process the query with a slight delay to simulate thinking
        setTimeout(() => {
            this.hideTypingIndicator();
            
            // Generate AI response
            const response = this.generateAiResponse(query);
            this.addBotMessage(response);
            
            // If the generated response is the default search prompt, perform the search
            // This prevents specific queries like 'time?' from triggering a search
            if (response === "Let me search for that information...") {
                const results = this.searchTestData(query);
                this.displaySearchResults(results);
            }
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
     * Determines if a query is a search query.
     * 
     * @param {string} query - The query to check
     * @returns {boolean} - Whether the query is a search query
     */
    isSearchQuery(query) {
        const searchTerms = ['find', 'search', 'look for', 'get', 'show', 'display', 'give me'];
        return searchTerms.some(term => query.toLowerCase().includes(term)) || 
               query.toLowerCase().includes('?');
    }

    /**
     * Searches test data based on the query.
     * 
     * @param {string} query - The search query
     * @returns {Array} - Array of matching results
     */
    searchTestData(query) {
        const environment = this.environmentSelect.value;
        const lowercaseQuery = query.toLowerCase();
        let results = [];
        
        // Extract keywords from the query
        const keywords = this.extractKeywords(lowercaseQuery);
        
        if (!testData || !testData[environment] || !testData[environment].length) {
            return [];
        }
        
        // Search through test data
        testData[environment].forEach(item => {
            let matchScore = 0;
            let matchDetails = [];
            
            // Check each property of the item
            for (const [key, value] of Object.entries(item)) {
                const strValue = String(value).toLowerCase();
                
                // Check if any keyword matches this property
                keywords.forEach(keyword => {
                    if (key.toLowerCase().includes(keyword) || strValue.includes(keyword)) {
                        matchScore += 1;
                        matchDetails.push({ key, value, keyword });
                    }
                });
            }
            
            if (matchScore > 0) {
                results.push({
                    item,
                    score: matchScore,
                    details: matchDetails
                });
            }
        });
        
        // Sort results by score (highest first)
        results.sort((a, b) => b.score - a.score);
        
        return results;
    }

    /**
     * Extracts keywords from a search query.
     * 
     * @param {string} query - The search query
     * @returns {Array<string>} - Array of keywords
     */
    extractKeywords(query) {
        // Remove common words and punctuation
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'in', 'on', 'at', 'to', 'for', 'with', 'about', 'find', 'search', 'look', 'get', 'show', 'display', 'give', 'me', 'please'];
        
        return query
            .replace(/[.,?!;:'"()\[\]{}]/g, '')
            .split(' ')
            .filter(word => word.length > 1 && !stopWords.includes(word));
    }

    /**
     * Displays search results in the chat interface.
     * 
     * @param {Array} results - Array of search results
     */
    displaySearchResults(results) {
        if (results.length === 0) {
            this.addBotMessage("I couldn't find any matching test data. Try a different search term or check another environment.");
            return;
        }
        
        // Create a summary message
        this.addBotMessage(`I found ${results.length} matching result${results.length > 1 ? 's' : ''}. Here's what I found:`);
        
        // Display each result
        results.forEach((result, index) => {
            if (index < 3) { // Limit to 3 results in chat
                const item = result.item;
                const name = item.name || 'Unnamed Entry';
                
                let detailsHtml = '';
                result.details.forEach(detail => {
                    detailsHtml += `<li><strong>${detail.key}:</strong> ${detail.value}</li>`;
                });
                
                const messageHtml = `
                    <div class="tobi-result-card">
                        <h4>${name}</h4>
                        <ul>
                            ${detailsHtml}
                        </ul>
                    </div>
                `;
                
                this.addBotMessage(messageHtml);
            }
        });
        
        // If there are more results, add a message
        if (results.length > 3) {
            this.addBotMessage(`There are ${results.length - 3} more results. You can see all results in the main search area.`);
        }
        
        // Update the search box with the query
        if (this.searchBox) {
            this.searchBox.value = results[0].details[0].keyword;
            // Trigger a click on the search button
            const searchBtn = document.getElementById('searchBtn');
            if (searchBtn) {
                searchBtn.click();
            }
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
        
        // Default responses for search-like queries
        if (this.isSearchQuery(lowercaseQuery)) {
            return "Let me search for that information...";
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
        // Optionally add a new welcome message after clearing
        this.addBotMessage(this.getRandomAiPrompt());
        this.testQueryCount = 0; // Reset test query counter
    }
}

// Initialize TOBi Assistant when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const tobiAssistant = new TobiAssistant();
    tobiAssistant.init();
});

// Ensure initial environment style is applied on load
document.addEventListener('DOMContentLoaded', () => {
    const tobiAssistantInstance = new TobiAssistant();
    // A small delay might be needed to ensure the DOM is fully ready and the select has its initial value
    setTimeout(() => {
        // Check if the environmentSelect element exists before trying to update styles
        if (tobiAssistantInstance.environmentSelect) {
             tobiAssistantInstance.updateEnvironmentStyles();
        }
    }, 100);
 });

export default TobiAssistant; 