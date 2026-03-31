const api = typeof browser !== "undefined" ? browser : chrome;
const toggle = document.getElementById("injectToggle");

// 1. On Load: Get the saved state and set the checkbox
api.storage.local.get(["bloxPanelEnabled"], (result) => {
  // Default to true if never set, or use the saved value
  toggle.checked = result.bloxPanelEnabled !== false; 
});

// 2. On Change: Save the state AND send the message
toggle.addEventListener("change", () => {
  const isEnabled = toggle.checked;
  
  // Save to storage
  api.storage.local.set({ bloxPanelEnabled: isEnabled });

  // Send to Content Script
  api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      api.tabs.sendMessage(tabs[0].id, {
        action: "togglePanel",
        enabled: isEnabled // Pass the state so the content script knows what to do
      });
    }
  });
});

const openTrophyRoomBtn = document.getElementById("openTrophyRoomBtn");

openTrophyRoomBtn.addEventListener("click", () => {
  const url = api.runtime.getURL("trophy.html");

  // Look for any existing tab with this specific extension URL
  api.tabs.query({ url: url }, (tabs) => {
    if (tabs.length > 0) {
      // If found, jump to it and focus the window
      const tab = tabs[0];
      api.tabs.update(tab.id, { active: true });
      api.windows.update(tab.windowId, { focused: true });
    } else {
      // If not found, open a brand new tab
      api.tabs.create({ url: url });
    }
  });
});