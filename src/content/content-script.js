// Content Script - Injected into all pages
import { initFontFinder } from './features/font-finder.js';
import { initColorFinder } from './features/color-finder.js';
import { initEditCookie } from './features/edit-cookie.js';
import { initCheckSEO } from './features/check-seo.js';
import { initFocusMode } from './features/focus-mode.js';
import { initPassiveWatching } from './features/passive-watching.js';
import { initEnergyScheduling } from './features/energy-scheduling.js';
import { initSpeedImprover } from './features/speed-improver.js';
import { initYouTubeAdBlock } from './features/youtube-adblock.js';

let activeFeatures = {};
let currentToggles = {};

// Load initial toggle state
chrome.storage.sync.get(['toggles'], (result) => {
  if (result.toggles) {
    currentToggles = result.toggles;
    initializeFeatures();
  }
});

// Listen for toggle updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOGGLE_UPDATE') {
    currentToggles[message.key] = message.value;
    handleFeatureToggle(message.key, message.value);
  }
});

function initializeFeatures() {
  Object.keys(currentToggles).forEach(key => {
    if (currentToggles[key]) {
      handleFeatureToggle(key, true);
    }
  });
}

function handleFeatureToggle(feature, enabled) {
  // Clean up existing feature
  if (activeFeatures[feature]?.cleanup) {
    activeFeatures[feature].cleanup();
    delete activeFeatures[feature];
  }

  if (!enabled) return;

  // Initialize feature based on toggle
  switch (feature) {
    case 'fontFinder':
      activeFeatures[feature] = initFontFinder();
      break;
    case 'colorFinder':
      activeFeatures[feature] = initColorFinder();
      break;
    case 'editCookie':
      activeFeatures[feature] = initEditCookie();
      break;
    case 'checkSEO':
      activeFeatures[feature] = initCheckSEO();
      break;
    case 'focusMode':
      activeFeatures[feature] = initFocusMode();
      break;
    case 'passiveWatching':
      activeFeatures[feature] = initPassiveWatching();
      break;
    case 'energyScheduling':
      activeFeatures[feature] = initEnergyScheduling();
      break;
    case 'speedImprover':
      activeFeatures[feature] = initSpeedImprover();
      break;
    case 'adBlocker':
      // YouTube-specific ad blocking
      activeFeatures[feature] = initYouTubeAdBlock();
      break;
    case 'githubAgent':
      // Integration hook for GitHub Agent
      if (window.location.hostname.includes('github.com')) {
        console.log('GitHub Agent integration point - ready for teammate implementation');
      }
      break;
    case 'awsAgent':
      // Integration hook for AWS Agent
      if (window.location.hostname.includes('aws.amazon.com') || 
          window.location.hostname.includes('console.aws')) {
        console.log('AWS Agent integration point - ready for teammate implementation');
      }
      break;
    case 'learningAgent':
      // Integration hook for Learning Agent
      console.log('Learning Agent integration point - ready for teammate implementation');
      break;
  }
}

console.log('Content script loaded');
