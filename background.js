chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openPopup") {
    chrome.action.openPopup(); // Opens the default popup
  }
});
