/**
 * Navigation Bar Module
 * Handles the dynamic loading and functionality of the navigation bar
 */

class Navbar {
    /**
     * Initialize the Navbar
     * @param {string} containerId - ID of the container element
     * @param {string} navbarHtmlPath - Path to the navbar HTML template
     */
    constructor(containerId, navbarHtmlPath) {
        // Store references to important elements and paths
        this.containerId = containerId;
        this.navbarHtmlPath = chrome.runtime.getURL(navbarHtmlPath);
        
        // Bind methods to preserve 'this' context
        this.load = this.load.bind(this);
        this.handleLoadError = this.handleLoadError.bind(this);
    }

    /**
     * Load and render the navbar
     * Fetches the HTML template and injects it into the page
     */
    async load() {
        try {
            const response = await fetch(this.navbarHtmlPath);
            
            if (!response.ok) {
                throw new Error("Failed to load navbar");
            }

            const html = await response.text();
            this.renderNavbar(html);

        } catch (error) {
            this.handleLoadError(error);
        }
    }

    /**
     * Render the navbar HTML into the container
     * @param {string} html - The HTML content to render
     */
    renderNavbar(html) {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.outerHTML = html;
        }
    }

    /**
     * Handle any errors that occur during navbar loading
     * @param {Error} error - The error that occurred
     */
    handleLoadError(error) {
        console.error("Error loading navbar:", error);
    }

    /**
     * Save the current page as the last visited page
     * Used for navigation history
     */
    saveLastVisitedPage() {
        const currentPage = window.location.href;
        localStorage.setItem("lastVisitedPage", currentPage);
        console.log("Last visited page saved:", currentPage);
    }
}

// Initialize the navbar when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    const navbar = new Navbar(
        "navbar-container", 
        "src/components/navBar/navBar.html"
    );
    navbar.load();
});

export default Navbar;
  