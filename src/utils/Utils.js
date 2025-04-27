class Utils {

    static async refreshActiveTab() {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab) {
            await chrome.tabs.reload(activeTab.id);
        }
    }

    static closeExtension() {
        window.close();
    }

}

export default Utils;