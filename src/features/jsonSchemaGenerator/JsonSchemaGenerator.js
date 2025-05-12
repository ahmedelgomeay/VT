import ToastManager from '../../utils/ToastManager.js';
import DarkMode from '../utilityButtons/darkMode/DarkMode.js';
import CookiesManager from '../utilityButtons/cookiesManager/CookiesManager.js';
import LocalStorageManager from '../utilityButtons/localStorageManager/LocalStorageManager.js';
import CacheManager from '../utilityButtons/cacheManager/CacheManager.js';
import { MESSAGES } from '../../constants/messages.js';

export default class JsonSchemaGenerator {
    constructor() {
        // Initialize DOM elements
        this.jsonInput = document.getElementById('json-input-gen');
        this.schemaOutput = document.getElementById('schema-output');
        this.generateBtn = document.getElementById('generate-btn');
        this.copyBtn = document.getElementById('copy-schema');
        this.clearBtn = document.getElementById('clear-json-gen');
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Generate schema
        this.generateBtn.addEventListener('click', () => this.generateSchema());
        
        // Copy schema to clipboard
        this.copyBtn.addEventListener('click', () => this.copySchema());
        
        // Clear JSON
        this.clearBtn.addEventListener('click', () => this.clearJson());
        
        // Add input validation and auto-formatting on paste
        this.jsonInput.addEventListener('paste', () => {
            // Short delay to let the paste event complete
            setTimeout(() => {
                this.autoFormatInput();
            }, 100);
        });
        
        // Add keyboard shortcut for generation (Ctrl+Enter)
        this.jsonInput.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                this.generateSchema();
            }
        });
    }
    
    /**
     * Auto-formats pasted JSON input
     */
    autoFormatInput() {
        try {
            const json = this.jsonInput.value.trim();
            if (!json) return;
            
            // Try to parse and format the JSON
            const parsed = JSON.parse(json);
            this.jsonInput.value = JSON.stringify(parsed, null, 2);
            
            // Show a subtle notification
            ToastManager.showToast('JSON formatted automatically', ToastManager.SUCCESS_TOAST);
        } catch (e) {
            // If it's not valid JSON, don't show an error - just leave as is
            console.log('Pasted content is not valid JSON');
        }
    }

    /**
     * Validate JSON format
     * @param {string} jsonString - The JSON string to validate
     * @returns {Object} - Validation result with success flag and parsed data or error message
     */
    validateJson(jsonString) {
        if (!jsonString || jsonString.trim() === '') {
            return { 
                isValid: false, 
                error: MESSAGES.EMPTY_JSON_INPUT 
            };
        }
        
        try {
            const parsedJson = JSON.parse(jsonString);
            
            // Check if it's a primitive value only (not an object or array)
            if (
                parsedJson === null || 
                typeof parsedJson !== 'object' ||
                (typeof parsedJson === 'object' && Object.keys(parsedJson).length === 0 && !Array.isArray(parsedJson))
            ) {
                if (Array.isArray(parsedJson) && parsedJson.length === 0) {
                    // Empty array is valid but not very useful
                    return { isValid: true, data: parsedJson };
                }
                
                return { 
                    isValid: false, 
                    error: "JSON needs to be an object or array with at least one value" 
                };
            }
            
            return { isValid: true, data: parsedJson };
        } catch (error) {
            // Create a user-friendly error message
            return { 
                isValid: false, 
                error: MESSAGES.INVALID_JSON
            };
        }
    }

    generateSchema() {
        const json = this.jsonInput.value.trim();
        
        // Validate JSON format first
        const validationResult = this.validateJson(json);
        
        if (!validationResult.isValid) {
            ToastManager.showToast(validationResult.error, ToastManager.FAILURE_TOAST);
            this.jsonInput.focus();
            
            // Highlight the textarea with error styling temporarily
            this.jsonInput.classList.add('json-error');
            setTimeout(() => {
                this.jsonInput.classList.remove('json-error');
            }, 2000);
            
            return;
        }
        
        try {
            // Add loading effect
            this.schemaOutput.textContent = 'Generating schema...';
            this.generateBtn.disabled = true;
            this.generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            
            // Small delay to show loading state (enhances UX perception)
            setTimeout(() => {
                const parsed = validationResult.data;
                
                // Auto-format the input JSON as well
                this.jsonInput.value = JSON.stringify(parsed, null, 2);
                
                // Generate schema
                const schema = this.generateSchemaFromJson(parsed);
                
                // Format and display schema
                const formattedSchema = JSON.stringify(schema, null, 2);
                this.schemaOutput.textContent = formattedSchema;
                
                // Apply syntax highlighting
                this.applySyntaxHighlighting(this.schemaOutput);
                
                // Show toast notification
                ToastManager.showToast(MESSAGES.SCHEMA_GENERATED, ToastManager.SUCCESS_TOAST);
                
                // Reset button state
                this.generateBtn.disabled = false;
                this.generateBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate Schema';
            }, 300);
            
        } catch (e) {
            // Show user-friendly error message without technical details
            this.schemaOutput.textContent = 'Error generating schema. Please check your JSON structure.';
            ToastManager.showToast(MESSAGES.SCHEMA_GENERATION_FAILED, ToastManager.FAILURE_TOAST);
            
            // Reset button state
            this.generateBtn.disabled = false;
            this.generateBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate Schema';
        }
    }

    copySchema() {
        const schema = this.schemaOutput.textContent;
        
        if (!schema || schema === 'Your schema will appear here...' || schema === MESSAGES.SCHEMA_GENERATION_IN_PROGRESS) {
            ToastManager.showToast(MESSAGES.NO_SCHEMA_TO_COPY, ToastManager.FAILURE_TOAST);
            return;
        }
        
        // Change button appearance during copy
        const originalButtonHtml = this.copyBtn.innerHTML;
        this.copyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Copying...';
        
        // Copy to clipboard
        navigator.clipboard.writeText(schema)
            .then(() => {
                ToastManager.showToast(MESSAGES.SCHEMA_COPIED, ToastManager.SUCCESS_TOAST);
                
                // Show success state
                this.copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                
                // Reset button after a brief delay
                setTimeout(() => {
                    this.copyBtn.innerHTML = originalButtonHtml;
                }, 1500);
            })
            .catch(err => {
                ToastManager.showToast(MESSAGES.COPY_FAILURE, ToastManager.FAILURE_TOAST);
                console.error('Could not copy text: ', err);
                
                // Reset button immediately
                this.copyBtn.innerHTML = originalButtonHtml;
            });
    }

    clearJson() {
        this.jsonInput.value = '';
        this.schemaOutput.textContent = 'Your schema will appear here...';
        
        // Auto-focus in the textarea
        this.jsonInput.focus();
    }

    /**
     * Apply syntax highlighting to a pre element containing JSON
     * @param {HTMLElement} element - The element containing JSON
     */
    applySyntaxHighlighting(element) {
        // Get raw text and escape HTML
        let json = element.textContent;
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Apply syntax highlighting with only the necessary highlighting
        // Remove key highlighting to fix the display issue
        json = json
            // Highlight string values
            .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>')
            // Highlight boolean values
            .replace(/\b(true|false)\b/g, '<span class="boolean">$1</span>')
            // Highlight null values
            .replace(/\b(null)\b/g, '<span class="null">$1</span>')
            // Highlight numeric values
            .replace(/\b(-?\d+(\.\d+)?([eE][+-]?\d+)?)\b/g, '<span class="number">$1</span>');
        
        element.innerHTML = json;
    }

    /**
     * Generate a JSON schema from a JSON object
     * @param {Object} json - The JSON object
     * @returns {Object} - The generated schema
     */
    generateSchemaFromJson(json) {
        // Create a base schema
        const schema = {
            "$schema": "http://json-schema.org/draft-04/schema#",
            "type": "object",
            "properties": {},
            "required": []
        };
        
        if (Array.isArray(json)) {
            schema.type = "array";
            if (json.length > 0) {
                schema.items = [];
                // Process each item in the array individually
                json.forEach(item => {
                    schema.items.push(this.inferType(item));
                });
            }
        } else if (typeof json === 'object' && json !== null) {
            // Process each property of the object
            for (const key in json) {
                if (json.hasOwnProperty(key)) {
                    schema.properties[key] = this.inferType(json[key]);
                    schema.required.push(key);
                }
            }
        } else {
            // For primitive values
            return this.inferType(json);
        }
        
        return schema;
    }

    /**
     * Infer type information for a value
     * @param {*} value - The value to infer type for
     * @returns {Object} - Type information
     */
    inferType(value) {
        if (value === null) {
            return { "type": "null" };
        }
        
        if (Array.isArray(value)) {
            const result = {
                "type": "array",
                "items": []
            };
            
            // Process each item in the array individually and preserve each one
            if (value.length > 0) {
                value.forEach(item => {
                    result.items.push(this.inferType(item));
                });
            }
            
            return result;
        }
        
        if (typeof value === 'object') {
            const nestedSchema = {
                "type": "object",
                "properties": {},
                "required": []
            };
            
            for (const key in value) {
                if (value.hasOwnProperty(key)) {
                    nestedSchema.properties[key] = this.inferType(value[key]);
                    nestedSchema.required.push(key);
                }
            }
            
            return nestedSchema;
        }
        
        // Handle primitive types more specifically
        if (typeof value === 'number') {
            if (Number.isInteger(value)) {
                return { "type": "integer" };
            } else {
                return { "type": "number" };
            }
        }
        
        return { "type": typeof value };
    }
}

// Initialize utility buttons after the page is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize dark mode
    const darkMode = new DarkMode();
    darkMode.init();
    
    // Initialize cookies manager
    const cookiesManager = new CookiesManager();
    cookiesManager.init();
    
    // Initialize local storage manager
    const localStorageManager = new LocalStorageManager();
    localStorageManager.init();
    
    // Initialize cache manager
    const cacheManager = new CacheManager();
    cacheManager.init();
    
    // Initialize the JSON Schema Generator
    const jsonSchemaGenerator = new JsonSchemaGenerator();
    jsonSchemaGenerator.init();
}); 