import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Bundling content scripts...');

// Read all feature files
const featuresDir = path.join(__dirname, 'src', 'content', 'features');
const featureFiles = [
  'font-finder.js',
  'color-finder.js',
  'edit-cookie.js',
  'check-seo.js',
  'focus-mode.js',
  'passive-watching.js',
  'energy-scheduling.js',
  'speed-improver.js',
  'youtube-adblock.js'
];

let bundledContent = `// Content Script Bundle - Auto-generated
// Cross-browser API compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

`;

// Read and append each feature file
featureFiles.forEach(file => {
  const filePath = path.join(featuresDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`  Adding ${file}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    // Remove export statements
    content = content.replace(/export\s+/g, '');
    bundledContent += `\n// ========== ${file} ==========\n`;
    bundledContent += content + '\n';
  } else {
    console.log(`  Skipping ${file} (not found)`);
  }
});

// Add the main initialization code
bundledContent += `
// ========== Main Initialization ==========
let activeFeatures = {};
let currentToggles = {};

function handleFeatureToggle(key, value) {
  if (value && !activeFeatures[key]) {
    // Initialize feature
    switch(key) {
      case 'fontFinder':
        activeFeatures[key] = initFontFinder();
        break;
      case 'colorFinder':
        activeFeatures[key] = initColorFinder();
        break;
      case 'editCookie':
        activeFeatures[key] = initEditCookie();
        break;
      case 'checkSEO':
        activeFeatures[key] = initCheckSEO();
        break;
      case 'focusMode':
        activeFeatures[key] = initFocusMode();
        break;
      case 'passiveWatching':
        activeFeatures[key] = initPassiveWatching();
        break;
      case 'energyScheduling':
        activeFeatures[key] = initEnergyScheduling();
        break;
      case 'speedImprover':
        activeFeatures[key] = initSpeedImprover();
        break;
    }
  } else if (!value && activeFeatures[key]) {
    // Cleanup feature
    if (activeFeatures[key].cleanup) {
      activeFeatures[key].cleanup();
    }
    delete activeFeatures[key];
  }
}

function initializeFeatures() {
  Object.keys(currentToggles).forEach(key => {
    if (currentToggles[key]) {
      handleFeatureToggle(key, true);
    }
  });
}

// Load initial state
browserAPI.storage.sync.get(null, (data) => {
  currentToggles = data;
  initializeFeatures();
});

// Listen for toggle changes
browserAPI.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    Object.keys(changes).forEach(key => {
      const newValue = changes[key].newValue;
      currentToggles[key] = newValue;
      handleFeatureToggle(key, newValue);
    });
  }
});

// Listen for messages from background
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOGGLE_UPDATE') {
    currentToggles[message.key] = message.value;
    handleFeatureToggle(message.key, message.value);
  }
});

console.log('Content script loaded');
`;

// Write the bundled file
const outputPath = path.join(__dirname, 'src', 'content', 'content-bundle.js');
fs.writeFileSync(outputPath, bundledContent);

console.log('✅ Content script bundled successfully!');
console.log(`   Output: ${outputPath}`);
