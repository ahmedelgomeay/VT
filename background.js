chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openPopup") {
    chrome.action.openPopup(); // Opens the default popup
  }
});

// Monitor tab updates to detect about:blank pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only proceed if the tab has completed loading and is an about:blank page
  if (changeInfo.status === 'complete' && tab.url === 'about:blank') {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['src/features/jsonBeautifier/JsonBeautifier.js']
    }).catch(error => console.error('Error injecting script:', error));
  }
});
