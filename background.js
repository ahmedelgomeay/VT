// Background script for VOIS Test Data Extension
const isOpera = navigator.userAgent.indexOf(" OPR/") >= 0;
const isFirefox = typeof InstallTrigger !== 'undefined' || navigator.userAgent.indexOf("Firefox") != -1;
const isEdge = navigator.userAgent.indexOf("Edg/") > -1;
const isChrome = !!chrome && (!!chrome.webstore || !!chrome.runtime);
const platform = isChrome ? "chrome" : isFirefox ? "firefox" : isEdge ? "edge" : isOpera ? "opera" : "chrome";

// Listen for messages from the popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received message:', request.action);
  
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
  } else if (request.action === "element-selectors" || request.action === "inspector-deactivated" || request.action === "inspector-error") {
    // Route content script messages back to TobiAssistant
    console.log('Forwarding', request.action, 'message from content script to extension');
    // No specific forwarding needed as the message will be handled by the TobiAssistant directly
    return true; // Keep message channel open for async response
  }
});

// JSON Beautifier Extension functionality

// Create a context menu item for beautifying JSON in new tab
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'beautify-json',
    title: 'Beautify JSON in New Tab',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'beautify-json' && info.selectionText) {
    try {
      // Try to parse as JSON to validate
      JSON.parse(info.selectionText);
      
      // Open a new tab with about:blank
      chrome.tabs.create({ url: 'about:blank' }, (newTab) => {
        // Execute a script to set the selected text to body
        setTimeout(() => {
          chrome.scripting.executeScript({
            target: { tabId: newTab.id },
            func: (jsonText) => {
              document.body.innerText = jsonText;
            },
            args: [info.selectionText]
          }).then(() => {
            // Now inject our beautifier
            chrome.scripting.executeScript({
              target: { tabId: newTab.id },
              files: ['src/features/jsonBeautifier/JsonBeautifier.js']
            });
          });
        }, 100);
      });
    } catch (e) {
      // Not valid JSON, show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'src/assets/icons/icon-128.png',
        title: 'Invalid JSON',
        message: 'The selected text is not valid JSON'
      });
    }
  }
});

// Monitor tab updates to detect about:blank pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if URL contains about:blank
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

// Add badge to show extension is active
chrome.action.setBadgeBackgroundColor({ color: '#0651A5' });
chrome.action.setBadgeText({ text: 'JSON' });

// Setup side panel for all supported browsers
try {
  // Check if sidePanel API is available
  if (chrome.sidePanel) {
    // Get the side panel path from the manifest
    const sidePanelPath = chrome.runtime.getManifest().side_panel?.default_path || 
                         "src/features/testDataManager/testDataManager.html";
    
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
              path: sidePanelPath,
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
          path: sidePanelPath,
          enabled: true
        });
        console.log("Side panel enabled for activated tab:", activeInfo.tabId);
      } catch (error) {
        console.error("Error enabling side panel on tab activation:", error);
      }
    });
    
    console.log("Side panel functionality initialized with path:", sidePanelPath);
  } else {
    console.log("Side panel API not available in this browser");
  }
} catch (error) {
  console.error("Error setting up side panel:", error);
}
