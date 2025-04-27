import ToastManager from '../../../utils/ToastManager.js';
import { MESSAGES } from '../../../constants/messages.js';

export default class CookiesManager {
    constructor() {
        this.clearCookiesBtn = document.getElementById('clearCookiesBtn');
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.clearCookiesBtn.addEventListener('click', () => {
            this.clearCookies();
        });
    }

    async clearCookies() {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const url = tabs[0].url;
            const domain = new URL(url).hostname;

            const cookies = await chrome.cookies.getAll({ domain: domain });
            const count = cookies.length;

            if (count === 0) {
                ToastManager.showToast(MESSAGES.NO_COOKIES_TO_CLEAR, ToastManager.FAILURE_TOAST);
                return;
            }

            for (const cookie of cookies) {
                await chrome.cookies.remove({
                    url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`,
                    name: cookie.name
                });
            }

            ToastManager.showToast(
                `${count} cookie(s) cleared.`,
                ToastManager.SUCCESS_TOAST
            );

        } catch (error) {
            console.error('Error clearing cookies:', error);
            ToastManager.showToast(
                MESSAGES.FAILED_TO_CLEAR_COOKIES,
                ToastManager.FAILURE_TOAST
            );
        }
    }
} 