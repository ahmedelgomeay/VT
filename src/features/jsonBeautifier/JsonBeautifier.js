// Content script for beautifying JSON on about:blank pages
(function() {
    console.log("JSON Beautifier script loaded on: " + window.location.href);
    
    // Run immediately and also after a slight delay to catch content that might load dynamically
    beautifyJsonInPage();
    
    // Also wait for DOM content to be fully loaded
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", beautifyJsonInPage);
    }
    
    // Add another check after a delay to catch any delayed content
    setTimeout(beautifyJsonInPage, 500);

    function beautifyJsonInPage() {
        try {
            console.log("Looking for JSON content to beautify");
            
            // Find all elements in the body that might contain JSON
            const elements = document.querySelectorAll('body > p, pre, div, span');
            
            if (elements.length === 0) {
                console.log('No potential JSON containers found');
                return;
            }
            
            console.log(`Found ${elements.length} potential JSON containers`);
            let beautifiedCount = 0;
            
            // Process each potential container
            elements.forEach(element => {
                // Get exact text with whitespace preserved
                const originalText = element.textContent;
                
                // Skip if empty
                if (!originalText.trim()) return;
                
                try {
                    // Try to parse as JSON (just to validate it's actually JSON)
                    JSON.parse(originalText);
                    console.log("Valid JSON found");
                    
                    // Create wrapper with background only
                    const wrapper = document.createElement('div');
                    wrapper.style.backgroundColor = '#f5f5f5';
                    wrapper.style.padding = '10px';
                    
                    // Keep the original element to preserve all formatting
                    element.style.fontFamily = 'monospace';
                    element.style.margin = '0';
                    element.style.padding = '0';
                    
                    // Apply syntax highlighting directly to the content
                    element.innerHTML = applySyntaxHighlighting(originalText);
                    
                    // Wrap the original element to add background
                    element.parentNode.replaceChild(wrapper, element);
                    wrapper.appendChild(element);
                    
                    beautifiedCount++;
                } catch (e) {
                    // Not valid JSON, leave it as is
                    console.log('Not valid JSON:', e.message);
                }
            });
            
            console.log(`Beautified ${beautifiedCount} JSON objects`);
            
            if (beautifiedCount > 0) {
                // Add a subtle indication that beautification occurred
                const notice = document.createElement('div');
                notice.style.position = 'fixed';
                notice.style.bottom = '10px';
                notice.style.right = '10px';
                notice.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                notice.style.color = 'white';
                notice.style.padding = '8px 12px';
                notice.style.borderRadius = '4px';
                notice.style.fontSize = '12px';
                notice.style.opacity = '0.8';
                notice.style.zIndex = '999999';
                notice.textContent = `Beautified ${beautifiedCount} JSON object${beautifiedCount !== 1 ? 's' : ''}`;
                
                document.body.appendChild(notice);
                
                // Fade out the notice after a few seconds
                setTimeout(() => {
                    notice.style.transition = 'opacity 1s';
                    notice.style.opacity = '0';
                    setTimeout(() => {
                        notice.remove();
                    }, 1000);
                }, 3000);
            }
        } catch (e) {
            console.error('Error while beautifying JSON:', e);
        }
    }
    
    function applySyntaxHighlighting(json) {
        // Basic syntax highlighting for JSON
        return json
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?/g, function(match) {
                const color = match.endsWith(':') ? '#881391' : '#1a1aa6'; // Key or string
                return '<span style="color:' + color + '">' + match + '</span>';
            })
            .replace(/\b(true|false)\b/g, '<span style="color:#0000ff">$1</span>')
            .replace(/\b(null)\b/g, '<span style="color:#0000ff">$1</span>')
            .replace(/\b(-?\d+(\.\d+)?([eE][+-]?\d+)?)\b/g, '<span style="color:#116644">$1</span>');
    }
})(); 