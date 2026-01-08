// Color Finder - ColorZilla-like eyedropper and color picker
export function initColorFinder() {
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  
  let panel = null;
  let eyedropperActive = false;
  let magnifier = null;
  let canvas = null;
  let ctx = null;
  let currentColor = { r: 32, g: 165, b: 172, a: 1 };
  let colorHistory = [];
  let samplingSize = 1; // 1x1, 3x3, 5x5, 11x11, 25x25

  // Color conversion functions
  const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
  };

  const rgbToHsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const rgbToHsv = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    let h, s = max === 0 ? 0 : d / max, v = max;
    if (max === min) {
      h = 0;
    } else {
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
  };

  const rgbToCmyk = (r, g, b) => {
    let c = 1 - (r / 255), m = 1 - (g / 255), y = 1 - (b / 255);
    let k = Math.min(c, m, y);
    if (k === 1) { c = m = y = 0; } 
    else { c = (c - k) / (1 - k); m = (m - k) / (1 - k); y = (y - k) / (1 - k); }
    return { c: Math.round(c * 100), m: Math.round(m * 100), y: Math.round(y * 100), k: Math.round(k * 100) };
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showNotification(`Copied ${label}!`);
  };

  const showNotification = (message) => {
    const notif = document.createElement('div');
    notif.textContent = message;
    notif.style.cssText = `position: fixed; left: 50%; top: 20px; transform: translateX(-50%); background: #10B981; color: white; padding: 12px 24px; border-radius: 6px; font-size: 14px; z-index: 10000000; box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;`;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2000);
  };

  // Create magnifying glass for eyedropper
  function createMagnifier() {
    magnifier = document.createElement('div');
    magnifier.style.cssText = `
      position: fixed; width: 140px; height: 140px; border: 3px solid #2D3748; border-radius: 50%; 
      pointer-events: none; z-index: 99999999; display: none; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      background: white; overflow: hidden;
    `;
    
    canvas = document.createElement('canvas');
    canvas.width = 140;
    canvas.height = 140;
    canvas.style.cssText = 'width: 100%; height: 100%; image-rendering: pixelated;';
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    magnifier.appendChild(canvas);
    
    // Crosshair
    const crosshair = document.createElement('div');
    crosshair.style.cssText = `
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 20px; height: 20px; border: 2px solid #000; box-shadow: 0 0 0 1px #fff;
      pointer-events: none;
    `;
    magnifier.appendChild(crosshair);
    
    document.body.appendChild(magnifier);
  }

  // Get pixel color from screen
  async function getPixelColor(x, y) {
    try {
      // Capture screenshot of area around cursor
      const captureArea = {
        x: Math.max(0, x - 70),
        y: Math.max(0, y - 70),
        width: 140,
        height: 140
      };

      // Draw the area under cursor to canvas
      const element = document.elementFromPoint(x, y);
      if (!element) return null;

      // Get computed background color
      const computedStyle = window.getComputedStyle(element);
      let color = computedStyle.backgroundColor;
      
      // Try to get color from background image or actual element
      if (color === 'rgba(0, 0, 0, 0)' || color === 'transparent') {
        color = computedStyle.color;
      }

      // Parse RGB
      const rgbMatch = color.match(/\d+/g);
      if (rgbMatch && rgbMatch.length >= 3) {
        return {
          r: parseInt(rgbMatch[0]),
          g: parseInt(rgbMatch[1]),
          b: parseInt(rgbMatch[2])
        };
      }

      // Fallback: try to capture from canvas if it's an image
      if (element.tagName === 'IMG' || element.tagName === 'CANVAS') {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = element.width || element.offsetWidth;
        tempCanvas.height = element.height || element.offsetHeight;
        
        try {
          tempCtx.drawImage(element, 0, 0);
          const rect = element.getBoundingClientRect();
          const localX = x - rect.left;
          const localY = y - rect.top;
          const imageData = tempCtx.getImageData(localX, localY, 1, 1);
          return {
            r: imageData.data[0],
            g: imageData.data[1],
            b: imageData.data[2]
          };
        } catch (e) {
          console.log('Cannot read image data (CORS)');
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting pixel color:', error);
      return null;
    }
  }

  // Eyedropper mouse move handler
  function handleEyedropperMove(e) {
    if (!eyedropperActive) return;
    
    const x = e.clientX;
    const y = e.clientY;
    
    // Position magnifier
    magnifier.style.left = (x + 20) + 'px';
    magnifier.style.top = (y + 20) + 'px';
    magnifier.style.display = 'block';
    
    // Get color at cursor
    getPixelColor(x, y).then(color => {
      if (color) {
        // Draw magnified area (simplified - just show the color)
        ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        ctx.fillRect(0, 0, 140, 140);
        
        // Update current color preview
        currentColor = color;
      }
    });
  }

  // Eyedropper click handler
  async function handleEyedropperClick(e) {
    if (!eyedropperActive) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const color = await getPixelColor(e.clientX, e.clientY);
    if (color) {
      updateColorDisplay(color.r, color.g, color.b);
      addToHistory(color.r, color.g, color.b);
      deactivateEyedropper();
      showNotification('Color picked!');
    }
  }

  function activateEyedropper() {
    eyedropperActive = true;
    document.body.style.cursor = 'crosshair';
    if (!magnifier) createMagnifier();
    magnifier.style.display = 'block';
    
    document.addEventListener('mousemove', handleEyedropperMove);
    document.addEventListener('click', handleEyedropperClick, true);
    
    // ESC to cancel
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        deactivateEyedropper();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  function deactivateEyedropper() {
    eyedropperActive = false;
    document.body.style.cursor = 'default';
    if (magnifier) magnifier.style.display = 'none';
    
    document.removeEventListener('mousemove', handleEyedropperMove);
    document.removeEventListener('click', handleEyedropperClick, true);
  }

  // Load color history from storage
  function loadColorHistory() {
    browserAPI.storage.local.get(['colorHistory'], (result) => {
      if (result.colorHistory) {
        colorHistory = result.colorHistory;
      }
    });
  }

  // Save color history to storage
  function saveColorHistory() {
    browserAPI.storage.local.set({ colorHistory: colorHistory });
  }

  // Add color to history
  function addToHistory(r, g, b) {
    const hex = rgbToHex(r, g, b);
    
    // Remove duplicate if exists
    colorHistory = colorHistory.filter(c => c.hex !== hex);
    
    // Add to beginning
    colorHistory.unshift({ r, g, b, hex, timestamp: Date.now() });
    
    // Keep only last 50 colors
    if (colorHistory.length > 50) {
      colorHistory = colorHistory.slice(0, 50);
    }
    
    saveColorHistory();
  }

  // Update color display
  function updateColorDisplay(r, g, b) {
    currentColor = { r, g, b, a: 1 };
    
    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    const hsv = rgbToHsv(r, g, b);
    const cmyk = rgbToCmyk(r, g, b);

    // Update all format displays if panel exists
    if (panel) {
      const hexEl = panel.querySelector('#hex-value');
      const rgbEl = panel.querySelector('#rgb-value');
      const hslEl = panel.querySelector('#hsl-value');
      const hsvEl = panel.querySelector('#hsv-value');
      const cmykEl = panel.querySelector('#cmyk-value');
      
      if (hexEl) hexEl.textContent = hex;
      if (rgbEl) rgbEl.textContent = `rgb(${r}, ${g}, ${b})`;
      if (hslEl) hslEl.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
      if (hsvEl) hsvEl.textContent = `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`;
      if (cmykEl) cmykEl.textContent = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
      
      // Update color preview
      const preview = panel.querySelector('#color-preview');
      if (preview) {
        preview.style.background = `rgb(${r}, ${g}, ${b})`;
      }
    }
  }

  // Create main menu panel
  function createPanel() {
    panel = document.createElement('div');
    panel.id = 'colorzilla-panel';
    panel.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 420px; background: #FFFFFF; border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2); z-index: 9999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      overflow: hidden; display: flex; flex-direction: column;
    `;

    panel.innerHTML = `
      <div style="padding: 20px; border-bottom: 1px solid #E5E7EB;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="margin: 0; font-size: 18px; color: #1F2937; font-weight: 600;">ColorZilla</h2>
          <button id="close-panel" style="background: none; border: none; font-size: 24px; color: #6B7280; cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; transition: all 0.2s;">×</button>
        </div>
        
        <!-- Menu Items -->
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <button class="menu-item" data-action="pick-page" style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: white; border: 1px solid #E5E7EB; border-radius: 8px; cursor: pointer; transition: all 0.2s; width: 100%; text-align: left;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2">
              <path d="M7 17L17 7M17 7H7M17 7V17"/>
            </svg>
            <span style="font-size: 15px; color: #1F2937; font-weight: 500;">Pick Color From Page</span>
          </button>

          <button class="menu-item" data-action="color-picker" style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: white; border: 1px solid #E5E7EB; border-radius: 8px; cursor: pointer; transition: all 0.2s; width: 100%; text-align: left;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#FF0000"/>
              <circle cx="12" cy="12" r="7" fill="#00FF00"/>
              <circle cx="12" cy="12" r="4" fill="#0000FF"/>
            </svg>
            <span style="font-size: 15px; color: #1F2937; font-weight: 500;">Color Picker</span>
          </button>

          <button class="menu-item" data-action="history" style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: white; border: 1px solid #E5E7EB; border-radius: 8px; cursor: pointer; transition: all 0.2s; width: 100%; text-align: left;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style="font-size: 15px; color: #1F2937; font-weight: 500;">Picked Color History</span>
          </button>
        </div>

        <div style="height: 1px; background: #E5E7EB; margin: 16px 0;"></div>

        <div style="display: flex; flex-direction: column; gap: 2px;">
          <button class="menu-item" data-action="analyzer" style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: white; border: 1px solid #E5E7EB; border-radius: 8px; cursor: pointer; transition: all 0.2s; width: 100%; text-align: left;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <span style="font-size: 15px; color: #1F2937; font-weight: 500;">Webpage Color Analyzer</span>
          </button>

          <button class="menu-item" data-action="palette" style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: white; border: 1px solid #E5E7EB; border-radius: 8px; cursor: pointer; transition: all 0.2s; width: 100%; text-align: left;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F97316" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>
            </svg>
            <span style="font-size: 15px; color: #1F2937; font-weight: 500;">Palette Browser</span>
          </button>

          <button class="menu-item" data-action="gradient" style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: white; border: 1px solid #E5E7EB; border-radius: 8px; cursor: pointer; transition: all 0.2s; width: 100%; text-align: left;">
            <div style="width: 24px; height: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 4px;"></div>
            <span style="font-size: 15px; color: #1F2937; font-weight: 500;">CSS Gradient Generator</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    // Add event listeners
    panel.querySelector('#close-panel').addEventListener('click', () => {
      panel.remove();
      browserAPI.storage.sync.set({ colorFinder: false });
    });

    // Hover effects
    panel.querySelector('#close-panel').addEventListener('mouseenter', function() {
      this.style.background = '#FEE2E2';
      this.style.color = '#DC2626';
    });
    panel.querySelector('#close-panel').addEventListener('mouseleave', function() {
      this.style.background = 'none';
      this.style.color = '#6B7280';
    });

    // Menu item hover effects and actions
    panel.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('mouseenter', function() {
        this.style.background = '#F3F4F6';
        this.style.borderColor = '#3B82F6';
      });
      item.addEventListener('mouseleave', function() {
        this.style.background = 'white';
        this.style.borderColor = '#E5E7EB';
      });

      item.addEventListener('click', function() {
        const action = this.dataset.action;
        handleMenuAction(action);
      });
    });

    // Make draggable
    makeDraggable(panel);
  }

  // Handle menu actions
  function handleMenuAction(action) {
    switch (action) {
      case 'pick-page':
        panel.style.display = 'none';
        activateEyedropper();
        break;
      case 'color-picker':
        showColorPicker();
        break;
      case 'history':
        showColorHistory();
        break;
      case 'analyzer':
        showWebpageAnalyzer();
        break;
      case 'palette':
        showNotification('Palette Browser coming soon!');
        break;
      case 'gradient':
        showNotification('CSS Gradient Generator coming soon!');
        break;
    }
  }

  // Show color picker panel
  function showColorPicker() {
    panel.innerHTML = `
      <div style="padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <button id="back-btn" style="background: none; border: none; color: #3B82F6; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 4px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <h3 style="margin: 0; font-size: 16px; color: #1F2937;">Color Picker</h3>
          <button id="close-panel" style="background: none; border: none; font-size: 24px; color: #6B7280; cursor: pointer;">×</button>
        </div>

        <div id="color-preview" style="width: 100%; height: 80px; border-radius: 8px; margin-bottom: 16px; background: rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b}); border: 2px solid #E5E7EB;"></div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #F9FAFB; border-radius: 6px;">
            <span id="hex-value" style="font-family: monospace; font-size: 14px; color: #1F2937;">${rgbToHex(currentColor.r, currentColor.g, currentColor.b)}</span>
            <button class="copy-btn" data-format="hex" style="background: #3B82F6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Copy</button>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #F9FAFB; border-radius: 6px;">
            <span id="rgb-value" style="font-family: monospace; font-size: 14px; color: #1F2937;">rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})</span>
            <button class="copy-btn" data-format="rgb" style="background: #3B82F6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Copy</button>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #F9FAFB; border-radius: 6px;">
            <span id="hsl-value" style="font-family: monospace; font-size: 14px; color: #1F2937;">hsl(${rgbToHsl(currentColor.r, currentColor.g, currentColor.b).h}, ${rgbToHsl(currentColor.r, currentColor.g, currentColor.b).s}%, ${rgbToHsl(currentColor.r, currentColor.g, currentColor.b).l}%)</span>
            <button class="copy-btn" data-format="hsl" style="background: #3B82F6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Copy</button>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #F9FAFB; border-radius: 6px;">
            <span id="hsv-value" style="font-family: monospace; font-size: 14px; color: #1F2937;">hsv(${rgbToHsv(currentColor.r, currentColor.g, currentColor.b).h}, ${rgbToHsv(currentColor.r, currentColor.g, currentColor.b).s}%, ${rgbToHsv(currentColor.r, currentColor.g, currentColor.b).v}%)</span>
            <button class="copy-btn" data-format="hsv" style="background: #3B82F6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Copy</button>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #F9FAFB; border-radius: 6px;">
            <span id="cmyk-value" style="font-family: monospace; font-size: 14px; color: #1F2937;">cmyk(${rgbToCmyk(currentColor.r, currentColor.g, currentColor.b).c}%, ${rgbToCmyk(currentColor.r, currentColor.g, currentColor.b).m}%, ${rgbToCmyk(currentColor.r, currentColor.g, currentColor.b).y}%, ${rgbToCmyk(currentColor.r, currentColor.g, currentColor.b).k}%)</span>
            <button class="copy-btn" data-format="cmyk" style="background: #3B82F6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Copy</button>
          </div>
        </div>
      </div>
    `;

    attachCommonHandlers();
  }

  // Show color history
  function showColorHistory() {
    const historyHTML = colorHistory.length > 0 
      ? colorHistory.map(color => `
          <div class="history-item" data-rgb="${color.r},${color.g},${color.b}" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #F9FAFB; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
            <div style="width: 40px; height: 40px; border-radius: 6px; background: rgb(${color.r}, ${color.g}, ${color.b}); border: 2px solid #E5E7EB; flex-shrink: 0;"></div>
            <div style="flex: 1;">
              <div style="font-family: monospace; font-size: 14px; color: #1F2937; font-weight: 600;">${color.hex}</div>
              <div style="font-size: 12px; color: #6B7280;">rgb(${color.r}, ${color.g}, ${color.b})</div>
            </div>
            <button class="copy-history-btn" data-hex="${color.hex}" style="background: #3B82F6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Copy</button>
          </div>
        `).join('')
      : '<div style="text-align: center; padding: 40px; color: #9CA3AF;">No colors picked yet. Use "Pick Color From Page" to start!</div>';

    panel.innerHTML = `
      <div style="padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <button id="back-btn" style="background: none; border: none; color: #3B82F6; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 4px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <h3 style="margin: 0; font-size: 16px; color: #1F2937;">Color History</h3>
          <button id="close-panel" style="background: none; border: none; font-size: 24px; color: #6B7280; cursor: pointer;">×</button>
        </div>

        <div style="max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
          ${historyHTML}
        </div>

        ${colorHistory.length > 0 ? '<button id="clear-history" style="width: 100%; margin-top: 16px; padding: 10px; background: #EF4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">Clear History</button>' : ''}
      </div>
    `;

    attachCommonHandlers();

    // History item click
    panel.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('mouseenter', function() {
        this.style.background = '#E5E7EB';
      });
      item.addEventListener('mouseleave', function() {
        this.style.background = '#F9FAFB';
      });
      item.addEventListener('click', function(e) {
        if (e.target.classList.contains('copy-history-btn')) return;
        const rgb = this.dataset.rgb.split(',').map(Number);
        currentColor = { r: rgb[0], g: rgb[1], b: rgb[2], a: 1 };
        showColorPicker();
      });
    });

    // Copy buttons
    panel.querySelectorAll('.copy-history-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        copyToClipboard(this.dataset.hex, 'HEX');
      });
    });

    // Clear history
    const clearBtn = panel.querySelector('#clear-history');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        colorHistory = [];
        saveColorHistory();
        showColorHistory();
        showNotification('History cleared!');
      });
    }
  }

  // Show webpage color analyzer
  function showWebpageAnalyzer() {
    showNotification('Analyzing webpage colors...');
    
    const colors = new Map();
    const elements = document.querySelectorAll('*');
    
    elements.forEach(el => {
      if (el.id === 'colorzilla-panel') return;
      
      const style = window.getComputedStyle(el);
      const bgColor = style.backgroundColor;
      const textColor = style.color;
      
      [bgColor, textColor].forEach(color => {
        if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
          const match = color.match(/\d+/g);
          if (match && match.length >= 3) {
            const hex = rgbToHex(parseInt(match[0]), parseInt(match[1]), parseInt(match[2]));
            colors.set(hex, { r: parseInt(match[0]), g: parseInt(match[1]), b: parseInt(match[2]) });
          }
        }
      });
    });

    const colorArray = Array.from(colors.values()).slice(0, 20);

    panel.innerHTML = `
      <div style="padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <button id="back-btn" style="background: none; border: none; color: #3B82F6; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 4px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <h3 style="margin: 0; font-size: 16px; color: #1F2937;">Webpage Colors</h3>
          <button id="close-panel" style="background: none; border: none; font-size: 24px; color: #6B7280; cursor: pointer;">×</button>
        </div>

        <div style="margin-bottom: 12px; color: #6B7280; font-size: 14px;">Found ${colorArray.length} unique colors</div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; max-height: 400px; overflow-y: auto;">
          ${colorArray.map(color => `
            <div class="analyzer-color" data-rgb="${color.r},${color.g},${color.b}" style="cursor: pointer; transition: all 0.2s;">
              <div style="width: 100%; aspect-ratio: 1; background: rgb(${color.r}, ${color.g}, ${color.b}); border-radius: 8px; border: 2px solid #E5E7EB; margin-bottom: 6px;"></div>
              <div style="font-family: monospace; font-size: 11px; color: #1F2937; text-align: center;">${rgbToHex(color.r, color.g, color.b)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    attachCommonHandlers();

    // Color click handlers
    panel.querySelectorAll('.analyzer-color').forEach(item => {
      item.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
      });
      item.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
      });
      item.addEventListener('click', function() {
        const rgb = this.dataset.rgb.split(',').map(Number);
        currentColor = { r: rgb[0], g: rgb[1], b: rgb[2], a: 1 };
        addToHistory(rgb[0], rgb[1], rgb[2]);
        showColorPicker();
      });
    });
  }

  // Attach common handlers (back, close, copy buttons)
  function attachCommonHandlers() {
    const backBtn = panel.querySelector('#back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        panel.remove();
        createPanel();
      });
    }

    const closeBtn = panel.querySelector('#close-panel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        panel.remove();
        browserAPI.storage.sync.set({ colorFinder: false });
      });
    }

    panel.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const format = this.dataset.format;
        const value = panel.querySelector(`#${format}-value`).textContent;
        copyToClipboard(value, format.toUpperCase());
      });
    });
  }

  // Make panel draggable
  function makeDraggable(element) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    element.addEventListener('mousedown', function(e) {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = element.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      element.style.transform = 'none';
      element.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      element.style.left = (startLeft + dx) + 'px';
      element.style.top = (startTop + dy) + 'px';
    });

    document.addEventListener('mouseup', function() {
      if (isDragging) {
        isDragging = false;
        element.style.cursor = 'default';
      }
    });
  }

  // Initialize
  loadColorHistory();
  createPanel();

  return {
    cleanup: () => {
      if (panel) panel.remove();
      if (magnifier) magnifier.remove();
      deactivateEyedropper();
    }
  };
}
