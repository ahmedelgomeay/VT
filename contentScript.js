// Listen for a message from the extension to get the DOM
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
        if (request.action === "getDOM") {
            // Get the full DOM structure
            const fullDOM = {
                html: document.documentElement.outerHTML,
                title: document.title,
                url: window.location.href,
                timestamp: Date.now(),
                elementCount: document.querySelectorAll('*').length,
                // Additional metadata that might be useful
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                scrollPosition: {
                    x: window.scrollX,
                    y: window.scrollY
                }
            };
            
            console.log('Content script: Sending DOM data', {
                size: fullDOM.html.length,
                elements: fullDOM.elementCount,
                title: fullDOM.title
            });
            
            sendResponse({ 
                success: true, 
                dom: fullDOM 
            });
        } else if (request.action === "activate-inspector") {
            if (window.voisDomInspector) {
                window.voisDomInspector.activate();
                console.log('Content script: Inspector activated');
                sendResponse({ success: true });
            } else {
                console.error('Content script: DOM Inspector not found');
                sendResponse({ 
                    success: false, 
                    error: 'DOM Inspector not found. Please refresh the page and try again.' 
                });
            }
        } else if (request.action === "deactivate-inspector") {
            // Forward to the DOM inspector if injected
            if (window.voisDomInspector) {
                window.voisDomInspector.deactivate();
                console.log('Content script: Inspector deactivated');
                sendResponse({ success: true });
            } else {
                console.error('Content script: DOM Inspector not found');
                sendResponse({ 
                    success: false, 
                    error: 'DOM Inspector not found.' 
                });
            }
        }
    } catch (error) {
        console.error('Content script error:', error);
        sendResponse({ 
            success: false, 
            error: error.message 
        });
    }
    
    return true; // Keep message channel open for async response
});


// Add listener for inspector messages to forward to extension
document.addEventListener('DOMContentLoaded', () => {
    // Create a message handler for the DOM Inspector
    window.handleDomInspectorMessage = (message) => {
        // Forward the message to the extension
        chrome.runtime.sendMessage(message);
    };
}); 