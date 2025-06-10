chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openPopup") {
    chrome.action.openPopup(); // Opens the default popup
  }
});

// Monitor all tab updates to detect about:blank pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if URL contains about:blank (more inclusive)
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('about:blank')) {
    console.log(`Detected about:blank page at ${tab.url}, injecting beautifier`);
    
    // Small delay to ensure page is fully loaded
    setTimeout(() => {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['src/features/jsonBeautifier/JsonBeautifier.js']
      }).then(() => {
        console.log('JSON Beautifier script injected successfully');
      }).catch(error => {
        console.error('Error injecting script:', error);
      });
    }, 200);
  }
});

// Also inject on new tab creation if it's about:blank
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.url && tab.url.includes('about:blank')) {
    console.log(`New about:blank tab created at ${tab.url}, injecting beautifier`);
    
    // Wait for the tab to fully load
    setTimeout(() => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/features/jsonBeautifier/JsonBeautifier.js']
      }).then(() => {
        console.log('JSON Beautifier script injected successfully');
      }).catch(error => {
        console.error('Error injecting script:', error);
      });
    }, 500);
  }
});
