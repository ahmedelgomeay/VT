/**
 * This file contains all the messages and responses used by Tobi Assistant
 * Centralizing messages here makes them easier to maintain and update
 */

const tobiMessages = {
    // AI prompt messages shown when chat is opened
    aiPrompts: [
        "Hi I'm TOBi, How can I help you today?",
        "Greetings I'm TOBi, What are you looking for today?",
        "Hello I'm TOBi, Need specific information? Just ask!"
    ],
    
    // General responses
    general: {
        fallback: "I'm not sure I understand. I am still under development.",
        aboutTobi: "I'm TOBi, Vodafone's AI assistant! I'm here to help you with locator generation!",
        helpRequest: "I can help you inspect elements on the page."
    },
    
    // Greetings
    greetings: [
        "Hello! How can I help you today?",
        "Hi there! I'm TOBi, ready to assist you.",
        "Greetings! How can I assist you today?"
    ],
    
    // Thank you responses
    thankYou: [
        "You're welcome! Happy to help.",
        "Anytime! Let me know if you need anything else.",
        "No problem at all! That's what I'm here for.",
        "Glad I could assist! Need anything else?"
    ],
    
    // Inspector-related messages
    inspector: {
        activated: "🔍 Inspector mode activated! Switch to the webpage tab, hover over elements to highlight them. Right-click or press Escape to exit inspector mode.",
        deactivated: "✅ Inspector mode deactivated.",
        noActiveTab: "❌ No active tab found. Please open a webpage and try again.",
        activationError: "❌ Could not activate inspector. Make sure you have a webpage open and refresh the page if needed.",
        injectionError: "❌ Could not inject inspector into the page. Please refresh the page and try again.",
        elementFailure: "❌ Failed to generate selectors for the selected element.",
        simplifiedNotice: "Element inspection functionality has been simplified to only highlight elements without displaying locators."
    },
    
    // Logs-related messages
    logs: {
        initialResponse: `Here are your logs: 
                         [Static Test Data for Logs that will be replaced later]
                         Test
                         Test
                         Test
                         Test4
                         Test6
                         TEst8
                         Test9
                         Test10
                         Test11
                         Test12
                         Test15
                         Test20
                         Test21
                         Test23
                         Test32124
                         TEst123421415215252212155215215152121521512515215215215215125125215112521
                         Test123421521512521521512515215221512525152152152112521215125512521521512521512521
                         Test 12452151252152152152121512521512521521521521512521525125215215215215121512521521`
    }
};

export default tobiMessages; 