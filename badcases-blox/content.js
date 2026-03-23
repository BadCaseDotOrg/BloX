const processedTweets = new WeakSet();

function detectBlockedTweet(tweet) {
  if (processedTweets.has(tweet)) return;
  processedTweets.add(tweet);
  const isRuleViolation = tweet.querySelector('[aria-live="polite"]');

  if (isRuleViolation) return;

  // Match any URL that ends with /superfollows/subscribe
  const isSubscription = tweet.querySelector(
    '[href$="/superfollows/subscribe"]',
  );

  if (isSubscription) return;

  const hasVisibilityLimited = tweet.textContent.includes("Visibility limited");

  if (hasVisibilityLimited) return;

  const disabledRetweet = tweet.querySelector(
    'button[data-testid="retweet"][aria-disabled="true"]',
  );
  if (!disabledRetweet) return;

  // Get profile link – more robust selectors (avoids status links etc.)
  let profileLink = tweet.querySelector(
    'a[href^="/"][role="link"]:not([href*="/status/"]):not([href*="/hashtag/"]):not([href*="/search"])',
  );

  if (!profileLink) {
    // Fallback for wrapped / deeper structures
    profileLink = tweet.querySelector(
      'a[href^="/"]:has(img[alt*="profile"]), a[href^="/"]:has([data-testid*="avatar"])',
    );
  }

  if (!profileLink) return;

  const href = profileLink.getAttribute("href");
  if (!href || href === "/" || href.includes("/i/")) return;

  const parts = href.replace(/^\//, "").split("/");
  const username = parts[0]?.toLowerCase();
  if (!username || username.length < 3) return;

  // Get display name from the next link in the user info
  let displayName = username; 
  const userNameDiv = tweet.querySelector('div[data-testid="User-Name"]');
  if (userNameDiv) {
    const nameLink = userNameDiv.querySelector('a, span[dir="auto"]');
    if (nameLink) displayName = nameLink.innerText.trim();
  }

  // Extract avatar
  let avatar = extractAvatarFromTweet(tweet, username);

  // If avatar is lazy-loading, you can still observe changes
  if (avatar && !isPlaceholderSrc(avatar)) {
    BlockStorage.save(username, avatar, displayName);
    return; // done!
  }

  // If not ready → set up observer for lazy load / hydration changes
  observeAvatarChanges(tweet, username, displayName);
}

// ────────────────────────────────────────────────
// Extract avatar from current DOM state
// ────────────────────────────────────────────────
function extractAvatarFromTweet(tweet, username) {
  let avatar = null;

  const candidates = [
    tweet.querySelector('[data-testid="Tweet-User-Avatar"]'),
    tweet.querySelector('[data-testid="user-avatar"]'),
    tweet.querySelector('img[src*="pbs.twimg.com/profile_images"]'),
    tweet.querySelector(`a[href="/${username}"] img`),
    tweet.querySelector('img[alt*="’s profile"], img[alt*="Avatar"]'),
  ];

  for (const el of candidates) {
    if (!el) continue;

    // Case 1: direct <img>
    if (el.tagName === "IMG" && el.src) {
      if (!isPlaceholderSrc(el.src)) {
        avatar = cleanAvatarUrl(el.src);
        if (avatar) return avatar;
      }
    }

    // Case 2: img inside container
    const img = el.querySelector('img[src*="profile_images"]');
    if (img?.src && !isPlaceholderSrc(img.src)) {
      avatar = cleanAvatarUrl(img.src);
      if (avatar) return avatar;
    }

    // Case 3: background-image (rare in tweets but still exists sometimes)
    const bgEl =
      el.querySelector('div[style*="background-image"]') ||
      (el.style?.backgroundImage ? el : null);
    if (bgEl?.style?.backgroundImage) {
      const match = bgEl.style.backgroundImage.match(
        /url\(["']?(.*?)(["']?)\)/i,
      );
      if (match?.[1] && !isPlaceholderSrc(match[1])) {
        avatar = cleanAvatarUrl(match[1]);
        if (avatar) return avatar;
      }
    }
  }

  return null;
}

// ────────────────────────────────────────────────
// Watch for src/style/child changes → common with lazy loading
// ────────────────────────────────────────────────
function observeAvatarChanges(tweet, username, displayName) {
  // Find the most likely avatar container to observe (narrow scope = better perf)
  let observeTarget =
    tweet.querySelector('[data-testid="Tweet-User-Avatar"]') ||
    tweet.querySelector('[data-testid="user-avatar"]') ||
    tweet.querySelector('a[href^="/"] img')?.closest("a") ||
    tweet.querySelector('div[role="link"] img')?.closest("div") ||
    tweet; // fallback to whole tweet (wider but works)

  if (!observeTarget) return;

  const observer = new MutationObserver((mutations) => {
    // only care about src/style/child changes
    let avatar = null;

    for (const mutation of mutations) {
      if (
        mutation.type === "attributes" &&
        (mutation.attributeName === "src" || mutation.attributeName === "style")
      ) {
        avatar = extractAvatarFromTweet(tweet, username);
        if (avatar) break;
      }

      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        // New img might have been inserted
        avatar = extractAvatarFromTweet(tweet, username);
        if (avatar) break;
      }
    }

    if (avatar && !isPlaceholderSrc(avatar)) {
      api.storage.local.get(["blockedUsers"], (data) => {
        const blocked = data.blockedUsers || {};

        if (!blocked[username]) {
          Toast.show(`Blocked By @${username}`, {
            type: "error",
            position: "top",
            duration: 0,
            closable: true,
          });
        }
      });
      BlockStorage.save(username, avatar, displayName);
      observer.disconnect(); // success clean up
    }
  });

  observer.observe(observeTarget, {
    attributes: true,
    attributeFilter: ["src", "style"],
    childList: true,
    subtree: true,
  });

  // timeout safety net (e.g. if never loads after 12 seconds)
  setTimeout(() => {
    if (observer.takeRecords().length === 0) {
      // no recent changes
      observer.disconnect();
    }
  }, 12000);
}

// ────────────────────────────────────────────────
// Helpers (from earlier suggestions – keep these)
// ────────────────────────────────────────────────
function cleanAvatarUrl(url) {
  if (!url) return null;
  try {
    let cleaned = url.replace(/_normal\.(jpg|png|jpeg|webp)$/i, ".$1");

    new URL(cleaned); // validate
    return cleaned;
  } catch {
    return null;
  }
}

function isPlaceholderSrc(src) {
  if (!src || src === "about:blank") return true;
  return (
    src.startsWith("data:image/") ||
    src.includes("abs.twimg.com") ||
    src.includes("placeholder") ||
    src.endsWith(".svg") ||
    (src.includes("profile_images") && src.includes("_mini"))
  );
}

TweetObserver.start(detectBlockedTweet);

console.log("[BlockTracker] running");

// Check if current URL is a conversation search
function isConversationSearch() {
  const url = window.location.href;

  return (
    url.includes("/search") &&
    url.includes("from%3A") &&
    url.includes("to%3A") &&
    url.includes("OR")
  );
}

// Extract usernames from search URL
function getUsersFromSearch() {
  const url = decodeURIComponent(window.location.href);

  const match = url.match(/from:(\w+)\s+to:(\w+)/);
  if (!match) return null;

  return {
    user1: match[1],
    user2: match[2],
  };
}

// Get first tweet ID from DOM
function getFirstTweetId() {
  const link = document.querySelector('a[href*="/status/"]');
  if (!link) return null;

  const match = link.getAttribute("href").match(/status\/(\d+)/);
  return match ? match[1] : null;
}

// Save to api.storage
function saveInteraction(blockerUsername, tweetId) {
  api.storage.local.get({ bloxInteractions: {} }, (result) => {
    const data = result.bloxInteractions;

    // Avoid overwriting if already exists
    if (data[blockerUsername] === tweetId) return;

    data[blockerUsername] = tweetId;

    api.storage.local.set({ bloxInteractions: data }, () => {
      Toast.success(`Last Tweet With @${blockerUsername} Saved`);
      console.log("Saved interaction:", blockerUsername, tweetId);
    });
  });
}

// Main capture logic
function captureInteraction() {
  if (!isConversationSearch()) return;

  const users = getUsersFromSearch();
  if (!users) return;

  const tweetId = getFirstTweetId();
  if (!tweetId) return;

  // Determine the OTHER user (blocker)
  const blocker = users.user1 === extUserName ? users.user2 : users.user1;

  saveInteraction(blocker, tweetId);
}

// Wait for tweets to load (X is dynamic)
function waitForTweetAndCapture() {
  let attempts = 0;

  const interval = setInterval(() => {
    const tweetId = getFirstTweetId();

    if (tweetId) {
      clearInterval(interval);
      captureInteraction();
    }

    if (++attempts > 20) clearInterval(interval); // ~10 seconds max
  }, 500);
}

// Detect navigation changes (SPA)
let lastUrl = location.href;

setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    console.log("URL changed:", lastUrl);

    waitForTweetAndCapture();
  }
}, 1000);

// Run once on load
waitForTweetAndCapture();
