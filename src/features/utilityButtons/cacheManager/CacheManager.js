import ToastManager from '../../../utils/ToastManager.js';
import Utils from '../../../utils/Utils.js';
import { MESSAGES } from '../../../constants/messages.js';

export default class CacheManager {
    constructor() {
        this.cacheManagerBtn = document.getElementById('cacheManagerBtn');
        this.softCacheBypass = document.getElementById('softCacheBypass');
        this.hardCacheClear = document.getElementById('hardCacheClear');
        this.softCacheTooltip = document.getElementById('softCacheTooltip');
        this.hardCacheTooltip = document.getElementById('hardCacheTooltip');
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Toggle dropdown when clicking the main button
        this.cacheManagerBtn.addEventListener('click', (e) => {
            const dropdown = this.cacheManagerBtn.parentElement.querySelector('.dropdown-content');
            dropdown.classList.toggle('show');
            e.stopPropagation();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            const dropdowns = document.querySelectorAll('.dropdown-content');
            dropdowns.forEach(dropdown => {
                if (dropdown.classList.contains('show')) {
                    dropdown.classList.remove('show');
                }
            });
        });

        // Add tooltip behavior for soft cache bypass
        this.softCacheBypass.addEventListener('mouseenter', () => {
            this.showTooltip(this.softCacheTooltip, this.softCacheBypass);
        });
        
        this.softCacheBypass.addEventListener('mouseleave', () => {
            this.hideTooltip(this.softCacheTooltip);
        });

        // Add tooltip behavior for hard cache clear
        this.hardCacheClear.addEventListener('mouseenter', () => {
            this.showTooltip(this.hardCacheTooltip, this.hardCacheClear);
        });
        
        this.hardCacheClear.addEventListener('mouseleave', () => {
            this.hideTooltip(this.hardCacheTooltip);
        });

        // Add event listeners for the two options
        this.softCacheBypass.addEventListener('click', () => {
            this.bypassCache();
        });

        this.hardCacheClear.addEventListener('click', () => {
            this.clearCache();
        });
    }

    // Helper method to show tooltip
    showTooltip(tooltip, targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const dropdownRect = this.cacheManagerBtn.parentElement.querySelector('.dropdown-content').getBoundingClientRect();
        
        tooltip.style.display = 'block';
        
        // Position tooltip relative to the dropdown content
        const topPosition = rect.top - dropdownRect.top;
        
        // Account for dropdown items heights to center properly
        // and apply a small offset for better alignment
        tooltip.style.top = (topPosition + (rect.height/2) - 2) + 'px';
        
        // Small delay for the fade-in effect
        setTimeout(() => {
            tooltip.style.opacity = '1';
        }, 5);
    }

    // Helper method to hide tooltip
    hideTooltip(tooltip) {
        tooltip.style.opacity = '0';
        
        // Wait for transition to complete before hiding
        setTimeout(() => {
            tooltip.style.display = 'none';
        }, 300);
    }

    async bypassCache() {
        try {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Set up a listener for when the tab completes loading
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === activeTab.id && info.status === 'complete') {
                    // Remove the listener once we've shown the toast
                    chrome.tabs.onUpdated.removeListener(listener);
                    
                    // Show the toast after page is completely loaded
                    setTimeout(() => {
                        ToastManager.showToast(
                            MESSAGES.CACHE_BYPASSED_SUCCESS || "Cache bypassed successfully!",
                            ToastManager.SUCCESS_TOAST
                        );
                    }, 2); // Small delay for better user experience
                }
            });
            
            // Reload the page with bypassCache set to true
            await chrome.tabs.reload(activeTab.id, { bypassCache: true });

        } catch (error) {
            console.error('Error bypassing cache:', error);
            ToastManager.showToast(
                MESSAGES.FAILED_TO_BYPASS_CACHE || "Failed to bypass cache!",
                ToastManager.FAILURE_TOAST
            );
        }
    }

    async clearCache() {
        try {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Clear cache using Chrome's browsingData API
            await chrome.browsingData.removeCache({
                "since": (new Date()).getTime() - (1000 * 60 * 60 * 24 * 7)
            });

            // Set up a listener for when the tab completes loading
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === activeTab.id && info.status === 'complete') {
                    // Remove the listener once we've shown the toast
                    chrome.tabs.onUpdated.removeListener(listener);
                    
                    // Show the toast after page is completely loaded
                    setTimeout(() => {
                        ToastManager.showToast(
                            MESSAGES.CACHE_CLEARED_SUCCESS || "Cache cleared successfully!",
                            ToastManager.SUCCESS_TOAST
                        );
                    }, 2); // Small delay for better user experience
                }
            });

            // Refresh the page after clearing cache
            await Utils.refreshActiveTab();

        } catch (error) {
            console.error('Error clearing cache:', error);
            ToastManager.showToast(
                MESSAGES.FAILED_TO_CLEAR_CACHE || "Failed to clear cache!",
                ToastManager.FAILURE_TOAST
            );
        }
    }
} 