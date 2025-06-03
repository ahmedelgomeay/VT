// Background script for VOIS Test Data Extension
const isOpera = navigator.userAgent.indexOf(" OPR/") >= 0;
const isFirefox = typeof InstallTrigger !== 'undefined' || navigator.userAgent.indexOf("Firefox") != -1;
const isEdge = navigator.userAgent.indexOf("Edg/") > -1;
const isChrome = !!chrome && (!!chrome.webstore || !!chrome.runtime);
const platform = isChrome ? "chrome" : isFirefox ? "firefox" : isEdge ? "edge" : isOpera ? "opera" : "chrome";

// Listen for messages from the popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openPopup") {
    chrome.action.openPopup(); // Opens the default popup
  } else if (request.action === "activate-inspector" || request.action === "deactivate-inspector") {
    // Route inspector messages from popup to content script
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error routing message to content script:', chrome.runtime.lastError);
            sendResponse({success: false, error: chrome.runtime.lastError.message});
          } else {
            sendResponse(response);
          }
        });
      } else {
        sendResponse({success: false, error: 'No active tab found'});
      }
    });
    return true; // Keep message channel open for async response
  } else if (request.action === "element-inspected" || request.action === "inspector-deactivated") {
    // Route content script messages back to popup - these are handled by NewTobiAssistant directly
    // No action needed here as these go directly to the extension
  }
});

// Setup side panel for all supported browsers
try {
  // Check if sidePanel API is available
  if (chrome.sidePanel) {
  // Configure side panel to open when action button is clicked
  chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  }).catch(error => console.error("Side panel setup error:", error));

  // Handle tab updates to enable side panel on compatible pages
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tab.url && changeInfo.status === "complete") {
      // Don't enable on chrome:// URLs
      if (!tab.url.startsWith("chrome://")) {
          try {
        await chrome.sidePanel.setOptions({
              tabId: tabId,
          path: "src/features/testDataManager/testDataManager.html",
          enabled: true
        });
            console.log("Side panel enabled for tab:", tabId);
          } catch (error) {
            console.error("Error enabling side panel:", error);
          }
      }
    }
  });

  // Handle tab activation to enable side panel
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
      try {
    await chrome.sidePanel.setOptions({
          tabId: activeInfo.tabId,
      path: "src/features/testDataManager/testDataManager.html",
      enabled: true
    });
        console.log("Side panel enabled for activated tab:", activeInfo.tabId);
      } catch (error) {
        console.error("Error enabling side panel on tab activation:", error);
      }
    });
    
    console.log("Side panel functionality initialized");
  } else {
    console.log("Side panel API not available in this browser");
  }
} catch (error) {
  console.error("Error setting up side panel:", error);
}
