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
            // First, inject the SelectorHub's injectedScript if not already done
            if (!window.selectorHubInjectedScriptLoaded) {
                injectSelectorHubScript()
                    .then(() => {
                        console.log('SelectorHub injectedScript loaded successfully');
                        // After script is loaded, activate the DOM inspector
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
                    })
                    .catch(error => {
                        console.error('Failed to inject SelectorHub script:', error);
                        sendResponse({ 
                            success: false, 
                            error: 'Failed to inject selector generation script.' 
                        });
                    });
                
                return true; // Keep message channel open for async response
            } else {
                // If script is already loaded, just activate the inspector
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

// Inject SelectorHub's injectedScript.js
function injectSelectorHubScript() {
    return new Promise((resolve, reject) => {
        try {
            // Create a script element to inject the SelectorHub script
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('src/utils/selectorhub/content-script/injectedScript.js');
            script.onload = () => {
                console.log('SelectorHub script loaded');
                window.selectorHubInjectedScriptLoaded = true;
                
                // Create a connection between the DOM Inspector and the injected script
                setupInspectorToInjectedScriptBridge();
                
                resolve();
            };
            script.onerror = (error) => {
                console.error('Error loading SelectorHub script:', error);
                reject(error);
            };
            
            document.head.appendChild(script);
        } catch (error) {
            console.error('Error injecting SelectorHub script:', error);
            reject(error);
        }
    });
}

// Set up bridge between DOM Inspector and injectedScript
function setupInspectorToInjectedScriptBridge() {
    // Create a global function that the DOM Inspector can call
    window.generateSelectorsForElement = function(element) {
        try {
            console.log('generateSelectorsForElement called with', element);
            
            // Use the SelectorHub's injected script to generate selectors
            if (window.InjectedScript) {
                console.log('InjectedScript found, generating selectors');
                const injectedScript = new window.InjectedScript(false, 0, 'chrome');
                const selector = injectedScript.generateSelector(element);
                
                console.log('Generated selector:', selector);
                
                // Prepare all the selector information
                const selectors = {
                    css: selector,
                    xpath: injectedScript.generateRelativeXPath ? 
                           injectedScript.generateRelativeXPath(element) : 
                           `//${element.tagName.toLowerCase()}`,
                    fullXPath: injectedScript.generateAbsoluteXPath ? 
                              injectedScript.generateAbsoluteXPath(element) : 
                              document.evaluate(`//${element.tagName.toLowerCase()}`, document, null, 
                                  XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0),
                    elementInfo: {
                        tagName: element.tagName.toLowerCase(),
                        id: element.id || '',
                        className: element.className || '',
                        name: element.getAttribute('name') || '',
                        text: element.innerText || element.textContent || ''
                    }
                };
                
                // Forward the selectors to the extension
                if (window.handleDomInspectorMessage) {
                    console.log('Sending element-selectors message to extension', selectors);
                    window.handleDomInspectorMessage({
                        action: 'element-selectors',
                        selectors: selectors
                    });
                } else {
                    console.error('handleDomInspectorMessage function not found');
                    // Try direct message to extension as fallback
                    chrome.runtime.sendMessage({
                        action: 'element-selectors',
                        selectors: selectors
                    });
                }
                
                return selectors;
            } else {
                console.error('SelectorHub InjectedScript not available');
                
                // Fallback to basic selector generation
                const selectors = {
                    css: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : ''),
                    xpath: `//${element.tagName.toLowerCase()}`,
                    fullXPath: '',
                    elementInfo: {
                        tagName: element.tagName.toLowerCase(),
                        id: element.id || '',
                        className: element.className || '',
                        name: element.getAttribute('name') || '',
                        text: element.innerText || element.textContent || ''
                    }
                };
                
                // Send message to extension
                if (window.handleDomInspectorMessage) {
                    window.handleDomInspectorMessage({
                        action: 'element-selectors',
                        selectors: selectors
                    });
                } else {
                    chrome.runtime.sendMessage({
                        action: 'element-selectors',
                        selectors: selectors
                    });
                }
                
                return selectors;
            }
        } catch (error) {
            console.error('Error generating selectors:', error);
            
            // Send error message to extension
            if (window.handleDomInspectorMessage) {
                window.handleDomInspectorMessage({
                    action: 'inspector-error',
                    message: 'Error generating selectors: ' + error.message
                });
            } else {
                chrome.runtime.sendMessage({
                    action: 'inspector-error',
                    message: 'Error generating selectors: ' + error.message
                });
            }
            
            return null;
        }
    };
}

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

// Add listener for inspector messages to forward to extension
document.addEventListener('DOMContentLoaded', () => {
    // Create a message handler for the DOM Inspector
    window.handleDomInspectorMessage = (message) => {
        // Forward the message to the extension
        chrome.runtime.sendMessage(message);
    };
}); 