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

            ToastManager.showToast(
                `${itemsCleared} local storage item(s) cleared.`,
                ToastManager.SUCCESS_TOAST
            );

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