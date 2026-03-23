// =========================================
// BloX Chrome Extension - Panel Script
// Manages the UI panel for users blocking extension user on X (Twitter)
// =========================================

// Global variables for panel state and DOM elements
let host = null;
let shadow = null;
let panel = null;
let list = null;
let collapsed = false;

// =========================================
// Panel Creation and UI Setup
// =========================================

// Helper function to create sort button event handlers
function setupSortButton(
  button,
  type,
  datasetKey,
  downIcon,
  upIcon,
  fieldName,
) {
  bindTap(button, (e) => {
    const current = button.dataset[datasetKey] === "true";
    button.dataset[datasetKey] = (!current).toString();
    // Swap SVG
    button.querySelector("img").src = api.runtime.getURL(
      !current ? downIcon : upIcon,
    );
    Toast.show(
      `Sorted By ${fieldName} ${!current ? "Ascending" : "Descending"} Order`,
      {
        type: "info",
        position: "top",
        duration: 1000,
      },
    );
    loadPanel(null, { type: type, asc: !current });
  });
}

// Helper function to create a user row element for the blocked users list
function createUserRow(user, newlyBlockedUsername) {
  const name = user.username;

  const div = document.createElement("div");
  div.style.display = "flex";
  div.style.alignItems = "center";
  div.style.padding = "6px";
  div.style.borderRadius = "6px";
  div.style.marginBottom = "2px";
  div.style.cursor = "pointer";
  div.style.transition = "background .15s";
  div.style.justifyContent = "space-between";

  div.onmouseenter = () => (div.style.background = "#1a1a1a");
  div.onmouseleave = () => (div.style.background = "transparent");

  const left = document.createElement("div");
  left.style.display = "flex";
  left.style.alignItems = "center";
  left.style.flex = "1";

  const avatar = user.avatar
    ? `<img src="${user.avatar}" style="width:28px;height:28px;border-radius:50%;margin-right:8px;">`
    : "";

  const displayName = trimDisplayName(user.displayName, 20) || name;

  left.innerHTML = `
    ${avatar}
    <div style="display:flex;flex-direction:column;line-height:1.2;padding-inline: 4px;">
      <span style="font-weight:600;color:#fff;">${displayName}</span>
      <a href="https://x.com/${name}" target="_blank"
         style="color:#8899a6;font-size:12px;text-decoration:none;">
         @${name}
      </a>
    </div>
  `;

  div.appendChild(left);

  // Trophy button
  const trophyBtn = document.createElement("img");

  // Get current trophy data
  api.storage.local.get(
    { bloxTrophies: { trophies: [], pending: [] } },
    (result) => {
      const data = result.bloxTrophies;

      // Check if user is in trophy room
      const inTrophyRoom =
        data.trophies.some((t) => t.username === name) ||
        data.pending.some((t) => t.username === name);

      // Set correct trophy icon
      trophyBtn.src = api.runtime.getURL(
        inTrophyRoom ? "img/trophy-star-gold.svg" : "img/trophy-star.svg",
      );
    },
  );
  trophyBtn.title = "Add to trophy room";

  styleButton(trophyBtn);

  bindTap(trophyBtn, (e) => {
    e.stopPropagation();
    trophyBtn.src = api.runtime.getURL("img/trophy-star-gold.svg");
    onTrophyButtonClick(name, displayName, user.avatar);
    console.log("trophy click " + name);
  });

  div.appendChild(trophyBtn);

  const convoBtn = document.createElement("img");
  convoBtn.src = api.runtime.getURL("img/messages-question.svg");
  convoBtn.title = "View conversation history";
  styleButton(convoBtn);

  bindTap(convoBtn, (e) => {
    e.stopPropagation();

    const url = `https://x.com/search?q=(from%3A${extUserName}%20to%3A${name})%20OR%20(from%3A${name}%20to%3A${extUserName})&src=typed_query&f=live`;

    window.open(url, "_blank");
  });

  div.insertBefore(convoBtn, trophyBtn);

  // Handle highlighting for newly blocked users
  if (name === newlyBlockedUsername) {
    clearInterval(loadInterval);
    highlightNewBlockedDiv(div);
  }

  return div;
}

// Creates the main panel UI using Shadow DOM for isolation
function createPanel() {
  if (panel) return;

  // Create host element and attach shadow root
  host = document.createElement("div");
  host.style.position = "fixed";
  host.style.top = "120px";
  host.style.right = "40px";
  host.style.zIndex = "999999";

  document.body.appendChild(host);

  shadow = host.attachShadow({ mode: "open" });

  // Inject CSS styles for the panel
  const style = document.createElement("style");
  style.textContent = `
  .panel{
  max-height: 94dvh;
    width:max-content;
    background:#0f0f0f;
    color:#e6e6e6;
    border:1px solid #2a2a2a;
    border-radius:10px;
    box-shadow:0 8px 30px rgba(0,0,0,.6);
    font-family: system-ui;
    overflow:hidden;
  }

  .header{
    background:#151515;
    padding:10px 12px;
    cursor:move;
    display:flex;
    justify-content:space-between;
    align-items:center;
    border-bottom:1px solid #2a2a2a;
    font-weight:600;
  }

  .buttons{
    display:flex;
    gap:6px;
  }

  button{
    background:#1d1d1d;
    border:1px solid #333;
    color:#bbb;
    padding:3px 8px;
    border-radius:4px;
    cursor:pointer;
  }

  .list{
    max-height:340px;
    overflow-y:auto;
    padding:6px;
  }

  .row{
    display:flex;
    align-items:center;
    padding:6px;
    border-radius:6px;
    margin-bottom:2px;
    cursor:pointer;
    transition:background .15s;
  }

  .row:hover{
    background:#1a1a1a;
  }

  .avatar{
    width:28px;
    height:28px;
    border-radius:50%;
    margin-right:8px;
  }

  .name{
    font-weight:600;
    color:#fff;
  }

  .username{
    color:#8899a6;
    font-size:12px;
    text-decoration:none;
  }

  #blockFooter {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  font-size: 12px;
  border-top: 1px solid rgba(255,255,255,0.1);
  background: rgba(0,0,0,0.2);
}
#blockSearchRow {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  gap: 6px;
}

#blockSearchRow input {
    flex: 1;
    padding: 6px 6px;
    font-size: 13px;
    background-color: #1a1a1a;      /* dark background */
    color: #ffffff;                 /* white text */
    border: 1px solid #333333;      /* subtle border */
    border-radius: 4px;             /* rounded corners */
    outline: none;                  /* remove default focus outline */
    transition: border-color 0.2s, background-color 0.2s;
}

#blockSearchRow input::placeholder {
    color: #888888;                 /* grey placeholder */
}

#blockSearchRow input:focus {
    border-color: #a7a7a7;          /* lighter border on focus */
    background-color: #222222;      /* slightly lighter bg on focus */
}

#blockSearchRow button {
  padding: 4px 6px;
  font-size: 14px;
  cursor: pointer;
}

  /* scrollbar */
/* For WebKit browsers (Chrome, Edge, Safari) */
::-webkit-scrollbar {
  width: 10px;              /* width of vertical scrollbar */
  height: 10px;             /* height of horizontal scrollbar */
}

::-webkit-scrollbar-track {
  background: #1e1e1e;      /* track background (dark) */
  border-radius: 5px;
}

::-webkit-scrollbar-thumb {
  background-color: #555;   /* scrollbar handle color */
  border-radius: 5px;
  border: 2px solid #1e1e1e; /* padding around thumb */
}

::-webkit-scrollbar-thumb:hover {
  background-color: #888;   /* hover state */
}

/* Optional: for Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: #555 #1e1e1e;
}

#backupRow {
  display: none;
  padding: 10px;
  gap: 10px; /* space between buttons */
}

#backupRow button {
  flex: 1; /* each button takes equal width */
}

#blockTitle {
padding-right: 10px;
}


  #toast-root {
  position: fixed;
  z-index: 2147483647;
  pointer-events: none;
}

.toast-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
}

.toast {
  min-width: 220px;
  max-width: 320px;
  background: #1e1e1e;
  color: #fff;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  pointer-events: auto;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.2s ease;
}

.toast.show {
  opacity: 1;
  transform: translateY(0);
}

.toast-icon {
  width: 18px;
  height: 18px;
}

.toast-close {
  margin-left: auto;
  cursor: pointer;
  opacity: 0.6;
}

.toast-close:hover {
  opacity: 1;
}

/* Types */
.toast.success { background: #1f7a3a; }
.toast.error   { background: #7a1f1f; }
.toast.warning { background: #7a5a1f; }
.toast.info    { background: #1f3a7a; }

/* Positions */
.toast-top       { top: 0; left: 0; right: 0; display: flex; justify-content: center; }
.toast-bottom    { bottom: 0; left: 0; right: 0; display: flex; justify-content: center; }
.toast-top-left  { top: 0; left: 0; }
.toast-top-right { top: 0; right: 0; }
.toast-bottom-left  { bottom: 0; left: 0; }
.toast-bottom-right { bottom: 0; right: 0; }
  `;

  shadow.appendChild(style);

  // Create the panel HTML structure
  panel = document.createElement("div");
  panel.className = "panel";

  panel.innerHTML = `
  <div id="blockHeader" class="header">

    <span id="blockTitle">BloX - by BadCase</span>

    <div class="buttons">
      <button id="trophyRoom"><img style="width:16px" src="${api.runtime.getURL("img/trophy-star-light.svg")}"></button>
      <button id="blockBackup"><img style="width:16px" src="${api.runtime.getURL("img/floppy-disk.svg")}"></button>
      <button id="blockClearList"><img style="width:16px" src="${api.runtime.getURL("img/trash-can.svg")}"></button>
      <button id="blockClose"><img id="minMaxImage" style="width:16px" src="${api.runtime.getURL("img/compress.svg")}"></button>
    </div>

  </div>
      <div id="backupRow" class="backupRow">
              <button id="backupData"><img style="width:16px" src="${api.runtime.getURL("img/download.svg")}"> Backup Data</button>
              <button id="restoreData"><img style="width:16px" src="${api.runtime.getURL("img/upload.svg")}"> Restore Data</button>

        <input type="file" id="restoreInput" accept=".json" style="display:none;">
      </div>
    <div id="blockSearchRow" class="searchRow">
    <input type="text" id="blockSearch" placeholder="Search blocks...">
 <button id="sortBtn" data-newest-first="true">
  <img style="width:16px" src="${api.runtime.getURL("img/arrow-down-clock.svg")}">
</button>

<button id="sortUsernameBtn" data-sort="username" data-order="asc">
  <img style="width:16px" src="${api.runtime.getURL("img/arrow-down-user.svg")}">
</button>

<button id="sortDisplayNameBtn" data-sort="displayName" data-order="asc">
  <img style="width:16px" src="${api.runtime.getURL("img/arrow-down-a-z.svg")}">
</button>
</div>

  <div id="blockList" class="list"></div>
  <div id="blockFooter" class="footer">
    <span id="blockTotal">Blocks: 0</span>
    <span id="blockToday">Today: 0</span>
  </div>

  `;
  const searchInput = panel.querySelector("#blockSearch");

  let sortNewestFirst = true;

  searchInput.addEventListener("input", () => {
    loadPanel(null, lastSort); // re-render with filter
  });

  // Get references to sort buttons
  const sortBtn = panel.querySelector("#sortBtn");
  const sortUsernameBtn = panel.querySelector("#sortUsernameBtn");
  const sortDisplayNameBtn = panel.querySelector("#sortDisplayNameBtn");

  // Setup sort button handlers
  setupSortButton(
    sortBtn,
    "timestamp",
    "newestFirst",
    "img/arrow-down-clock.svg",
    "img/arrow-up-clock.svg",
    "Timestamp",
  );
  setupSortButton(
    sortUsernameBtn,
    "username",
    "asc",
    "img/arrow-down-user.svg",
    "img/arrow-up-user.svg",
    "Username",
  );
  setupSortButton(
    sortDisplayNameBtn,
    "displayName",
    "asc",
    "img/arrow-down-a-z.svg",
    "img/arrow-up-z-a.svg",
    "Display Name",
  );

  // Click header to toggle content + try to keep panel fully visible
  const content = panel.querySelector("#blockList");
  const header = panel.querySelector("#blockHeader");
  const title = panel.querySelector("#blockTitle");

  const trophyRoomButton = panel.querySelector("#trophyRoom");
  const backupRestoreButton = panel.querySelector("#blockBackup");
  const clearListButton = panel.querySelector("#blockClearList");
  const closeButton = panel.querySelector("#blockClose");
  const minMaxImage = panel.querySelector("#minMaxImage");
  const backupDataButton = panel.querySelector("#backupData");
  const restoreDataButton = panel.querySelector("#restoreData");
  const restoreInput = panel.querySelector("#restoreInput");
  const blockSearchRow = panel.querySelector("#blockSearchRow");
  const blockFooter = panel.querySelector("#blockFooter");
  const backupRow = panel.querySelector("#backupRow");

  // Button event handlers
  bindTap(trophyRoomButton, (e) => {
    e.stopPropagation();
    openTrophyRoom();
  });
  bindTap(closeButton, (e) => {
    collapsed = !collapsed;
    //blockSearchRow blockFooter
    if (collapsed) {
      content.style.display = "none";
      blockSearchRow.style.display = "none";
      blockFooter.style.display = "none";
      backupRow.style.display = "none";
      minMaxImage.src = api.runtime.getURL("img/expand.svg");
      if (lastTop) {
        host.style.top = `${Math.round(lastTop)}px`;
      }
    } else {
      content.style.display = "block";
      blockSearchRow.style.display = "flex";
      blockFooter.style.display = "flex";
      minMaxImage.src = api.runtime.getURL("img/compress.svg");
      // Give the browser time to reflow and compute the new height
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const rect = host.getBoundingClientRect(); // host is the fixed container

          // Get current top position (from the fixed host element)
          let currentTop = parseFloat(host.style.top) || 120;
          lastTop = currentTop;
          if (isNaN(currentTop)) currentTop = rect.top;

          const bottomOverflow = Math.max(0, rect.bottom - window.innerHeight);
          const topOverflow = Math.max(0, -rect.top);

          let newTop = currentTop;

          // Adjust position if overflowing
          if (bottomOverflow > 0) {
            newTop -= bottomOverflow + 16; // move up + breathing room
          } else if (topOverflow > 0) {
            newTop += topOverflow + 16; // move down + breathing room
          }

          // Clamp so panel stays mostly visible
          const panelHeight = rect.height;
          const minTop = 8;
          const maxTop = Math.max(minTop, window.innerHeight - panelHeight - 8);
          newTop = Math.max(minTop, Math.min(newTop, maxTop));

          // Apply smooth movement
          host.style.transition = "top 0.3s ease-out";
          host.style.top = `${Math.round(newTop)}px`;

          // Remove transition after animation finishes (important for smooth dragging afterward)
          setTimeout(() => {
            host.style.transition = "";
          }, 350);
        });
      });
    }
  });
  shadow.appendChild(panel);

  list = shadow.querySelector("#blockList");

  //bindTap(closeButton, (e) => {
  //    host.remove();
  //    panel = null;
  //  });

  bindTap(backupRestoreButton, (e) => {
    const backupPanel = panel.querySelector("#backupRow");

    backupPanel.style.display =
      backupPanel.style.display === "flex" ? "none" : "flex";
  });

  bindTap(backupDataButton, (e) => {
    backupAllData();
  });

  bindTap(restoreDataButton, (e) => {
    restoreInput.click();
  });

  restoreInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) restoreAllData(file);
  });

  bindTap(clearListButton, (e) => {
    // Show native browser confirm dialog
    const confirmed = confirm(
      "Are you sure you want to clear the entire blocked users list?\n\nThis action cannot be undone.",
    );

    if (!confirmed) {
      console.log("[BlockTracker] Clear list cancelled by user");
      return;
    }

    // Only proceed if user clicked OK
    api.storage.local.set({ blockedUsers: {} }, () => {
      loadPanel(null, lastSort);
      console.log("[BlockTracker] Cleared blocked users list");
      Toast.success("Cleared User List");
    });
  });

  enableDrag(shadow.querySelector("#blockHeader"), host);

  loadPanel(null, lastSort);
}

// =========================================
// Drag and Drop Functionality
// =========================================

let wasDragged = false;
let lastTop = null;

// Enables dragging for the panel header
function enableDrag(header, element) {
  let isDragging = false;
  let startX = 0,
    startY = 0;
  let initialLeft = 0,
    initialTop = 0;

  function startDrag(e) {
    if (e.type === "mousedown" && e.button !== 0) return;

    e.preventDefault();
    isDragging = true;

    // Use mouse or first touch
    const clientX = e.type.startsWith("touch")
      ? e.touches[0].clientX
      : e.clientX;
    const clientY = e.type.startsWith("touch")
      ? e.touches[0].clientY
      : e.clientY;

    const style = window.getComputedStyle(element);
    initialLeft = parseFloat(style.left) || 0;
    initialTop = parseFloat(style.top) || 0;

    startX = clientX;
    startY = clientY;

    if (e.type.startsWith("touch")) {
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", onStop);
    } else {
      document.addEventListener("mousemove", onMove, { passive: false });
      document.addEventListener("mouseup", onStop);
    }
  }

  function onMove(e) {
    if (!isDragging) return;
    e.preventDefault();

    const clientX = e.type.startsWith("touch")
      ? e.touches[0].clientX
      : e.clientX;
    const clientY = e.type.startsWith("touch")
      ? e.touches[0].clientY
      : e.clientY;

    let newLeft = initialLeft + (clientX - startX);
    let newTop = initialTop + (clientY - startY);

    // Clamp to viewport
    const maxLeft = window.innerWidth - element.offsetWidth - 8;
    const maxTop = window.innerHeight - element.offsetHeight - 8;
    newLeft = Math.max(8, Math.min(newLeft, maxLeft));
    newTop = Math.max(8, Math.min(newTop, maxTop));

    element.style.left = newLeft + "px";
    element.style.top = newTop + "px";
    element.style.right = "auto";

    wasDragged = true;
  }

  function onStop(e) {
    if (!isDragging) return;
    isDragging = false;

    if (e.type.startsWith("touch")) {
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onStop);
    } else {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onStop);
    }

    setTimeout(() => {
      wasDragged = false;
    }, 150);
  }

  // Mouse events
  header.addEventListener("mousedown", startDrag);
  // Touch events
  header.addEventListener("touchstart", startDrag, { passive: false });
}

// =========================================
// Trophy Room Functionality
// =========================================

// Opens the trophy room popup
function openTrophyRoom() {
  api.runtime.sendMessage({ action: "openTrophyRoom" });
}

// Called when user clicks the trophy button in the panel
function onTrophyButtonClick(username, displayName, avatar) {
  console.log("Trophy button clicked:", { username, displayName, avatar });

  addToTrophyRoom(username, displayName, avatar);

  openTrophyRoom();
}

function addToTrophyRoom(username, displayName, avatar) {
  if (!username) return;

  api.storage.local.get(
    { bloxTrophies: { trophies: [], pending: [] } },
    (result) => {
      const data = result.bloxTrophies;

      // Prevent duplicates
      if (
        data.trophies.find((t) => t.username === username) ||
        data.pending.find((t) => t.username === username)
      ) {
        console.log("User already in trophies or pending:", username);
        return;
      }

      data.pending.push({ username, displayName, avatar });
      console.log("Added to pending (api.storage):", data);

      api.storage.local.set({ bloxTrophies: data }, () => {
        console.log("Saved trophies to api.storage:", data);

        // Optional: send message to trophy page if open
        window.dispatchEvent(
          new CustomEvent("bloxTrophyAdded", {
            detail: { username, displayName, avatar },
          }),
        );
      });
    },
  );
}

// =========================================
// UI Utilities and Panel Loading
// =========================================

let lastSort = null;

// Styles buttons for trophy and conversation icons
function styleButton(btn) {
  btn.style.width = "18px";
  btn.style.height = "18px";
  btn.style.marginLeft = "8px";
  btn.style.cursor = "pointer";
  btn.style.opacity = "0.7";
  btn.style.transition = "all 0.18s ease";
  btn.style.background = "#383838";
  btn.style.borderRadius = "4px";
  btn.style.padding = "4px";

  btn.onmouseenter = () => {
    btn.style.background = "#a7a7a7";
    btn.style.opacity = "0.95";
  };

  btn.onmouseleave = () => {
    btn.style.background = "#383838";
    btn.style.opacity = "0.7";
  };
}

// Loads and renders the blocked users list in the panel

function loadPanel(newlyBlockedUsername = null, sortParam = null) {
  if (!list) return;
  updateBlockFooter();

  // --- Determine current sort ---
  if (!sortParam) {
    const sortBtn = panel.querySelector("#sortBtn");
    sortParam = {
      type: "timestamp",
      asc: sortBtn ? sortBtn.dataset.newestFirst !== "true" : false, // newest first default
    };
  }
  lastSort = sortParam;
  // Save current sort in panel for future calls
  panel.dataset.currentSort = sortParam.type;
  panel.dataset.currentOrder = sortParam.asc.toString();

  // --- Get search query ---
  const searchInput = panel.querySelector("#blockSearch");
  const query = searchInput ? searchInput.value.toLowerCase() : "";

  api.storage.local.get("blockedUsers", (data) => {
    const usersObj = data.blockedUsers || {};
    let users = Object.values(usersObj);

    // --- FILTER ---
    if (query) {
      users = users.filter(
        (u) =>
          u.username.toLowerCase().includes(query) ||
          (u.displayName && u.displayName.toLowerCase().includes(query)),
      );
    }

    // --- SORT ---
    users.sort((a, b) => {
      let valA, valB;

      if (sortParam.type === "timestamp") {
        valA = a.timestamp;
        valB = b.timestamp;
      } else if (sortParam.type === "username") {
        valA = a.username.toLowerCase();
        valB = b.username.toLowerCase();
      } else if (sortParam.type === "displayName") {
        valA = (a.displayName || "").toLowerCase();
        valB = (b.displayName || "").toLowerCase();
      }

      if (valA < valB) return sortParam.asc ? -1 : 1;
      if (valA > valB) return sortParam.asc ? 1 : -1;
      return 0;
    });

    // --- RENDER ---
    list.innerHTML = "";
    if (users.length === 0) {
      list.innerHTML = "No blocks detected";
      return;
    }

    users.forEach((user) => {
      const userRow = createUserRow(user, newlyBlockedUsername);
      list.appendChild(userRow);
    });
  });
}

// Highlights a newly blocked user in the list
function highlightNewBlockedDiv(userDiv) {
  // Scroll the user into view within the scrollable list container
  requestAnimationFrame(() => {
    const listRect = list.getBoundingClientRect();
    const userRect = userDiv.getBoundingClientRect();

    // Calculate position relative to the list
    const userTop = userRect.top - listRect.top + list.scrollTop;
    const listHeight = list.clientHeight;
    const userHeight = userRect.height;

    // Center the user in the list
    const targetScrollTop = userTop - listHeight / 2 + userHeight / 2;

    // Smooth scroll the list to the target position
    list.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: "smooth",
    });
  });

  // initial red highlight
  userDiv.style.backgroundColor = "rgba(255, 0, 0, 0.4)";
  userDiv.style.transition = "background-color 0.4s";

  // remove highlight on hover after short delay
  const removeHighlight = () => {
    setTimeout(() => {
      userDiv.style.backgroundColor = "transparent";
      userDiv.removeEventListener("mouseenter", removeHighlight);
      loadInterval = setInterval(() => {
        refreshPanel();
      }, 5000);
    }, 400);
  };

  userDiv.addEventListener("mouseenter", removeHighlight);
}

// =========================================
// Initialization and Message Handling
// =========================================

let extUserName = null;

// Initialize the panel on load
createPanel();

// Listen for messages from background script to toggle panel
api.runtime.onMessage.addListener((msg) => {
  if (msg.action === "togglePanel") {
    if (panel) {
      const isHidden =
        host.style.display === "none" ||
        getComputedStyle(host).display === "none";
      host.style.display = isHidden ? "block" : "none";
    } else {
      createPanel();
    }
  }
});

// Triggers a visual alert on the panel header
function triggerHeaderAlert() {
  if (!panel) return;

  const header = panel.querySelector("#blockHeader");
  if (!header) return;

  // Add red flash class or background
  header.style.backgroundColor = "rgba(255,0,0,0.4)";
  header.style.transition = "background-color 0.2s";

  // Add flashing effect
  let flash = true;
  const interval = setInterval(() => {
    header.style.backgroundColor = flash ? "rgba(255,0,0,0.4)" : "#151515";
    flash = !flash;
  }, 300);

  // Remove alert when panel gains focus
  const removeAlert = () => {
    header.style.backgroundColor = "#151515";
    clearInterval(interval); // if using flashing
    panel.removeEventListener("mouseenter", removeAlert);
    panel.removeEventListener("mousedown", removeAlert);
    panel.removeEventListener("focusin", removeAlert);
  };

  panel.addEventListener("mouseenter", removeAlert);
  panel.addEventListener("mousedown", removeAlert);
  panel.addEventListener("focusin", removeAlert);
}

// Gets the current user's username from the X profile link
function getExtensionUsername() {
  const profileLink = document.querySelector(
    '[data-testid="AppTabBar_Profile_Link"]',
  );
  if (!profileLink) return null;

  const href = profileLink.getAttribute("href");
  if (!href) return null;

  const username = href.replace("/", "");
  // Save for later use
  api.storage.local.set({ bloxUsername: username });

  return username;
}

// Waits for the X profile link to load and extracts username
function waitForProfileLink() {
  const link = document.querySelector('[data-testid="AppTabBar_Profile_Link"]');

  if (link) {
    extUserName = getExtensionUsername();
  } else {
    setTimeout(waitForProfileLink, 500);
  }
}

waitForProfileLink();

// Updates the footer with total blocks and today's count
function updateBlockFooter() {
  api.storage.local.get("blockedUsers", (data) => {
    const blocked = data.blockedUsers || {};

    const users = Object.values(blocked);
    const total = users.length;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayCount = users.filter(
      (u) => u.timestamp >= startOfToday.getTime(),
    ).length;

    const totalEl = panel.querySelector("#blockTotal");
    const todayEl = panel.querySelector("#blockToday");

    if (totalEl) totalEl.textContent = "Blocks: " + total;
    if (todayEl) todayEl.textContent = "Today: " + todayCount;
  });
}

window.addEventListener("blocklistUpdated", updateBlockFooter);

// Trims display names to a maximum length, avoiding cutting words
function trimDisplayName(name, maxLength = 20) {
  if (!name || name.length <= maxLength) return name;

  // Take substring up to maxLength
  let sub = name.substr(0, maxLength);

  // Trim any trailing partial word
  sub = sub.substr(0, Math.min(sub.length, sub.lastIndexOf(" ")));

  // If nothing left (no spaces), just cut at maxLength
  if (!sub) sub = name.substr(0, maxLength);

  return sub + "…";
}

// =========================================
// Data Management Functions
// =========================================

// Backs up all extension data to a JSON file
function backupAllData() {
  api.storage.local.get(null, (data) => {
    const json = JSON.stringify(data, null, 2);

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "blox_backup.json";
    a.click();

    URL.revokeObjectURL(url);

    console.log("Backup created:", data);
    Toast.success("Backup Complete");
  });
}

// Restores extension data from a JSON file
function restoreAllData(file) {
  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);

      console.log("Restoring data:", data);

      api.storage.local.clear(() => {
        if (api.runtime.lastError) {
          console.error("Clear failed:", api.runtime.lastError);
          Toast.error("Clear Failed:", api.runtime.lastError);
          return;
        }

        api.storage.local.set(data, () => {
          if (api.runtime.lastError) {
            console.error("Set failed:", api.runtime.lastError);
            Toast.error("Set Failed:", api.runtime.lastError);
            return;
          }

          console.log("Restore complete");
          Toast.success("Restore Complete");

          // Reload UI AFTER data is saved
          if (typeof loadTrophies === "function") {
            loadTrophies();
          }
        });
      });
    } catch (err) {
      console.error("Invalid backup file", err);
      alert("Failed to restore backup.");
      Toast.error("Restore Failed");
    }
  };

  reader.readAsText(file);
}

// Utility function to handle both click and touch events
function bindTap(el, handler) {
  el.addEventListener("click", handler);
  el.addEventListener(
    "touchend",
    (e) => {
      e.preventDefault(); // prevent synthetic click
      handler(e);
    },
    { passive: false },
  );
}

// =========================================
// Auto-Refresh Functionality
// =========================================

let lastStateHash = "";

// Refreshes the panel only if blocked users or trophies have changed
function refreshPanel() {
  api.storage.local.get(["blockedUsers", "bloxTrophies"], (data) => {
    const users = data.blockedUsers || {};
    const trophies = data.bloxTrophies || { trophies: [], pending: [] };

    // Create a simple hash for current state
    const hash = JSON.stringify({ users, trophies });

    if (hash !== lastStateHash) {
      lastStateHash = hash;
      loadPanel(null, lastSort); // reload only if blocked users or trophies changed
    }
  });
}

// Start auto-refresh every 5 seconds
let loadInterval = setInterval(() => {
  refreshPanel();
}, 5000);

// =========================================
// Toast Notification System
// =========================================

const Toast = (() => {
  const icons = {
    success: api.runtime.getURL("img/badge-check-white.svg"),
    error: api.runtime.getURL("img/diamond-exclamation-white.svg"),
    warning: api.runtime.getURL("img/bell-exclamation-white.svg"),
    info: api.runtime.getURL("img/circle-info-white.svg"),
  };

  let root;
  const containers = {};
  const injectedGlowTypes = new Set();

  // Ensure root container exists
  function ensureRoot() {
    if (root) return root;

    root = document.getElementById("bc-toast-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "bc-toast-root";
      Object.assign(root.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "0",
        zIndex: "2147483647",
        pointerEvents: "none",
      });
      document.documentElement.appendChild(root);
    }
    return root;
  }

  // Glow keyframes per type
  function ensureGlow(type, color) {
    if (injectedGlowTypes.has(type)) return;

    const style = document.createElement("style");
    style.textContent = `
      @keyframes bc-toast-glow-${type} {
        0%   { box-shadow: 0 0 0 ${color}; }
        50%  { box-shadow: 0 0 14px ${color}; }
        100% { box-shadow: 0 0 0 ${color}; }
      }
    `;
    document.documentElement.appendChild(style);
    injectedGlowTypes.add(type);
  }

  function getGlowColor(type) {
    switch (type) {
      case "success":
        return "rgba(46, 204, 113, 0.6)";
      case "error":
        return "rgba(231, 76, 60, 0.6)";
      case "warning":
        return "rgba(241, 196, 15, 0.6)";
      default:
        return "rgba(52, 152, 219, 0.6)";
    }
  }

  // Create/get per-position container
  function getContainer(position) {
    if (containers[position]) return containers[position];

    const el = document.createElement("div");
    el.className = `bc-toast-container ${position}`;
    Object.assign(el.style, {
      position: "fixed",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      padding: "10px",
      pointerEvents: "none",
    });

    const posMap = {
      top: { top: "0", left: "50%", transform: "translateX(-50%)" },
      bottom: { bottom: "0", left: "50%", transform: "translateX(-50%)" },
      "top-left": { top: "0", left: "0" },
      "top-right": { top: "0", right: "0" },
      "bottom-left": { bottom: "0", left: "0" },
      "bottom-right": { bottom: "0", right: "0" },
    };

    Object.assign(el.style, posMap[position] || posMap["top"]);
    ensureRoot().appendChild(el);
    containers[position] = el;
    return el;
  }

  function getBg(type) {
    switch (type) {
      case "success":
        return "#1f7a3a";
      case "error":
        return "#7a1f1f";
      case "warning":
        return "#7a5a1f";
      default:
        return "#1f3a7a";
    }
  }

  // Show toast
  function show(message, opts = {}) {
    const {
      type = "info",
      duration = 3000,
      position = "top",
      icon,
      closable = false,
    } = opts;

    const container = getContainer(position);
    const toast = document.createElement("div");

    let removed = false;
    let timeoutId = null;

    Object.assign(toast.style, {
      minWidth: "220px",
      maxWidth: "320px",
      background: getBg(type),
      color: "#fff",
      borderRadius: "8px",
      padding: "10px 12px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      pointerEvents: "auto",
      opacity: "0",
      transform: "translateY(10px)",
      transition: "all 0.2s ease",
      fontFamily: "system-ui",
      fontSize: "12px",
      cursor: closable ? "pointer" : "default",
    });

    // Glow only if closable
    if (closable) {
      const glowColor = getGlowColor(type);
      ensureGlow(type, glowColor);
      toast.style.animation = `bc-toast-glow-${type} 1.5s ease-in-out infinite`;
      // Hover effect
      toast.addEventListener(
        "mouseenter",
        () => (toast.style.opacity = "0.85"),
      );
      toast.addEventListener("mouseleave", () => (toast.style.opacity = "1"));
    }

    // Icons
    const leftIcon = document.createElement("img");
    leftIcon.src = icon || icons[type];
    leftIcon.style.width = "18px";
    const rightIcon = leftIcon.cloneNode();

    // Text
    const textEl = document.createElement("div");
    textEl.textContent = message;
    Object.assign(textEl.style, {
      flex: "1",
      textAlign: "center",
    });

    toast.appendChild(leftIcon);
    toast.appendChild(textEl);
    toast.appendChild(rightIcon);

    // Click-to-dismiss only if closable
    if (closable) {
      toast.addEventListener("click", () => {
        if (removed) return;
        removed = true;
        toast.style.animation = ""; // stop glow
        if (timeoutId) clearTimeout(timeoutId);
        removeToast(toast);
      });
    }

    // Animate in
    requestAnimationFrame(() => {
      if (removed) return;
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    // Auto-remove
    if (duration > 0) {
      timeoutId = setTimeout(() => {
        if (removed) return;
        removed = true;
        toast.style.animation = ""; // stop glow
        removeToast(toast);
      }, duration);
    }

    container.appendChild(toast);
    return toast;
  }

  function removeToast(toast) {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.animation = "";
    setTimeout(() => toast.remove(), 200);
  }

  return {
    show,
    success: (msg, opts = {}) => show(msg, { ...opts, type: "success" }),
    error: (msg, opts = {}) => show(msg, { ...opts, type: "error" }),
    warning: (msg, opts = {}) => show(msg, { ...opts, type: "warning" }),
    info: (msg, opts = {}) => show(msg, { ...opts, type: "info" }),
  };
})();

// Show success toast on extension load
Toast.success("BloX By BadCase Is Loaded");
