# Content Script Features

This directory contains modular feature implementations for the content script.

## Structure

Each feature is in its own file and exports an initialization function:

```
features/
├── font-finder.js          - Font recognition tool
├── color-finder.js         - Color picker tool
├── cookie-editor.js        - Cookie management UI
├── seo-checker.js          - SEO analysis tool
├── focus-mode.js           - Distraction-free mode
├── passive-watching.js     - Inactivity detector
├── energy-scheduling.js    - Energy-based task scheduler
└── speed-improver.js       - Page speed optimizer
```

## How It Works

1. **Individual Files**: Each feature is developed in its own file with `export function initFeatureName()`
2. **Bundling**: The `bundle-content.js` script combines all features into `content-bundle.js`
3. **Build Process**: Run `npm run build` which:
   - Bundles features → `content-bundle.js`
   - Builds React popup → `dist/popup.js`
   - Copies files → `dist/` folder

## Adding a New Feature

1. Create `src/content/features/my-feature.js`:
```javascript
export function initMyFeature() {
  // Your feature code here
  
  return {
    cleanup: () => {
      // Cleanup code
    }
  };
}
```

2. Add to `bundle-content.js` featureFiles array:
```javascript
const featureFiles = [
  // ... existing files
  'my-feature.js'
];
```

3. Add to switch statement in `bundle-content.js`:
```javascript
case 'myFeature':
  activeFeatures[key] = initMyFeature();
  break;
```

4. Run `npm run bundle` or `npm run build`

## Development Workflow

### Quick Bundle (features only)
```bash
npm run bundle
```

### Full Build (features + popup + copy to dist)
```bash
npm run build
```

### Watch Mode (popup only)
```bash
npm run dev
```

## Benefits

- ✅ **Organized**: Each feature in its own file
- ✅ **Maintainable**: Easy to find and edit features
- ✅ **Scalable**: Add new features without touching existing code
- ✅ **Clean**: No merge conflicts in large bundle file
- ✅ **Debuggable**: Clear file names in error stack traces

## Notes

- The bundler removes `export` statements automatically
- Cross-browser API (`browserAPI`) is added at the top of the bundle
- Features are initialized based on toggle state from `chrome.storage.sync`
- Each feature should return a `cleanup` function for proper teardown
