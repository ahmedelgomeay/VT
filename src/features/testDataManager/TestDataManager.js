/**
 * @fileoverview Test Data Manager - A comprehensive manager for handling test data
 * display, search, and interactions in the VOIS Test Data Extension.
 * 
 * This module provides functionality to search and display test data across different
 * environments, with copy-to-clipboard functionality and persistent state management.
 * 
 * @author VOIS Test Data Extension Team
 * @version 1.0.0
 */

import testData from "../../data/testData.js";
import ToastManager from "../../utils/ToastManager.js";
import { ENVIRONMENTS } from '../../constants/environments.js';
import { CSS_CLASSES } from '../../constants/cssClasses.js';
import { MESSAGES } from '../../constants/messages.js';
import DarkMode from '../utilityButtons/darkMode/DarkMode.js';
import CookiesManager from '../utilityButtons/cookiesManager/CookiesManager.js';
import LocalStorageManager from '../utilityButtons/localStorageManager/LocalStorageManager.js';

/**
 * Storage keys for managing persistent data in Chrome storage
 * @constant {Object}
 */
const STORAGE_KEYS = {
    LAST_SEARCH_QUERY: 'lastSearchQuery',
    LAST_SEARCH_RESULTS: 'lastSearchResults',
    SELECTED_ENVIRONMENT: 'selectedEnvironment'
};

/**
 * TestDataManager class responsible for managing and displaying test data
 * including search, display, and user data handling functionality
 */
class TestDataManager {
    /**
     * Creates an instance of TestDataManager.
     * 
     * @constructor
     * @param {string} searchBoxId - ID of the search input element
     * @param {string} searchBtnId - ID of the search button element
     * @param {string} clearBtnId - ID of the clear button element
     * @param {string} resultsContainerId - ID of the results container element
     */
    constructor(searchBoxId, searchBtnId, clearBtnId, resultsContainerId) {
        // Initialize DOM elements
        this.searchBox = document.getElementById(searchBoxId);
        this.searchBtn = document.getElementById(searchBtnId);
        this.clearBtn = document.getElementById(clearBtnId);
        this.resultsContainer = document.getElementById(resultsContainerId);
        this.environmentSelect = null;
        
        // Initialize state variables
        this.currentEnvironment = null;
        this.results = [];
        this.searchTimeout = null;
        this.animationTimeout = null;

        // Bind methods to preserve 'this' context
        this.debouncedSearch = this.debounce(this.performSearch.bind(this), 250);
    }

    //-------------------------------------------------------------------------
    // INITIALIZATION METHODS
    //-------------------------------------------------------------------------

    /**
     * Initializes the TestDataManager functionality.
     * This is the main entry point after creating an instance.
     */
    init() {
        this.initializeEnvironmentSelect();
        this.loadSavedState();
        this.detectCurrentEnvironment();
        this.setupEventListeners();
    }
    
    /**
     * Initializes the environment selection dropdown element.
     */
    initializeEnvironmentSelect() {
        this.environmentSelect = document.getElementById('environmentSelect');
    }

    /**
     * Sets up all event listeners for the application.
     */
    setupEventListeners() {
        this.setupSearchListeners();
        this.setupEnvironmentListener();
    }

    /**
     * Sets up event listeners related to search functionality.
     */
    setupSearchListeners() {
        // Input event for real-time search as user types
        this.searchBox.addEventListener("input", () => {
            const query = this.searchBox.value.trim();
            query === '' ? this.clearSearch() : this.debouncedSearch();
        });

        // Click event for search button
        this.searchBtn.addEventListener("click", () => this.performSearch());
        
        // Click event for clear button
        this.clearBtn.addEventListener("click", () => this.clearSearch());
        
        // Enter key event for immediate search
        this.searchBox.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                clearTimeout(this.searchTimeout);
                clearTimeout(this.animationTimeout);
                this.performSearch();
            }
        });
    }

    /**
     * Sets up environment selection change event listener.
     */
    setupEnvironmentListener() {
        this.environmentSelect.addEventListener("change", (e) => {
            this.handleEnvironmentChange(e.target.value);
        });
    }

    //-------------------------------------------------------------------------
    // ENVIRONMENT MANAGEMENT METHODS
    //-------------------------------------------------------------------------

    /**
     * Handles environment change event.
     * Updates UI and performs search with the new environment.
     * 
     * @param {string} newEnvironment - The newly selected environment
     */
    handleEnvironmentChange(newEnvironment) {
        this.currentEnvironment = newEnvironment;
        this.updateEnvironmentClass(newEnvironment);
        this.performSearchIfNeeded();
    }

    /**
     * Updates the CSS class for the environment select dropdown based on selection.
     * This provides visual feedback about which environment is currently selected.
     * 
     * @param {string} environment - The current environment
     */
    updateEnvironmentClass(environment) {
        // Remove all environment-specific classes first
        this.environmentSelect.classList.remove(
            CSS_CLASSES.DEV_SELECTED, 
            CSS_CLASSES.TESTING_SELECTED, 
            CSS_CLASSES.STAGING_SELECTED,
            CSS_CLASSES.PRODUCTION_SELECTED
        );
        
        // Add the class for the currently selected environment
        this.environmentSelect.classList.add(`${environment.toLowerCase()}-selected`);
    }

    /**
     * Detects and sets the default environment (DEV).
     * This method runs on initialization.
     * 
     * @async
     */
    async detectCurrentEnvironment() {
        try {
            // Set default environment to DEV
            this.currentEnvironment = ENVIRONMENTS.DEV;
            this.updateEnvironmentClass(this.currentEnvironment);
            this.environmentSelect.value = this.currentEnvironment;
            this.performSearchIfNeeded();
        } catch (error) {
            console.error('Error setting default environment:', error);
        }
    }

    //-------------------------------------------------------------------------
    // SEARCH FUNCTIONALITY METHODS
    //-------------------------------------------------------------------------

    /**
     * Creates a debounced function to limit how often a function is called.
     * Useful for search operations to prevent excessive processing during typing.
     * 
     * @param {Function} func - The function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} - Debounced function
     */
    debounce(func, delay) {
        return (...args) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * Performs search based on the input query.
     * This is the main search method triggered by user actions.
     */
    performSearch() {
        const query = this.searchBox.value.trim();
        const selectedEnvironment = this.environmentSelect.value;
        this.resultsContainer.innerHTML = "";

        // Check if query is empty
        if (!query) {
            this.displayErrorMessage(MESSAGES.NO_SEARCH_TERM);
            return;
        }

        // Search for matching test data
        this.results = this.searchTestData(query.toLowerCase(), selectedEnvironment);
        
        // Handle case when no results are found
        if (this.results.length === 0) {
            this.displayErrorMessage(MESSAGES.NO_RESULTS);
            // Apply shake animation after a delay (only for "No results found")
            clearTimeout(this.animationTimeout);
            this.animationTimeout = setTimeout(() => this.applySearchBoxShakeAnimation(), 500);
            return;
        }

        // Display results and save search state
        this.displayResults();
        this.saveState(query);
    }

    /**
     * Searches test data based on query and environment.
     * 
     * @param {string} query - The search query (lowercase)
     * @param {string} environment - The selected environment
     * @returns {Array<Object>} - Array of matching test data items
     */
    searchTestData(query, environment) {
        try {
            // Check if test data exists for the environment
            if (!testData || !testData[environment]) {
                console.error(`No test data found for environment: ${environment}`);
                return [];
            }

            // Filter test data based on search query
            return testData[environment].filter(item => {
                // Item must be a non-empty object
                if (!item || typeof item !== 'object' || Object.keys(item).length === 0) {
                    return false;
                }

                // Check if any field in the item contains the search query
                return Object.entries(item).some(([key, value]) => {
                    // Skip null or undefined values
                    if (value === null || value === undefined) {
                        return false;
                    }
                    
                    // Convert value to string and check if it contains the query
                    const stringValue = typeof value === 'object' 
                        ? JSON.stringify(value).toLowerCase() 
                        : String(value).toLowerCase();
                        
                    return stringValue.includes(query);
                });
            });
        } catch (error) {
            console.error('Error searching test data:', error);
            return [];
        }
    }

    /**
     * Checks if search needs to be performed after environment change.
     * Only performs search if there's a current query.
     */
    performSearchIfNeeded() {
        const query = this.searchBox.value.trim();
        if (query) {
            this.performSearch();
        }
    }

    /**
     * Displays search results in the UI.
     * Creates and appends result elements to the container.
     */
    displayResults() {
        this.results.forEach(item => {
            const resultElement = this.createResultItem(item);
            this.resultsContainer.appendChild(resultElement);
        });
    }

    //-------------------------------------------------------------------------
    // RESULT ITEM CREATION METHODS
    //-------------------------------------------------------------------------

    /**
     * Creates a result item element containing all test data properties.
     * With the name displayed as a header with a styled border.
     * 
     * @param {Object} item - Test data item
     * @returns {HTMLElement} - Result item container element
     */
    createResultItem(item) {
        const resultDiv = document.createElement("div");
        resultDiv.classList.add(CSS_CLASSES.RESULT_ITEM);
        
        // Add name header if present
        if (item.name) {
            const nameHeader = document.createElement("div");
            nameHeader.classList.add("result-item-name");
            
            // Truncate long names in the display but show full name on hover
            const displayName = item.name.length > 20 
                ? `${item.name.substring(0, 20)}...` 
                : item.name;
            
            nameHeader.textContent = displayName;
            
            // Add tooltip for long names
            if (item.name.length > 20) {
                const tooltip = document.createElement("span");
                tooltip.classList.add("result-item-name-tooltip");
                tooltip.textContent = item.name;
                nameHeader.appendChild(tooltip);
            }
            
            resultDiv.appendChild(nameHeader);
        }
        
        const elements = this.createResultElements(item);
        resultDiv.append(...elements);
        
        return resultDiv;
    }

    /**
     * Creates all elements for a result item with display order matching the testData.js file.
     * Excludes the name property as it's now displayed in the header.
     * 
     * @param {Object} item - Test data item
     * @returns {Array<HTMLElement>} - Array of DOM elements for each property
     */
    createResultElements(item) {
        const elements = [];
        
        // Get all keys from the item object, preserving their original order from testData.js
        // Object.keys() returns properties in insertion order for non-integer keys
        const keys = Object.keys(item);
        
        // Process all properties in their original order from testData.js
        keys.forEach(key => {
            // Skip the name property as it's already displayed in the header
            if (key === 'name') {
                return;
            }
            
            // Format the label nicely (capitalize first letter)
            const label = `${key.charAt(0).toUpperCase() + key.slice(1)}:`;
            const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
            const value = item[key];
            
            // Special handling for password field only
            if (key === 'password') {
                const passwordP = document.createElement("p");
                const labelElement = this.createStrongElement(label);
                const passwordContainer = this.createPasswordContainer(value);
                
                const copyButton = this.createCopyButton(
                    () => this.copyToClipboard(
                        value, 
                        MESSAGES.FIELD_COPIED.replace('{fieldName}', fieldName)
                    )
                );
                
                passwordP.append(labelElement, passwordContainer, copyButton);
                elements.push(passwordP);
            } else {
                // For all other fields
                const copyCallback = () => this.copyToClipboard(
                    value, 
                    MESSAGES.FIELD_COPIED.replace('{fieldName}', fieldName)
                );
                    
                elements.push(this.createInfoElement(label, value, copyCallback, item));
            }
        });
        
        return elements;
    }

    /**
     * Creates an info element with label and value.
     * 
     * @param {string} label - Label text (e.g., "Name:")
     * @param {any} value - Value to display
     * @param {Function|null} onCopy - Copy callback function or null if no copy button
     * @param {Object} item - The original test data item
     * @returns {HTMLElement} - Info element containing label, value, and copy button
     */
    createInfoElement(label, value, onCopy, item) {
        const infoP = document.createElement("p");
        const labelElement = this.createStrongElement(label);
        const valueElement = this.createValueElement(label, value);

        infoP.appendChild(labelElement);
        infoP.appendChild(valueElement);

        if (onCopy) {
            const copyButton = this.createCopyButton(onCopy);
            infoP.appendChild(copyButton);
        }

        return infoP;
    }

    /**
     * Creates and formats a value element based on the type of data and field.
     * 
     * @param {string} label - Label for the field 
     * @param {any} value - Value to display
     * @returns {HTMLElement} - Formatted value element
     */
    createValueElement(label, value) {
        const valueElement = document.createElement("span");
        
        // Special formatting based on field type
        if (label === "Name:") {
            this.formatNameValue(valueElement, value);
        } else if (label === "Email:") {
            this.formatEmailValue(valueElement, value);
        } else {
            // Handle different data types appropriately
            if (value === null || value === undefined) {
                valueElement.textContent = 'N/A';
                valueElement.style.color = '#999'; // Lighter color for missing values
            } else if (typeof value === 'object') {
                // Format objects and arrays as JSON strings
                try {
                    valueElement.textContent = JSON.stringify(value);
                    valueElement.style.fontFamily = "'Roboto Mono', 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace";
                    valueElement.style.fontSize = '13px';
                } catch (e) {
                    valueElement.textContent = '[Complex Object]';
                }
            } else if (typeof value === 'boolean') {
                // Style boolean values
                valueElement.textContent = value.toString();
                valueElement.style.color = value ? '#41C488' : '#f44336'; // Green for true, red for false
            } else if (typeof value === 'number') {
                // Style numeric values
                valueElement.textContent = value.toString();
                valueElement.style.color = '#0C314E';
            } else {
                // For string values, check if they're very long
                const stringValue = value.toString();
                if (stringValue.length > 15) {
                    // Format long text values with truncation and tooltip
                    this.formatLongTextValue(valueElement, stringValue);
                } else {
                    // Default text handling for strings and other types
                    valueElement.textContent = stringValue;
                }
            }
        }
        
        return valueElement;
    }

    /**
     * Formats email values with truncation and tooltip for long emails.
     * 
     * @param {HTMLElement} element - Element to append the formatted email to
     * @param {string} email - Email address to format
     */
    formatEmailValue(element, email) {
        // Create container for email and tooltip
        const container = document.createElement("div");
        container.classList.add("long-text-container");
        container.style.position = "relative";
        container.style.display = "inline-block";
        
        // Create email text element
        const emailText = document.createElement("span");
        const [localPart, domain] = email.split('@');
        
        if (localPart.length > 8) {
            const truncatedEmail = `${localPart.substring(0, 8)}..@${domain}`;
            emailText.textContent = truncatedEmail;
        } else {
            emailText.textContent = email;
        }
        
        // Create tooltip using the same style as long text tooltip
        const tooltip = document.createElement("span");
        tooltip.classList.add("long-text-tooltip");
        tooltip.style.cssText = `
            visibility: hidden;
            min-width: 120px;
            max-width: 300px;
            background: linear-gradient(135deg, #1C3A54, #0C314E);
            color: #fff;
            text-align: center;
            border-radius: 5px;
            padding: 8px;
            position: absolute;
            z-index: 2;
            bottom: 125%;
            left: 50%;
            transform: translateX(-50%);
            opacity: 0;
            transition: opacity 0.3s ease, visibility 0.3s ease;
            font-size: 11px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
            white-space: normal;
            word-wrap: break-word;
        `;
        tooltip.textContent = email;
        
        // Add tooltip arrow
        const arrow = document.createElement("div");
        arrow.style.cssText = `
            content: "";
            position: absolute;
            top: 100%;
            left: 50%;
            margin-left: -6px;
            border-width: 6px;
            border-style: solid;
            border-color: #0C314E transparent transparent transparent;
        `;
        tooltip.appendChild(arrow);
        
        // Assemble the elements
        container.appendChild(emailText);
        container.appendChild(tooltip);
        element.appendChild(container);

        // Show tooltip on hover - using the same approach as long text tooltip
        container.addEventListener("mouseenter", () => {
            tooltip.style.visibility = "visible";
            tooltip.style.opacity = "1";
        });
        
        container.addEventListener("mouseleave", () => {
            tooltip.style.visibility = "hidden";
            tooltip.style.opacity = "0";
        });
    }

    /**
     * Formats name values with line breaks for long names.
     * 
     * @param {HTMLElement} element - Element to append the formatted name to
     * @param {string} name - Name to format
     */
    formatNameValue(element, name) {
        const words = name.split(' ');
        if (words.length > 3) {
            const firstLine = words.slice(0, 3).join(' ');
            const secondLine = words.slice(3).join(' ');
            element.innerHTML = `${firstLine}<br>${secondLine}`;
        } else {
            element.textContent = name;
        }
    }

    /**
     * Formats long text values with truncation and tooltip for full content.
     * 
     * @param {HTMLElement} element - Element to append the formatted value to
     * @param {string} text - Long text value to format
     */
    formatLongTextValue(element, text) {
        // Create container for text and tooltip
        const container = document.createElement("div");
        container.classList.add("long-text-container");
        container.style.position = "relative";
        container.style.display = "inline-block";
        
        // Create truncated text element
        const textSpan = document.createElement("span");
        const truncatedText = `${text.substring(0, 15)}...`;
        textSpan.textContent = truncatedText;
        
        // Create tooltip
        const tooltip = document.createElement("span");
        tooltip.classList.add("long-text-tooltip");
        tooltip.style.cssText = `
            visibility: hidden;
            min-width: 120px;
            max-width: 300px;
            background: linear-gradient(135deg, #1C3A54, #0C314E);
            color: #fff;
            text-align: center;
            border-radius: 5px;
            padding: 8px;
            position: absolute;
            z-index: 2;
            bottom: 125%;
            left: 50%;
            transform: translateX(-50%);
            opacity: 0;
            transition: opacity 0.3s ease, visibility 0.3s ease;
            font-size: 11px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
            white-space: normal;
            word-wrap: break-word;
        `;
        tooltip.textContent = text;
        
        // Add tooltip arrow
        const arrow = document.createElement("div");
        arrow.style.cssText = `
            content: "";
            position: absolute;
            top: 100%;
            left: 50%;
            margin-left: -6px;
            border-width: 6px;
            border-style: solid;
            border-color: #0C314E transparent transparent transparent;
        `;
        tooltip.appendChild(arrow);
        
        // Assemble the elements
        container.appendChild(textSpan);
        container.appendChild(tooltip);
        element.appendChild(container);

        // Show tooltip on hover
        container.addEventListener("mouseenter", () => {
            tooltip.style.visibility = "visible";
            tooltip.style.opacity = "1";
        });
        
        container.addEventListener("mouseleave", () => {
            tooltip.style.visibility = "hidden";
            tooltip.style.opacity = "0";
        });
    }

    //-------------------------------------------------------------------------
    // PASSWORD DISPLAY METHODS
    //-------------------------------------------------------------------------

    /**
     * Creates a password container with hidden and revealed states.
     * 
     * @param {string} password - Password text to display
     * @returns {HTMLElement} - Password container with hidden/reveal functionality
     */
    createPasswordContainer(password) {
        const container = document.createElement("div");
        container.classList.add(CSS_CLASSES.PASSWORD_CONTAINER);

        const hiddenPassword = this.createPasswordSpan(CSS_CLASSES.PASSWORD, "*****");
        const revealedPassword = this.createPasswordSpan(CSS_CLASSES.PASSWORD_REVEALED, password);

        container.append(hiddenPassword, revealedPassword);
        return container;
    }

    /**
     * Creates a password span element with specific class.
     * 
     * @param {string} className - CSS class to apply
     * @param {string} text - Text content for the span
     * @returns {HTMLElement} - Span element for password display
     */
    createPasswordSpan(className, text) {
        const span = document.createElement("span");
        span.classList.add(className);
        span.textContent = text;
        return span;
    }

    //-------------------------------------------------------------------------
    // COPY BUTTON METHODS
    //-------------------------------------------------------------------------

    /**
     * Creates a copy button with tooltip and event listeners.
     * 
     * @param {Function} onClick - Click handler for the copy function
     * @returns {HTMLElement} - Copy button element
     */
    createCopyButton(onClick) {
        const button = this.createCopyButtonElement();
        const parentContainer = document.querySelector('#results');
        const tooltip = this.createCopyButtonTooltipElement();

        this.appendElements(parentContainer, button, tooltip);
        this.setupCopyButtonTooltipEventListeners(button, tooltip);
        this.setupCopyButtonEventListener(button, onClick);

        return button;
    }

    /**
     * Creates the copy button element with icon.
     * 
     * @returns {HTMLElement} - Button element with copy icon
     */
    createCopyButtonElement() {
        const button = document.createElement("button");
        button.classList.add(CSS_CLASSES.COPY_BTN);

        const icon = document.createElement("i");
        icon.classList.add("fas", "fa-copy");
        button.appendChild(icon);
        
        return button;
    }

    /**
     * Creates a tooltip element for the copy button.
     * 
     * @returns {HTMLElement} - Tooltip span element
     */
    createCopyButtonTooltipElement() {
        const tooltip = document.createElement("span");
        tooltip.classList.add("copy-tooltip");
        tooltip.textContent = "Copy to Clipboard";
        return tooltip;
    }

    /**
     * Appends button and tooltip to the parent container.
     * 
     * @param {HTMLElement} parentContainer - Container to append elements to
     * @param {HTMLElement} button - Button element
     * @param {HTMLElement} tooltip - Tooltip element
     */
    appendElements(parentContainer, button, tooltip) {
        parentContainer.appendChild(button);
        parentContainer.appendChild(tooltip);
    }

    /**
     * Sets up event listeners for the copy button tooltip.
     * 
     * @param {HTMLElement} button - Copy button
     * @param {HTMLElement} tooltip - Tooltip element
     */
    setupCopyButtonTooltipEventListeners(button, tooltip) {
        button.addEventListener("mouseenter", () => {
            this.showCopyButtonTooltip(button, tooltip);
        });

        button.addEventListener("mouseleave", () => {
            this.hideCopyButtonTooltip(tooltip);
        });
    }

    /**
     * Shows the copy button tooltip and positions it.
     * 
     * @param {HTMLElement} button - Copy button
     * @param {HTMLElement} tooltip - Tooltip element
     */
    showCopyButtonTooltip(button, tooltip) {
        tooltip.style.visibility = 'visible';
        tooltip.style.opacity = '1';
        
        const rect = button.getBoundingClientRect();
        tooltip.style.top = `${rect.bottom + window.scrollY - 15}px`;
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.transform = 'translateX(-95%)';
    }

    /**
     * Hides the copy button tooltip.
     * 
     * @param {HTMLElement} tooltip - Tooltip element to hide
     */
    hideCopyButtonTooltip(tooltip) {
        tooltip.style.visibility = 'hidden';
        tooltip.style.opacity = '0';
    }

    /**
     * Sets up the click event listener for the copy button.
     * 
     * @param {HTMLElement} button - Copy button
     * @param {Function} onClick - Click handler
     */
    setupCopyButtonEventListener(button, onClick) {
        button.addEventListener("click", onClick);
    }

    //-------------------------------------------------------------------------
    // UTILITY METHODS
    //-------------------------------------------------------------------------

    /**
     * Creates a strong element for labels.
     * 
     * @param {string} text - Text for the strong element
     * @returns {HTMLElement} - Strong element with text
     */
    createStrongElement(text) {
        const strong = document.createElement("strong");
        strong.textContent = text;
        return strong;
    }

    /**
     * Copies a value to the clipboard.
     * 
     * @async
     * @param {any} value - Value to copy
     * @param {string} message - Success message to display
     */
    async copyToClipboard(value, message = MESSAGES.COPY_SUCCESS) {
        try {
            // Convert value to string based on its type
            let textToCopy;
            
            if (value === null || value === undefined) {
                textToCopy = 'N/A';
            } else if (typeof value === 'object') {
                textToCopy = JSON.stringify(value, null, 2);
            } else {
                textToCopy = String(value);
            }
            
            await navigator.clipboard.writeText(textToCopy);
            ToastManager.showToast(message, ToastManager.SUCCESS_TOAST);
        } catch (err) {
            console.error("Failed to copy:", err);
            ToastManager.showToast(MESSAGES.COPY_FAILURE, ToastManager.FAILURE_TOAST);
        }
    }

    /**
     * Displays an error message in the results container.
     * 
     * @param {string} message - Error message to display
     */
    displayErrorMessage(message) {
        const errorMessageElement = document.createElement("div");
        errorMessageElement.classList.add("error-message");
        errorMessageElement.textContent = message;
        this.resultsContainer.appendChild(errorMessageElement);
    }

    /**
     * Applies a shake animation to the search box to indicate an error.
     */
    applySearchBoxShakeAnimation() {
        this.searchBox.classList.add(CSS_CLASSES.SHAKE_ANIMATION);
        setTimeout(() => {
            this.searchBox.classList.remove(CSS_CLASSES.SHAKE_ANIMATION);
        }, 500);
    }

    //-------------------------------------------------------------------------
    // STATE MANAGEMENT METHODS
    //-------------------------------------------------------------------------

    /**
     * Saves the current search state to Chrome storage.
     * 
     * @param {string} query - The search query to save
     */
    saveState(query) {
        const stateData = {
            [STORAGE_KEYS.LAST_SEARCH_QUERY]: query,
            [STORAGE_KEYS.SELECTED_ENVIRONMENT]: this.currentEnvironment
        };

        chrome.storage.local.set(stateData, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving state:', chrome.runtime.lastError);
            }
        });
    }

    /**
     * Clears the search and resets the state.
     */
    clearSearch() {
        this.searchBox.value = "";
        this.resultsContainer.innerHTML = "";
        this.results = [];
        
        // Clear any pending timeouts
        clearTimeout(this.searchTimeout);
        clearTimeout(this.animationTimeout);
        
        const keysToRemove = [
            STORAGE_KEYS.LAST_SEARCH_QUERY,
            STORAGE_KEYS.SELECTED_ENVIRONMENT
        ];

        chrome.storage.local.remove(keysToRemove, () => {
            if (chrome.runtime.lastError) {
                console.error('Error clearing state:', chrome.runtime.lastError);
            }
        });
    }

    /**
     * Loads the saved search state from Chrome storage.
     */
    loadSavedState() {
        const keysToGet = [
            STORAGE_KEYS.LAST_SEARCH_QUERY,
            STORAGE_KEYS.SELECTED_ENVIRONMENT
        ];

        chrome.storage.local.get(keysToGet, (data) => {
            if (chrome.runtime.lastError) {
                console.error('Error loading state:', chrome.runtime.lastError);
                return;
            }

            if (data[STORAGE_KEYS.SELECTED_ENVIRONMENT]) {
                this.restoreEnvironment(data[STORAGE_KEYS.SELECTED_ENVIRONMENT]);
            }
            
            if (data[STORAGE_KEYS.LAST_SEARCH_QUERY]) {
                this.restoreSearch(data);
            }
        });
    }

    /**
     * Restores the environment from saved state.
     * 
     * @param {string} savedEnvironment - Environment to restore
     */
    restoreEnvironment(savedEnvironment) {
        this.currentEnvironment = savedEnvironment;
        this.environmentSelect.value = savedEnvironment;
        this.updateEnvironmentClass(savedEnvironment);
    }

    /**
     * Restores the search from saved state data.
     * 
     * @param {Object} data - Saved state data
     */
    restoreSearch(data) {
        this.searchBox.value = data[STORAGE_KEYS.LAST_SEARCH_QUERY];
        
        // Re-run the search to get fresh data
        const query = data[STORAGE_KEYS.LAST_SEARCH_QUERY];
        const environment = this.environmentSelect.value;
        
        if (query) {
            // Re-execute the search to get the most up-to-date data
            this.results = this.searchTestData(query.toLowerCase(), environment);
        
        if (this.results.length > 0) {
            this.displayResults();
        } else {
                // When restoring state with no results, display the message without animation
            this.resultsContainer.textContent = MESSAGES.NO_RESULTS;
        }
        } else {
            // No query, just clear the results
            this.resultsContainer.innerHTML = "";
            this.results = [];
        }
    }
}

// Initialize all components
const testDataManager = new TestDataManager("searchBox", "searchBtn", "clearBtn", "results");
testDataManager.init();

const darkMode = new DarkMode();
darkMode.init();

const cookiesManager = new CookiesManager();
cookiesManager.init();

const localStorageManager = new LocalStorageManager();
localStorageManager.init();

export default TestDataManager;

