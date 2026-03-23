const api = typeof browser !== "undefined" ? browser : chrome;

api.action.onClicked.addListener((tab) => {
  api.tabs.sendMessage(tab.id, {
    action: "togglePanel",
  });
});

api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "openTrophyRoom") {
    const url = api.runtime.getURL("trophy.html");

    api.tabs.query({ url }, (tabs) => {
      if (tabs.length > 0) {
        const tab = tabs[0];

        api.tabs.update(tab.id, { active: true });
        api.windows.update(tab.windowId, { focused: true });
      } else {
        api.tabs.create({ url });
      }
    });
  }
});
