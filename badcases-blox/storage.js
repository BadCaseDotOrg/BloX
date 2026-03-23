const api = typeof browser !== "undefined" ? browser : chrome;

const BlockStorage = {
  save(username, avatar = null, displayName = null) {
    api.storage.local.get(["blockedUsers"], (data) => {
      const blocked = data.blockedUsers || {};

      if (blocked[username]) return;

      blocked[username] = {
        username: username,
        displayName: displayName || username, // fallback to username if displayName missing
        url: "https://x.com/" + username,
        avatar: avatar || null,
        timestamp: Date.now(),
      };

      api.storage.local.set({ blockedUsers: blocked }, notifyPanel);

      console.log("[BlockTracker] Saved:", username, displayName, avatar);

      // Trigger header alert
      if (panel) triggerHeaderAlert();
      loadPanel(username);
    });
  },

  getAll(callback) {
    api.storage.local.get(["blockedUsers"], (data) => {
      callback(data.blockedUsers || {});
    });
  },
};

function notifyPanel() {
  const event = new CustomEvent("blocklistUpdated");
  window.dispatchEvent(event);
}
