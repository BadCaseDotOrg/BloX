// =========================================
// BloX Trophy Room - Main Script
// Manages the trophy room UI for displaying and organizing blocked users
// =========================================

// =========================================
// API and Mobile Detection Setup
// =========================================

const api = typeof browser !== "undefined" ? browser : chrome;

const isMobile =
  /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  window.matchMedia("(pointer: coarse)").matches;

// =========================================
// Global Variables and DOM Elements
// =========================================

// Global variable to track toggle status
let trophyHeaderToggleEnabled = false;
let selectedTrophyUsername = null;

// Elements
const headerToggle = document.getElementById("headerToggle");

// =========================================
// Header Toggle Functionality
// =========================================

// Load saved value on page load
api.storage.local.get({ trophyHeaderToggle: false }, (result) => {
  trophyHeaderToggleEnabled = result.trophyHeaderToggle;
  if (headerToggle) {
    headerToggle.checked = trophyHeaderToggleEnabled;
  }
});

// Save toggle value and update variable when clicked
if (headerToggle) {
  headerToggle.addEventListener("click", () => {
    trophyHeaderToggleEnabled = headerToggle.checked;
    renderTrophies();
    api.storage.local.set(
      { trophyHeaderToggle: trophyHeaderToggleEnabled },
      () => {
        console.log("Header toggle saved:", trophyHeaderToggleEnabled);
      },
    );
  });
}

// =========================================
// Trophy Room Data Management
// =========================================

// Storage model
let trophyRoom = {
  trophies: [], // [{ place, username, displayName, avatar }]
  pending: [], // [{ username, displayName, avatar }]
};

// Load username for header display
api.storage.local.get("bloxUsername", (data) => {
  const header = document.getElementById("trophyHeader");
  console.log(data.bloxUsername);
  if (header && data.bloxUsername) {
    header.textContent = "BloX Trophy Room - @" + data.bloxUsername;
  }
});

// Header bar click to toggle settings
const header = document.getElementById("trophyHeaderBar");

header.addEventListener("click", () => {
  const settingsWrapper = document.getElementById("settingsWrapper");

  settingsWrapper.style.display =
    settingsWrapper.style.display === "flex" ? "none" : "flex";
});

// Load saved data
function loadTrophies() {
  api.storage.local.get(
    { bloxTrophies: { trophies: [], pending: [] } },
    (result) => {
      trophyRoom = result.bloxTrophies;
      console.log("TrophyRoom loaded in trophy.html:", trophyRoom);
      runAfterFrames(renderTrophies, 2);
    },
  );
}

// Save trophies to api.storage
function saveTrophies() {
  api.storage.local.set({ bloxTrophies: trophyRoom }, () => {
    console.log("TrophyRoom saved:", trophyRoom);
  });
}

// =========================================
// Trophy Rendering and Display
// =========================================

// Render trophies in slots and pending
function renderTrophies() {
  // Podium & leaderboard slots
  document.querySelectorAll(".slot").forEach((slot) => {
    const podiumImg = slot.querySelector(".trophyImg");
    slot.innerHTML = "";
    if (podiumImg) slot.appendChild(podiumImg);

    const contentDiv = document.createElement("div");
    contentDiv.className = "trophyContent";
    slot.appendChild(contentDiv);
  });

  // Load interactions from storage
  api.storage.local.get({ bloxInteractions: {} }, (result) => {
    const interactions = result.bloxInteractions || {};

    // Place trophies
    trophyRoom.trophies.forEach((t) => {
      const slot = document.querySelector(
        `.slot[data-place="${t.place}"] .trophyContent`,
      );
      if (!slot) return;

      let slotNumber = "";
      if (t.place > 3) {
        slotNumber = `<span style="width: 30px; text-align: left;">${t.place}th</span>`;
      }

      slot.innerHTML = `${slotNumber}
        <img src="${t.avatar}" draggable="true" data-username="${t.username}" id="avatarImg${t.place}" class="avatarImg">
        <div class="nameWrapper">
          <span>${trimDisplayName(t.displayName, 20)}</span>
          <small>@${t.username}</small>
        </div>
      `;

      // For top 3, append tweet iframe if exists
      if (t.place >= 1 && t.place <= 3) {
        const tweetId = interactions[t.username];
        document.getElementById(`tweetScrollWrapper${t.place}`)?.remove();
        if (trophyHeaderToggleEnabled) {
          if (tweetId) {
            const tweetWrapper = document.createElement("div");
            tweetWrapper.style.marginTop = "8px";
            tweetWrapper.style.maxHeight = "30dvh";
            tweetWrapper.style.overflowY = "auto";
            tweetWrapper.style.overflowX = "hidden";
            tweetWrapper.className = `tweetScrollWrapper`;
            tweetWrapper.id = `tweetScrollWrapper${t.place}`;

            // Create iframe for X tweet
            const iframe = document.createElement("iframe");
            iframe.src = `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=dark`;
            iframe.width = "300";
            iframe.height = "1000";
            iframe.frameBorder = "0";
            iframe.setAttribute("scrolling", "no");
            iframe.style.borderRadius = "8px";
            iframe.style.overflow = "auto";

            tweetWrapper.appendChild(iframe);
            const trophyWrapper = document.querySelector(
              `#trophyWrapper${t.place}`,
            );
            trophyWrapper.appendChild(tweetWrapper);
          }
        }
      }
    });

    // Pending trophies
    const pendingContainer = document.getElementById("pendingContainer");
    const pendingWrapper = document.getElementById("pendingWrapper");
    pendingWrapper.style.display = trophyRoom.pending.length ? "block" : "none";
    pendingContainer.innerHTML = "";
    trophyRoom.pending.forEach((t) => {
      const div = document.createElement("div");
      div.className = "pendingSlot";
      div.innerHTML = `
        <img src="${t.avatar}" draggable="true" data-username="${t.username}">
        <span>${trimDisplayName(t.displayName, 20)}</span>
        <small>@${t.username}</small>
      `;
      pendingContainer.appendChild(div);
    });

    // Apply podium images
    document.querySelectorAll(".slot").forEach((slot) => {
      const place = slot.dataset.place;
      const trophyContent = slot.querySelector(".trophyContent");
      if (!trophyContent) return;

      let imgPath = "";
      switch (place) {
        case "1":
          imgPath = api.runtime.getURL("img/trophy_gold.png");
          break;
        case "2":
          imgPath = api.runtime.getURL("img/trophy_silver.png");
          break;
        case "3":
          imgPath = api.runtime.getURL("img/trophy_bronze.png");
          break;
      }
      trophyContent.style.backgroundImage = `url(${imgPath})`;
    });
    autoScalePodiumNames(110);
    autoScaleLeaderboardNames(160, 45);
    addDragDrop();
    settingsVisibility();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        mobileLayout();
        // Give iframes/images one more frame to influence layout
        requestAnimationFrame(() => {
          mobileLayout();
        });
      });
    });
  });
}

// =========================================
// Drag and Drop Functionality
// =========================================

// Drag & Drop
function addDragDrop() {
  const slots = document.querySelectorAll(".slot");

  // Clean old draggables: clone to remove previous event listeners
  document.querySelectorAll('[draggable="true"]').forEach((oldEl) => {
    const newEl = oldEl.cloneNode(true);
    oldEl.parentNode.replaceChild(newEl, oldEl);
  });

  // Re-query after replacement
  const draggables = document.querySelectorAll('[draggable="true"]');

  console.log(`addDragDrop: Attached to ${draggables.length} avatars`);

  let draggingEl = null;
  let draggingUsername = null;
  let dropTargetSlot = null;

  // ───────────────────────────────────────────────
  // DESKTOP / NON-MOBILE: Native HTML5 Drag & Drop
  // ───────────────────────────────────────────────
  draggables.forEach((d) => {
    d.setAttribute("draggable", "true"); // ensure it's set

    d.addEventListener("dragstart", (e) => {
      console.log("dragstart fired (desktop)", d.dataset.username);
      e.dataTransfer.setData("text/plain", d.dataset.username);
      e.dataTransfer.effectAllowed = "move";
      document.body.classList.add("dragging");
      d.style.opacity = "0.5"; // optional visual cue
    });

    d.addEventListener("dragend", () => {
      document.body.classList.remove("dragging");
      d.style.opacity = "";
    });
  });

  slots.forEach((slot) => {
    // Highlight when something is dragged over this slot
    slot.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      slot.classList.add("drop-target");
    });

    // Remove highlight when drag leaves this slot
    slot.addEventListener("dragleave", (e) => {
      // only remove if we're actually leaving this slot
      // (prevents flicker when moving between child elements)
      if (!slot.contains(e.relatedTarget)) {
        slot.classList.remove("drop-target");
      }
    });

    // make sure it's removed on successful drop too
    slot.addEventListener("drop", (e) => {
      e.preventDefault();
      const username = e.dataTransfer.getData("text/plain");
      if (username) {
        moveToSlot(username, parseInt(slot.dataset.place));
      }
      // Clean up highlight on all slots
      slots.forEach((s) => s.classList.remove("drop-target"));
      document.body.classList.remove("dragging");
    });
  });

  // remove highlight when drag ends anywhere
  document.addEventListener("dragend", () => {
    slots.forEach((s) => s.classList.remove("drop-target"));
    document.body.classList.remove("dragging");
  });

  // ───────────────────────────────────────────────
  // MOBILE / ANDROID: Custom touch-based drag
  // ───────────────────────────────────────────────
  if (isMobile) {
    document.body.style.width = "max-content";
    function startDrag(e) {
      const touch = e.touches[0];
      if (!touch) return;

      const draggable = e.currentTarget.closest('[draggable="true"]');
      if (!draggable) return;

      e.preventDefault();
      e.stopPropagation();

      draggingUsername = draggable.dataset.username;
      window._draggingUsername = draggingUsername; // ← FIX
      console.log("touch drag started:", draggingUsername);

      document.body.classList.add("dragging");

      draggingEl = draggable.cloneNode(true);
      const rect = draggable.getBoundingClientRect();
      draggingEl.style.cssText = `
        position: fixed;
        left: ${touch.clientX}px;
        top: ${touch.clientY}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        transform: translate(-50%, -50%) scale(1.1);
        z-index: 99999;
        pointer-events: none;
        opacity: 0.85;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        border-radius: 50%;
      `;

      document.body.appendChild(draggingEl);

      draggable.style.opacity = "0.4";

      slots.forEach((s) => s.classList.remove("drop-target"));
    }

    function onTouchMove(e) {
      if (!draggingEl || e.touches.length === 0) return;
      e.preventDefault();

      const touch = e.touches[0];
      draggingEl.style.left = `${touch.clientX}px`;
      draggingEl.style.top = `${touch.clientY}px`;

      const elUnder = document.elementFromPoint(touch.clientX, touch.clientY);
      const slot = elUnder?.closest(".slot");

      slots.forEach((s) => s.classList.remove("drop-target"));
      if (slot) {
        slot.classList.add("drop-target");
        dropTargetSlot = slot;
      } else {
        dropTargetSlot = null;
      }
    }

    function onTouchEnd(e) {
      if (!draggingEl) return;

      console.log(
        "touch drag ended, target slot:",
        dropTargetSlot?.dataset.place || "none",
      );

      document.body.classList.remove("dragging");

      if (dropTargetSlot && draggingUsername) {
        moveToSlot(draggingUsername, parseInt(dropTargetSlot.dataset.place));
      }

      if (draggingEl) draggingEl.remove();
      draggingEl = null;
      draggingUsername = null;
      dropTargetSlot = null;

      document
        .querySelectorAll('[draggable="true"]')
        .forEach((el) => (el.style.opacity = ""));
      slots.forEach((s) => s.classList.remove("drop-target"));
    }

    // Attach to fresh draggables
    draggables.forEach((item) => {
      item.addEventListener("touchstart", startDrag, { passive: false });
    });

    // Global listeners for continuation
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: false });
    document.addEventListener("touchcancel", onTouchEnd, { passive: false });
  }
}

// =========================================
// Trash Bin and Removal Functionality
// =========================================

// TRASH BIN DROP TARGET
function enableTrashBinDrop() {
  const trash = document.getElementById("trashDropZone");
  if (!trash) return;

  // Desktop dragover
  trash.addEventListener("dragover", (e) => {
    e.preventDefault();
    trash.classList.add("dragover");
  });

  trash.addEventListener("dragleave", () => {
    trash.classList.remove("dragover");
  });

  trash.addEventListener("drop", (e) => {
    e.preventDefault();
    trash.classList.remove("dragover");
    const username = e.dataTransfer.getData("text/plain");
    if (username) removeUserFromTrophyRoom(username);
  });

  if (isMobile) {
    // Mobile touch-drop
    document.addEventListener("touchend", (e) => {
      const trashRect = trash.getBoundingClientRect();
      const touch = e.changedTouches?.[0];
      if (!touch) return;

      const insideTrash =
        touch.clientX >= trashRect.left &&
        touch.clientX <= trashRect.right &&
        touch.clientY >= trashRect.top &&
        touch.clientY <= trashRect.bottom;

      if (insideTrash && window._draggingUsername) {
        removeUserFromTrophyRoom(window._draggingUsername);
      }
    });
  }
}

// =========================================
// Trophy Management Functions
// =========================================

// Remove a single user from trophy room
function removeUserFromTrophyRoom(username) {
  if (!username) return;

  trophyRoom.trophies = trophyRoom.trophies.filter(
    (t) => t.username !== username,
  );
  trophyRoom.pending = trophyRoom.pending.filter(
    (t) => t.username !== username,
  );
  // Re-number places
  trophyRoom.trophies.forEach((t, i) => {
    t.place = i + 1;
  });
  Toast.success(`@${username} Removed From Room`);
  saveTrophies();
  renderTrophies();
}

let lastMoveUser = null;
let lastMovePlace = null;

// Move trophy to slot
function moveToSlot(username, place) {
  const alreadyThere = trophyRoom.trophies.find(
    (t) => t.username === username && t.place === place,
  );
  if (alreadyThere) return;
  let trophy = null;

  // Remove from pending
  let pIndex = trophyRoom.pending.findIndex((t) => t.username === username);
  if (pIndex !== -1) {
    trophy = trophyRoom.pending.splice(pIndex, 1)[0];
  }

  // Remove from trophies if already there
  let tIndex = trophyRoom.trophies.findIndex((t) => t.username === username);
  if (tIndex !== -1) {
    trophy = trophyRoom.trophies.splice(tIndex, 1)[0];
  }

  if (!trophy) return;

  // Insert at correct array index
  const insertIndex = Math.max(
    0,
    Math.min(place - 1, trophyRoom.trophies.length),
  );

  trophyRoom.trophies.splice(insertIndex, 0, trophy);

  // Re-number places
  trophyRoom.trophies.forEach((t, i) => {
    t.place = i + 1;
  });

  // Limit to 10 trophies
  trophyRoom.trophies = trophyRoom.trophies.slice(0, 10);

  const pendingWrapper = document.getElementById("pendingWrapper");
  pendingWrapper.style.display = trophyRoom.pending.length ? "block" : "none";
  if (username !== lastMoveUser || place !== lastMovePlace) {
    Toast.info(`@${username} Moved To Slot ${place}`);
  }
  lastMoveUser = username;
  lastMovePlace = place;
  saveTrophies();
  renderTrophies();
}

// Add trophy from content script (via api.storage)
function addTrophyFromProfile(username, displayName, avatar) {
  if (!username) return; // safety

  api.storage.local.get(
    { bloxTrophies: { trophies: [], pending: [] } },
    (result) => {
      let data = result.bloxTrophies;

      // Prevent duplicates
      if (
        data.trophies.find((t) => t.username === username) ||
        data.pending.find((t) => t.username === username)
      )
        return;

      data.pending.push({
        username,
        displayName: displayName || username,
        avatar:
          avatar ||
          "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png",
      });

      api.storage.local.set({ bloxTrophies: data }, () => {
        console.log("Trophy added from profile:", data);
        trophyRoom.pending = data.pending;
        renderTrophies();
      });
    },
  );
}

// =========================================
// Event Listeners and Initialization
// =========================================

// Listen for custom event to add trophy
window.addEventListener("bloxTrophyAdded", (e) => {
  const t = e.detail;
  if (!trophyRoom.pending.find((p) => p.username === t.username)) {
    trophyRoom.pending.push(t);
    saveTrophies();
    renderTrophies();
    console.log("TrophyRoom updated via event:", trophyRoom);
    Toast.success(`@${t.username} Added To Room`);
  }
});

// Initial load
loadTrophies();
let toastedUsernames = [];

api.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.bloxTrophies) {
    trophyRoom = changes.bloxTrophies.newValue;
    console.log("TrophyRoom updated via storage listener:", trophyRoom);

    const pending = trophyRoom.pending || [];

    // Remove names not in pending anymore
    toastedUsernames = toastedUsernames.filter((name) =>
      pending.some((p) => p.username === name),
    );

    if (pending.length > 0) {
      const lastUser = pending[pending.length - 1].username;

      if (!toastedUsernames.includes(lastUser)) {
        Toast.success(`@${lastUser} Added To Room`);
        toastedUsernames.push(lastUser);
      }
    }

    renderTrophies();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".slot").forEach((slot) => {
    const place = slot.dataset.place;
    const trophyContent = slot.querySelector(".trophyContent");

    if (!trophyContent) return; // safety check

    let imgPath = "";
    switch (place) {
      case "1":
        imgPath = api.runtime.getURL("img/trophy_gold.png");
        break;
      case "2":
        imgPath = api.runtime.getURL("img/trophy_silver.png");
        break;
      case "3":
        imgPath = api.runtime.getURL("img/trophy_bronze.png");
        break;
    }

    trophyContent.style.backgroundImage = `url(${imgPath})`;
  });
});

// =========================================
// UI Utility Functions
// =========================================

function autoScalePodiumNames(maxWidth = 180) {
  const wrappers = document.querySelectorAll(
    ".slot1 .nameWrapper, .slot2 .nameWrapper, .slot3 .nameWrapper",
  );

  if (!wrappers.length) return;

  let fontSize = 12; // starting size
  const step = 1;
  const maxFont = 40;

  while (fontSize <= maxFont) {
    wrappers.forEach((w) => {
      w.style.fontSize = fontSize + "px";
    });

    let exceeded = false;

    wrappers.forEach((w) => {
      if (w.scrollWidth > maxWidth) {
        exceeded = true;
      }
    });

    if (exceeded) {
      fontSize -= step;

      wrappers.forEach((w) => {
        w.style.fontSize = fontSize + "px";
      });

      break;
    }

    fontSize += step;
  }
}

function autoScaleLeaderboardNames(maxWidth = 160, maxHeight = 50) {
  const wrappers = document.querySelectorAll(".leaderboard .nameWrapper");

  if (!wrappers.length) return;

  let fontSize = 10;
  const step = 1;
  const maxFont = 30;

  while (fontSize <= maxFont) {
    wrappers.forEach((w) => {
      w.style.fontSize = fontSize + "px";
    });

    let exceeded = false;

    wrappers.forEach((w) => {
      if (w.scrollWidth > maxWidth || w.scrollHeight > maxHeight) {
        exceeded = true;
      }
    });

    if (exceeded) {
      fontSize -= step;

      wrappers.forEach((w) => {
        w.style.fontSize = fontSize + "px";
      });

      break;
    }

    fontSize += step;
  }
}
function resetMobileStyles() {
  document.querySelectorAll(".trophyWrapper").forEach((el) => {
    el.style.marginTop = "";
    el.style.flexDirection = "";
    el.style.width = "";
  });

  document.querySelectorAll(".trophyContent").forEach((el) => {
    el.style.width = "";
    el.style.height = "";
    el.style.marginLeft = "";
  });

  document.querySelectorAll(".avatarImg").forEach((el) => {
    el.style = "";
  });
  document.querySelectorAll(".nameWrapper").forEach((el) => {
    el.style = "";
  });
  document.querySelectorAll(".tweetScrollWrapper").forEach((el) => {
    el.style.height = "";
  });
  const slots = document.querySelectorAll(".leaderboard .slot");
  slots.forEach((el) => {
    el.style.gridColumn = "";
    el.style.justifySelf = "";
    el.style.maxWidth = "";
  });
}
function mobileLayout() {
  resetMobileStyles();
  // detect mobile

  if (isMobile) {
    const wrapper = document.getElementById("slot-wrapper");
    if (!wrapper) return;

    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    const slotWrapper = document.querySelector("#slot-wrapper");
    if (!isPortrait) {
    } else {
      slotWrapper.style.flexDirection = "column";
      slotWrapper.style.justifyContent = "unset";
      document.querySelectorAll(".trophyWrapper").forEach((el) => {
        el.style.width = "unset";
      });
      document.querySelectorAll(".leaderboard").forEach((el) => {
        el.style.display = "grid";
        el.style.gridTemplateColumns = "1fr 1fr";
        el.style.gap = "8px";
      });
      const slots = document.querySelectorAll(".leaderboard .slot");
      slots.forEach((el) => {
        el.style.width = "48dvw";
      });
      if (slots.length % 2 !== 0) {
        const last = slots[slots.length - 1];

        last.style.gridColumn = "1 / -1";
        last.style.justifySelf = "center";
      }
      document
        .querySelectorAll(
          ".slot1 .trophyContent, .slot2 .trophyContent, .slot3 .trophyContent",
        )
        .forEach((el) => {
          el.style.width = "100px";
          el.style.height = "220px";
          el.style.backgroundSize = "cover";
          el.style.backgroundPosition = "center";
          el.style.backgroundRepeat = "no-repeat";
        });

      document.querySelectorAll(".slot1, .slot2, .slot3").forEach((el) => {
        el.style.height = "unset";
        el.style.width = "unset";
      });

      document.querySelectorAll(".tweetScrollWrapper").forEach((wrapper) => {
        wrapper.style.height = "150px";
        wrapper.style.width = "30dvw";
        wrapper.style.overflowY = "auto";
        wrapper.style.overflowX = "hidden";
        wrapper.style.webkitOverflowScrolling = "touch";
        const iframe = wrapper.querySelector("iframe");
        if (!iframe) return;

        const scale = 0.4;

        iframe.style.transform = `scale(${scale})`;
        iframe.style.transformOrigin = "top left";

        iframe.style.width = `${100 / scale}%`;
      });
      document
        .querySelectorAll('.slot[data-place="1"] .avatarImg')
        .forEach((img) => {
          img.style.height = "48px";
          img.style.width = "48px";
          img.style.marginBottom = "0px";
          img.style.marginTop = "14px";
          img.style.position = "unset";
        });
      document
        .querySelectorAll('.slot[data-place="2"] .avatarImg')
        .forEach((img) => {
          img.style.height = "44px";
          img.style.width = "44px";
          img.style.marginBottom = "0px";
          img.style.marginTop = "39px";
          img.style.position = "unset";
        });
      document
        .querySelectorAll('.slot[data-place="3"] .avatarImg')
        .forEach((img) => {
          img.style.height = "42px";
          img.style.width = "42px";
          img.style.marginBottom = "0px";
          img.style.marginTop = "39px";
          img.style.position = "unset";
        });
      document
        .querySelectorAll('.slot[data-place="1"] .nameWrapper')
        .forEach((name) => {
          name.style.top = "184px";
        });
      document
        .querySelectorAll('.slot[data-place="2"] .nameWrapper')
        .forEach((name) => {
          name.style.top = "190px";
        });
      document
        .querySelectorAll('.slot[data-place="3"] .nameWrapper')
        .forEach((name) => {
          name.style.top = "190px";
        });
    }
  }
}

function runAfterFrames(fn, frames = 2) {
  function next() {
    if (--frames <= 0) fn();
    else requestAnimationFrame(next);
  }
  requestAnimationFrame(next);
}

// =========================================
// String Utility Functions
// =========================================

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

document.body.style.touchAction = "manipulation";

// =========================================
// Mobile-Specific Functions
// =========================================

function enforcePortrait() {
  const isLandscape = window.matchMedia("(orientation: landscape)").matches;

  let blocker = document.getElementById("rotateBlocker");

  if (isLandscape) {
    if (!blocker) {
      blocker = document.createElement("div");
      blocker.id = "rotateBlocker";
      blocker.style.position = "fixed";
      blocker.style.top = "0";
      blocker.style.left = "0";
      blocker.style.width = "100%";
      blocker.style.height = "100%";
      blocker.style.background = "#000";
      blocker.style.color = "#fff";
      blocker.style.display = "flex";
      blocker.style.alignItems = "center";
      blocker.style.justifyContent = "center";
      blocker.style.zIndex = "999999";
      blocker.style.fontSize = "20px";
      blocker.textContent = "Rotate your device to portrait";
      document.body.appendChild(blocker);
    }
  } else {
    blocker?.remove();
  }
}
if (isMobile) {
  window.addEventListener("resize", enforcePortrait);
  window.addEventListener("orientationchange", enforcePortrait);
  enforcePortrait();
}
let visibilitySet = false;
function settingsVisibility() {
  const hasPending = trophyRoom.pending.length > 0;
  const settingsWrapper = document.querySelector(".settingsWrapper");
  if (hasPending) {
    settingsWrapper.style.display = "flex";
  }
  if (visibilitySet) return;
  visibilitySet = true;
  enableTrashBinDrop();

  const btn = document.getElementById("clearTrophyRoomBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      if (!confirm("Remove ALL users from the trophy room?")) return;

      trophyRoom.trophies = [];
      trophyRoom.pending = [];

      saveTrophies();
      renderTrophies();
    });
  }
}

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
