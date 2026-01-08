// Nuclear Mode - Simple Website Blocker
// Blocks all sites except whitelisted ones

// Hardcoded whitelist (can be made dynamic later)
const WHITELIST = [
  'google.com',
  'github.com',
  'stackoverflow.com',
  'youtube.com'
];

// Track if Nuclear Mode is active
let isNuclearModeActive = false;

// Get the blocked page URL
const BLOCKED_PAGE_URL = chrome.runtime.getURL('nuclear-blocked.html');

/**
 * Check if a URL should be allowed
 * @param {string} url - The URL to check
 * @returns {boolean} - True if allowed, false if blocked
 */
function isUrlAllowed(url) {
  try {
    // Always allow Chrome internal pages
    if (url.startsWith('chrome://') || 
        url.startsWith('about:') || 
        url.startsWith('edge://') ||
        url.startsWith('chrome-extension://')) {
      return true;
    }

    // Always allow the blocked page itself to prevent infinite loops
    if (url.includes('nuclear-blocked.html')) {
      return true;
    }

    // If Nuclear Mode is not active, allow everything
    if (!isNuclearModeActive) {
      return true;
    }

    // Parse the URL to get the hostname
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '').toLowerCase();

    // Check if hostname is in whitelist
    for (const whitelistedSite of WHITELIST) {
      const cleanSite = whitelistedSite.toLowerCase().trim();
      if (hostname === cleanSite || hostname.endsWith('.' + cleanSite)) {
        console.log('✅ ALLOWED:', hostname);
        return true;
      }
    }

    console.log('🚫 BLOCKED:', hostname);
    return false;
  } catch (error) {
    console.error('Error checking URL:', error);
    return true; // Allow on error to be safe
  }
}

/**
 * Handle tab updates - check and block if needed
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only check when URL changes and page is loading
  if (changeInfo.url && isNuclearModeActive) {
    const url = changeInfo.url;
    
    if (!isUrlAllowed(url)) {
      // Block the site by redirecting to blocked page
      const blockedPageUrl = `${BLOCKED_PAGE_URL}?blocked=${encodeURIComponent(url)}`;
      chrome.tabs.update(tabId, { url: blockedPageUrl });
      console.log('Redirected to blocked page:', url);
    }
  }
});

/**
 * Listen for messages from popup to toggle Nuclear Mode
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOGGLE_NUCLEAR_MODE') {
    isNuclearModeActive = message.isActive;
    console.log('Nuclear Mode:', isNuclearModeActive ? 'ACTIVATED' : 'DEACTIVATED');
    
    // If activating, check all currently open tabs
    if (isNuclearModeActive) {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.url && !isUrlAllowed(tab.url)) {
            const blockedPageUrl = `${BLOCKED_PAGE_URL}?blocked=${encodeURIComponent(tab.url)}`;
            chrome.tabs.update(tab.id, { url: blockedPageUrl });
          }
        });
      });
    }
    
    sendResponse({ success: true });
  }
  
  if (message.type === 'GET_NUCLEAR_MODE_STATUS') {
    sendResponse({ isActive: isNuclearModeActive, whitelist: WHITELIST });
  }
  
  return true;
});

console.log('Nuclear Mode background script loaded');
