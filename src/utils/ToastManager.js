class ToastManager {

    static SUCCESS_TOAST = 'success';
    static FAILURE_TOAST = 'failure';
    static INFO_TOAST = 'info';
    
    // Toast durations in seconds
    static DURATION = {
        SHORT: 2,
        DEFAULT: 3,
        LONG: 5
    };

    static async showToast(message, type) {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Calculate duration before injection
        let duration = this.DURATION.DEFAULT;
        if (type === this.FAILURE_TOAST) {
            duration = this.DURATION.LONG;
        } else if (message.length < 20) {
            duration = this.DURATION.SHORT;
        }
        
        function createToastInPage(message, type, duration) {
            const toast = document.createElement('div');
            toast.innerText = message;
            toast.style.fontSize = '16px';
            toast.style.fontWeight = 'bold';
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.left = '20px';
            toast.style.padding = '10px 20px';
            toast.style.borderRadius = '5px';
            toast.style.zIndex = '10000';
            toast.style.transition = 'all 0.5s ease';
            toast.style.opacity = '1';

            if (type === 'success') {
                toast.style.backgroundColor = '#28a745';
                toast.style.color = '#fff';
            } else if (type === 'failure') {
                toast.style.backgroundColor = '#dc3545';
                toast.style.color = '#fff';
            } else if (type === 'info') {
                toast.style.backgroundColor = '#17a2b8';
                toast.style.color = '#fff';
            }

            // Get existing toasts and calculate position
            const existingToasts = document.querySelectorAll('.toast-notification');
            let bottomOffset = 20;
            
            if (existingToasts.length > 0) {
                existingToasts.forEach(existingToast => {
                    const height = existingToast.offsetHeight;
                    const margin = 10; // Space between toasts
                    bottomOffset += height + margin;
                });
            }

            // Add class for easier selection
            toast.classList.add('toast-notification');
            toast.style.bottom = `${bottomOffset}px`;
            
            document.body.appendChild(toast);
        
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => {
                    // Adjust positions of remaining toasts when removing
                    const currentToasts = document.querySelectorAll('.toast-notification');
                    const index = Array.from(currentToasts).indexOf(toast);
                    const height = toast.offsetHeight + 10; // height + margin

                    // Move remaining toasts down
                    for (let i = index + 1; i < currentToasts.length; i++) {
                        const currentBottom = parseInt(currentToasts[i].style.bottom);
                        currentToasts[i].style.bottom = `${currentBottom - height}px`;
                    }

                    document.body.removeChild(toast);
                }, 500);
            }, duration * 1000);
        }

        chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: createToastInPage,
            args: [message, type, duration]
        });
    }

}

export default ToastManager;