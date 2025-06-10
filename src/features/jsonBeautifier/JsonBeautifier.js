// Content script for beautifying JSON on about:blank pages
(function() {
    // Only run on about:blank pages
    if (window.location.href === 'about:blank') {
        beautifyJsonInPage();
    }

    function beautifyJsonInPage() {
        try {
            // Find all paragraphs in the body that might contain JSON
            const paragraphs = document.querySelectorAll('body > p');
            
            if (paragraphs.length === 0) {
                console.log('No paragraphs found to beautify');
                return;
            }
            
            let beautifiedCount = 0;
            
            // Process each paragraph
            paragraphs.forEach(paragraph => {
                const text = paragraph.textContent.trim();
                
                // Skip if empty
                if (!text) return;
                
                try {
                    // Try to parse as JSON
                    const jsonObj = JSON.parse(text);
                    
                    // If successful, replace with beautified version
                    const beautified = JSON.stringify(jsonObj, null, 2);
                    
                    // Create a pre element for proper formatting
                    const preElement = document.createElement('pre');
                    preElement.style.whiteSpace = 'pre-wrap';
                    preElement.style.fontFamily = 'monospace';
                    preElement.style.fontSize = '14px';
                    preElement.style.backgroundColor = '#f5f5f5';
                    preElement.style.padding = '15px';
                    preElement.style.borderRadius = '5px';
                    preElement.style.border = '1px solid #ddd';
                    preElement.style.overflow = 'auto';
                    preElement.style.maxHeight = '80vh';
                    preElement.style.margin = '20px';
                    preElement.style.lineHeight = '1.5';
                    
                    // Apply syntax highlighting
                    const highlightedJson = applySyntaxHighlighting(beautified);
                    preElement.innerHTML = highlightedJson;
                    
                    // Replace the paragraph with the pre element
                    paragraph.parentNode.replaceChild(preElement, paragraph);
                    
                    beautifiedCount++;
                } catch (e) {
                    // Not valid JSON, leave it as is
                    console.log('Paragraph does not contain valid JSON');
                }
            });
            
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
                notice.style.zIndex = '999';
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