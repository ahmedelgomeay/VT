// Content script for beautifying JSON on about:blank pages
(function() {
    console.log("JSON Beautifier script loaded on: " + window.location.href);
    
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
            
            console.log("Found text content, attempting to parse as JSON");
            
            try {
                // Try to parse as JSON
                const jsonObj = JSON.parse(bodyText);
                console.log("Valid JSON found, beautifying...");
                
                // Process nested payloads before stringify
                processNestedPayloads(jsonObj);
                
                // If successful, replace with beautified version
                const beautified = JSON.stringify(jsonObj, null, 2);
                
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
                const highlightedJson = applySyntaxHighlighting(beautified);
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
                title.textContent = 'JSON Viewer';
                
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
                    navigator.clipboard.writeText(beautified)
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
                
                header.appendChild(title);
                header.appendChild(copyButton);
                preElement.parentNode.insertBefore(header, preElement);
                
                // Set the page title
                document.title = "JSON Viewer";
                
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
        // Process the JSON string in a specific order to avoid highlighting conflicts
        let highlighted = json
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // First, handle all strings (both keys and values)
        // This ensures numbers inside strings won't be processed separately
        highlighted = highlighted.replace(/"(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?/g, function(match) {
            // #A21515 for attribute names, #0651A5 for string values
            const color = match.endsWith(':') ? '#A21515' : '#0651A5';
            const fontWeight = match.endsWith(':') ? 'bold' : 'normal';
            return `<span style="color:${color};font-weight:${fontWeight}">${match}</span>`;
        });
        
        // After handling strings, highlight booleans, null, and standalone numbers
        highlighted = highlighted
            // #0651A5 and bold for boolean and null values
            .replace(/\b(true|false)\b/g, '<span style="color:#0651A5;font-weight:bold">$1</span>')
            .replace(/\b(null)\b/g, '<span style="color:#0651A5;font-weight:bold">$1</span>')
            // #0B8658 for numeric values - but only those not inside HTML tags
            .replace(/(?<!(span style="color:)[\s\S]*?)(-?\d+(\.\d+)?([eE][+-]?\d+)?)\b/g, '<span style="color:#0B8658">$2</span>');
        
        return highlighted;
    }
})(); 