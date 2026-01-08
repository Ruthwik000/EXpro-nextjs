// Background Service Worker

// ============================================
// HANDLERS - Inlined
// ============================================
async function clearCache() {
  try {
    await chrome.browsingData.remove({
      since: 0
    }, {
      cache: true,
      localStorage: true,
      sessionStorage: true
    });
    
    console.log('Cache cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
}

async function handleAdBlocker(enabled) {
  try {
    const rulesetIds = ['adblock_rules'];
    
    if (enabled) {
      const enabledRulesets = await chrome.declarativeNetRequest.getEnabledRulesets();
      console.log('Currently enabled rulesets:', enabledRulesets);
      
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: rulesetIds
      });
      
      const newEnabledRulesets = await chrome.declarativeNetRequest.getEnabledRulesets();
      console.log('Ad blocker enabled. New enabled rulesets:', newEnabledRulesets);
      
      const rules = await chrome.declarativeNetRequest.getDynamicRules();
      console.log('Current dynamic rules:', rules);
    } else {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: rulesetIds
      });
      console.log('Ad blocker disabled');
    }
  } catch (error) {
    console.error('Error toggling ad blocker:', error);
    console.error('Error details:', error.message, error.stack);
  }
}

// ============================================
// NUCLEAR MODE - Simple Implementation
// ============================================
let WHITELIST = ['google.com', 'github.com', 'stackoverflow.com', 'youtube.com'];
let isNuclearModeActive = false;

// Load whitelist from storage on startup
chrome.storage.local.get(['nuclearWhitelist', 'nuclearModeActive'], (result) => {
  if (result.nuclearWhitelist) {
    WHITELIST = result.nuclearWhitelist;
  }
  if (result.nuclearModeActive !== undefined) {
    isNuclearModeActive = result.nuclearModeActive;
  }
  console.log('Nuclear Mode loaded:', { isActive: isNuclearModeActive, whitelist: WHITELIST });
});

function isUrlAllowed(url) {
  try {
    if (url.startsWith('chrome://') || url.startsWith('about:') || 
        url.startsWith('edge://') || url.startsWith('chrome-extension://')) {
      return true;
    }
    if (url.includes('nuclear-blocked-simple.html')) {
      return true;
    }
    if (!isNuclearModeActive) {
      return true;
    }
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '').toLowerCase();
    for (const site of WHITELIST) {
      const cleanSite = site.toLowerCase().trim();
      if (hostname === cleanSite || hostname.endsWith('.' + cleanSite)) {
        console.log('✅ ALLOWED:', hostname);
        return true;
      }
    }
    console.log('🚫 BLOCKED:', hostname);
    return false;
  } catch (error) {
    return true;
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && isNuclearModeActive) {
    const url = changeInfo.url;
    if (!isUrlAllowed(url)) {
      const blockedPageUrl = chrome.runtime.getURL('nuclear-blocked-simple.html') + '?blocked=' + encodeURIComponent(url);
      chrome.tabs.update(tabId, { url: blockedPageUrl });
      console.log('🚫 Blocked:', url);
    }
  }
});

// ============================================
// FOCUS DETECTION - State and Constants
// ============================================
let isDetecting = false;
let detectionInterval = null;
const API_KEY = 'dnJH9C8BFgg1vaBXQaz1';
const API_URL = 'https://serverless.roboflow.com/mobile-phone-detection-2vads/1';
const DETECTION_INTERVAL = 2000;

// Initialize on install/startup
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed/updated');
  
  // Load saved toggle states and apply them
  const result = await chrome.storage.sync.get(['toggles']);
  if (result.toggles && result.toggles.adBlocker) {
    await handleAdBlocker(true);
  }
});

// Also check on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('Browser started');
  
  // Load saved toggle states and apply them
  const result = await chrome.storage.sync.get(['toggles']);
  if (result.toggles && result.toggles.adBlocker) {
    await handleAdBlocker(true);
  }
});

// Listen for toggle changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Focus Detection Messages
  if (message.action === 'startDetection') {
    console.log('Background: Received startDetection');
    startDetection();
    sendResponse({ success: true, isDetecting: true });
    return true;
  }
  
  if (message.action === 'stopDetection') {
    console.log('Background: Received stopDetection');
    stopDetection();
    sendResponse({ success: true, isDetecting: false });
    return true;
  }
  
  if (message.action === 'getStatus') {
    sendResponse({ isDetecting });
    return true;
  }
  
  if (message.action === 'captureFrame') {
    // Forward to offscreen document
    chrome.runtime.sendMessage(message).then(sendResponse);
    return true;
  }

  // Other Messages
  if (message.type === 'TOGGLE_CHANGED') {
    handleToggleChange(message.key, message.value);
    sendResponse({ success: true });
  }
  
  // Nuclear Mode messages
  if (message.type === 'TOGGLE_NUCLEAR_MODE') {
    isNuclearModeActive = message.isActive;
    chrome.storage.local.set({ nuclearModeActive: isNuclearModeActive });
    console.log('Nuclear Mode:', isNuclearModeActive ? 'ACTIVATED ✅' : 'DEACTIVATED ❌');
    
    if (isNuclearModeActive) {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.url && !isUrlAllowed(tab.url)) {
            const blockedPageUrl = chrome.runtime.getURL('nuclear-blocked-simple.html') + '?blocked=' + encodeURIComponent(tab.url);
            chrome.tabs.update(tab.id, { url: blockedPageUrl });
          }
        });
      });
    }
    sendResponse({ success: true });
    return true;
  }
  
  if (message.type === 'GET_NUCLEAR_MODE_STATUS') {
    sendResponse({ isActive: isNuclearModeActive, whitelist: WHITELIST });
    return true;
  }
  
  if (message.type === 'UPDATE_WHITELIST') {
    WHITELIST = message.whitelist;
    chrome.storage.local.set({ nuclearWhitelist: WHITELIST });
    console.log('Whitelist updated:', WHITELIST);
    sendResponse({ success: true });
    return true;
  }
  
  if (message.type === 'CLEAR_CACHE') {
    clearCache().then(() => {
      sendResponse({ success: true });
    });
    return true; // Keep channel open for async response
  }

  // Nuclear Mode coordination
  if (message.type === 'NUCLEAR_MODE_CHECK') {
    chrome.storage.local.get(['nuclearMode'], (result) => {
      sendResponse({ nuclearMode: result.nuclearMode || null });
    });
    return true;
  }

  if (message.type === 'NUCLEAR_MODE_UPDATE') {
    chrome.storage.local.set({ nuclearMode: message.data }, async () => {
      // Update declarativeNetRequest rules for Nuclear Mode
      if (message.data.isActive && message.data.whitelist) {
        // Create blocking rules for all non-whitelisted domains
        // We'll use a redirect rule to our blocked page
        const rules = [{
          id: 999999,
          priority: 1,
          action: {
            type: 'redirect',
            redirect: {
              url: chrome.runtime.getURL('nuclear-blocked.html')
            }
          },
          condition: {
            urlFilter: '*',
            resourceTypes: ['main_frame'],
            excludedInitiatorDomains: message.data.whitelist.map(site => 
              site.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')
            )
          }
        }];
        
        try {
          // Remove old rules
          const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
          const ruleIdsToRemove = existingRules.map(rule => rule.id);
          
          await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: ruleIdsToRemove,
            addRules: rules
          });
          
          console.log('Nuclear Mode DNR rules updated:', rules);
        } catch (err) {
          console.error('Failed to update DNR rules:', err);
        }
      } else {
        // Deactivating - remove all dynamic rules
        try {
          const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
          const ruleIdsToRemove = existingRules.map(rule => rule.id);
          
          await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: ruleIdsToRemove
          });
          
          console.log('Nuclear Mode DNR rules removed');
        } catch (err) {
          console.error('Failed to remove DNR rules:', err);
        }
      }
      
      // If activating Nuclear Mode, check all open tabs
      if (message.data.isActive) {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('about:') && !tab.url.startsWith('data:') && !tab.url.includes('nuclear-blocked.html')) {
              try {
                const url = new URL(tab.url);
                const domain = url.hostname.replace(/^www\./, '');
                
                // Check if whitelisted - SAME LOGIC AS NAVIGATION LISTENER
                const whitelistArray = Array.isArray(message.data.whitelist) ? message.data.whitelist : [];
                
                let isWhitelisted = false;
                for (let i = 0; i < whitelistArray.length; i++) {
                  const site = whitelistArray[i];
                  const cleanSite = String(site).toLowerCase().trim();
                  const cleanDomain = domain.toLowerCase().trim();
                  
                  if (cleanDomain === cleanSite || cleanDomain.includes(cleanSite) || cleanSite.includes(cleanDomain)) {
                    isWhitelisted = true;
                    console.log('✅ Existing tab is whitelisted:', domain);
                    break;
                  }
                }
                
                // Block if not whitelisted
                if (!isWhitelisted) {
                  console.log('🚫 Blocking existing tab:', tab.url);
                  chrome.tabs.update(tab.id, {
                    url: chrome.runtime.getURL('nuclear-blocked.html') + '?blocked=' + encodeURIComponent(tab.url)
                  });
                } else {
                  console.log('✅ Allowing existing tab:', tab.url);
                }
              } catch (err) {
                console.error('Error checking tab:', err);
              }
            }
          });
        });
      }
      
      // Notify all tabs about Nuclear Mode change
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            type: 'NUCLEAR_MODE_UPDATED',
            data: message.data
          }).catch(() => {});
        });
      });
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'GET_COOKIES') {
    chrome.cookies.getAll({ url: message.url }, (cookies) => {
      sendResponse({ cookies });
    });
    return true;
  }

  if (message.type === 'SET_COOKIE') {
    const cookieDetails = {
      url: message.url,
      name: message.cookie.name,
      value: message.cookie.value,
      domain: message.cookie.domain,
      path: message.cookie.path || '/',
      secure: message.cookie.secure || false,
      httpOnly: message.cookie.httpOnly || false,
      sameSite: message.cookie.sameSite || 'no_restriction'
    };

    if (message.cookie.expirationDate) {
      cookieDetails.expirationDate = message.cookie.expirationDate;
    }

    chrome.cookies.set(cookieDetails, (cookie) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, cookie });
      }
    });
    return true;
  }

  if (message.type === 'REMOVE_COOKIE') {
    const url = message.url;
    const name = message.name;
    const domain = message.domain;
    
    chrome.cookies.remove({ url, name }, () => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true });
      }
    });
    return true;
  }

  if (message.type === 'DELETE_ALL_COOKIES') {
    chrome.cookies.getAll({ url: message.url }, (cookies) => {
      let removed = 0;
      cookies.forEach(cookie => {
        chrome.cookies.remove({
          url: message.url,
          name: cookie.name
        }, () => {
          removed++;
          if (removed === cookies.length) {
            sendResponse({ success: true });
          }
        });
      });
      if (cookies.length === 0) {
        sendResponse({ success: true });
      }
    });
    return true;
  }
});

// Handle toggle state changes
async function handleToggleChange(key, value) {
  console.log(`Toggle changed: ${key} = ${value}`);
  
  // Ad Blocker toggle
  if (key === 'adBlocker') {
    await handleAdBlocker(value);
  }

  // Notify all tabs about toggle change
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    chrome.tabs.sendMessage(tab.id, {
      type: 'TOGGLE_UPDATE',
      key,
      value
    }).catch(() => {
      // Tab might not have content script loaded
    });
  });
}

// Integration hooks for teammate agents
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // GitHub Agent Hook
  if (message.type === 'GITHUB_AGENT_ACTION') {
    // Placeholder: GitHub agent will implement this
    console.log('GitHub Agent hook triggered');
    sendResponse({ status: 'pending_integration' });
  }

  // AWS Agent Hook
  if (message.type === 'AWS_AGENT_ACTION') {
    // Placeholder: AWS agent will implement this
    console.log('AWS Agent hook triggered');
    sendResponse({ status: 'pending_integration' });
  }

  // Learning Agent Hook
  if (message.type === 'LEARNING_AGENT_ACTION') {
    // Placeholder: Learning agent will implement this
    console.log('Learning Agent hook triggered');
    sendResponse({ status: 'pending_integration' });
  }
});

console.log('Background service worker loaded');

// ============================================
// FOCUS DETECTION - Background Processing
// ============================================
async function startDetection() {
  if (isDetecting) return;
  
  console.log('Starting detection...');
  isDetecting = true;
  
  // Create offscreen document for camera
  try {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['USER_MEDIA'],
      justification: 'Camera access for mobile phone detection'
    });
  } catch (error) {
    if (!error.message.includes('Only a single offscreen')) {
      console.error('Error creating offscreen document:', error);
    }
  }
  
  // Wait for camera to initialize
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Start detection loop
  detectionInterval = setInterval(async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'captureFrame' });
      if (response && response.imageData) {
        await detectMobilePhone(response.imageData);
      }
    } catch (error) {
      console.error('Detection loop error:', error);
    }
  }, DETECTION_INTERVAL);
  
  console.log('Focus detection started in background');
}

function stopDetection() {
  console.log('Stopping detection...');
  isDetecting = false;
  
  if (detectionInterval) {
    clearInterval(detectionInterval);
    detectionInterval = null;
  }
  
  chrome.offscreen.closeDocument().catch(() => {});
  
  console.log('Focus detection stopped');
}

async function detectMobilePhone(imageBase64) {
  try {
    const response = await fetch(`${API_URL}?api_key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: imageBase64
    });
    
    const data = await response.json();
    console.log('API Response:', data);
    
    if (data.predictions && data.predictions.length > 0) {
      // Show alert on active tab
      try {
        const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (tabs[0]) {
          await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
              alert('⚠️ DISTRACTED! Mobile phone detected. Please stay focused!');
            }
          });
        }
      } catch (error) {
        console.error('Error showing alert:', error);
      }
      
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        title: 'Focus Alert!',
        message: `${data.predictions.length} mobile phone(s) detected!`
      });
      
      // Notify popup if open
      chrome.runtime.sendMessage({
        action: 'detectionResult',
        predictions: data.predictions
      }).catch(() => {});
    }
  } catch (error) {
    console.error('Detection error:', error);
  }
}

// Nuclear Mode: Block navigation to non-whitelisted sites
// NOTE: onBeforeNavigate cannot actually block navigation in MV3
// We rely on checking tabs when Nuclear Mode is activated instead
/*
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  console.log('🔥 onBeforeNavigate fired for:', details.url, 'frameId:', details.frameId);
  
  if (details.frameId !== 0) return; // Only main frame
  
  // Skip data URLs and extension pages to avoid infinite loops
  if (details.url.startsWith('data:') || 
      details.url.startsWith('chrome://') ||
      details.url.startsWith('about:') ||
      details.url.startsWith('chrome-extension://') ||
      details.url.includes('nuclear-blocked.html')) {
    console.log('✅ Skipping system/extension URL');
    return;
  }

  const result = await chrome.storage.local.get(['nuclearMode']);
  const nuclearMode = result.nuclearMode;
  
  console.log('Nuclear Mode check (onCommitted):', { 
    isActive: nuclearMode?.isActive, 
    url: details.url,
    whitelist: nuclearMode?.whitelist,
    whitelistType: typeof nuclearMode?.whitelist,
    whitelistIsArray: Array.isArray(nuclearMode?.whitelist),
    whitelistLength: nuclearMode?.whitelist?.length
  });
  
  if (!nuclearMode || !nuclearMode.isActive || !nuclearMode.timerEndTime) {
    return;
  }

  // Check if timer expired
  if (Date.now() > nuclearMode.timerEndTime) {
    // Auto-disable nuclear mode
    chrome.storage.local.set({ 
      nuclearMode: { ...nuclearMode, isActive: false, timerEndTime: null } 
    });
    return;
  }

  try {
    const url = new URL(details.url);
    const domain = url.hostname.replace(/^www\./, '');

    // Allow chrome://, about:, extension pages
    if (url.protocol.startsWith('chrome') || 
        url.protocol.startsWith('about') || 
        url.protocol.startsWith('moz-extension') ||
        url.protocol.startsWith('chrome-extension')) {
      console.log('Allowing system URL:', details.url);
      return;
    }

    // Check if domain is whitelisted - SIMPLE VERSION
    const whitelistArray = Array.isArray(nuclearMode.whitelist) ? nuclearMode.whitelist : [];
    
    console.log('=== NUCLEAR MODE CHECK ===');
    console.log('Site name:', domain);
    console.log('Whitelist array:', JSON.stringify(whitelistArray));
    console.log('Whitelist raw:', whitelistArray);
    
    let isWhitelisted = false;
    for (let i = 0; i < whitelistArray.length; i++) {
      const site = whitelistArray[i];
      const cleanSite = String(site).toLowerCase().trim();
      const cleanDomain = domain.toLowerCase().trim();
      
      console.log(`[${i}] Comparing: "${cleanDomain}" with whitelist entry: "${cleanSite}"`);
      console.log(`[${i}] Site type:`, typeof site, 'Value:', site);
      
      if (cleanDomain === cleanSite || cleanDomain.includes(cleanSite) || cleanSite.includes(cleanDomain)) {
        isWhitelisted = true;
        console.log(`✅ MATCH FOUND! "${cleanDomain}" matches "${cleanSite}"`);
        break;
      } else {
        console.log(`❌ No match: "${cleanDomain}" vs "${cleanSite}"`);
      }
    }
    
    console.log('Site name:', domain);
    console.log('Whitelisted?', isWhitelisted ? 'YES' : 'NO');
    console.log('Blocked-html shown:', !isWhitelisted ? 'TRUE' : 'FALSE');
    console.log('=========================');

    // Block if not whitelisted
    if (!isWhitelisted) {
      console.log('BLOCKING:', details.url);
      
      // Calculate remaining time
      const remaining = Math.max(0, nuclearMode.timerEndTime - Date.now());
      const totalSeconds = Math.floor(remaining / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      let timeStr = '';
      if (hours > 0) {
        timeStr = `${hours}h ${minutes}m ${seconds}s`;
      } else {
        timeStr = `${minutes}m ${seconds}s`;
      }

      // Create blocked page HTML
      const blockedHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site Blocked - Nuclear Mode</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 600px;
      animation: fadeIn 0.5s ease-in;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .icon {
      font-size: 80px;
      margin-bottom: 20px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    h1 {
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 16px;
      background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .subtitle {
      font-size: 20px;
      color: #9CA3AF;
      margin-bottom: 32px;
      font-weight: 500;
    }
    .message {
      background: rgba(239, 68, 68, 0.1);
      border: 2px solid #DC2626;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .message p {
      font-size: 16px;
      color: #FCA5A5;
      line-height: 1.6;
      margin-bottom: 12px;
    }
    .blocked-url {
      background: rgba(0, 0, 0, 0.3);
      padding: 12px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: #FEE2E2;
      word-break: break-all;
      margin-top: 16px;
    }
    .info {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid #3B82F6;
      border-radius: 8px;
      padding: 16px;
      margin-top: 24px;
    }
    .info p {
      font-size: 14px;
      color: #93C5FD;
      line-height: 1.5;
    }
    .timer {
      font-size: 18px;
      color: #FCD34D;
      font-weight: 600;
      margin-top: 16px;
    }
    .footer {
      margin-top: 32px;
      font-size: 12px;
      color: #6B7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">☢️</div>
    <h1>SITE NUKED</h1>
    <p class="subtitle">Nuclear Mode is Active</p>
    
    <div class="message">
      <p><strong>This website is not whitelisted.</strong></p>
      <p>Only sites in your whitelist are accessible during Nuclear Mode.</p>
      <div class="blocked-url">${details.url.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>

    <div class="info">
      <p>💡 To access this site, add it to your whitelist in the ExPro extension popup.</p>
      <p class="timer">⏱️ Nuclear Mode ends in: ${timeStr}</p>
    </div>

    <div class="footer">
      <p>ExPro - Nuclear Mode | Stay Focused, Stay Productive</p>
    </div>
  </div>
</body>
</html>`;

      // Stop the page load and redirect to extension's blocked page
      const blockedPageUrl = chrome.runtime.getURL('nuclear-blocked.html') + '?blocked=' + encodeURIComponent(details.url);
      chrome.tabs.update(details.tabId, { 
        url: blockedPageUrl
      }).then(() => {
        console.log('Redirected to blocked page:', blockedPageUrl);
      }).catch(err => {
        console.error('Failed to redirect:', err);
      });
    } else {
      console.log('ALLOWING whitelisted site:', details.url);
    }
  } catch (error) {
    console.error('Nuclear Mode error:', error);
  }
});
*/

console.log('Service worker fully loaded and ready');
