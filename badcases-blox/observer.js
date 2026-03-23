const TweetObserver = {
  start(handler) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue;

          if (node.matches?.("article")) {
            handler(node);
          }

          const tweets = node.querySelectorAll?.("article");
          tweets?.forEach(handler);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  },
};
