/**
 * DomInspector.js - Basic DOM Inspector for Element Highlighting
 * Simple DOM element inspection with visual highlighting
 */

// Prevent multiple injections
if (window.voisDomInspectorLoaded) {
    console.log('VOIS DomInspector already loaded');
} else {
    window.voisDomInspectorLoaded = true;

    /**
     * Basic DOM Inspector for element highlighting and inspection
     */

    class DOMInspector {
        constructor() {
            this.isActive = false;
            this.overlay = null;
            this.tooltip = null;
            this.lastHoveredElement = null;
            this.scrollTimeout = null;
        }

        activate() {
            if (this.isActive) return;
            this.isActive = true;
            
            try {
                this.createOverlayElements();
                this.addEventListeners();
                console.log('VOIS DomInspector activated');
            } catch (error) {
                console.error('Failed to activate DomInspector:', error);
            }
        }

        deactivate() {
            if (!this.isActive) return;
            this.isActive = false;
            
            try {
                this.removeOverlayElements();
                this.removeEventListeners();
                console.log('VOIS DomInspector deactivated');

                // Notify the extension / background about deactivation so UI can update.
                const message = { action: 'inspector-deactivated' };
                if (window.handleDomInspectorMessage) {
                    window.handleDomInspectorMessage(message);
                } else if (typeof chrome !== 'undefined' && chrome.runtime) {
                    chrome.runtime.sendMessage(message);
                }
            } catch (error) {
                console.error('Failed to deactivate DomInspector:', error);
            }
        }

        createOverlayElements() {
            // Remove existing elements
            this.removeOverlayElements();
            
            // Create overlay container
            this.overlay = document.createElement('div');
            this.overlay.id = 'vois-inspector-overlay';
            this.overlay.style.cssText = `
                position: fixed !important;
                pointer-events: none !important;
                z-index: 2147483647 !important;
                border: 2px solid #ff6b6b !important;
                background: rgba(255, 107, 107, 0.1) !important;
                box-shadow: 0 0 10px rgba(255, 107, 107, 0.5) !important;
                transition: all 0.1s ease !important;
                border-radius: 3px !important;
                display: none !important;
            `;
            
            // Create tooltip
            this.tooltip = document.createElement('div');
            this.tooltip.id = 'vois-inspector-tooltip';
            this.tooltip.style.cssText = `
                        position: fixed !important;
                z-index: 2147483648 !important;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                color: white !important;
                padding: 12px 16px !important;
                border-radius: 8px !important;
                font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif !important;
                font-size: 13px !important;
                font-weight: 500 !important;
                line-height: 1.4 !important;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
                backdrop-filter: blur(10px) !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                max-width: 400px !important;
                word-wrap: break-word !important;
                display: none !important;
                pointer-events: none !important;
            `;
            
            document.documentElement.appendChild(this.overlay);
            document.documentElement.appendChild(this.tooltip);
        }

        removeOverlayElements() {
            const existingOverlay = document.getElementById('vois-inspector-overlay');
            const existingTooltip = document.getElementById('vois-inspector-tooltip');
            
            if (existingOverlay) existingOverlay.remove();
            if (existingTooltip) existingTooltip.remove();
            
            this.overlay = null;
            this.tooltip = null;
        }

        addEventListeners() {
            document.addEventListener('mouseover', this.highlightElement.bind(this), true);
            document.addEventListener('mouseout', this.hideHighlight.bind(this), true);
            document.addEventListener('click', this.inspectElement.bind(this), true);
            document.addEventListener('contextmenu', this.onContextMenu.bind(this), true);
            document.addEventListener('keydown', this.onKeyDown.bind(this), true);
            document.addEventListener('scroll', this.onScroll.bind(this), true);
            window.addEventListener('resize', this.onResize.bind(this), true);
        }

        removeEventListeners() {
            document.removeEventListener('mouseover', this.highlightElement.bind(this), true);
            document.removeEventListener('mouseout', this.hideHighlight.bind(this), true);
            document.removeEventListener('click', this.inspectElement.bind(this), true);
            document.removeEventListener('contextmenu', this.onContextMenu.bind(this), true);
            document.removeEventListener('keydown', this.onKeyDown.bind(this), true);
            document.removeEventListener('scroll', this.onScroll.bind(this), true);
            window.removeEventListener('resize', this.onResize.bind(this), true);
        }

        highlightElement(event) {
            if (!this.isActive || !this.overlay) return;

            const element = event.target;
            if (!element || element === document.documentElement || element === document.body) return;
            
            this.lastHoveredElement = element;
            this.updateOverlayPosition(element);
            
            // Generate enhanced tooltip content with attributes
            const elementInfo = this.generateEnhancedElementInfo(element);
            if (this.tooltip) {
                this.tooltip.innerHTML = elementInfo;
                this.updateTooltipPosition(element);
                this.tooltip.style.display = 'block';
            }
        }

        updateOverlayPosition(element) {
            if (!this.overlay) return;
            
            const rect = element.getBoundingClientRect();
            
            this.overlay.style.cssText += `
                left: ${rect.left}px !important;
                top: ${rect.top}px !important;
                width: ${rect.width}px !important;
                height: ${rect.height}px !important;
                display: block !important;
            `;
        }

        updateTooltipPosition(element) {
            if (!this.tooltip) return;
            
            const rect = element.getBoundingClientRect();
            const tooltipRect = this.tooltip.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            let left = rect.left;
            let top = rect.bottom + 10;
            
            // Adjust if tooltip goes off-screen horizontally
            if (left + tooltipRect.width > viewportWidth) {
                left = viewportWidth - tooltipRect.width - 10;
            }
            if (left < 10) left = 10;
            
            // Adjust if tooltip goes off-screen vertically
            if (top + tooltipRect.height > viewportHeight) {
                top = rect.top - tooltipRect.height - 10;
            }
            if (top < 10) top = rect.bottom + 10;
            
            // Use fixed positioning coordinates (viewport-relative)
            this.tooltip.style.left = `${left}px`;
            this.tooltip.style.top = `${top}px`;
        }

        hideHighlight(event) {
            if (!this.isActive || !this.overlay) return;

            // Only hide if not hovering over a child element
            if (!event.relatedTarget || !event.target.contains(event.relatedTarget)) {
                this.overlay.style.display = 'none';
                if (this.tooltip) {
                    this.tooltip.style.display = 'none';
                }
                this.lastHoveredElement = null;
            }
        }

        inspectElement(event) {
            if (!this.isActive) return;

            event.preventDefault();
            event.stopPropagation();

            const element = event.target;
            try {
                console.log('Element inspected:', element);

                // Mark the inspected element for potential downstream tooling.
                element.setAttribute('shub-ins', 1);

                // Deactivate inspector immediately after the click.
                this.deactivate();
            } catch (error) {
                console.error('Error inspecting element:', error);
                const errorMessage = { action: 'inspector-error', message: 'Error inspecting element: ' + error.message };
                if (window.handleDomInspectorMessage) {
                    window.handleDomInspectorMessage(errorMessage);
                } else if (typeof chrome !== 'undefined' && chrome.runtime) {
                    chrome.runtime.sendMessage(errorMessage);
                }
            }
        }

        generateEnhancedElementInfo(element) {
            const tagName = element.tagName.toLowerCase();
            const id = element.id ? `#${element.id}` : '';
            const className = element.className ? `.${element.className.toString().split(' ').slice(0, 2).join('.')}` : '';
            const text = this.getElementText(element).substring(0, 50);
            
            // Get important attributes
            const attributes = this.getElementAttributes(element);
            let attributesHtml = '';
            
            // Categories of attributes
            const testingAttrs = ['id', 'name', 'data-testid', 'data-test', 'data-cy', 'data-automation-id'];
            const accessibilityAttrs = ['role', 'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-controls'];
            const contentAttrs = ['href', 'src', 'alt', 'title', 'placeholder', 'value', 'type'];
            
            // Check if any of these attributes exist
            const hasTestingAttrs = testingAttrs.some(attr => attributes[attr]);
            const hasAccessibilityAttrs = accessibilityAttrs.some(attr => attributes[attr]);
            const hasContentAttrs = contentAttrs.some(attr => attributes[attr]);
            const hasText = text.length > 0;
            
            // Check for other aria-* attributes not in our list
            const otherAriaAttrs = Object.keys(attributes).filter(attr => 
                attr.startsWith('aria-') && !accessibilityAttrs.includes(attr)
            );
            
            if (hasTestingAttrs || hasAccessibilityAttrs || hasContentAttrs || otherAriaAttrs.length > 0 || hasText) {
                attributesHtml = '<div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 8px;">';
                attributesHtml += '<div style="color: #fff; margin-bottom: 4px;"><strong>Element Attributes:</strong></div>';
                
                // Testing attributes section
                if (hasTestingAttrs) {
                    attributesHtml += '<div style="margin-bottom: 6px;">';
                    attributesHtml += '<div style="color: #FFD166; margin-bottom: 2px;"><em>Testing Identifiers:</em></div>';
                    testingAttrs.forEach(attr => {
                        if (attributes[attr]) {
                            attributesHtml += `<div style="margin: 2px 0; display: flex;">
                                <span style="color: #A5D6FF; min-width: 80px;">${attr}:</span>
                                <span style="word-break: break-all;">${attributes[attr]}</span>
                            </div>`;
                        }
                    });
                    attributesHtml += '</div>';
                }
                
                // Accessibility attributes section
                if (hasAccessibilityAttrs || otherAriaAttrs.length > 0) {
                    attributesHtml += '<div style="margin-bottom: 6px;">';
                    attributesHtml += '<div style="color: #FFD166; margin-bottom: 2px;"><em>Accessibility:</em></div>';
                    
                    // Standard accessibility attributes
                    accessibilityAttrs.forEach(attr => {
                        if (attributes[attr]) {
                            attributesHtml += `<div style="margin: 2px 0; display: flex;">
                                <span style="color: #A5D6FF; min-width: 80px;">${attr}:</span>
                                <span style="word-break: break-all;">${attributes[attr]}</span>
                            </div>`;
                        }
                    });
                    
                    // Other aria-* attributes
                    otherAriaAttrs.forEach(attr => {
                        attributesHtml += `<div style="margin: 2px 0; display: flex;">
                            <span style="color: #A5D6FF; min-width: 80px;">${attr}:</span>
                            <span style="word-break: break-all;">${attributes[attr]}</span>
                        </div>`;
                    });
                    
                    attributesHtml += '</div>';
                }
                
                // Content attributes section with text content
                if (hasContentAttrs || hasText) {
                    attributesHtml += '<div style="margin-bottom: 6px;">';
                    attributesHtml += '<div style="color: #FFD166; margin-bottom: 2px;"><em>Content & Behavior:</em></div>';
                    
                    // Add text as first item if it exists
                    if (hasText) {
                        attributesHtml += `<div style="margin: 2px 0; display: flex;">
                            <span style="color: #A5D6FF; min-width: 80px;">text:</span>
                            <span style="word-break: break-all;">${text}${text.length >= 50 ? '...' : ''}</span>
                        </div>`;
                    }
                    
                    contentAttrs.forEach(attr => {
                        if (attributes[attr]) {
                            attributesHtml += `<div style="margin: 2px 0; display: flex;">
                                <span style="color: #A5D6FF; min-width: 80px;">${attr}:</span>
                                <span style="word-break: break-all;">${attributes[attr]}</span>
                            </div>`;
                        }
                    });
                    attributesHtml += '</div>';
                }
                
                attributesHtml += '</div>';
            }
            
            return `
                <div style="margin-bottom: 8px;">
                    <strong style="color: #fff;">${tagName}${id}${className}</strong>
                </div>
                ${attributesHtml}
            `;
        }

        getElementText(element) {
            // Get direct text content, excluding script/style elements
            const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        const parent = node.parentElement;
                        if (!parent) return NodeFilter.FILTER_REJECT;
                        
                        const tagName = parent.tagName.toLowerCase();
                        if (['script', 'style', 'noscript'].includes(tagName)) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        
                        return NodeFilter.FILTER_ACCEPT;
                    }
                }
            );
            
            const textNodes = [];
            let node;
            while (node = walker.nextNode()) {
                textNodes.push(node.textContent);
            }
            
            return textNodes.join(' ').replace(/\s+/g, ' ').trim();
        }

        onContextMenu(event) {
            if (this.isActive) {
                event.preventDefault();
                this.deactivate();
                return false;
            }
        }

        onKeyDown(event) {
            if (this.isActive && event.key === 'Escape') {
                event.preventDefault();
                this.deactivate();
            }
        }

        onScroll(event) {
            if (!this.isActive || !this.lastHoveredElement) return;
            
            if (this.scrollTimeout) {
                clearTimeout(this.scrollTimeout);
            }
            
            // Update overlay position immediately for smooth scrolling experience
            this.updateOverlayPosition(this.lastHoveredElement);
            this.updateTooltipPosition(this.lastHoveredElement);
            
            // Also set a debounced update as a safety measure
            this.scrollTimeout = setTimeout(() => {
                if (this.lastHoveredElement) {
                this.updateOverlayPosition(this.lastHoveredElement);
                    this.updateTooltipPosition(this.lastHoveredElement);
                }
            }, 10);
        }

        onResize(event) {
            if (!this.isActive || !this.lastHoveredElement) return;
            
            // Immediately update positions on resize
            this.updateOverlayPosition(this.lastHoveredElement);
            this.updateTooltipPosition(this.lastHoveredElement);
        }

        /**
         * Helper functions
         */
        getElementAttributes(element) {
            const attributes = {};
            if (element && element.attributes) {
                for (let i = 0; i < element.attributes.length; i++) {
                    const attr = element.attributes[i];
                    attributes[attr.name] = attr.value;
                }
            }
            return attributes;
        }
    }

    // Create global inspector instance
    window.voisDomInspector = new DOMInspector();

    // Listen for messages from the extension
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            const messageAction = message.action || message.name;
            
            if (messageAction === "activate-inspector") {
                window.voisDomInspector.activate();
                sendResponse({success: true});
            } else if (messageAction === "deactivate-inspector") {
                window.voisDomInspector.deactivate();
                sendResponse({success: true});
            }
            
            return true;
        });
    }

    console.log('VOIS Basic DomInspector loaded');
}