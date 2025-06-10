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
                
                // If successful, replace with beautified version
                const beautified = JSON.stringify(jsonObj, null, 2);
                
                // Clear the current body content
                document.body.innerHTML = '';
                
                // Apply a background color to the entire page
                document.body.style.backgroundColor = '#f8f8f8';
                document.body.style.margin = '0';
                document.body.style.padding = '0';
                
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
                preElement.style.padding = '20px';
                preElement.style.borderRadius = '8px';
                preElement.style.border = '1px solid #e0e0e0';
                preElement.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.05)';
                preElement.style.overflow = 'auto';
                preElement.style.lineHeight = '1.5';
                
                // Apply syntax highlighting
                const highlightedJson = applySyntaxHighlighting(beautified);
                preElement.innerHTML = highlightedJson;
                
                // Add to container and then to body
                container.appendChild(preElement);
                document.body.appendChild(container);
                
                // Add a subtle header
                const header = document.createElement('div');
                header.style.padding = '15px 20px';
                header.style.backgroundColor = '#333';
                header.style.color = 'white';
                header.style.marginBottom = '20px';
                header.style.borderRadius = '8px 8px 0 0';
                header.style.fontWeight = 'bold';
                header.style.display = 'flex';
                header.style.justifyContent = 'space-between';
                header.style.alignItems = 'center';
                
                const title = document.createElement('span');
                title.textContent = 'JSON Viewer';
                
                const copyButton = document.createElement('button');
                copyButton.textContent = 'Copy JSON';
                copyButton.style.padding = '5px 10px';
                copyButton.style.backgroundColor = '#555';
                copyButton.style.color = 'white';
                copyButton.style.border = 'none';
                copyButton.style.borderRadius = '4px';
                copyButton.style.cursor = 'pointer';
                copyButton.style.fontSize = '12px';
                
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
    
    function applySyntaxHighlighting(json) {
        // Enhanced syntax highlighting for JSON
        return json
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?/g, function(match) {
                const color = match.endsWith(':') ? '#0451a5' : '#50a14f'; // Key or string
                const fontWeight = match.endsWith(':') ? 'bold' : 'normal';
                return `<span style="color:${color};font-weight:${fontWeight}">${match}</span>`;
            })
            .replace(/\b(true|false)\b/g, '<span style="color:#e45649">$1</span>')
            .replace(/\b(null)\b/g, '<span style="color:#986801">$1</span>')
            .replace(/\b(-?\d+(\.\d+)?([eE][+-]?\d+)?)\b/g, '<span style="color:#986801">$1</span>');
    }
})(); 