// Background Service Worker Bundle - Cross-browser compatible

// Cross-browser API compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// ============================================
// FOCUS DETECTION - State and Constants
// ============================================
let isDetecting = false;
let detectionInterval = null;
const API_KEY = 'dnJH9C8BFgg1vaBXQaz1';
const API_URL = 'https://serverless.roboflow.com/mobile-phone-detection-2vads/1';
const DETECTION_INTERVAL = 2000;

// Cache Handler
async function clearCache() {
  try {
    await browserAPI.browsingData.remove({
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

// Ad Blocker Handler
async function handleAdBlocker(enabled) {
  try {
    const rulesetIds = ['adblock_rules'];
    
    if (enabled) {
      await browserAPI.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: rulesetIds
      });
      console.log('Ad blocker enabled');
    } else {
      await browserAPI.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: rulesetIds
      });
      console.log('Ad blocker disabled');
    }
  } catch (error) {
    console.error('Error toggling ad blocker:', error);
  }
}

// Initialize on install/startup
browserAPI.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed/updated');
  
  // Load saved toggle states and apply them
  const result = await browserAPI.storage.sync.get(['toggles']);
  if (result.toggles && result.toggles.adBlocker) {
    await handleAdBlocker(true);
  }
});

// Also check on startup
browserAPI.runtime.onStartup.addListener(async () => {
  console.log('Browser started');
  
  // Load saved toggle states and apply them
  const result = await browserAPI.storage.sync.get(['toggles']);
  if (result.toggles && result.toggles.adBlocker) {
    await handleAdBlocker(true);
  }
});

// Listen for messages
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
    browserAPI.runtime.sendMessage(message).then(sendResponse);
    return true;
  }

  // Other Messages
  if (message.type === 'TOGGLE_CHANGED') {
    handleToggleChange(message.key, message.value);
    sendResponse({ success: true });
  }
  
  if (message.type === 'CLEAR_CACHE') {
    clearCache().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  // Nuclear Mode coordination
  if (message.type === 'NUCLEAR_MODE_CHECK') {
    browserAPI.storage.local.get(['nuclearMode'], (result) => {
      sendResponse({ nuclearMode: result.nuclearMode || null });
    });
    return true;
  }

  if (message.type === 'NUCLEAR_MODE_UPDATE') {
    browserAPI.storage.local.set({ nuclearMode: message.data }, () => {
      // Notify all tabs about Nuclear Mode change
      browserAPI.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          browserAPI.tabs.sendMessage(tab.id, {
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
    browserAPI.cookies.getAll({ url: message.url }, (cookies) => {
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

    browserAPI.cookies.set(cookieDetails, (cookie) => {
      if (browserAPI.runtime.lastError) {
        sendResponse({ success: false, error: browserAPI.runtime.lastError.message });
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
    
    browserAPI.cookies.remove({ url, name }, () => {
      if (browserAPI.runtime.lastError) {
        sendResponse({ success: false, error: browserAPI.runtime.lastError.message });
      } else {
        sendResponse({ success: true });
      }
    });
    return true;
  }

  if (message.type === 'DELETE_ALL_COOKIES') {
    browserAPI.cookies.getAll({ url: message.url }, (cookies) => {
      let removed = 0;
      cookies.forEach(cookie => {
        browserAPI.cookies.remove({
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

  // Integration hooks
  if (message.type === 'GITHUB_AGENT_ACTION') {
    console.log('GitHub Agent hook triggered');
    sendResponse({ status: 'pending_integration' });
  }

  if (message.type === 'AWS_AGENT_ACTION') {
    console.log('AWS Agent hook triggered');
    sendResponse({ status: 'pending_integration' });
  }

  if (message.type === 'LEARNING_AGENT_ACTION') {
    console.log('Learning Agent hook triggered');
    sendResponse({ status: 'pending_integration' });
  }
});

// Handle toggle state changes
async function handleToggleChange(key, value) {
  console.log(`Toggle changed: ${key} = ${value}`);
  
  if (key === 'adBlocker') {
    await handleAdBlocker(value);
  }

  const tabs = await browserAPI.tabs.query({});
  tabs.forEach(tab => {
    browserAPI.tabs.sendMessage(tab.id, {
      type: 'TOGGLE_UPDATE',
      key,
      value
    }).catch(() => {});
  });
}

console.log('Background service worker loaded (cross-browser compatible)');

// ============================================
// FOCUS DETECTION - Background Processing
// ============================================
async function startDetection() {
  if (isDetecting) return;
  
  console.log('Starting detection...');
  isDetecting = true;
  
  // Create offscreen document for camera
  try {
    await browserAPI.offscreen.createDocument({
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
      const response = await browserAPI.runtime.sendMessage({ action: 'captureFrame' });
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
  
  browserAPI.offscreen.closeDocument().catch(() => {});
  
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
        const tabs = await browserAPI.tabs.query({ active: true, lastFocusedWindow: true });
        if (tabs[0]) {
          await browserAPI.scripting.executeScript({
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
      browserAPI.notifications.create({
        type: 'basic',
        iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        title: 'Focus Alert!',
        message: `${data.predictions.length} mobile phone(s) detected!`
      });
      
      // Notify popup if open
      browserAPI.runtime.sendMessage({
        action: 'detectionResult',
        predictions: data.predictions
      }).catch(() => {});
    }
  } catch (error) {
    console.error('Detection error:', error);
  }
}

// Nuclear Mode: Block new tabs that aren't whitelisted
browserAPI.tabs.onCreated.addListener(async (tab) => {
  const result = await browserAPI.storage.local.get(['nuclearMode']);
  const nuclearMode = result.nuclearMode;
  
  if (!nuclearMode || !nuclearMode.isActive || !nuclearMode.timerEndTime) {
    return;
  }

  if (Date.now() > nuclearMode.timerEndTime) {
    return;
  }

  setTimeout(async () => {
    const updatedTab = await browserAPI.tabs.get(tab.id).catch(() => null);
    if (!updatedTab || !updatedTab.url) return;

    const url = new URL(updatedTab.url);
    const domain = url.hostname.replace(/^www\./, '');

    const isWhitelisted = nuclearMode.whitelist.some(site => {
      const cleanSite = site.replace(/^https?:\/\//, '').replace(/^www\./, '');
      return domain.includes(cleanSite) || cleanSite.includes(domain);
    });

    if (!isWhitelisted && !url.protocol.startsWith('chrome') && !url.protocol.startsWith('about')) {
      browserAPI.tabs.update(tab.id, {
        url: 'data:text/html,<html><head><style>body{margin:0;padding:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#1F2937 0%,#111827 100%);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:white;text-align:center}</style></head><body><div><h1 style="font-size:36px;margin:0 0 16px 0">Nuclear Mode Active</h1><p style="font-size:18px;color:#9CA3AF">This website is not whitelisted. Tab will close in 3 seconds...</p></div><script>setTimeout(()=>window.close(),3000)</script></body></html>'
      });
      
      setTimeout(() => {
        browserAPI.tabs.remove(tab.id).catch(() => {});
      }, 3000);
    }
  }, 500);
});

// Nuclear Mode: Block navigation to non-whitelisted sites
browserAPI.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;

  const result = await browserAPI.storage.local.get(['nuclearMode']);
  const nuclearMode = result.nuclearMode;
  
  if (!nuclearMode || !nuclearMode.isActive || !nuclearMode.timerEndTime) {
    return;
  }

  if (Date.now() > nuclearMode.timerEndTime) {
    return;
  }

  const url = new URL(details.url);
  const domain = url.hostname.replace(/^www\./, '');

  const isWhitelisted = nuclearMode.whitelist.some(site => {
    const cleanSite = site.replace(/^https?:\/\//, '').replace(/^www\./, '');
    return domain.includes(cleanSite) || cleanSite.includes(domain);
  });

  if (!isWhitelisted && !url.protocol.startsWith('chrome') && !url.protocol.startsWith('about') && !url.protocol.startsWith('data')) {
    browserAPI.tabs.update(details.tabId, {
      url: 'data:text/html,<html><head><style>body{margin:0;padding:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#1F2937 0%,#111827 100%);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:white;text-align:center}</style></head><body><div><h1 style="font-size:36px;margin:0 0 16px 0">Nuclear Mode Active</h1><p style="font-size:18px;color:#9CA3AF;margin-bottom:24px">This website is not whitelisted.</p><p style="font-size:14px;color:#6B7280">Only whitelisted sites are accessible during Nuclear Mode.</p></div></body></html>'
    });
  }
});
