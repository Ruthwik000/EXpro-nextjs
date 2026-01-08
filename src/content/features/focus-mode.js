// Focus Mode - Remove YouTube distractions for focused learning
export function initFocusMode() {
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  
  if (!window.location.hostname.includes('youtube.com')) {
    return { cleanup: () => {} };
  }

  console.log('Focus Mode initialized for YouTube');

  let extensionEnabled = true;
  let showComments = false;
  let showDescription = true;
  let blockShorts = true;

  // Load saved preferences
  browserAPI.storage.sync.get(['focusModeSettings'], (result) => {
    if (result.focusModeSettings) {
      extensionEnabled = result.focusModeSettings.extensionEnabled !== false;
      showComments = result.focusModeSettings.showComments || false;
      showDescription = result.focusModeSettings.showDescription !== false;
      blockShorts = result.focusModeSettings.blockShorts !== false;
      applyFocusMode();
      updatePanelUI();
    }
  });

  // CSS to hide distracting elements
  const style = document.createElement('style');
  style.id = 'focus-mode-style';
  style.textContent = `
    /* Focus Mode Control Panel */
    .focus-mode-panel {
      position: fixed;
      top: 80px;
      right: 20px;
      width: 340px;
      background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
      border: 1px solid #374151;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #F3F4F6;
      overflow: hidden;
      resize: both;
      min-width: 300px;
      min-height: 280px;
    }

    .focus-mode-header {
      background: linear-gradient(135deg, #374151 0%, #1F2937 100%);
      padding: 14px 16px;
      cursor: move;
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid #374151;
      user-select: none;
    }

    .focus-mode-logo {
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .focus-mode-title {
      font-size: 15px;
      font-weight: 600;
      flex: 1;
      color: #F9FAFB;
    }

    .focus-mode-close {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: transparent;
      border: none;
      color: #9CA3AF;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      transition: all 0.2s;
    }

    .focus-mode-close:hover {
      background: rgba(239, 68, 68, 0.1);
      color: #EF4444;
    }

    .focus-mode-content {
      padding: 16px;
    }

    .focus-mode-toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #374151;
    }

    .focus-mode-toggle-row:last-child {
      border-bottom: none;
    }

    .focus-mode-toggle-label {
      font-size: 14px;
      color: #E5E7EB;
      font-weight: 500;
    }

    .focus-mode-toggle-switch {
      position: relative;
      width: 48px;
      height: 26px;
      background: #4B5563;
      border-radius: 13px;
      cursor: pointer;
      transition: background 0.3s;
    }

    .focus-mode-toggle-switch.active {
      background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
    }

    .focus-mode-toggle-knob {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      transition: transform 0.3s;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .focus-mode-toggle-switch.active .focus-mode-toggle-knob {
      transform: translateX(22px);
    }

    .focus-mode-footer {
      padding: 12px 16px;
      border-top: 1px solid #374151;
      display: flex;
      gap: 8px;
      font-size: 11px;
      color: #9CA3AF;
      background: rgba(0, 0, 0, 0.2);
    }

    .focus-mode-footer a {
      color: #60A5FA;
      text-decoration: none;
      transition: color 0.2s;
    }

    .focus-mode-footer a:hover {
      color: #93C5FD;
      text-decoration: underline;
    }

    /* When extension is disabled */
    body.focus-mode-disabled .focus-mode-hide-element {
      display: block !important;
    }

    /* Hide homepage feed - show only search */
    body:not(.focus-mode-disabled) ytd-browse[page-subtype="home"] #contents,
    body:not(.focus-mode-disabled) ytd-browse[page-subtype="home"] ytd-two-column-browse-results-renderer {
      display: none !important;
    }

    /* Hide sidebar recommendations on video pages */
    body:not(.focus-mode-disabled) #related,
    body:not(.focus-mode-disabled) #secondary,
    body:not(.focus-mode-disabled) #secondary-inner,
    body:not(.focus-mode-disabled) ytd-watch-next-secondary-results-renderer {
      display: none !important;
    }

    /* Hide comments by default */
    body:not(.focus-mode-disabled):not(.focus-mode-show-comments) #comments,
    body:not(.focus-mode-disabled):not(.focus-mode-show-comments) ytd-comments {
      display: none !important;
    }

    /* When comments are enabled */
    body.focus-mode-show-comments #comments,
    body.focus-mode-show-comments ytd-comments {
      display: block !important;
    }

    /* When description is hidden */
    body:not(.focus-mode-disabled).focus-mode-hide-description #description,
    body:not(.focus-mode-disabled).focus-mode-hide-description ytd-video-secondary-info-renderer,
    body:not(.focus-mode-disabled).focus-mode-hide-description #description-inline-expander {
      display: none !important;
    }

    /* Block Shorts - Hide all shorts content */
    body:not(.focus-mode-disabled).focus-mode-block-shorts ytd-reel-shelf-renderer,
    body:not(.focus-mode-disabled).focus-mode-block-shorts ytd-rich-shelf-renderer[is-shorts],
    body:not(.focus-mode-disabled).focus-mode-block-shorts [is-shorts],
    body:not(.focus-mode-disabled).focus-mode-block-shorts ytd-guide-entry-renderer:has([title="Shorts"]),
    body:not(.focus-mode-disabled).focus-mode-block-shorts ytd-mini-guide-entry-renderer:has([aria-label="Shorts"]),
    body:not(.focus-mode-disabled).focus-mode-block-shorts a[href^="/shorts"],
    body:not(.focus-mode-disabled).focus-mode-block-shorts ytd-rich-item-renderer:has(a[href^="/shorts"]),
    body:not(.focus-mode-disabled).focus-mode-block-shorts ytd-video-renderer:has(a[href^="/shorts"]),
    body:not(.focus-mode-disabled).focus-mode-block-shorts ytd-grid-video-renderer:has(a[href^="/shorts"]),
    body:not(.focus-mode-disabled).focus-mode-block-shorts ytd-compact-video-renderer:has(a[href^="/shorts"]),
    body:not(.focus-mode-disabled).focus-mode-block-shorts #shorts-container,
    body:not(.focus-mode-disabled).focus-mode-block-shorts ytd-reel-video-renderer {
      display: none !important;
    }

    /* Hide Shorts tab in channel pages */
    body:not(.focus-mode-disabled).focus-mode-block-shorts tp-yt-paper-tab:has([tab-title="Shorts"]),
    body:not(.focus-mode-disabled).focus-mode-block-shorts yt-tab-shape:has([tab-title="Shorts"]) {
      display: none !important;
    }

    /* Block navigation to Shorts */
    body:not(.focus-mode-disabled).focus-mode-block-shorts [href*="/shorts/"],
    body:not(.focus-mode-disabled).focus-mode-block-shorts [href*="youtube.com/shorts"] {
      pointer-events: none !important;
      opacity: 0 !important;
      display: none !important;
    }

    /* Hide end screen recommendations */
    body:not(.focus-mode-disabled) .ytp-ce-element,
    body:not(.focus-mode-disabled) .ytp-endscreen-content,
    body:not(.focus-mode-disabled) .ytp-suggestion-set {
      display: none !important;
    }

    /* Expand video player to full width */
    body:not(.focus-mode-disabled) ytd-watch-flexy[flexy] #primary {
      max-width: 100% !important;
    }

    /* Clean search results - remove ads */
    body:not(.focus-mode-disabled) ytd-search-pyv-renderer,
    body:not(.focus-mode-disabled) ytd-ad-slot-renderer {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

  // Create focus mode control panel
  const panel = document.createElement('div');
  panel.className = 'focus-mode-panel';
  panel.innerHTML = `
    <div class="focus-mode-header">
      <div class="focus-mode-logo">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
        </svg>
      </div>
      <div class="focus-mode-title">YouTube Focus Mode</div>
      <button class="focus-mode-close" title="Close panel">×</button>
    </div>
    <div class="focus-mode-content">
      <div class="focus-mode-toggle-row">
        <div class="focus-mode-toggle-label">Extension enabled</div>
        <div class="focus-mode-toggle-switch ${extensionEnabled ? 'active' : ''}" data-toggle="extension">
          <div class="focus-mode-toggle-knob"></div>
        </div>
      </div>
      <div class="focus-mode-toggle-row">
        <div class="focus-mode-toggle-label">Comments</div>
        <div class="focus-mode-toggle-switch ${showComments ? 'active' : ''}" data-toggle="comments">
          <div class="focus-mode-toggle-knob"></div>
        </div>
      </div>
      <div class="focus-mode-toggle-row">
        <div class="focus-mode-toggle-label">Description</div>
        <div class="focus-mode-toggle-switch ${showDescription ? 'active' : ''}" data-toggle="description">
          <div class="focus-mode-toggle-knob"></div>
        </div>
      </div>
      <div class="focus-mode-toggle-row">
        <div class="focus-mode-toggle-label">Block Shorts</div>
        <div class="focus-mode-toggle-switch ${blockShorts ? 'active' : ''}" data-toggle="shorts">
          <div class="focus-mode-toggle-knob"></div>
        </div>
      </div>
    </div>
    <div class="focus-mode-footer">
      <a href="https://github.com/makaroni4/focused_youtube" target="_blank">Source code</a>
    </div>
  `;
  document.body.appendChild(panel);

  // Make panel draggable
  let isDragging = false;
  let currentX, currentY, initialX, initialY;

  const header = panel.querySelector('.focus-mode-header');
  header.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    if (e.target.closest('.focus-mode-close')) return;
    initialX = e.clientX - panel.offsetLeft;
    initialY = e.clientY - panel.offsetTop;
    isDragging = true;
    panel.style.cursor = 'grabbing';
  }

  function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;
    panel.style.left = currentX + 'px';
    panel.style.top = currentY + 'px';
    panel.style.right = 'auto';
  }

  function dragEnd() {
    isDragging = false;
    panel.style.cursor = 'default';
  }

  // Close button
  panel.querySelector('.focus-mode-close').addEventListener('click', () => {
    panel.remove();
    browserAPI.storage.sync.set({ focusMode: false });
  });

  // Toggle switches
  panel.querySelectorAll('.focus-mode-toggle-switch').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const type = toggle.dataset.toggle;
      const isActive = toggle.classList.contains('active');
      
      if (type === 'extension') {
        extensionEnabled = !isActive;
        toggle.classList.toggle('active');
      } else if (type === 'comments') {
        showComments = !isActive;
        toggle.classList.toggle('active');
      } else if (type === 'description') {
        showDescription = !isActive;
        toggle.classList.toggle('active');
      } else if (type === 'shorts') {
        blockShorts = !isActive;
        toggle.classList.toggle('active');
      }

      applyFocusMode();
      saveSettings();
    });
  });

  // Update panel UI
  function updatePanelUI() {
    const extensionToggle = panel.querySelector('[data-toggle="extension"]');
    const commentsToggle = panel.querySelector('[data-toggle="comments"]');
    const descriptionToggle = panel.querySelector('[data-toggle="description"]');
    const shortsToggle = panel.querySelector('[data-toggle="shorts"]');

    if (extensionToggle) {
      extensionToggle.classList.toggle('active', extensionEnabled);
    }
    if (commentsToggle) {
      commentsToggle.classList.toggle('active', showComments);
    }
    if (descriptionToggle) {
      descriptionToggle.classList.toggle('active', showDescription);
    }
    if (shortsToggle) {
      shortsToggle.classList.toggle('active', blockShorts);
    }
  }

  // Save settings
  function saveSettings() {
    browserAPI.storage.sync.set({
      focusModeSettings: {
        extensionEnabled,
        showComments,
        showDescription,
        blockShorts
      }
    });
  }

  // Apply focus mode settings
  function applyFocusMode() {
    // Toggle extension
    if (!extensionEnabled) {
      document.body.classList.add('focus-mode-disabled');
    } else {
      document.body.classList.remove('focus-mode-disabled');
    }

    // Toggle comments
    if (showComments) {
      document.body.classList.add('focus-mode-show-comments');
    } else {
      document.body.classList.remove('focus-mode-show-comments');
    }

    // Toggle description
    if (!showDescription) {
      document.body.classList.add('focus-mode-hide-description');
    } else {
      document.body.classList.remove('focus-mode-hide-description');
    }

    // Toggle shorts blocking
    if (blockShorts) {
      document.body.classList.add('focus-mode-block-shorts');
    } else {
      document.body.classList.remove('focus-mode-block-shorts');
    }

    // Remove distracting elements
    if (extensionEnabled) {
      removeDistractingElements();
    }
  }

  // Remove distracting elements from DOM
  function removeDistractingElements() {
    if (!extensionEnabled) return;

    // Block Shorts if enabled
    if (blockShorts) {
      // Redirect if on shorts page
      if (window.location.pathname.includes('/shorts/')) {
        window.location.href = 'https://www.youtube.com/';
        return;
      }

      // Remove all shorts elements
      const shortsElements = document.querySelectorAll(`
        ytd-reel-shelf-renderer,
        ytd-rich-shelf-renderer[is-shorts],
        [is-shorts],
        ytd-guide-entry-renderer:has([title="Shorts"]),
        ytd-mini-guide-entry-renderer:has([aria-label="Shorts"]),
        a[href^="/shorts"],
        ytd-rich-item-renderer:has(a[href^="/shorts"]),
        ytd-video-renderer:has(a[href^="/shorts"]),
        ytd-grid-video-renderer:has(a[href^="/shorts"]),
        ytd-compact-video-renderer:has(a[href^="/shorts"]),
        #shorts-container,
        ytd-reel-video-renderer,
        tp-yt-paper-tab:has([tab-title="Shorts"]),
        yt-tab-shape:has([tab-title="Shorts"])
      `);
      shortsElements.forEach(el => el.remove());

      // Block navigation to shorts
      document.querySelectorAll('a[href*="/shorts/"], a[href*="youtube.com/shorts"]').forEach(link => {
        link.style.display = 'none';
        link.style.pointerEvents = 'none';
      });
    }

    // Remove end screen elements
    const endScreens = document.querySelectorAll('.ytp-ce-element, .ytp-endscreen-content');
    endScreens.forEach(el => el.remove());

    // Disable autoplay
    const video = document.querySelector('video');
    if (video) {
      const player = document.querySelector('.html5-video-player');
      if (player && player.setAutonavState) {
        player.setAutonavState(false);
      }
    }
  }

  // Run periodically to catch dynamically loaded content
  const cleanupInterval = setInterval(removeDistractingElements, 1000);

  // Observer for dynamic content
  const observer = new MutationObserver(() => {
    removeDistractingElements();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Listen for YouTube navigation
  document.addEventListener('yt-navigate-finish', () => {
    applyFocusMode();
    removeDistractingElements();
  });

  // Run on load
  applyFocusMode();

  console.log('Focus Mode panel active');

  return {
    cleanup: () => {
      style.remove();
      panel.remove();
      clearInterval(cleanupInterval);
      observer.disconnect();
      document.body.classList.remove('focus-mode-disabled', 'focus-mode-show-comments', 'focus-mode-hide-description', 'focus-mode-no-infinite-scroll');
      console.log('Focus Mode disabled');
    }
  };
}
