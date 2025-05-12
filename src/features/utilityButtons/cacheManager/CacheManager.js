import ToastManager from '../../../utils/ToastManager.js';
import Utils from '../../../utils/Utils.js';
import { MESSAGES } from '../../../constants/messages.js';

export default class CacheManager {
    constructor() {
        this.clearCacheBtn = document.getElementById('clearCacheBtn');
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.clearCacheBtn.addEventListener('click', () => {
            this.clearCache();
        });
    }

    async clearCache() {
        try {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Clear cache using Chrome's browsingData API
            await chrome.browsingData.removeCache({
                // Clear cache from the past 7 days
                "since": (new Date()).getTime() - (1000 * 60 * 60 * 24 * 7)
            });

            ToastManager.showToast(
                MESSAGES.CACHE_CLEARED_SUCCESS,
                ToastManager.SUCCESS_TOAST
            );

            // Refresh the page after clearing cache
            await Utils.refreshActiveTab();

        } catch (error) {
            console.error('Error clearing cache:', error);
            ToastManager.showToast(
                MESSAGES.FAILED_TO_CLEAR_CACHE,
                ToastManager.FAILURE_TOAST
            );
        }
    }
} 