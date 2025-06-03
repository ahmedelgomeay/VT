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

// Inject Font Awesome stylesheet for TipTap editor if it's not already present
(function injectFontAwesome() {
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
        link.integrity = 'sha512-1ycn6IcaQQ40/MKBW2W4Rhis/DbILU74C1vSrLJxCq57o941Ym01SwNsOMqvEBFlcgUa6xLiPY/NS5R+E6ztJQ==';
        link.crossOrigin = 'anonymous';
        link.referrerPolicy = 'no-referrer';
        document.head.appendChild(link);
    }
})(); 