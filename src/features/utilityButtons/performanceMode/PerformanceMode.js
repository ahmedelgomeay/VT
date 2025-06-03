/**
 * @fileoverview Performance Mode - A utility for disabling animations and visual effects
 * to improve performance on low-end devices.
 * 
 * This module provides functionality to toggle the performance mode on and off,
 * which disables animations, transitions, and other GPU/CPU-intensive features.
 * 
 * @author VOIS Test Data Extension Team
 * @version 1.0.0
 */

export default class PerformanceMode {
    /**
     * Creates an instance of PerformanceMode.
     * 
     * @constructor
     */
    constructor() {
        this.body = document.body;
        this.performanceModeBtn = null;
        this.storageKey = 'performanceModeEnabled';
    }

    /**
     * Initializes the PerformanceMode functionality.
     * This is the main entry point after creating an instance.
     */
    init() {
        this.createPerformanceModeButton();
        this.loadSavedState();
        this.setupEventListeners();
    }

    /**
     * Creates the performance mode button and adds it to the utility buttons container.
     */
    createPerformanceModeButton() {
        // Create the performance mode button
        this.performanceModeBtn = document.createElement('button');
        this.performanceModeBtn.id = 'performanceModeBtn';
        this.performanceModeBtn.className = 'utility-button';
        this.performanceModeBtn.innerHTML = '<i class="fas fa-tachometer-alt"></i>';
        this.performanceModeBtn.setAttribute('data-tooltip', 'Performance Mode');
        
        // Get the utility buttons container and add the button
        const utilityButtons = document.querySelector('.utility-buttons');
        if (utilityButtons) {
            utilityButtons.appendChild(this.performanceModeBtn);
        } else {
            console.error('Utility buttons container not found');
        }
    }

    /**
     * Loads the saved performance mode state from Chrome storage.
     */
    loadSavedState() {
        chrome.storage.local.get([this.storageKey], (result) => {
            if (result[this.storageKey]) {
                this.enablePerformanceMode();
            }
        });
    }

    /**
     * Sets up event listeners for the performance mode button.
     */
    setupEventListeners() {
        if (this.performanceModeBtn) {
            this.performanceModeBtn.addEventListener('click', () => this.togglePerformanceMode());
        }
    }

    /**
     * Toggles the performance mode on and off.
     */
    togglePerformanceMode() {
        const isEnabled = this.body.classList.toggle('low-performance-mode');
        
        if (isEnabled) {
            this.enablePerformanceMode();
        } else {
            this.disablePerformanceMode();
        }
        
        // Save state
        this.saveState(isEnabled);
    }

    /**
     * Enables performance mode.
     */
    enablePerformanceMode() {
        // Check if dark mode is active before making changes
        const isDarkModeActive = this.body.classList.contains('dark-mode');
        
        // Add the performance mode class
        this.body.classList.add('low-performance-mode');
        
        // If dark mode was active, ensure it remains active
        if (isDarkModeActive) {
            this.body.classList.add('dark-mode');
        }
        
        // Force apply styles directly to ensure they take effect
        document.documentElement.style.setProperty('--force-bg-color', isDarkModeActive ? '#1e2a3a' : '#8b0000');
        this.body.style.background = isDarkModeActive ? '#1e2a3a' : '#8b0000';
        this.body.style.backgroundColor = isDarkModeActive ? '#1e2a3a' : '#8b0000';
        
        // Handle the pseudo-elements via a style tag
        this.injectPerformanceModeStyles(isDarkModeActive);
        
        // Add active class to button
        if (this.performanceModeBtn) {
            this.performanceModeBtn.classList.add('active');
        }
        
        console.log('Performance mode enabled');
    }

    /**
     * Disables performance mode.
     */
    disablePerformanceMode() {
        this.body.classList.remove('low-performance-mode');
        
        // Remove direct styles
        document.documentElement.style.removeProperty('--force-bg-color');
        this.body.style.background = '';
        this.body.style.backgroundColor = '';
        
        // Remove our injected styles
        const styleElement = document.getElementById('performance-mode-styles');
        if (styleElement) {
            styleElement.remove();
        }
        
        if (this.performanceModeBtn) {
            this.performanceModeBtn.classList.remove('active');
        }
        
        console.log('Performance mode disabled');
    }
    
    /**
     * Injects additional CSS to ensure performance mode styles are applied.
     * This helps override any conflicting styles from other components.
     * 
     * @param {boolean} isDarkModeActive - Whether dark mode is currently active
     */
    injectPerformanceModeStyles(isDarkModeActive) {
        // Remove any existing injected styles
        const existingStyle = document.getElementById('performance-mode-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        // Get the appropriate background color based on dark mode status
        const bgColor = isDarkModeActive ? '#1e2a3a' : '#8b0000';
        
        // Create a new style tag
        const style = document.createElement('style');
        style.id = 'performance-mode-styles';
        style.textContent = `
            html body.low-performance-mode {
                background: ${bgColor} !important;
                background-color: ${bgColor} !important;
                background-image: none !important;
            }
            
            html body.low-performance-mode::after {
                content: '' !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: ${bgColor} !important;
                background-color: ${bgColor} !important;
                background-image: none !important;
                opacity: 1 !important;
                z-index: -2 !important;
            }
            
            html body.low-performance-mode::before {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                background: none !important;
                background-image: none !important;
                animation: none !important;
            }
            
            /* Exclude environment selectors from animation disabling */
            html body.low-performance-mode *:not(.env-select):not(.env-select *),
            html body.low-performance-mode *:not(.env-select):not(.env-select *)::before,
            html body.low-performance-mode *:not(.env-select):not(.env-select *)::after {
                transition: none !important;
                animation: none !important;
            }
        `;
        
        // Append to the head
        document.head.appendChild(style);
    }

    /**
     * Saves the current performance mode state to Chrome storage.
     * 
     * @param {boolean} isEnabled - Whether performance mode is enabled
     */
    saveState(isEnabled) {
        chrome.storage.local.set({ [this.storageKey]: isEnabled }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving performance mode state:', chrome.runtime.lastError);
            }
        });
    }
} 