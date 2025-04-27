export class Footer {
    constructor(containerId, footerHtmlPath) {
        this.containerId = containerId;
        this.footerHtmlPath = chrome.runtime.getURL(footerHtmlPath);
    }

    load() {
        fetch(this.footerHtmlPath)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to load footer");
                }
                return response.text();
            })
            .then((html) => {
                const container = document.getElementById(this.containerId);
                if (container) {
                    container.outerHTML = html;
                }
            })
            .catch((err) => console.error("Error loading footer:", err));
    }
}

// Initialize Footer
document.addEventListener("DOMContentLoaded", () => {
    const footer = new Footer("footer-container", "src/components/footer/footer.html");
    footer.load();
}); 