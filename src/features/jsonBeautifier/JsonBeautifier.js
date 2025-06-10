// Content script for beautifying JSON on about:blank pages
(function() {
    console.log("JSON Beautifier script loaded on: " + window.location.href);
    
    // Store original JSON and beautified version
    let originalJson = '';
    let beautifiedJson = '';
    let currentView = 'beautified';
    
    // Run immediately and also after a short delay to catch content that might load dynamically
    beautifyJsonInPage();
    
    // Also wait for DOM content to be fully loaded
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", beautifyJsonInPage);
    }
    
    // Add another check after a delay to catch any delayed content
    setTimeout(beautifyJsonInPage, 300);

    function beautifyJsonInPage() {
        try {
            console.log("Attempting to beautify JSON on the page");
            
            // Get the entire text content of the body
            const bodyText = document.body.textContent.trim();
            
            if (!bodyText) {
                console.log('No content found on the page');
                return;
            }
            
            // Store the original JSON before any modifications
            originalJson = bodyText;
            console.log("Stored original JSON, length:", originalJson.length);
            
            console.log("Found text content, attempting to parse as JSON");
            
            try {
                // Try to parse as JSON
                const jsonObj = JSON.parse(bodyText);
                console.log("Valid JSON found, beautifying...");
                
                // Clone the object before processing to keep original
                const processedObj = JSON.parse(JSON.stringify(jsonObj));
                
                // Process nested payloads before stringify
                processNestedPayloads(processedObj);
                
                // If successful, replace with beautified version
                beautifiedJson = JSON.stringify(processedObj, null, 2);
                
                // Clear the current body content
                document.body.innerHTML = '';
                
                // Apply a background color to the entire page - lighter background
                document.body.style.backgroundColor = '#f6f6f6';
                document.body.style.margin = '0';
                document.body.style.padding = '0';
                document.body.style.color = '#333333';
                
                // Create a styled container
                const container = document.createElement('div');
                container.style.maxWidth = '1200px';
                container.style.margin = '0 auto';
                container.style.padding = '20px';
                container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
                
                // Create a pre element for proper formatting
                const preElement = document.createElement('pre');
                preElement.id = 'json-display';
                preElement.style.whiteSpace = 'pre-wrap';
                preElement.style.fontFamily = 'Monaco, Consolas, "Courier New", monospace';
                preElement.style.fontSize = '14px';
                preElement.style.backgroundColor = '#ffffff';
                preElement.style.color = '#333333';
                preElement.style.padding = '20px';
                preElement.style.borderRadius = '6px';
                preElement.style.border = '1px solid #e0e0e0';
                preElement.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.05)';
                preElement.style.overflow = 'auto';
                preElement.style.lineHeight = '1.5';
                
                // Apply syntax highlighting with custom colors
                const highlightedJson = applySyntaxHighlighting(beautifiedJson);
                preElement.innerHTML = highlightedJson;
                
                // Add to container and then to body
                container.appendChild(preElement);
                document.body.appendChild(container);
                
                // Add a header
                const header = document.createElement('div');
                header.style.padding = '15px 20px';
                header.style.backgroundColor = '#f0f0f0';
                header.style.color = '#333333';
                header.style.marginBottom = '20px';
                header.style.borderRadius = '6px 6px 0 0';
                header.style.fontWeight = 'bold';
                header.style.display = 'flex';
                header.style.justifyContent = 'space-between';
                header.style.alignItems = 'center';
                header.style.borderBottom = '1px solid #e0e0e0';
                
                const title = document.createElement('span');
                title.textContent = 'JSON Beautifier';
                
                const buttonContainer = document.createElement('div');
                buttonContainer.style.display = 'flex';
                buttonContainer.style.gap = '10px';
                
                // Toggle Raw/Beautified button
                const toggleButton = document.createElement('button');
                toggleButton.textContent = 'Show Raw JSON';
                toggleButton.style.padding = '6px 12px';
                toggleButton.style.backgroundColor = '#555555';
                toggleButton.style.color = 'white';
                toggleButton.style.border = 'none';
                toggleButton.style.borderRadius = '4px';
                toggleButton.style.cursor = 'pointer';
                toggleButton.style.fontSize = '12px';
                toggleButton.style.fontWeight = 'bold';
                
                toggleButton.addEventListener('click', () => {
                    const jsonDisplay = document.getElementById('json-display');
                    if (currentView === 'beautified') {
                        // Switch to raw view
                        console.log("Switching to raw view, original JSON length:", originalJson.length);
                        // Important: Just set textContent, not innerHTML, to avoid any HTML interpretation
                        jsonDisplay.innerHTML = ''; // Clear first
                        jsonDisplay.textContent = originalJson;
                        toggleButton.textContent = 'Show Beautified JSON';
                        currentView = 'raw';
                    } else {
                        // Switch to beautified view
                        console.log("Switching to beautified view");
                        jsonDisplay.textContent = ''; // Clear first
                        jsonDisplay.innerHTML = applySyntaxHighlighting(beautifiedJson);
                        toggleButton.textContent = 'Show Raw JSON';
                        currentView = 'beautified';
                    }
                });
                
                // Copy JSON button
                const copyButton = document.createElement('button');
                copyButton.textContent = 'Copy JSON';
                copyButton.style.padding = '6px 12px';
                copyButton.style.backgroundColor = '#0651A5';
                copyButton.style.color = 'white';
                copyButton.style.border = 'none';
                copyButton.style.borderRadius = '4px';
                copyButton.style.cursor = 'pointer';
                copyButton.style.fontSize = '12px';
                copyButton.style.fontWeight = 'bold';
                
                copyButton.addEventListener('click', () => {
                    // Copy current view
                    const textToCopy = currentView === 'beautified' ? beautifiedJson : originalJson;
                    
                    navigator.clipboard.writeText(textToCopy)
                        .then(() => {
                            copyButton.textContent = 'Copied!';
                            setTimeout(() => {
                                copyButton.textContent = 'Copy JSON';
                            }, 2000);
                        })
                        .catch(err => {
                            console.error('Could not copy text: ', err);
                        });
                });
                
                // Add buttons to the button container
                buttonContainer.appendChild(toggleButton);
                buttonContainer.appendChild(copyButton);
                
                header.appendChild(title);
                header.appendChild(buttonContainer);
                preElement.parentNode.insertBefore(header, preElement);
                
                // Store raw JSON in a hidden element
                const rawJsonStorage = document.createElement('div');
                rawJsonStorage.id = 'raw-json-storage';
                rawJsonStorage.style.display = 'none';
                rawJsonStorage.textContent = originalJson;
                document.body.appendChild(rawJsonStorage);
                
                // Set the page title
                document.title = "JSON Beautifier";
                
                console.log("JSON successfully beautified");
                
            } catch (e) {
                console.log('Content is not valid JSON:', e.message);
            }
        } catch (e) {
            console.error('Error while beautifying JSON:', e);
        }
    }
    
    // Function to process nested payloads in the JSON object
    function processNestedPayloads(obj) {
        if (!obj || typeof obj !== 'object') return;
        
        for (const key in obj) {
            // Process payloads and other attributes that might contain JSON strings
            if ((key === 'payload' || key === 'data' || key === 'body' || key === 'content') && 
                typeof obj[key] === 'string') {
                try {
                    // Try to parse the string as JSON
                    const parsed = JSON.parse(obj[key]);
                    // If successful, replace with the parsed object
                    obj[key] = parsed;
                    
                    // Recursively process the newly parsed object
                    processNestedPayloads(parsed);
                } catch (e) {
                    // Not valid JSON, leave as is
                    console.log(`Failed to parse nested JSON in ${key}:`, e.message);
                }
            } 
            // Handle backslash escaped JSON strings
            else if (typeof obj[key] === 'string' && 
                    (obj[key].includes('\\\"') || obj[key].includes('\\\\') || obj[key].includes('\\\\'))) {
                try {
                    // Try to parse the string by replacing escaped quotes
                    const unescaped = obj[key].replace(/\\\"/g, '"').replace(/\\\\/g, '\\');
                    const parsed = JSON.parse(unescaped);
                    // If successful, replace with the parsed object
                    obj[key] = parsed;
                    
                    // Recursively process the newly parsed object
                    processNestedPayloads(parsed);
                } catch (e) {
                    // Not valid JSON after unescaping, leave as is
                }
            }
            // Recursively process nested objects and arrays
            else if (typeof obj[key] === 'object') {
                processNestedPayloads(obj[key]);
            }
        }
    }
    
    function applySyntaxHighlighting(json) {
        // Process the JSON in correct order to prevent overlap between rules
        
        // First, escape HTML entities
        let processed = json
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
            
        // Store all string matches to protect them
        const stringMatches = [];
        processed = processed.replace(/"(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?/g, function(match) {
            // #A21515 for attribute names, #0651A5 for string values
            const color = match.endsWith(':') ? '#A21515' : '#0651A5';
            const fontWeight = match.endsWith(':') ? 'bold' : 'normal';
            const highlighted = `<span style="color:${color};font-weight:${fontWeight}">${match}</span>`;
            
            // Store the highlighted string
            const placeholder = `__STRING_PLACEHOLDER_${stringMatches.length}__`;
            stringMatches.push(highlighted);
            return placeholder;
        });
        
        // Process non-string content (booleans, nulls, numbers)
        processed = processed
            .replace(/\b(true|false)\b/g, '<span style="color:#0651A5;font-weight:bold">$1</span>')
            .replace(/\b(null)\b/g, '<span style="color:#0651A5;font-weight:bold">$1</span>')
            .replace(/\b(-?\d+(\.\d+)?([eE][+-]?\d+)?)\b/g, '<span style="color:#0B8658">$1</span>');
            
        // Restore string placeholders
        stringMatches.forEach((highlighted, index) => {
            const placeholder = `__STRING_PLACEHOLDER_${index}__`;
            processed = processed.replace(placeholder, highlighted);
        });
        
        return processed;
    }
})(); 