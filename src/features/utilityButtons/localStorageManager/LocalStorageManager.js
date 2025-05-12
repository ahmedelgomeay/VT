import ToastManager from '../../../utils/ToastManager.js';
import Utils from '../../../utils/Utils.js';
import { MESSAGES } from '../../../constants/messages.js';

export default class LocalStorageManager {
    constructor() {
        this.clearLocalStorageBtn = document.getElementById('clearLocalStorageBtn');
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.clearLocalStorageBtn.addEventListener('click', () => {
            this.clearLocalStorage();
        });
    }

    async clearLocalStorage() {
        try {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            const result = await chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                func: () => {
                    const itemCount = localStorage.length;
                    localStorage.clear();
                    return itemCount;
                }
            });

            const itemsCleared = result[0]?.result || 0;

            if (itemsCleared === 0) {
                ToastManager.showToast(MESSAGES.NO_LOCAL_STORAGE_TO_CLEAR, ToastManager.FAILURE_TOAST);
                return;
            }

            // Set up a listener for when the tab completes loading
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === activeTab.id && info.status === 'complete') {
                    // Remove the listener once we've shown the toast
                    chrome.tabs.onUpdated.removeListener(listener);
                    
                    // Show the toast after page is completely loaded
                    setTimeout(() => {
                        ToastManager.showToast(
                            `${itemsCleared} local storage item(s) cleared.`,
                            ToastManager.SUCCESS_TOAST
                        );
                    }, 1); // Small delay for better user experience
                }
            });

            // Refresh the page after clearing local storage
            await Utils.refreshActiveTab();

        } catch (error) {
            console.error('Error clearing local storage:', error);
            ToastManager.showToast(
                MESSAGES.FAILED_TO_CLEAR_LOCAL_STORAGE,
                ToastManager.FAILURE_TOAST
            );
        }
    }
}