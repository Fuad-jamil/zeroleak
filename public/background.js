// ZeroLeak Extension Background Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  // Context menu for quick text selection sanitization
  chrome.contextMenus.create({
    id: "zeroleak-sanitize",
    title: "Sanitize selection with ZeroLeak",
    contexts: ["selection"]
  });

  // Enable side panel behavior if supported
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
  }
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "zeroleak-sanitize" && info.selectionText) {
    // Store highlighted text in extension storage
    chrome.storage.local.set({ pendingPrompt: info.selectionText }, () => {
      // Open side panel if available on the current window, else open tab
      if (chrome.sidePanel && tab?.windowId) {
        chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {
          chrome.tabs.create({ url: "index.html" });
        });
      } else {
        chrome.tabs.create({ url: "index.html" });
      }
    });
  }
});

