// Content Script Bundle - Auto-generated
// Cross-browser API compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;


// ========== font-finder.js ==========
// Font Finder Feature
function initFontFinder() {
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  let panel = null;
  let currentElement = null;

  // Dragging state
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let panelStartX = 0;
  let panelStartY = 0;

  // Resizing state
  let isResizing = false;
  let resizeStartX = 0;
  let resizeStartY = 0;
  let panelStartWidth = 0;
  let panelStartHeight = 0;

  const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    
    const notif = document.createElement('div');
    notif.textContent = `Copied ${label}!`;
    notif.style.cssText = `
      position: fixed;
      left: 50%;
      top: 20px;
      transform: translateX(-50%);
      background: #10B981;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 10000000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2000);
  };

  const updatePanel = (element) => {
    if (!panel) return;
    
    const computedStyle = window.getComputedStyle(element);
    const fontFamily = computedStyle.fontFamily.replace(/['"]/g, '');
    const fontSize = computedStyle.fontSize;
    const fontWeight = computedStyle.fontWeight;
    const fontStyle = computedStyle.fontStyle;
    const color = computedStyle.color;
    const textContent = element.textContent.trim().substring(0, 50);
    
    // Parse RGB color
    const rgbMatch = color.match(/\d+/g);
    let hexColor = '#000000';
    let rgbColor = '(0, 0, 0)';
    if (rgbMatch) {
      hexColor = rgbToHex(+rgbMatch[0], +rgbMatch[1], +rgbMatch[2]);
      rgbColor = `(${rgbMatch[0]}, ${rgbMatch[1]}, ${rgbMatch[2]})`;
    }

    document.getElementById('font-sample-text').textContent = textContent || 'Sample Text';
    document.getElementById('font-sample-text').style.fontFamily = fontFamily;
    document.getElementById('font-family-value').textContent = fontFamily.split(',')[0];
    document.getElementById('font-size-value').textContent = fontSize;
    document.getElementById('font-weight-value').textContent = fontWeight;
    document.getElementById('font-style-value').textContent = fontStyle;
    document.getElementById('font-color-hex').textContent = hexColor;
    document.getElementById('font-color-rgb').textContent = rgbColor;
    document.getElementById('font-color-preview').style.background = hexColor;
  };

  const handleMouseMove = (e) => {
    const element = e.target;
    if (element === panel || panel?.contains(element)) return;
    
    currentElement = element;
    updatePanel(element);
    
    // Highlight element
    element.style.outline = '2px solid #3B82F6';
    element.style.outlineOffset = '2px';
    
    // Remove highlight from previous element
    document.querySelectorAll('[data-font-finder-highlight]').forEach(el => {
      if (el !== element) {
        el.style.outline = '';
        el.style.outlineOffset = '';
        el.removeAttribute('data-font-finder-highlight');
      }
    });
    
    element.setAttribute('data-font-finder-highlight', 'true');
  };

  const handleMouseLeave = (e) => {
    const element = e.target;
    if (element === panel || panel?.contains(element)) return;
    
    element.style.outline = '';
    element.style.outlineOffset = '';
    element.removeAttribute('data-font-finder-highlight');
  };

  // Create panel
  panel = document.createElement('div');
  panel.id = 'font-finder-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 320px;
    min-width: 280px;
    min-height: 400px;
    background: #1F2937;
    border-radius: 12px;
    border: 1px solid #374151;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    z-index: 9999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #E5E7EB;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `;

  panel.innerHTML = `
    <div id="font-header" style="background: #111827; padding: 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #374151; cursor: move; user-select: none;">
      <div style="font-weight: 600; font-size: 16px;">Font Recognition</div>
      <button id="close-font-panel" style="background: none; border: none; color: #9CA3AF; cursor: pointer; font-size: 24px; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: all 0.2s;">×</button>
    </div>

    <div style="padding: 20px; flex: 1; overflow-y: auto;">
      <div style="text-align: center; margin-bottom: 20px; padding: 16px; background: #111827; border-radius: 8px;">
        <div style="font-size: 11px; color: #9CA3AF; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Hover over text to detect</div>
        <div id="font-sample-text" style="font-size: 24px; font-weight: 500; color: #E5E7EB; word-break: break-word;">Sample Text</div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #374151;">
          <span style="font-size: 13px; color: #9CA3AF;">Font-family</span>
          <span id="font-family-value" style="font-size: 13px; color: #E5E7EB; font-weight: 500;">-</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #374151;">
          <span style="font-size: 13px; color: #9CA3AF;">Font-size</span>
          <span id="font-size-value" style="font-size: 13px; color: #E5E7EB; font-weight: 500;">-</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #374151;">
          <span style="font-size: 13px; color: #9CA3AF;">Font Weight</span>
          <span id="font-weight-value" style="font-size: 13px; color: #E5E7EB; font-weight: 500;">-</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #374151;">
          <span style="font-size: 13px; color: #9CA3AF;">Font Style</span>
          <span id="font-style-value" style="font-size: 13px; color: #E5E7EB; font-weight: 500;">-</span>
        </div>

        <div style="padding: 10px 0;">
          <div style="font-size: 13px; color: #9CA3AF; margin-bottom: 8px;">Color</div>
          <div style="display: flex; gap: 12px; align-items: center;">
            <div style="flex: 1;">
              <div style="font-size: 11px; color: #6B7280; margin-bottom: 4px;">HEX</div>
              <div id="font-color-hex" style="font-size: 13px; color: #E5E7EB; font-weight: 500; font-family: monospace;">#000000</div>
            </div>
            <div style="flex: 1;">
              <div style="font-size: 11px; color: #6B7280; margin-bottom: 4px;">RGB</div>
              <div id="font-color-rgb" style="font-size: 13px; color: #E5E7EB; font-weight: 500; font-family: monospace;">(0, 0, 0)</div>
            </div>
            <div id="font-color-preview" style="width: 40px; height: 40px; border-radius: 6px; border: 2px solid #374151; background: #000;"></div>
          </div>
        </div>
      </div>

      <button id="copy-all-font-btn" style="width: 100%; margin-top: 16px; background: rgba(59, 130, 246, 0.2); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.3); padding: 12px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;">
        Copy all
      </button>
    </div>
  `;

  document.body.appendChild(panel);

  // Add resize handle
  const resizeHandle = document.createElement('div');
  resizeHandle.id = 'resize-handle-font';
  resizeHandle.style.cssText = `
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    cursor: nwse-resize;
    background: linear-gradient(135deg, transparent 50%, #666 50%);
    border-radius: 0 0 12px 0;
    z-index: 10;
  `;
  panel.appendChild(resizeHandle);

  // Event listeners
  document.addEventListener('mouseover', handleMouseMove);
  document.addEventListener('mouseout', handleMouseLeave);

  // Make panel draggable
  const header = document.getElementById('font-header');
  
  header.addEventListener('mousedown', (e) => {
    if (e.target.id === 'close-font-panel' || e.target.closest('#close-font-panel')) {
      return;
    }
    
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    
    const rect = panel.getBoundingClientRect();
    panelStartX = rect.left;
    panelStartY = rect.top;
    
    panel.style.bottom = 'auto';
    panel.style.right = 'auto';
    panel.style.left = panelStartX + 'px';
    panel.style.top = panelStartY + 'px';
    
    header.style.cursor = 'grabbing';
    e.preventDefault();
  });

  // Make panel resizable
  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    
    panelStartWidth = panel.offsetWidth;
    panelStartHeight = panel.offsetHeight;
    
    e.preventDefault();
    e.stopPropagation();
  });

  // Mouse move handler
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;
      
      let newX = panelStartX + deltaX;
      let newY = panelStartY + deltaY;
      
      const maxX = window.innerWidth - panel.offsetWidth;
      const maxY = window.innerHeight - panel.offsetHeight;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      panel.style.left = newX + 'px';
      panel.style.top = newY + 'px';
    }
    
    if (isResizing) {
      const deltaX = e.clientX - resizeStartX;
      const deltaY = e.clientY - resizeStartY;
      
      let newWidth = panelStartWidth + deltaX;
      let newHeight = panelStartHeight + deltaY;
      
      newWidth = Math.max(280, Math.min(newWidth, window.innerWidth * 0.9));
      newHeight = Math.max(400, Math.min(newHeight, window.innerHeight * 0.9));
      
      panel.style.width = newWidth + 'px';
      panel.style.height = newHeight + 'px';
    }
  });

  // Mouse up handler
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      header.style.cursor = 'move';
    }
    if (isResizing) {
      isResizing = false;
    }
  });

  document.getElementById('close-font-panel').addEventListener('click', () => {
    panel.remove();
    document.removeEventListener('mouseover', handleMouseMove);
    document.removeEventListener('mouseout', handleMouseLeave);
    // Remove all highlights
    document.querySelectorAll('[data-font-finder-highlight]').forEach(el => {
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.removeAttribute('data-font-finder-highlight');
    });
    // Turn off toggle
    browserAPI.storage.sync.set({ fontFinder: false });
  });

  document.getElementById('copy-all-font-btn').addEventListener('click', () => {
    if (!currentElement) return;
    
    const computedStyle = window.getComputedStyle(currentElement);
    const fontFamily = computedStyle.fontFamily.replace(/['"]/g, '');
    const fontSize = computedStyle.fontSize;
    const fontWeight = computedStyle.fontWeight;
    const fontStyle = computedStyle.fontStyle;
    const color = computedStyle.color;
    
    const rgbMatch = color.match(/\d+/g);
    let hexColor = '#000000';
    let rgbColor = '(0, 0, 0)';
    if (rgbMatch) {
      hexColor = rgbToHex(+rgbMatch[0], +rgbMatch[1], +rgbMatch[2]);
      rgbColor = `(${rgbMatch[0]}, ${rgbMatch[1]}, ${rgbMatch[2]})`;
    }
    
    const allInfo = `Font Family: ${fontFamily}
Font Size: ${fontSize}
Font Weight: ${fontWeight}
Font Style: ${fontStyle}
Color HEX: ${hexColor}
Color RGB: ${rgbColor}`;
    
    copyToClipboard(allInfo, 'all font info');
  });

  // Hover effect for close button
  const closeBtn = document.getElementById('close-font-panel');
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = '#374151';
    closeBtn.style.color = '#fff';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = 'none';
    closeBtn.style.color = '#9CA3AF';
  });

  // Hover effect for copy button
  const copyBtn = document.getElementById('copy-all-font-btn');
  const originalBg = copyBtn.style.background;
  copyBtn.addEventListener('mouseenter', () => {
    copyBtn.style.background = 'rgba(59, 130, 246, 0.3)';
  });
  copyBtn.addEventListener('mouseleave', () => {
    copyBtn.style.background = originalBg;
  });

  return {
    cleanup: () => {
      document.removeEventListener('mouseover', handleMouseMove);
      document.removeEventListener('mouseout', handleMouseLeave);
      if (panel) panel.remove();
      // Remove all highlights
      document.querySelectorAll('[data-font-finder-highlight]').forEach(el => {
        el.style.outline = '';
        el.style.outlineOffset = '';
        el.removeAttribute('data-font-finder-highlight');
      });
    }
  };
}


// ========== color-finder.js ==========
// Color Finder - ColorZilla-like eyedropper and color picker
function initColorFinder() {
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


// ========== edit-cookie.js ==========
// Cookie Editor Feature - Comprehensive with Dark UI
function initEditCookie() {
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  
  let allCookies = [];
  let filteredCookies = [];
  let selectedCookie = null;
  let editMode = false;

  // Dragging state
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let panelStartX = 0;
  let panelStartY = 0;

  // Resizing state
  let isResizing = false;
  let resizeStartX = 0;
  let resizeStartY = 0;
  let panelStartWidth = 0;
  let panelStartHeight = 0;

  const panel = document.createElement('div');
  panel.id = 'cookie-editor-panel';
  panel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 700px;
    height: 600px;
    min-width: 500px;
    min-height: 400px;
    max-width: 95vw;
    max-height: 95vh;
    background: #1F2937;
    border-radius: 12px;
    border: 1px solid #374151;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    z-index: 999999;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #E5E7EB;
    resize: both;
    overflow: hidden;
  `;

  panel.innerHTML = `
    <div id="cookie-header" style="background: #111827; padding: 16px; border-radius: 12px 12px 0 0; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #374151; cursor: move; user-select: none;">
      <div style="font-weight: 600; font-size: 16px; color: #E5E7EB;">Cookie Editor - ${window.location.hostname}</div>
      <button id="close-cookie-panel" style="background: none; border: none; color: #9CA3AF; cursor: pointer; font-size: 24px; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: all 0.2s;">×</button>
    </div>

    <div style="padding: 16px; border-bottom: 1px solid #374151; background: #111827;">
      <div style="display: flex; gap: 8px; margin-bottom: 12px;">
        <input type="text" id="cookie-search" placeholder="Search cookies..." style="flex: 1; background: #1F2937; border: 1px solid #374151; color: #E5E7EB; padding: 10px 12px; border-radius: 6px; font-size: 13px; outline: none;">
        <button id="add-cookie-btn" style="background: rgba(59, 130, 246, 0.2); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.3); padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; white-space: nowrap; min-width: 80px;">+ Add</button>
        <button id="import-cookies-btn" style="background: rgba(59, 130, 246, 0.2); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.3); padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; white-space: nowrap; min-width: 80px;">Import</button>
        <button id="export-cookies-btn" style="background: rgba(59, 130, 246, 0.2); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.3); padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; white-space: nowrap; min-width: 80px;">Export</button>
        <button id="delete-all-btn" style="background: rgba(239, 68, 68, 0.2); color: #F87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; white-space: nowrap; min-width: 100px;">Delete All</button>
      </div>
      <div style="font-size: 12px; color: #9CA3AF;">
        <span id="cookie-count">0 cookies</span>
      </div>
    </div>

    <div style="display: flex; flex: 1; overflow: hidden; position: relative;">
      <div id="cookie-list-container" style="flex: 1; overflow-y: auto; background: #1F2937;">
        <div id="cookie-list">
          <div style="padding: 20px; text-align: center; color: #6B7280;">Loading cookies...</div>
        </div>
      </div>

      <div id="cookie-details" style="width: 350px; overflow-y: auto; padding: 16px; background: #111827; border-left: 1px solid #374151; display: none;">
        <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #374151;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #E5E7EB;">Cookie Details</div>
          <div style="font-size: 11px; color: #9CA3AF;">View and edit cookie properties</div>
        </div>

        <div id="cookie-form">
          <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 11px; color: #9CA3AF; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Name</label>
            <input type="text" id="edit-name" style="width: 100%; background: #1F2937; border: 1px solid #374151; color: #E5E7EB; padding: 8px; border-radius: 4px; font-size: 13px; box-sizing: border-box;">
          </div>

          <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 11px; color: #9CA3AF; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Value</label>
            <textarea id="edit-value" rows="3" style="width: 100%; background: #1F2937; border: 1px solid #374151; color: #E5E7EB; padding: 8px; border-radius: 4px; font-size: 13px; resize: vertical; box-sizing: border-box; font-family: monospace;"></textarea>
          </div>

          <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 11px; color: #9CA3AF; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Domain</label>
            <input type="text" id="edit-domain" style="width: 100%; background: #1F2937; border: 1px solid #374151; color: #E5E7EB; padding: 8px; border-radius: 4px; font-size: 13px; box-sizing: border-box;">
          </div>

          <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 11px; color: #9CA3AF; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Path</label>
            <input type="text" id="edit-path" value="/" style="width: 100%; background: #1F2937; border: 1px solid #374151; color: #E5E7EB; padding: 8px; border-radius: 4px; font-size: 13px; box-sizing: border-box;">
          </div>

          <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 11px; color: #9CA3AF; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Expires</label>
            <input type="datetime-local" id="edit-expires" style="width: 100%; background: #1F2937; border: 1px solid #374151; color: #E5E7EB; padding: 8px; border-radius: 4px; font-size: 13px; box-sizing: border-box;">
            <div style="margin-top: 4px;">
              <label style="font-size: 11px; color: #9CA3AF; cursor: pointer;">
                <input type="checkbox" id="edit-session" style="margin-right: 4px;"> Session cookie
              </label>
            </div>
          </div>

          <div style="margin-bottom: 12px; display: flex; gap: 12px;">
            <label style="font-size: 12px; color: #E5E7EB; cursor: pointer; display: flex; align-items: center;">
              <input type="checkbox" id="edit-secure" style="margin-right: 6px;"> Secure
            </label>
            <label style="font-size: 12px; color: #E5E7EB; cursor: pointer; display: flex; align-items: center;">
              <input type="checkbox" id="edit-httponly" style="margin-right: 6px;"> HttpOnly
            </label>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 11px; color: #9CA3AF; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">SameSite</label>
            <select id="edit-samesite" style="width: 100%; background: #1F2937; border: 1px solid #374151; color: #E5E7EB; padding: 8px; border-radius: 4px; font-size: 13px; box-sizing: border-box;">
              <option value="no_restriction">No restriction</option>
              <option value="lax">Lax</option>
              <option value="strict">Strict</option>
            </select>
          </div>

          <div style="display: flex; gap: 8px;">
            <button id="save-cookie-btn" style="flex: 1; background: rgba(59, 130, 246, 0.2); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.3); padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 13px; transition: all 0.2s;">
              Save
            </button>
            <button id="delete-cookie-btn" style="flex: 1; background: rgba(239, 68, 68, 0.2); color: #F87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 13px; transition: all 0.2s;">
              Delete
            </button>
            <button id="cancel-edit-btn" style="flex: 1; background: rgba(107, 114, 128, 0.2); color: #9CA3AF; border: 1px solid rgba(107, 114, 128, 0.3); padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 13px; transition: all 0.2s;">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  // Add resize handle at the end
  const resizeHandle = document.createElement('div');
  resizeHandle.id = 'resize-handle-corner';
  resizeHandle.style.cssText = `
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    cursor: nwse-resize;
    background: linear-gradient(135deg, transparent 50%, #666 50%);
    border-radius: 0 0 12px 0;
    z-index: 10;
  `;
  panel.appendChild(resizeHandle);

  // Make panel draggable
  const header = document.getElementById('cookie-header');
  
  header.addEventListener('mousedown', (e) => {
    if (e.target.id === 'close-cookie-panel' || e.target.closest('#close-cookie-panel')) {
      return;
    }
    
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    
    const rect = panel.getBoundingClientRect();
    panelStartX = rect.left;
    panelStartY = rect.top;
    
    panel.style.transform = 'none';
    panel.style.left = panelStartX + 'px';
    panel.style.top = panelStartY + 'px';
    
    header.style.cursor = 'grabbing';
    e.preventDefault();
  });

  // Make panel resizable
  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    
    panelStartWidth = panel.offsetWidth;
    panelStartHeight = panel.offsetHeight;
    
    e.preventDefault();
    e.stopPropagation();
  });

  // Mouse move handler
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;
      
      let newX = panelStartX + deltaX;
      let newY = panelStartY + deltaY;
      
      // Keep panel within viewport
      const maxX = window.innerWidth - panel.offsetWidth;
      const maxY = window.innerHeight - panel.offsetHeight;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      panel.style.left = newX + 'px';
      panel.style.top = newY + 'px';
    }
    
    if (isResizing) {
      const deltaX = e.clientX - resizeStartX;
      const deltaY = e.clientY - resizeStartY;
      
      let newWidth = panelStartWidth + deltaX;
      let newHeight = panelStartHeight + deltaY;
      
      // Apply min/max constraints
      newWidth = Math.max(500, Math.min(newWidth, window.innerWidth * 0.95));
      newHeight = Math.max(400, Math.min(newHeight, window.innerHeight * 0.95));
      
      panel.style.width = newWidth + 'px';
      panel.style.height = newHeight + 'px';
    }
  });

  // Mouse up handler
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      header.style.cursor = 'move';
    }
    if (isResizing) {
      isResizing = false;
    }
  });

  // Load cookies
  function loadCookies() {
    browserAPI.runtime.sendMessage({ type: 'GET_ALL_COOKIES', url: window.location.href }, (response) => {
      if (response && response.cookies) {
        allCookies = response.cookies;
        filteredCookies = allCookies;
        renderCookieList();
        updateStats();
      }
    });
  }

  function renderCookieList() {
    const list = document.getElementById('cookie-list');
    
    if (filteredCookies.length === 0) {
      list.innerHTML = '<div style="padding: 40px 20px; text-align: center; color: #6B7280;">No cookies found</div>';
      return;
    }

    list.innerHTML = filteredCookies.map(cookie => `
      <div class="cookie-item" data-cookie='${JSON.stringify(cookie).replace(/'/g, "&#39;")}' style="padding: 12px 16px; border-bottom: 1px solid #374151; cursor: pointer; transition: all 0.2s; ${selectedCookie === cookie ? 'background: #111827; border-left: 2px solid #3B82F6;' : ''}">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 500; font-size: 13px; color: #E5E7EB; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${cookie.name}</div>
            <div style="font-size: 11px; color: #9CA3AF; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${cookie.value.substring(0, 50)}${cookie.value.length > 50 ? '...' : ''}</div>
            <div style="font-size: 10px; color: #6B7280; margin-top: 4px;">
              ${cookie.domain} • ${cookie.path || '/'}
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // Add click handlers
    document.querySelectorAll('.cookie-item').forEach(item => {
      item.addEventListener('click', () => {
        const cookie = JSON.parse(item.dataset.cookie);
        selectCookie(cookie);
      });
      
      item.addEventListener('mouseenter', () => {
        if (!item.dataset.cookie || JSON.parse(item.dataset.cookie) !== selectedCookie) {
          item.style.background = '#111827';
        }
      });
      
      item.addEventListener('mouseleave', () => {
        if (!item.dataset.cookie || JSON.parse(item.dataset.cookie) !== selectedCookie) {
          item.style.background = 'transparent';
        }
      });
    });
  }

  function selectCookie(cookie) {
    selectedCookie = cookie;
    editMode = false;
    document.getElementById('cookie-details').style.display = 'block';
    
    // Populate form
    document.getElementById('edit-name').value = cookie.name;
    document.getElementById('edit-value').value = cookie.value;
    document.getElementById('edit-domain').value = cookie.domain;
    document.getElementById('edit-path').value = cookie.path || '/';
    document.getElementById('edit-secure').checked = cookie.secure || false;
    document.getElementById('edit-httponly').checked = cookie.httpOnly || false;
    document.getElementById('edit-session').checked = !cookie.expirationDate;
    
    if (cookie.expirationDate) {
      const date = new Date(cookie.expirationDate * 1000);
      document.getElementById('edit-expires').value = date.toISOString().slice(0, 16);
    } else {
      document.getElementById('edit-expires').value = '';
    }
    
    if (cookie.sameSite) {
      document.getElementById('edit-samesite').value = cookie.sameSite;
    }

    // Show delete button for existing cookies
    document.getElementById('delete-cookie-btn').style.display = 'block';

    renderCookieList();
  }

  function deleteCookie(name, domain) {
    console.log('Deleting cookie:', name, domain);
    browserAPI.runtime.sendMessage({ 
      type: 'REMOVE_COOKIE', 
      url: window.location.href, 
      name: name,
      domain: domain
    }, (response) => {
      if (response && response.success) {
        console.log('Cookie deleted successfully');
        loadCookies();
        if (selectedCookie && selectedCookie.name === name) {
          document.getElementById('cookie-details').style.display = 'none';
          selectedCookie = null;
        }
      } else {
        console.error('Failed to delete cookie:', response?.error);
      }
    });
  }

  function updateStats() {
    document.getElementById('cookie-count').textContent = `${allCookies.length} cookie${allCookies.length !== 1 ? 's' : ''}`;
  }

  // Export cookies
  function exportCookies() {
    const cookiesJSON = JSON.stringify(allCookies, null, 2);
    const blob = new Blob([cookiesJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cookies_${window.location.hostname}_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Import cookies
  function importCookies() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const cookies = JSON.parse(event.target.result);
            if (Array.isArray(cookies)) {
              cookies.forEach(cookie => {
                browserAPI.runtime.sendMessage({ 
                  type: 'SET_COOKIE', 
                  url: window.location.href,
                  cookie: cookie
                });
              });
              setTimeout(() => loadCookies(), 500);
            }
          } catch (error) {
            alert('Invalid cookie file format');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  // Search functionality
  document.getElementById('cookie-search').addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    filteredCookies = allCookies.filter(cookie => 
      cookie.name.toLowerCase().includes(search) || 
      cookie.value.toLowerCase().includes(search)
    );
    renderCookieList();
  });

  // Add cookie
  document.getElementById('add-cookie-btn').addEventListener('click', () => {
    selectedCookie = null;
    editMode = true;
    document.getElementById('cookie-details').style.display = 'block';
    
    // Clear form
    document.getElementById('edit-name').value = '';
    document.getElementById('edit-value').value = '';
    document.getElementById('edit-domain').value = window.location.hostname;
    document.getElementById('edit-path').value = '/';
    document.getElementById('edit-secure').checked = false;
    document.getElementById('edit-httponly').checked = false;
    document.getElementById('edit-session').checked = true;
    document.getElementById('edit-expires').value = '';
    
    // Hide delete button for new cookies
    document.getElementById('delete-cookie-btn').style.display = 'none';
  });

  // Import cookies
  document.getElementById('import-cookies-btn').addEventListener('click', () => {
    importCookies();
  });

  // Export cookies
  document.getElementById('export-cookies-btn').addEventListener('click', () => {
    exportCookies();
  });

  // Delete all
  document.getElementById('delete-all-btn').addEventListener('click', () => {
    if (confirm(`Delete all ${allCookies.length} cookies?`)) {
      browserAPI.runtime.sendMessage({ 
        type: 'DELETE_ALL_COOKIES', 
        url: window.location.href
      }, () => {
        loadCookies();
        document.getElementById('cookie-details').style.display = 'none';
      });
    }
  });

  // Save cookie
  document.getElementById('save-cookie-btn').addEventListener('click', () => {
    const name = document.getElementById('edit-name').value.trim();
    const value = document.getElementById('edit-value').value;
    const domain = document.getElementById('edit-domain').value.trim();
    const path = document.getElementById('edit-path').value.trim() || '/';
    
    if (!name) {
      alert('Cookie name is required');
      return;
    }
    
    if (!domain) {
      alert('Cookie domain is required');
      return;
    }

    const cookieData = {
      name: name,
      value: value,
      domain: domain,
      path: path,
      secure: document.getElementById('edit-secure').checked,
      httpOnly: document.getElementById('edit-httponly').checked,
      sameSite: document.getElementById('edit-samesite').value
    };

    // Add expiration if not a session cookie
    if (!document.getElementById('edit-session').checked) {
      const expiresInput = document.getElementById('edit-expires').value;
      if (expiresInput) {
        const expires = new Date(expiresInput);
        cookieData.expirationDate = Math.floor(expires.getTime() / 1000);
      }
    }

    console.log('Saving cookie:', cookieData);

    browserAPI.runtime.sendMessage({ 
      type: 'SET_COOKIE', 
      url: window.location.href,
      cookie: cookieData
    }, (response) => {
      if (response && response.success) {
        console.log('Cookie saved successfully');
        setTimeout(() => {
          loadCookies();
          document.getElementById('cookie-details').style.display = 'none';
        }, 300);
      } else {
        console.error('Failed to save cookie:', response?.error);
        alert('Failed to save cookie: ' + (response?.error || 'Unknown error'));
      }
    });
  });

  // Cancel edit
  document.getElementById('cancel-edit-btn').addEventListener('click', () => {
    document.getElementById('cookie-details').style.display = 'none';
    selectedCookie = null;
  });

  // Delete cookie button
  document.getElementById('delete-cookie-btn').addEventListener('click', () => {
    if (selectedCookie && confirm(`Delete cookie "${selectedCookie.name}"?`)) {
      deleteCookie(selectedCookie.name, selectedCookie.domain);
    }
  });

  // Close panel
  document.getElementById('close-cookie-panel').addEventListener('click', () => {
    panel.remove();
    // Turn off toggle
    browserAPI.storage.sync.set({ editCookie: false });
  });

  // Hover effect for close button
  const closeBtn = document.getElementById('close-cookie-panel');
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = '#374151';
    closeBtn.style.color = '#fff';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = 'none';
    closeBtn.style.color = '#9CA3AF';
  });

  // Hover effects for action buttons
  const actionButtons = [
    { id: 'add-cookie-btn', hoverBg: 'rgba(59, 130, 246, 0.3)' },
    { id: 'import-cookies-btn', hoverBg: 'rgba(59, 130, 246, 0.3)' },
    { id: 'export-cookies-btn', hoverBg: 'rgba(59, 130, 246, 0.3)' },
    { id: 'delete-all-btn', hoverBg: 'rgba(239, 68, 68, 0.3)' },
    { id: 'save-cookie-btn', hoverBg: 'rgba(59, 130, 246, 0.3)' },
    { id: 'delete-cookie-btn', hoverBg: 'rgba(239, 68, 68, 0.3)' },
    { id: 'cancel-edit-btn', hoverBg: 'rgba(107, 114, 128, 0.3)' }
  ];

  actionButtons.forEach(({ id, hoverBg }) => {
    const btn = document.getElementById(id);
    if (btn) {
      const originalBg = btn.style.background;
      btn.addEventListener('mouseenter', () => {
        btn.style.background = hoverBg;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = originalBg;
      });
    }
  });

  // Session checkbox toggle
  document.getElementById('edit-session').addEventListener('change', (e) => {
    document.getElementById('edit-expires').disabled = e.target.checked;
  });

  // Initial load
  loadCookies();

  return {
    cleanup: () => panel.remove()
  };
}


// ========== check-seo.js ==========
// SEO & Performance Checker Feature - Comprehensive like Checkbot
function initCheckSEO() {
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  
  // Dragging state
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let panelStartX = 0;
  let panelStartY = 0;

  // Resizing state
  let isResizing = false;
  let resizeStartX = 0;
  let resizeStartY = 0;
  let panelStartWidth = 0;
  let panelStartHeight = 0;

  // Analysis results
  let analysisResults = {
    overview: { pass: 0, warn: 0, fail: 0 },
    seo: [],
    performance: [],
    security: [],
    accessibility: []
  };

  const panel = document.createElement('div');
  panel.id = 'seo-checker-panel';
  panel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 800px;
    height: 600px;
    min-width: 600px;
    min-height: 400px;
    max-width: 95vw;
    max-height: 95vh;
    background: #1F2937;
    border-radius: 12px;
    border: 1px solid #374151;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    z-index: 999999;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #E5E7EB;
    overflow: hidden;
  `;

  panel.innerHTML = `
    <div id="seo-header" style="background: #111827; padding: 16px; border-radius: 12px 12px 0 0; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #374151; cursor: move; user-select: none;">
      <div style="font-weight: 600; font-size: 16px; color: #E5E7EB;">SEO & Performance Checker</div>
      <button id="close-seo-panel" style="background: none; border: none; color: #9CA3AF; cursor: pointer; font-size: 24px; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: all 0.2s;">×</button>
    </div>

    <div style="display: flex; background: #111827; border-bottom: 1px solid #374151; padding: 0 16px;">
      <button class="tab-btn active" data-tab="overview" style="padding: 12px 20px; background: none; border: none; color: #9CA3AF; cursor: pointer; font-size: 14px; font-weight: 500; border-bottom: 2px solid transparent; transition: all 0.2s;">Overview</button>
      <button class="tab-btn" data-tab="seo" style="padding: 12px 20px; background: none; border: none; color: #9CA3AF; cursor: pointer; font-size: 14px; font-weight: 500; border-bottom: 2px solid transparent; transition: all 0.2s;">SEO</button>
      <button class="tab-btn" data-tab="performance" style="padding: 12px 20px; background: none; border: none; color: #9CA3AF; cursor: pointer; font-size: 14px; font-weight: 500; border-bottom: 2px solid transparent; transition: all 0.2s;">Performance</button>
      <button class="tab-btn" data-tab="security" style="padding: 12px 20px; background: none; border: none; color: #9CA3AF; cursor: pointer; font-size: 14px; font-weight: 500; border-bottom: 2px solid transparent; transition: all 0.2s;">Security</button>
      <button class="tab-btn" data-tab="accessibility" style="padding: 12px 20px; background: none; border: none; color: #9CA3AF; cursor: pointer; font-size: 14px; font-weight: 500; border-bottom: 2px solid transparent; transition: all 0.2s;">Accessibility</button>
    </div>

    <div style="flex: 1; overflow-y: auto; padding: 20px;">
      <div id="tab-content-overview" class="tab-content">
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #E5E7EB;">Analysis Summary</h3>
          
          <!-- Performance Meters -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
            <!-- Overall Score Circle -->
            <div style="display: flex; align-items: center; justify-content: center; background: #111827; padding: 30px; border-radius: 12px; border: 1px solid #374151;">
              <div style="position: relative; width: 180px; height: 180px;">
                <svg width="180" height="180" style="transform: rotate(-90deg);">
                  <circle cx="90" cy="90" r="75" fill="none" stroke="#374151" stroke-width="12"/>
                  <circle id="overall-circle" cx="90" cy="90" r="75" fill="none" stroke="#3B82F6" stroke-width="12" stroke-dasharray="471" stroke-dashoffset="471" stroke-linecap="round" style="transition: stroke-dashoffset 1s ease, stroke 0.3s ease;"/>
                </svg>
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                  <div id="overall-score" style="font-size: 48px; font-weight: 700; color: #E5E7EB; line-height: 1;">0%</div>
                  <div style="font-size: 13px; color: #9CA3AF; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Overall</div>
                </div>
              </div>
            </div>

            <!-- Category Scores -->
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <div style="background: #111827; padding: 16px; border-radius: 8px; border: 1px solid #374151;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 14px; color: #E5E7EB; font-weight: 500;">SEO</span>
                  <span id="seo-score" style="font-size: 18px; font-weight: 700; color: #3B82F6;">0%</span>
                </div>
                <div style="height: 8px; background: #374151; border-radius: 4px; overflow: hidden;">
                  <div id="seo-bar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #3B82F6, #60A5FA); transition: width 1s ease, background 0.3s ease; border-radius: 4px;"></div>
                </div>
              </div>

              <div style="background: #111827; padding: 16px; border-radius: 8px; border: 1px solid #374151;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 14px; color: #E5E7EB; font-weight: 500;">Performance</span>
                  <span id="performance-score" style="font-size: 18px; font-weight: 700; color: #3B82F6;">0%</span>
                </div>
                <div style="height: 8px; background: #374151; border-radius: 4px; overflow: hidden;">
                  <div id="performance-bar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #3B82F6, #60A5FA); transition: width 1s ease, background 0.3s ease; border-radius: 4px;"></div>
                </div>
              </div>

              <div style="background: #111827; padding: 16px; border-radius: 8px; border: 1px solid #374151;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 14px; color: #E5E7EB; font-weight: 500;">Security</span>
                  <span id="security-score" style="font-size: 18px; font-weight: 700; color: #3B82F6;">0%</span>
                </div>
                <div style="height: 8px; background: #374151; border-radius: 4px; overflow: hidden;">
                  <div id="security-bar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #3B82F6, #60A5FA); transition: width 1s ease, background 0.3s ease; border-radius: 4px;"></div>
                </div>
              </div>

              <div style="background: #111827; padding: 16px; border-radius: 8px; border: 1px solid #374151;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 14px; color: #E5E7EB; font-weight: 500;">Accessibility</span>
                  <span id="accessibility-score" style="font-size: 18px; font-weight: 700; color: #3B82F6;">0%</span>
                </div>
                <div style="height: 8px; background: #374151; border-radius: 4px; overflow: hidden;">
                  <div id="accessibility-bar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #3B82F6, #60A5FA); transition: width 1s ease, background 0.3s ease; border-radius: 4px;"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Stats Grid -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
            <div style="background: #111827; padding: 20px; border-radius: 8px; border: 1px solid #374151; text-align: center;">
              <div style="font-size: 36px; font-weight: 700; color: #10B981; margin-bottom: 4px;" id="pass-count">0</div>
              <div style="font-size: 13px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px;">Passed</div>
            </div>
            <div style="background: #111827; padding: 20px; border-radius: 8px; border: 1px solid #374151; text-align: center;">
              <div style="font-size: 36px; font-weight: 700; color: #F59E0B; margin-bottom: 4px;" id="warn-count">0</div>
              <div style="font-size: 13px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px;">Warnings</div>
            </div>
            <div style="background: #111827; padding: 20px; border-radius: 8px; border: 1px solid #374151; text-align: center;">
              <div style="font-size: 36px; font-weight: 700; color: #EF4444; margin-bottom: 4px;" id="fail-count">0</div>
              <div style="font-size: 13px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px;">Failed</div>
            </div>
          </div>

          <!-- Page Statistics -->
          <div style="background: #111827; padding: 20px; border-radius: 8px; border: 1px solid #374151; margin-bottom: 24px;">
            <h4 style="font-size: 14px; font-weight: 600; color: #E5E7EB; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">Page Statistics</h4>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #374151;">
                <span style="font-size: 13px; color: #9CA3AF;">Images</span>
                <span id="stat-images" style="font-size: 14px; color: #60A5FA; font-weight: 600;">0</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #374151;">
                <span style="font-size: 13px; color: #9CA3AF;">Links</span>
                <span id="stat-links" style="font-size: 14px; color: #60A5FA; font-weight: 600;">0</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #374151;">
                <span style="font-size: 13px; color: #9CA3AF;">CSS Files</span>
                <span id="stat-css" style="font-size: 14px; color: #60A5FA; font-weight: 600;">0</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #374151;">
                <span style="font-size: 13px; color: #9CA3AF;">JavaScript Files</span>
                <span id="stat-js" style="font-size: 14px; color: #60A5FA; font-weight: 600;">0</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #374151;">
                <span style="font-size: 13px; color: #9CA3AF;">Headings</span>
                <span id="stat-headings" style="font-size: 14px; color: #60A5FA; font-weight: 600;">0</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #374151;">
                <span style="font-size: 13px; color: #9CA3AF;">Forms</span>
                <span id="stat-forms" style="font-size: 14px; color: #60A5FA; font-weight: 600;">0</span>
              </div>
            </div>
          </div>
        </div>
        <div id="overview-details"></div>
      </div>

      <div id="tab-content-seo" class="tab-content" style="display: none;"></div>
      <div id="tab-content-performance" class="tab-content" style="display: none;"></div>
      <div id="tab-content-security" class="tab-content" style="display: none;"></div>
      <div id="tab-content-accessibility" class="tab-content" style="display: none;"></div>
    </div>
  `;

  document.body.appendChild(panel);

  // Add resize handle
  const resizeHandle = document.createElement('div');
  resizeHandle.id = 'resize-handle-seo';
  resizeHandle.style.cssText = `
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    cursor: nwse-resize;
    background: linear-gradient(135deg, transparent 50%, #666 50%);
    border-radius: 0 0 12px 0;
    z-index: 10;
  `;
  panel.appendChild(resizeHandle);

  // Make panel draggable
  const header = document.getElementById('seo-header');
  
  header.addEventListener('mousedown', (e) => {
    if (e.target.id === 'close-seo-panel' || e.target.closest('#close-seo-panel')) {
      return;
    }
    
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    
    const rect = panel.getBoundingClientRect();
    panelStartX = rect.left;
    panelStartY = rect.top;
    
    panel.style.transform = 'none';
    panel.style.left = panelStartX + 'px';
    panel.style.top = panelStartY + 'px';
    
    header.style.cursor = 'grabbing';
    e.preventDefault();
  });

  // Make panel resizable
  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    
    panelStartWidth = panel.offsetWidth;
    panelStartHeight = panel.offsetHeight;
    
    e.preventDefault();
    e.stopPropagation();
  });

  // Mouse move handler
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;
      
      let newX = panelStartX + deltaX;
      let newY = panelStartY + deltaY;
      
      const maxX = window.innerWidth - panel.offsetWidth;
      const maxY = window.innerHeight - panel.offsetHeight;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      panel.style.left = newX + 'px';
      panel.style.top = newY + 'px';
    }
    
    if (isResizing) {
      const deltaX = e.clientX - resizeStartX;
      const deltaY = e.clientY - resizeStartY;
      
      let newWidth = panelStartWidth + deltaX;
      let newHeight = panelStartHeight + deltaY;
      
      newWidth = Math.max(600, Math.min(newWidth, window.innerWidth * 0.95));
      newHeight = Math.max(400, Math.min(newHeight, window.innerHeight * 0.95));
      
      panel.style.width = newWidth + 'px';
      panel.style.height = newHeight + 'px';
    }
  });

  // Mouse up handler
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      header.style.cursor = 'move';
    }
    if (isResizing) {
      isResizing = false;
    }
  });

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      
      // Update active tab button
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
        b.style.color = '#9CA3AF';
        b.style.borderBottomColor = 'transparent';
      });
      btn.classList.add('active');
      btn.style.color = '#60A5FA';
      btn.style.borderBottomColor = '#3B82F6';
      
      // Show corresponding content
      document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
      });
      document.getElementById(`tab-content-${tab}`).style.display = 'block';
    });
  });

  // Close panel
  document.getElementById('close-seo-panel').addEventListener('click', () => {
    panel.remove();
    browserAPI.storage.sync.set({ checkSeo: false });
  });

  // Hover effect for close button
  const closeBtn = document.getElementById('close-seo-panel');
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = '#374151';
    closeBtn.style.color = '#fff';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = 'none';
    closeBtn.style.color = '#9CA3AF';
  });

  // Analysis functions
  function analyzeSEO() {
    const checks = [];
    
    // Title check
    const title = document.querySelector('title');
    if (title && title.textContent.trim()) {
      const titleLength = title.textContent.trim().length;
      if (titleLength >= 30 && titleLength <= 60) {
        checks.push({
          status: 'pass',
          title: 'Page Title',
          value: title.textContent.trim(),
          message: 'Title length is optimal (30-60 characters)',
          improve: ''
        });
      } else {
        checks.push({
          status: 'warn',
          title: 'Page Title',
          value: title.textContent.trim(),
          message: `Title length is ${titleLength} characters`,
          improve: 'Keep your title between 30-60 characters for optimal display in search results. Titles that are too short may not be descriptive enough, while titles that are too long will be truncated.'
        });
      }
    } else {
      checks.push({
        status: 'fail',
        title: 'Page Title',
        value: 'Missing',
        message: 'No title tag found',
        improve: 'Add a <title> tag in the <head> section. The title should be unique, descriptive, and between 30-60 characters. It appears in search results and browser tabs.'
      });
    }

    // Meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && metaDesc.content.trim()) {
      const descLength = metaDesc.content.trim().length;
      if (descLength >= 120 && descLength <= 160) {
        checks.push({
          status: 'pass',
          title: 'Meta Description',
          value: metaDesc.content.trim(),
          message: 'Description length is optimal (120-160 characters)',
          improve: ''
        });
      } else {
        checks.push({
          status: 'warn',
          title: 'Meta Description',
          value: metaDesc.content.trim(),
          message: `Description length is ${descLength} characters`,
          improve: 'Keep your meta description between 120-160 characters. This text appears in search results below your title and should accurately summarize your page content.'
        });
      }
    } else {
      checks.push({
        status: 'fail',
        title: 'Meta Description',
        value: 'Missing',
        message: 'No meta description found',
        improve: 'Add a <meta name="description" content="..."> tag in the <head> section. Write a compelling 120-160 character summary that encourages clicks from search results.'
      });
    }

    // H1 headings
    const h1s = document.querySelectorAll('h1');
    if (h1s.length === 1) {
      checks.push({
        status: 'pass',
        title: 'H1 Heading',
        value: h1s[0].textContent.trim().substring(0, 100),
        message: 'One H1 heading found',
        improve: ''
      });
    } else if (h1s.length === 0) {
      checks.push({
        status: 'fail',
        title: 'H1 Heading',
        value: 'Missing',
        message: 'No H1 heading found',
        improve: 'Add exactly one <h1> tag to your page. The H1 should contain your main keyword and clearly describe the page content. It helps search engines understand your page topic.'
      });
    } else {
      checks.push({
        status: 'warn',
        title: 'H1 Heading',
        value: `${h1s.length} H1 tags found`,
        message: 'Multiple H1 headings found',
        improve: 'Use only one <h1> tag per page. Multiple H1s can confuse search engines about your page\'s main topic. Use <h2>, <h3>, etc. for subheadings.'
      });
    }

    // Images with alt text
    const images = document.querySelectorAll('img');
    const imagesWithoutAlt = Array.from(images).filter(img => !img.alt || img.alt.trim() === '');
    if (images.length > 0) {
      if (imagesWithoutAlt.length === 0) {
        checks.push({
          status: 'pass',
          title: 'Image Alt Text',
          value: `${images.length} images, all have alt text`,
          message: 'All images have alt attributes',
          improve: ''
        });
      } else {
        checks.push({
          status: 'warn',
          title: 'Image Alt Text',
          value: `${imagesWithoutAlt.length} of ${images.length} images missing alt text`,
          message: 'Some images are missing alt attributes',
          improve: 'Add descriptive alt text to all images. Alt text helps search engines understand image content and improves accessibility for screen readers. Describe what the image shows in 10-15 words.'
        });
      }
    }

    // Canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && canonical.href) {
      checks.push({
        status: 'pass',
        title: 'Canonical URL',
        value: canonical.href,
        message: 'Canonical URL is set',
        improve: ''
      });
    } else {
      checks.push({
        status: 'warn',
        title: 'Canonical URL',
        value: 'Not set',
        message: 'No canonical URL found',
        improve: 'Add a <link rel="canonical" href="..."> tag to specify the preferred URL for this page. This prevents duplicate content issues when the same content is accessible via multiple URLs.'
      });
    }

    // Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    const ogCount = [ogTitle, ogDesc, ogImage].filter(Boolean).length;
    
    if (ogCount === 3) {
      checks.push({
        status: 'pass',
        title: 'Open Graph Tags',
        value: 'All essential tags present',
        message: 'og:title, og:description, og:image found',
        improve: ''
      });
    } else if (ogCount > 0) {
      checks.push({
        status: 'warn',
        title: 'Open Graph Tags',
        value: `${ogCount} of 3 essential tags found`,
        message: 'Some Open Graph tags are missing',
        improve: 'Add og:title, og:description, and og:image meta tags. These control how your page appears when shared on social media platforms like Facebook, LinkedIn, and Slack.'
      });
    } else {
      checks.push({
        status: 'fail',
        title: 'Open Graph Tags',
        value: 'Missing',
        message: 'No Open Graph tags found',
        improve: 'Add Open Graph meta tags (og:title, og:description, og:image) to control how your page appears when shared on social media. This significantly improves click-through rates from social platforms.'
      });
    }

    // Robots meta tag
    const robots = document.querySelector('meta[name="robots"]');
    if (robots) {
      const content = robots.content.toLowerCase();
      if (content.includes('noindex') || content.includes('nofollow')) {
        checks.push({
          status: 'warn',
          title: 'Robots Meta Tag',
          value: robots.content,
          message: 'Page has indexing restrictions',
          improve: 'Your robots meta tag contains "noindex" or "nofollow". This prevents search engines from indexing your page or following links. Remove these directives if you want this page to appear in search results.'
        });
      } else {
        checks.push({
          status: 'pass',
          title: 'Robots Meta Tag',
          value: robots.content,
          message: 'Robots tag allows indexing',
          improve: ''
        });
      }
    }

    // Structured data
    const jsonLd = document.querySelectorAll('script[type="application/ld+json"]');
    if (jsonLd.length > 0) {
      checks.push({
        status: 'pass',
        title: 'Structured Data',
        value: `${jsonLd.length} schema(s) found`,
        message: 'Structured data is present',
        improve: ''
      });
    } else {
      checks.push({
        status: 'warn',
        title: 'Structured Data',
        value: 'Not found',
        message: 'No structured data detected',
        improve: 'Add JSON-LD structured data to help search engines better understand your content. Use Schema.org vocabulary to mark up products, articles, events, reviews, and other content types for rich search results.'
      });
    }

    // Language declaration
    const htmlLang = document.documentElement.lang;
    if (htmlLang && htmlLang.trim()) {
      checks.push({
        status: 'pass',
        title: 'Language Declaration',
        value: htmlLang,
        message: 'Page language is declared',
        improve: ''
      });
    } else {
      checks.push({
        status: 'warn',
        title: 'Language Declaration',
        value: 'Not set',
        message: 'No language attribute on <html> tag',
        improve: 'Add a lang attribute to your <html> tag (e.g., <html lang="en">). This helps search engines understand your content language and improves accessibility for screen readers.'
      });
    }

    return checks;
  }

  function analyzePerformance() {
    const checks = [];
    
    // Page load time (using Navigation Timing API)
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      
      if (loadTime < 3000) {
        checks.push({
          status: 'pass',
          title: 'Page Load Time',
          value: `${(loadTime / 1000).toFixed(2)}s`,
          message: 'Page loads quickly',
          improve: ''
        });
      } else if (loadTime < 5000) {
        checks.push({
          status: 'warn',
          title: 'Page Load Time',
          value: `${(loadTime / 1000).toFixed(2)}s`,
          message: 'Page load time is moderate',
          improve: 'Optimize your page to load in under 3 seconds. Compress images, minify CSS/JS, enable browser caching, use a CDN, and consider lazy loading for below-the-fold content.'
        });
      } else {
        checks.push({
          status: 'fail',
          title: 'Page Load Time',
          value: `${(loadTime / 1000).toFixed(2)}s`,
          message: 'Page loads slowly',
          improve: 'Your page takes over 5 seconds to load. This significantly impacts user experience and SEO. Prioritize: image optimization, code minification, server response time, and removing render-blocking resources.'
        });
      }
    }

    // Image optimization
    const images = document.querySelectorAll('img');
    const largeImages = Array.from(images).filter(img => {
      return img.naturalWidth > 2000 || img.naturalHeight > 2000;
    });
    
    if (images.length > 0) {
      if (largeImages.length === 0) {
        checks.push({
          status: 'pass',
          title: 'Image Sizes',
          value: `${images.length} images checked`,
          message: 'No oversized images detected',
          improve: ''
        });
      } else {
        checks.push({
          status: 'warn',
          title: 'Image Sizes',
          value: `${largeImages.length} oversized images found`,
          message: 'Some images are very large',
          improve: 'Resize images to appropriate dimensions before uploading. Use responsive images with srcset, compress images (aim for <200KB), and consider modern formats like WebP for better compression.'
        });
      }
    }

    // CSS files
    const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
    if (cssLinks.length <= 3) {
      checks.push({
        status: 'pass',
        title: 'CSS Files',
        value: `${cssLinks.length} stylesheet(s)`,
        message: 'Reasonable number of CSS files',
        improve: ''
      });
    } else {
      checks.push({
        status: 'warn',
        title: 'CSS Files',
        value: `${cssLinks.length} stylesheet(s)`,
        message: 'Many CSS files detected',
        improve: 'Combine multiple CSS files into one to reduce HTTP requests. Minify CSS, remove unused styles, and consider inlining critical CSS for above-the-fold content.'
      });
    }

    // JavaScript files
    const scripts = document.querySelectorAll('script[src]');
    if (scripts.length <= 5) {
      checks.push({
        status: 'pass',
        title: 'JavaScript Files',
        value: `${scripts.length} script(s)`,
        message: 'Reasonable number of JS files',
        improve: ''
      });
    } else {
      checks.push({
        status: 'warn',
        title: 'JavaScript Files',
        value: `${scripts.length} script(s)`,
        message: 'Many JavaScript files detected',
        improve: 'Combine and minify JavaScript files. Use async or defer attributes to prevent render blocking. Consider code splitting to load only necessary scripts per page.'
      });
    }

    // Inline styles
    const elementsWithStyle = document.querySelectorAll('[style]');
    if (elementsWithStyle.length < 10) {
      checks.push({
        status: 'pass',
        title: 'Inline Styles',
        value: `${elementsWithStyle.length} elements`,
        message: 'Minimal inline styles',
        improve: ''
      });
    } else {
      checks.push({
        status: 'warn',
        title: 'Inline Styles',
        value: `${elementsWithStyle.length} elements`,
        message: 'Many inline styles detected',
        improve: 'Move inline styles to external CSS files. This improves caching, reduces HTML size, and makes maintenance easier. Use CSS classes instead of inline style attributes.'
      });
    }

    // Viewport meta tag
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      checks.push({
        status: 'pass',
        title: 'Mobile Viewport',
        value: viewport.content,
        message: 'Viewport meta tag is present',
        improve: ''
      });
    } else {
      checks.push({
        status: 'fail',
        title: 'Mobile Viewport',
        value: 'Missing',
        message: 'No viewport meta tag found',
        improve: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the <head>. This ensures your page displays correctly on mobile devices and is required for mobile-friendly ranking.'
      });
    }

    return checks;
  }

  function analyzeSecurity() {
    const checks = [];
    
    // HTTPS
    if (window.location.protocol === 'https:') {
      checks.push({
        status: 'pass',
        title: 'HTTPS',
        value: 'Enabled',
        message: 'Page is served over HTTPS',
        improve: ''
      });
    } else {
      checks.push({
        status: 'fail',
        title: 'HTTPS',
        value: 'Not enabled',
        message: 'Page is not served over HTTPS',
        improve: 'Enable HTTPS for your entire site. HTTPS encrypts data between users and your server, protects against man-in-the-middle attacks, and is required for many modern web features. It\'s also a ranking factor.'
      });
    }

    // Mixed content
    const httpResources = Array.from(document.querySelectorAll('img[src^="http:"], script[src^="http:"], link[href^="http:"]'));
    if (window.location.protocol === 'https:' && httpResources.length > 0) {
      checks.push({
        status: 'warn',
        title: 'Mixed Content',
        value: `${httpResources.length} insecure resource(s)`,
        message: 'HTTP resources on HTTPS page',
        improve: 'Replace all HTTP URLs with HTTPS. Mixed content (HTTP resources on HTTPS pages) can be blocked by browsers and creates security vulnerabilities. Update all resource URLs to use HTTPS.'
      });
    } else {
      checks.push({
        status: 'pass',
        title: 'Mixed Content',
        value: 'None detected',
        message: 'No mixed content issues',
        improve: ''
      });
    }

    // Content Security Policy
    const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (csp) {
      checks.push({
        status: 'pass',
        title: 'Content Security Policy',
        value: 'Implemented',
        message: 'CSP header is present',
        improve: ''
      });
    } else {
      checks.push({
        status: 'warn',
        title: 'Content Security Policy',
        value: 'Not found',
        message: 'No CSP detected',
        improve: 'Implement Content Security Policy headers to prevent XSS attacks, clickjacking, and other code injection attacks. Start with a report-only policy to test before enforcing.'
      });
    }

    // X-Frame-Options
    checks.push({
      status: 'warn',
      title: 'Clickjacking Protection',
      value: 'Cannot verify from client',
      message: 'X-Frame-Options header check requires server',
      improve: 'Ensure X-Frame-Options or CSP frame-ancestors is set on your server to prevent clickjacking attacks. Use "SAMEORIGIN" to allow framing only from same origin, or "DENY" to block all framing.'
    });

    // Inline JavaScript
    const inlineScripts = document.querySelectorAll('script:not([src])');
    const inlineEventHandlers = document.querySelectorAll('[onclick], [onload], [onerror]');
    const totalInline = inlineScripts.length + inlineEventHandlers.length;
    
    if (totalInline < 5) {
      checks.push({
        status: 'pass',
        title: 'Inline JavaScript',
        value: `${totalInline} instance(s)`,
        message: 'Minimal inline JavaScript',
        improve: ''
      });
    } else {
      checks.push({
        status: 'warn',
        title: 'Inline JavaScript',
        value: `${totalInline} instance(s)`,
        message: 'Multiple inline scripts detected',
        improve: 'Move inline JavaScript to external files. This improves security (enables stricter CSP), caching, and code maintainability. Avoid inline event handlers like onclick.'
      });
    }

    return checks;
  }

  function analyzeAccessibility() {
    const checks = [];
    
    // Alt text on images
    const images = document.querySelectorAll('img');
    const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
    
    if (images.length > 0) {
      if (imagesWithoutAlt.length === 0) {
        checks.push({
          status: 'pass',
          title: 'Image Alt Text',
          value: `${images.length} images checked`,
          message: 'All images have alt attributes',
          improve: ''
        });
      } else {
        checks.push({
          status: 'fail',
          title: 'Image Alt Text',
          value: `${imagesWithoutAlt.length} missing alt text`,
          message: 'Some images lack alt attributes',
          improve: 'Add alt text to all images. Screen readers use alt text to describe images to visually impaired users. Decorative images should have empty alt="" attributes.'
        });
      }
    }

    // Form labels
    const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
    const inputsWithoutLabels = Array.from(inputs).filter(input => {
      const id = input.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = input.getAttribute('aria-label');
      return !hasLabel && !hasAriaLabel;
    });
    
    if (inputs.length > 0) {
      if (inputsWithoutLabels.length === 0) {
        checks.push({
          status: 'pass',
          title: 'Form Labels',
          value: `${inputs.length} inputs checked`,
          message: 'All form inputs have labels',
          improve: ''
        });
      } else {
        checks.push({
          status: 'fail',
          title: 'Form Labels',
          value: `${inputsWithoutLabels.length} inputs without labels`,
          message: 'Some form inputs lack labels',
          improve: 'Associate every form input with a <label> element using the for attribute, or use aria-label. This helps screen reader users understand what each field is for.'
        });
      }
    }

    // Heading hierarchy
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const headingLevels = headings.map(h => parseInt(h.tagName[1]));
    let hierarchyIssue = false;
    
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i-1] > 1) {
        hierarchyIssue = true;
        break;
      }
    }
    
    if (headings.length > 0) {
      if (!hierarchyIssue) {
        checks.push({
          status: 'pass',
          title: 'Heading Hierarchy',
          value: `${headings.length} headings checked`,
          message: 'Heading structure is logical',
          improve: ''
        });
      } else {
        checks.push({
          status: 'warn',
          title: 'Heading Hierarchy',
          value: 'Hierarchy issues detected',
          message: 'Heading levels are skipped',
          improve: 'Maintain proper heading hierarchy (h1 → h2 → h3). Don\'t skip levels (e.g., h1 → h3). This helps screen reader users navigate your content structure.'
        });
      }
    }

    // Link text
    const links = document.querySelectorAll('a[href]');
    const vagueLinkText = ['click here', 'read more', 'here', 'more', 'link'];
    const vagueLinks = Array.from(links).filter(link => {
      const text = link.textContent.trim().toLowerCase();
      return vagueLinkText.includes(text);
    });
    
    if (links.length > 0) {
      if (vagueLinks.length === 0) {
        checks.push({
          status: 'pass',
          title: 'Link Text',
          value: `${links.length} links checked`,
          message: 'Link text is descriptive',
          improve: ''
        });
      } else {
        checks.push({
          status: 'warn',
          title: 'Link Text',
          value: `${vagueLinks.length} vague links found`,
          message: 'Some links have non-descriptive text',
          improve: 'Use descriptive link text that makes sense out of context. Avoid generic phrases like "click here" or "read more". Screen reader users often navigate by links alone.'
        });
      }
    }

    // Color contrast (basic check)
    checks.push({
      status: 'warn',
      title: 'Color Contrast',
      value: 'Manual check recommended',
      message: 'Automated contrast checking is limited',
      improve: 'Ensure text has sufficient contrast against backgrounds (4.5:1 for normal text, 3:1 for large text). Use tools like WebAIM Contrast Checker or browser DevTools to verify contrast ratios.'
    });

    return checks;
  }

  // Render check item
  function renderCheckItem(check) {
    const statusColors = {
      pass: { bg: 'rgba(16, 185, 129, 0.1)', border: '#10B981', text: '#10B981', icon: '✓' },
      warn: { bg: 'rgba(245, 158, 11, 0.1)', border: '#F59E0B', text: '#F59E0B', icon: '⚠' },
      fail: { bg: 'rgba(239, 68, 68, 0.1)', border: '#EF4444', text: '#EF4444', icon: '✕' }
    };
    
    const color = statusColors[check.status];
    const hasImprove = check.improve && check.improve.trim();
    
    const item = document.createElement('div');
    item.style.cssText = `
      background: #111827;
      border: 1px solid #374151;
      border-left: 3px solid ${color.border};
      border-radius: 8px;
      margin-bottom: 12px;
      overflow: hidden;
    `;
    
    item.innerHTML = `
      <div class="check-header" style="padding: 16px; cursor: ${hasImprove ? 'pointer' : 'default'}; user-select: none;">
        <div style="display: flex; align-items: start; gap: 12px;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background: ${color.bg}; border: 2px solid ${color.border}; display: flex; align-items: center; justify-content: center; color: ${color.text}; font-weight: bold; font-size: 14px; flex-shrink: 0;">
            ${color.icon}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <div style="font-weight: 600; font-size: 14px; color: #E5E7EB;">${check.title}</div>
              ${hasImprove ? '<div style="color: #9CA3AF; font-size: 18px; transform: rotate(0deg); transition: transform 0.2s;">›</div>' : ''}
            </div>
            <div style="font-size: 13px; color: #9CA3AF; margin-bottom: 4px;">${check.message}</div>
            <div style="font-size: 12px; color: #6B7280; font-family: monospace; word-break: break-all;">${check.value}</div>
          </div>
        </div>
      </div>
      ${hasImprove ? `
        <div class="check-details" style="display: none; padding: 0 16px 16px 52px; border-top: 1px solid #374151;">
          <div style="margin-top: 12px; padding: 12px; background: #1F2937; border-radius: 6px; border-left: 3px solid #3B82F6;">
            <div style="font-size: 11px; color: #60A5FA; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">How to Improve</div>
            <div style="font-size: 13px; color: #D1D5DB; line-height: 1.6;">${check.improve}</div>
          </div>
        </div>
      ` : ''}
    `;
    
    if (hasImprove) {
      const header = item.querySelector('.check-header');
      const details = item.querySelector('.check-details');
      const arrow = item.querySelector('.check-header > div > div > div:last-child');
      
      header.addEventListener('click', () => {
        const isOpen = details.style.display === 'block';
        details.style.display = isOpen ? 'none' : 'block';
        if (arrow) {
          arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
        }
      });
      
      header.addEventListener('mouseenter', () => {
        header.style.background = '#1F2937';
      });
      
      header.addEventListener('mouseleave', () => {
        header.style.background = 'transparent';
      });
    }
    
    return item;
  }

  // Run analysis
  function runAnalysis() {
    analysisResults.seo = analyzeSEO();
    analysisResults.performance = analyzePerformance();
    analysisResults.security = analyzeSecurity();
    analysisResults.accessibility = analyzeAccessibility();
    
    // Calculate overview stats
    const allChecks = [
      ...analysisResults.seo,
      ...analysisResults.performance,
      ...analysisResults.security,
      ...analysisResults.accessibility
    ];
    
    analysisResults.overview = {
      pass: allChecks.filter(c => c.status === 'pass').length,
      warn: allChecks.filter(c => c.status === 'warn').length,
      fail: allChecks.filter(c => c.status === 'fail').length
    };
    
    // Calculate scores for each category
    const calculateScore = (checks) => {
      if (checks.length === 0) return 100;
      const passCount = checks.filter(c => c.status === 'pass').length;
      const warnCount = checks.filter(c => c.status === 'warn').length;
      const failCount = checks.filter(c => c.status === 'fail').length;
      // Pass = 100%, Warn = 50%, Fail = 0%
      return Math.round(((passCount * 100) + (warnCount * 50)) / checks.length);
    };
    
    const seoScore = calculateScore(analysisResults.seo);
    const perfScore = calculateScore(analysisResults.performance);
    const secScore = calculateScore(analysisResults.security);
    const a11yScore = calculateScore(analysisResults.accessibility);
    const overallScore = Math.round((seoScore + perfScore + secScore + a11yScore) / 4);
    
    // Update scores with animation
    setTimeout(() => {
      updateScore('overall', overallScore);
      updateScore('seo', seoScore);
      updateScore('performance', perfScore);
      updateScore('security', secScore);
      updateScore('accessibility', a11yScore);
    }, 100);
    
    // Update stats
    document.getElementById('pass-count').textContent = analysisResults.overview.pass;
    document.getElementById('warn-count').textContent = analysisResults.overview.warn;
    document.getElementById('fail-count').textContent = analysisResults.overview.fail;
    
    // Update page statistics
    document.getElementById('stat-images').textContent = document.querySelectorAll('img').length;
    document.getElementById('stat-links').textContent = document.querySelectorAll('a[href]').length;
    document.getElementById('stat-css').textContent = document.querySelectorAll('link[rel="stylesheet"]').length;
    document.getElementById('stat-js').textContent = document.querySelectorAll('script[src]').length;
    document.getElementById('stat-headings').textContent = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
    document.getElementById('stat-forms').textContent = document.querySelectorAll('form').length;
    
    // Render overview details
    const overviewDetails = document.getElementById('overview-details');
    overviewDetails.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h4 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #E5E7EB;">Critical Issues</h4>
        <div id="overview-critical"></div>
      </div>
      <div>
        <h4 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #E5E7EB;">Warnings</h4>
        <div id="overview-warnings"></div>
      </div>
    `;
    
    const criticalIssues = allChecks.filter(c => c.status === 'fail');
    const warnings = allChecks.filter(c => c.status === 'warn').slice(0, 5);
    
    const criticalContainer = document.getElementById('overview-critical');
    if (criticalIssues.length > 0) {
      criticalIssues.forEach(check => {
        criticalContainer.appendChild(renderCheckItem(check));
      });
    } else {
      criticalContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #6B7280; background: #111827; border-radius: 8px; border: 1px solid #374151;">No critical issues found</div>';
    }
    
    const warningsContainer = document.getElementById('overview-warnings');
    if (warnings.length > 0) {
      warnings.forEach(check => {
        warningsContainer.appendChild(renderCheckItem(check));
      });
    } else {
      warningsContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #6B7280; background: #111827; border-radius: 8px; border: 1px solid #374151;">No warnings found</div>';
    }
    
    // Render SEO tab
    const seoContent = document.getElementById('tab-content-seo');
    seoContent.innerHTML = `
      <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #E5E7EB;">SEO Analysis</h3>
      <div id="seo-checks"></div>
    `;
    const seoChecks = document.getElementById('seo-checks');
    analysisResults.seo.forEach(check => {
      seoChecks.appendChild(renderCheckItem(check));
    });
    
    // Render Performance tab
    const perfContent = document.getElementById('tab-content-performance');
    perfContent.innerHTML = `
      <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #E5E7EB;">Performance Analysis</h3>
      <div id="performance-checks"></div>
    `;
    const perfChecks = document.getElementById('performance-checks');
    analysisResults.performance.forEach(check => {
      perfChecks.appendChild(renderCheckItem(check));
    });
    
    // Render Security tab
    const secContent = document.getElementById('tab-content-security');
    secContent.innerHTML = `
      <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #E5E7EB;">Security Analysis</h3>
      <div id="security-checks"></div>
    `;
    const secChecks = document.getElementById('security-checks');
    analysisResults.security.forEach(check => {
      secChecks.appendChild(renderCheckItem(check));
    });
    
    // Render Accessibility tab
    const a11yContent = document.getElementById('tab-content-accessibility');
    a11yContent.innerHTML = `
      <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #E5E7EB;">Accessibility Analysis</h3>
      <div id="accessibility-checks"></div>
    `;
    const a11yChecks = document.getElementById('accessibility-checks');
    analysisResults.accessibility.forEach(check => {
      a11yChecks.appendChild(renderCheckItem(check));
    });
  }

  // Update score with animation
  function updateScore(category, score) {
    const getColor = (score) => {
      if (score >= 80) return { stroke: '#10B981', gradient: 'linear-gradient(90deg, #10B981, #34D399)' };
      if (score >= 60) return { stroke: '#3B82F6', gradient: 'linear-gradient(90deg, #3B82F6, #60A5FA)' };
      if (score >= 40) return { stroke: '#F59E0B', gradient: 'linear-gradient(90deg, #F59E0B, #FBBF24)' };
      return { stroke: '#EF4444', gradient: 'linear-gradient(90deg, #EF4444, #F87171)' };
    };
    
    const color = getColor(score);
    
    if (category === 'overall') {
      const circle = document.getElementById('overall-circle');
      const scoreText = document.getElementById('overall-score');
      const circumference = 2 * Math.PI * 75;
      const offset = circumference - (score / 100) * circumference;
      
      circle.style.strokeDashoffset = offset;
      circle.style.stroke = color.stroke;
      scoreText.textContent = score + '%';
      scoreText.style.color = color.stroke;
    } else {
      const bar = document.getElementById(`${category}-bar`);
      const scoreText = document.getElementById(`${category}-score`);
      
      bar.style.width = score + '%';
      bar.style.background = color.gradient;
      scoreText.textContent = score + '%';
      scoreText.style.color = color.stroke;
    }
  }

  // Initialize active tab styling
  const activeTab = document.querySelector('.tab-btn.active');
  if (activeTab) {
    activeTab.style.color = '#60A5FA';
    activeTab.style.borderBottomColor = '#3B82F6';
  }

  // Run analysis
  runAnalysis();

  return {
    cleanup: () => panel.remove()
  };
}


// ========== focus-mode.js ==========
// Focus Mode - Remove YouTube distractions for focused learning
function initFocusMode() {
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


// ========== passive-watching.js ==========
// Nuclear Mode - Website blocker with whitelist and timer
function initPassiveWatching() {
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  
  let panel = null;
  let whitelist = [];
  let timerEndTime = null;
  let timerInterval = null;
  let isActive = false;

  // Load saved settings
  browserAPI.storage.local.get(['nuclearMode'], (result) => {
    if (result.nuclearMode) {
      whitelist = result.nuclearMode.whitelist || [];
      timerEndTime = result.nuclearMode.timerEndTime || null;
      isActive = result.nuclearMode.isActive || false;
      
      if (isActive && timerEndTime) {
        checkAndBlockSite();
        startTimer();
      }
    }
  });

  // Listen for updates from other tabs
  browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'NUCLEAR_MODE_UPDATED') {
      whitelist = message.data.whitelist || [];
      timerEndTime = message.data.timerEndTime || null;
      isActive = message.data.isActive || false;
      
      if (isActive && timerEndTime) {
        checkAndBlockSite();
        if (!timerInterval) startTimer();
      } else {
        deactivateNuclearMode();
      }
    }
  });

  // Save settings and notify other tabs
  function saveSettings() {
    const data = {
      whitelist,
      timerEndTime,
      isActive
    };
    
    browserAPI.storage.local.set({ nuclearMode: data });
    
    // Notify background to update all tabs
    browserAPI.runtime.sendMessage({
      type: 'NUCLEAR_MODE_UPDATE',
      data: data
    }).catch(() => {});
  }

  // Check if current site is blocked
  function checkAndBlockSite() {
    if (!isActive || !timerEndTime) return;
    
    const now = Date.now();
    if (now > timerEndTime) {
      // Timer expired
      deactivateNuclearMode();
      return;
    }

    const currentDomain = window.location.hostname;
    const isWhitelisted = whitelist.some(site => {
      const cleanSite = site.replace(/^https?:\/\//, '').replace(/^www\./, '');
      const cleanCurrent = currentDomain.replace(/^www\./, '');
      return cleanCurrent.includes(cleanSite) || cleanSite.includes(cleanCurrent);
    });

    if (!isWhitelisted) {
      showBlockedPage();
    }

    // Add warning before closing browser/tab
    enableCloseWarning();
  }

  // Prevent closing browser/tab with warning
  function enableCloseWarning() {
    window.addEventListener('beforeunload', handleBeforeUnload);
  }

  function disableCloseWarning() {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  }

  function handleBeforeUnload(e) {
    if (!isActive || !timerEndTime) return;
    
    const timeLeft = Math.ceil((timerEndTime - Date.now()) / 1000 / 60);
    if (timeLeft > 0) {
      const message = `Nuclear Mode is active! ${timeLeft} minutes remaining. Are you sure you want to quit?`;
      e.preventDefault();
      e.returnValue = message;
      return message;
    }
  }

  // Show blocked page overlay
  function showBlockedPage() {
    const overlay = document.createElement('div');
    overlay.id = 'nuclear-mode-block';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
      z-index: 999999999; display: flex; align-items: center; justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    const timeLeft = Math.ceil((timerEndTime - Date.now()) / 1000 / 60);
    
    overlay.innerHTML = `
      <div style="text-align: center; color: white; max-width: 500px; padding: 40px;">
        <h1 style="font-size: 36px; margin: 0 0 16px 0; font-weight: 700;">Nuclear Mode Active</h1>
        <p style="font-size: 18px; color: #9CA3AF; margin-bottom: 32px;">
          This website is blocked. You can only access whitelisted sites.
        </p>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; margin-bottom: 24px;">
          <div style="font-size: 14px; color: #D1D5DB; margin-bottom: 8px;">Time Remaining</div>
          <div id="block-timer" style="font-size: 48px; font-weight: 700; color: #EF4444;">${timeLeft} min</div>
        </div>
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #EF4444; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <p style="font-size: 14px; color: #FCA5A5; margin: 0;">
            Closing the browser will show a warning. Stay focused!
          </p>
        </div>
        <p style="font-size: 14px; color: #6B7280;">
          Stay focused on your whitelisted sites to complete your session.
        </p>
      </div>
    `;

    document.body.innerHTML = '';
    document.body.appendChild(overlay);

    // Prevent right-click and shortcuts
    document.addEventListener('contextmenu', preventEscape, true);
    document.addEventListener('keydown', preventEscapeKeys, true);

    // Update timer
    const updateBlockTimer = setInterval(() => {
      const remaining = Math.ceil((timerEndTime - Date.now()) / 1000 / 60);
      const timerEl = document.getElementById('block-timer');
      if (timerEl) {
        timerEl.textContent = remaining > 0 ? `${remaining} min` : 'Done!';
      }
      if (remaining <= 0) {
        clearInterval(updateBlockTimer);
        deactivateNuclearMode();
        window.location.reload();
      }
    }, 1000);
  }

  // Prevent escape attempts
  function preventEscape(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  function preventEscapeKeys(e) {
    // Prevent: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+W, Ctrl+T, Alt+F4
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
      (e.ctrlKey && e.key === 'u') ||
      (e.ctrlKey && e.key === 'w') ||
      (e.ctrlKey && e.key === 't') ||
      (e.altKey && e.key === 'F4')
    ) {
      e.preventDefault();
      e.stopPropagation();
      showWarningNotification('Nuclear Mode is active! Stay focused!');
      return false;
    }
  }

  function showWarningNotification(message) {
    const notif = document.createElement('div');
    notif.textContent = message;
    notif.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      background: #EF4444; color: white; padding: 16px 24px; border-radius: 8px;
      font-size: 16px; font-weight: 600; z-index: 9999999999;
      box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
      animation: shake 0.5s;
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
  }

  // Create control panel
  function createPanel() {
    panel = document.createElement('div');
    panel.id = 'nuclear-mode-panel';
    panel.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 480px; min-height: 400px; background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
      border-radius: 16px; border: 1px solid #374151; box-shadow: 0 20px 60px rgba(0,0,0,0.6);
      z-index: 9999999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #E5E7EB; overflow: hidden; display: flex; flex-direction: column;
      resize: both; min-width: 400px; min-height: 350px;
    `;

    const currentDomain = window.location.hostname.replace(/^www\./, '');

    panel.innerHTML = `
      <div id="panel-header" style="background: linear-gradient(135deg, #374151 0%, #1F2937 100%); padding: 16px 20px; cursor: move; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #374151; user-select: none;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #F9FAFB;">Nuclear Mode</h2>
        </div>
        <button id="close-panel" style="background: transparent; border: none; color: #9CA3AF; cursor: pointer; font-size: 24px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; transition: all 0.2s;">×</button>
      </div>

      <div style="padding: 20px; flex: 1; overflow-y: auto;">
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: 600; color: #D1D5DB; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Whitelist</h3>
          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <input type="text" id="whitelist-input" placeholder="example.com" style="flex: 1; background: rgba(255,255,255,0.05); border: 1px solid #374151; border-radius: 8px; padding: 10px 14px; color: #E5E7EB; font-size: 14px; outline: none;">
            <button id="add-whitelist" style="background: #3B82F6; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s;">Add</button>
          </div>
          <button id="add-current-site" style="width: 100%; background: rgba(59, 130, 246, 0.1); color: #60A5FA; border: 1px solid #3B82F6; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 13px; margin-bottom: 12px; transition: all 0.2s;">
            Add Current Site (${currentDomain})
          </button>
          <div id="whitelist-container" style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto;">
            ${whitelist.length === 0 ? '<div style="text-align: center; padding: 20px; color: #6B7280; font-size: 14px;">No whitelisted sites yet</div>' : ''}
          </div>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: 600; color: #D1D5DB; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Timer</h3>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px;">
            <button class="timer-preset" data-minutes="15" style="background: rgba(255,255,255,0.05); border: 1px solid #374151; color: #E5E7EB; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; transition: all 0.2s;">15m</button>
            <button class="timer-preset" data-minutes="30" style="background: rgba(255,255,255,0.05); border: 1px solid #374151; color: #E5E7EB; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; transition: all 0.2s;">30m</button>
            <button class="timer-preset" data-minutes="60" style="background: rgba(255,255,255,0.05); border: 1px solid #374151; color: #E5E7EB; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; transition: all 0.2s;">1h</button>
            <button class="timer-preset" data-minutes="120" style="background: rgba(255,255,255,0.05); border: 1px solid #374151; color: #E5E7EB; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; transition: all 0.2s;">2h</button>
          </div>
          <div style="display: flex; gap: 8px;">
            <input type="number" id="custom-minutes" placeholder="Custom minutes" min="1" max="480" style="flex: 1; background: rgba(255,255,255,0.05); border: 1px solid #374151; border-radius: 8px; padding: 10px 14px; color: #E5E7EB; font-size: 14px; outline: none;">
            <button id="set-custom-timer" style="background: rgba(255,255,255,0.05); border: 1px solid #374151; color: #E5E7EB; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; transition: all 0.2s;">Set</button>
          </div>
        </div>

        <button id="activate-nuclear" style="width: 100%; background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: white; border: none; padding: 14px; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4); transition: all 0.2s;">
          Activate Nuclear Mode
        </button>

        <button id="deactivate-nuclear" style="width: 100%; background: rgba(255,255,255,0.05); color: #9CA3AF; border: 1px solid #374151; padding: 14px; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 600; margin-top: 12px; display: none; transition: all 0.2s;">
          Stop Nuclear Mode
        </button>
      </div>

      <div id="resize-handle" style="position: absolute; bottom: 0; right: 0; width: 20px; height: 20px; cursor: nwse-resize; background: linear-gradient(135deg, transparent 50%, #374151 50%); border-radius: 0 0 16px 0;"></div>
    `;

    document.body.appendChild(panel);
    updateWhitelistDisplay();
    attachEventListeners();
    makeDraggable();
    makeResizable();

    if (isActive && timerEndTime) {
      showActiveState();
    }
  }

  // Update whitelist display
  function updateWhitelistDisplay() {
    const container = panel.querySelector('#whitelist-container');
    if (whitelist.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 20px; color: #6B7280; font-size: 14px;">No whitelisted sites yet</div>';
      return;
    }

    container.innerHTML = whitelist.map((site, index) => `
      <div class="whitelist-item" style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.05); border: 1px solid #374151; border-radius: 8px; padding: 10px 14px; transition: all 0.2s;">
        <span style="color: #E5E7EB; font-size: 14px;">${site}</span>
        <button class="remove-whitelist" data-index="${index}" style="background: rgba(239, 68, 68, 0.1); color: #EF4444; border: none; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;">Remove</button>
      </div>
    `).join('');

    // Add remove handlers
    panel.querySelectorAll('.remove-whitelist').forEach(btn => {
      btn.addEventListener('click', function() {
        const index = parseInt(this.dataset.index);
        whitelist.splice(index, 1);
        saveSettings();
        updateWhitelistDisplay();
      });
      btn.addEventListener('mouseenter', function() {
        this.style.background = '#EF4444';
        this.style.color = 'white';
      });
      btn.addEventListener('mouseleave', function() {
        this.style.background = 'rgba(239, 68, 68, 0.1)';
        this.style.color = '#EF4444';
      });
    });
  }

  // Attach event listeners
  function attachEventListeners() {
    // Close button
    panel.querySelector('#close-panel').addEventListener('click', () => {
      panel.remove();
      browserAPI.storage.sync.set({ passiveWatching: false });
    });

    panel.querySelector('#close-panel').addEventListener('mouseenter', function() {
      this.style.background = 'rgba(239, 68, 68, 0.1)';
      this.style.color = '#EF4444';
    });
    panel.querySelector('#close-panel').addEventListener('mouseleave', function() {
      this.style.background = 'transparent';
      this.style.color = '#9CA3AF';
    });

    // Add whitelist
    const addWhitelist = () => {
      const input = panel.querySelector('#whitelist-input');
      const site = input.value.trim().replace(/^https?:\/\//, '').replace(/^www\./, '');
      if (site && !whitelist.includes(site)) {
        whitelist.push(site);
        saveSettings();
        updateWhitelistDisplay();
        input.value = '';
      }
    };

    panel.querySelector('#add-whitelist').addEventListener('click', addWhitelist);
    panel.querySelector('#whitelist-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addWhitelist();
    });

    // Add current site
    panel.querySelector('#add-current-site').addEventListener('click', function() {
      const currentDomain = window.location.hostname.replace(/^www\./, '');
      if (!whitelist.includes(currentDomain)) {
        whitelist.push(currentDomain);
        saveSettings();
        updateWhitelistDisplay();
      }
    });

    // Timer presets
    panel.querySelectorAll('.timer-preset').forEach(btn => {
      btn.addEventListener('click', function() {
        const minutes = parseInt(this.dataset.minutes);
        setTimer(minutes);
      });
      btn.addEventListener('mouseenter', function() {
        this.style.background = '#3B82F6';
        this.style.borderColor = '#3B82F6';
      });
      btn.addEventListener('mouseleave', function() {
        this.style.background = 'rgba(255,255,255,0.05)';
        this.style.borderColor = '#374151';
      });
    });

    // Custom timer
    panel.querySelector('#set-custom-timer').addEventListener('click', () => {
      const minutes = parseInt(panel.querySelector('#custom-minutes').value);
      if (minutes > 0) {
        setTimer(minutes);
      }
    });

    // Activate nuclear mode
    panel.querySelector('#activate-nuclear').addEventListener('click', activateNuclearMode);
    panel.querySelector('#deactivate-nuclear').addEventListener('click', deactivateNuclearMode);
  }

  // Set timer
  function setTimer(minutes) {
    timerEndTime = Date.now() + (minutes * 60 * 1000);
    saveSettings();
    updateTimerDisplay();
    startTimer();
  }

  // Start timer countdown
  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
      updateFloatingTimer();
      
      if (Date.now() >= timerEndTime) {
        clearInterval(timerInterval);
        deactivateNuclearMode();
      }
    }, 1000);
  }

  // Activate nuclear mode
  function activateNuclearMode() {
    if (whitelist.length === 0) {
      alert('Please add at least one website to the whitelist!');
      return;
    }
    if (!timerEndTime) {
      alert('Please set a timer first!');
      return;
    }

    isActive = true;
    saveSettings();
    showActiveState();
    checkAndBlockSite();
    
    // Close main panel and show floating timer
    if (panel) panel.remove();
    createFloatingTimer();
  }

  // Create floating timer window
  let floatingTimer = null;
  function createFloatingTimer() {
    floatingTimer = document.createElement('div');
    floatingTimer.id = 'nuclear-floating-timer';
    floatingTimer.style.cssText = `
      position: fixed; top: 20px; right: 20px; width: 200px; min-height: 100px;
      background: linear-gradient(135deg, #1F2937 0%, #111827 100%);
      border-radius: 12px; border: 1px solid #374151;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6); z-index: 9999998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #E5E7EB; padding: 16px; resize: both; overflow: hidden;
      min-width: 180px; min-height: 90px;
    `;

    floatingTimer.innerHTML = `
      <div id="timer-header" style="cursor: move; user-select: none; margin-bottom: 12px;">
        <div style="font-size: 12px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Nuclear Mode</div>
      </div>
      <div style="text-align: center;">
        <div id="floating-timer-value" style="font-size: 48px; font-weight: 700; color: #EF4444; line-height: 1;">--:--</div>
        <div style="font-size: 11px; color: #6B7280; margin-top: 8px;">Time Remaining</div>
      </div>
    `;

    document.body.appendChild(floatingTimer);
    updateFloatingTimer();
    makeFloatingTimerDraggable();
  }

  // Update floating timer display
  function updateFloatingTimer() {
    if (!floatingTimer) return;
    
    const value = floatingTimer.querySelector('#floating-timer-value');
    if (!value) return;

    const remaining = Math.max(0, timerEndTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    value.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Make floating timer draggable
  function makeFloatingTimerDraggable() {
    const header = floatingTimer.querySelector('#timer-header');
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = floatingTimer.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      header.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      floatingTimer.style.left = (startLeft + dx) + 'px';
      floatingTimer.style.top = (startTop + dy) + 'px';
      floatingTimer.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        header.style.cursor = 'move';
      }
    });
  }

  // Deactivate nuclear mode
  function deactivateNuclearMode() {
    isActive = false;
    timerEndTime = null;
    if (timerInterval) clearInterval(timerInterval);
    disableCloseWarning();
    saveSettings();
    
    if (panel) {
      panel.querySelector('#activate-nuclear').style.display = 'block';
      panel.querySelector('#deactivate-nuclear').style.display = 'none';
    }

    // Remove floating timer
    if (floatingTimer) floatingTimer.remove();

    // Remove block overlay if exists
    const blockOverlay = document.getElementById('nuclear-mode-block');
    if (blockOverlay) blockOverlay.remove();

    // Remove event listeners
    document.removeEventListener('contextmenu', preventEscape, true);
    document.removeEventListener('keydown', preventEscapeKeys, true);
  }

  // Show active state
  function showActiveState() {
    if (panel) {
      panel.querySelector('#activate-nuclear').style.display = 'none';
      panel.querySelector('#deactivate-nuclear').style.display = 'block';
    }
  }

  // Make panel draggable
  function makeDraggable() {
    const header = panel.querySelector('#panel-header');
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    header.addEventListener('mousedown', (e) => {
      if (e.target.id === 'close-panel' || e.target.closest('#close-panel')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = panel.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      panel.style.transform = 'none';
      header.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      panel.style.left = (startLeft + dx) + 'px';
      panel.style.top = (startTop + dy) + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        header.style.cursor = 'move';
      }
    });
  }

  // Make panel resizable
  function makeResizable() {
    const handle = panel.querySelector('#resize-handle');
    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    handle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = panel.offsetWidth;
      startHeight = panel.offsetHeight;
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      panel.style.width = Math.max(400, startWidth + dx) + 'px';
      panel.style.height = Math.max(350, startHeight + dy) + 'px';
    });

    document.addEventListener('mouseup', () => {
      isResizing = false;
    });
  }

  // Initialize
  createPanel();

  return {
    cleanup: () => {
      if (panel) panel.remove();
      if (timerInterval) clearInterval(timerInterval);
      disableCloseWarning();
      document.removeEventListener('contextmenu', preventEscape, true);
      document.removeEventListener('keydown', preventEscapeKeys, true);
    }
  };
}


// ========== energy-scheduling.js ==========
function initEnergyScheduling() {
  const panel = document.createElement('div');
  panel.id = 'energy-scheduling-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 280px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;

  panel.innerHTML = `
    <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 12px; font-weight: 600; border-radius: 8px 8px 0 0;">
      ⚡ Energy Level
      <button id="close-energy-panel" style="float: right; background: none; border: none; color: white; cursor: pointer; font-size: 18px;">×</button>
    </div>
    <div style="padding: 16px;">
      <div style="margin-bottom: 12px; font-size: 13px; color: #6b7280;">How's your energy?</div>
      <div style="display: flex; gap: 8px; margin-bottom: 16px;">
        <button class="energy-btn" data-level="high" style="flex: 1; padding: 8px; border: 2px solid #10b981; background: white; border-radius: 6px; cursor: pointer; font-size: 12px;">
          🔥 High
        </button>
        <button class="energy-btn" data-level="low" style="flex: 1; padding: 8px; border: 2px solid #f59e0b; background: white; border-radius: 6px; cursor: pointer; font-size: 12px;">
          😴 Low
        </button>
      </div>
      <div id="energy-suggestion" style="font-size: 12px; color: #374151; padding: 12px; background: #f3f4f6; border-radius: 6px; display: none;"></div>
    </div>
  `;

  document.body.appendChild(panel);

  const suggestions = {
    high: '💪 Great! Focus on complex tasks, coding, or problem-solving.',
    low: '🧘 Take it easy. Review docs, organize tasks, or take a break.'
  };

  document.querySelectorAll('.energy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const level = e.target.dataset.level;
      const suggestionEl = document.getElementById('energy-suggestion');
      suggestionEl.textContent = suggestions[level];
      suggestionEl.style.display = 'block';
      
      // Highlight selected button
      document.querySelectorAll('.energy-btn').forEach(b => {
        b.style.background = 'white';
      });
      e.target.style.background = level === 'high' ? '#d1fae5' : '#fef3c7';
    });
  });

  document.getElementById('close-energy-panel').addEventListener('click', () => {
    panel.remove();
  });

  return {
    cleanup: () => panel.remove()
  };
}


// ========== speed-improver.js ==========
// Video Speed Control - Advanced playback speed controller
function initSpeedImprover() {
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  
  let panel = null;
  let currentSpeed = 1;
  let video = null;
  let videoCheckInterval = null;

  // Dragging state
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let panelStartX = 0;
  let panelStartY = 0;

  // Resizing state
  let isResizing = false;
  let resizeStartX = 0;
  let resizeStartY = 0;
  let panelStartWidth = 0;
  let panelStartHeight = 0;

  // Slider dragging
  let isSliderDragging = false;

  // Find video element
  function findVideo() {
    const videos = document.querySelectorAll('video');
    if (videos.length > 0) {
      // Prefer the largest video (main content)
      let largestVideo = videos[0];
      let maxArea = 0;
      
      videos.forEach(v => {
        const area = v.offsetWidth * v.offsetHeight;
        if (area > maxArea) {
          maxArea = area;
          largestVideo = v;
        }
      });
      
      return largestVideo;
    }
    return null;
  }

  // Create panel
  panel = document.createElement('div');
  panel.id = 'speed-control-panel';
  panel.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    width: 320px;
    min-width: 280px;
    min-height: 180px;
    background: linear-gradient(135deg, #2D3748 0%, #1A202C 100%);
    border-radius: 12px;
    border: 1px solid #4A5568;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6);
    z-index: 9999998;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #E5E7EB;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 14px;
  `;

  panel.innerHTML = `
    <div id="speed-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; cursor: move; user-select: none; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
      <div style="display: flex; align-items: center; gap: 8px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <div style="font-weight: 600; font-size: 14px; color: #E5E7EB;">Video Speed Control</div>
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <button id="reset-speed-btn" title="Reset to 1x" style="background: rgba(255,255,255,0.1); border: none; color: #9CA3AF; cursor: pointer; font-size: 14px; padding: 0; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border-radius: 5px; transition: all 0.2s;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M3 21v-5h5"/>
          </svg>
        </button>
        <button id="help-speed-btn" title="Help" style="background: rgba(255,255,255,0.1); border: none; color: #9CA3AF; cursor: pointer; font-size: 13px; padding: 0; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border-radius: 5px; transition: all 0.2s;">?</button>
        <button id="close-speed-panel" style="background: rgba(255,255,255,0.1); border: none; color: #9CA3AF; cursor: pointer; font-size: 18px; padding: 0; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border-radius: 5px; transition: all 0.2s;">×</button>
      </div>
    </div>

    <!-- Speed Slider -->
    <div style="margin-bottom: 16px;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
        <button id="decrease-speed-btn" style="width: 36px; height: 36px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #E5E7EB; font-size: 18px; font-weight: 300; transition: all 0.2s; flex-shrink: 0;">−</button>
        
        <div style="flex: 1; position: relative;">
          <input type="range" id="speed-slider" min="0.25" max="16" step="0.25" value="1" style="width: 100%; height: 6px; background: linear-gradient(to right, #3B82F6 0%, #3B82F6 6.25%, #4B5563 6.25%, #4B5563 100%); border-radius: 3px; outline: none; -webkit-appearance: none; cursor: pointer;">
          <style>
            #speed-slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 16px;
              height: 16px;
              background: #60A5FA;
              border: 2px solid #1E293B;
              border-radius: 50%;
              cursor: grab;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            }
            #speed-slider::-webkit-slider-thumb:active {
              cursor: grabbing;
              transform: scale(1.1);
            }
            #speed-slider::-moz-range-thumb {
              width: 16px;
              height: 16px;
              background: #60A5FA;
              border: 2px solid #1E293B;
              border-radius: 50%;
              cursor: grab;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            }
          </style>
        </div>
        
        <button id="increase-speed-btn" style="width: 36px; height: 36px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #E5E7EB; font-size: 18px; font-weight: 300; transition: all 0.2s; flex-shrink: 0;">+</button>
      </div>
    </div>

    <!-- Current Speed Display -->
    <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 12px; margin-bottom: 14px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="font-size: 11px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.3px;">Current playback rate</div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="font-size: 10px; color: #6B7280;">×</div>
          <input type="number" id="speed-input" min="0.25" max="16" step="0.25" value="1" style="width: 60px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #E5E7EB; padding: 6px 8px; border-radius: 6px; font-size: 14px; font-weight: 600; text-align: center; outline: none;">
          <button id="apply-speed-btn" style="background: linear-gradient(135deg, #3B82F6, #2563EB); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600; transition: all 0.2s; display: flex; align-items: center; gap: 4px;">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Apply
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Presets -->
    <div style="margin-bottom: 12px;">
      <div style="font-size: 10px; color: #9CA3AF; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.3px;">Quick Presets</div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
        <button class="preset-btn" data-speed="0.5" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: #E5E7EB; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 500; transition: all 0.2s;">0.5×</button>
        <button class="preset-btn" data-speed="1" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: #E5E7EB; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 500; transition: all 0.2s;">1×</button>
        <button class="preset-btn" data-speed="1.5" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: #E5E7EB; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 500; transition: all 0.2s;">1.5×</button>
        <button class="preset-btn" data-speed="2" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: #E5E7EB; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 500; transition: all 0.2s;">2×</button>
        <button class="preset-btn" data-speed="2.5" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: #E5E7EB; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 500; transition: all 0.2s;">2.5×</button>
        <button class="preset-btn" data-speed="3" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: #E5E7EB; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 500; transition: all 0.2s;">3×</button>
        <button class="preset-btn" data-speed="4" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: #E5E7EB; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 500; transition: all 0.2s;">4×</button>
        <button class="preset-btn" data-speed="8" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: #E5E7EB; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 500; transition: all 0.2s;">8×</button>
      </div>
    </div>

    <!-- Video Status -->
    <div id="video-status" style="font-size: 9px; color: #6B7280; text-align: center; padding: 6px; background: rgba(255,255,255,0.03); border-radius: 5px;">
      Searching for video...
    </div>
  `;

  document.body.appendChild(panel);

  // Add resize handle
  const resizeHandle = document.createElement('div');
  resizeHandle.id = 'resize-handle-speed';
  resizeHandle.style.cssText = `
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    cursor: nwse-resize;
    background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.1) 50%);
    border-radius: 0 0 16px 0;
    z-index: 10;
  `;
  panel.appendChild(resizeHandle);

  // Find and monitor video
  function updateVideo() {
    video = findVideo();
    const statusEl = document.getElementById('video-status');
    
    if (video) {
      statusEl.textContent = `Video found: ${video.videoWidth}×${video.videoHeight}`;
      statusEl.style.color = '#10B981';
      
      // Apply current speed
      video.playbackRate = currentSpeed;
      
      // Listen for speed changes from native controls
      video.addEventListener('ratechange', () => {
        if (Math.abs(video.playbackRate - currentSpeed) > 0.01) {
          currentSpeed = video.playbackRate;
          updateUI();
        }
      });
    } else {
      statusEl.textContent = 'No video found on page';
      statusEl.style.color = '#EF4444';
    }
  }

  // Update UI elements
  function updateUI() {
    document.getElementById('speed-slider').value = currentSpeed;
    document.getElementById('speed-input').value = currentSpeed;
    
    // Update slider background
    const slider = document.getElementById('speed-slider');
    const percentage = ((currentSpeed - 0.25) / (16 - 0.25)) * 100;
    slider.style.background = `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${percentage}%, #4B5563 ${percentage}%, #4B5563 100%)`;
  }

  // Set speed
  function setSpeed(speed) {
    speed = Math.max(0.25, Math.min(16, speed));
    currentSpeed = speed;
    
    if (video) {
      video.playbackRate = speed;
    }
    
    updateUI();
  }

  // Check for video periodically
  videoCheckInterval = setInterval(updateVideo, 1000);
  updateVideo();

  // Event Listeners

  // Slider
  const slider = document.getElementById('speed-slider');
  slider.addEventListener('input', (e) => {
    setSpeed(parseFloat(e.target.value));
  });

  // Decrease button
  document.getElementById('decrease-speed-btn').addEventListener('click', () => {
    setSpeed(currentSpeed - 0.25);
  });

  // Increase button
  document.getElementById('increase-speed-btn').addEventListener('click', () => {
    setSpeed(currentSpeed + 0.25);
  });

  // Input field
  const speedInput = document.getElementById('speed-input');
  speedInput.addEventListener('change', (e) => {
    setSpeed(parseFloat(e.target.value) || 1);
  });

  // Apply button
  document.getElementById('apply-speed-btn').addEventListener('click', () => {
    const speed = parseFloat(speedInput.value) || 1;
    setSpeed(speed);
  });

  // Preset buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = parseFloat(btn.dataset.speed);
      setSpeed(speed);
    });

    // Hover effect
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(59, 130, 246, 0.2)';
      btn.style.borderColor = '#3B82F6';
      btn.style.transform = 'translateY(-2px)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(255,255,255,0.08)';
      btn.style.borderColor = 'rgba(255,255,255,0.12)';
      btn.style.transform = 'translateY(0)';
    });
  });

  // Reset button
  document.getElementById('reset-speed-btn').addEventListener('click', () => {
    setSpeed(1);
  });

  // Help button
  document.getElementById('help-speed-btn').addEventListener('click', () => {
    alert('Video Speed Control\n\n' +
          '• Use slider or +/- buttons to adjust speed\n' +
          '• Range: 0.25× to 16× (YouTube limit is 2×)\n' +
          '• Click preset buttons for quick speeds\n' +
          '• Enter custom speed in the input field\n' +
          '• Works on YouTube, Vimeo, and most video sites\n\n' +
          'Keyboard shortcuts:\n' +
          '• Use native video controls for fine-tuning');
  });

  // Make panel draggable
  const header = document.getElementById('speed-header');
  
  header.addEventListener('mousedown', (e) => {
    if (e.target.closest('button')) return;
    
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    
    const rect = panel.getBoundingClientRect();
    panelStartX = rect.left;
    panelStartY = rect.top;
    
    panel.style.right = 'auto';
    panel.style.left = panelStartX + 'px';
    panel.style.top = panelStartY + 'px';
    
    header.style.cursor = 'grabbing';
    e.preventDefault();
  });

  // Make panel resizable
  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    
    panelStartWidth = panel.offsetWidth;
    panelStartHeight = panel.offsetHeight;
    
    e.preventDefault();
    e.stopPropagation();
  });

  // Mouse move handler
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;
      
      let newX = panelStartX + deltaX;
      let newY = panelStartY + deltaY;
      
      const maxX = window.innerWidth - panel.offsetWidth;
      const maxY = window.innerHeight - panel.offsetHeight;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      panel.style.left = newX + 'px';
      panel.style.top = newY + 'px';
    }
    
    if (isResizing) {
      const deltaX = e.clientX - resizeStartX;
      const deltaY = e.clientY - resizeStartY;
      
      let newWidth = panelStartWidth + deltaX;
      let newHeight = panelStartHeight + deltaY;
      
      newWidth = Math.max(280, Math.min(newWidth, window.innerWidth * 0.9));
      newHeight = Math.max(180, Math.min(newHeight, window.innerHeight * 0.9));
      
      panel.style.width = newWidth + 'px';
      panel.style.height = newHeight + 'px';
    }
  });

  // Mouse up handler
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      header.style.cursor = 'move';
    }
    if (isResizing) {
      isResizing = false;
    }
  });

  // Close panel
  document.getElementById('close-speed-panel').addEventListener('click', () => {
    panel.remove();
    clearInterval(videoCheckInterval);
    browserAPI.storage.sync.set({ speedImprover: false });
  });

  // Hover effects for header buttons
  const headerButtons = [
    'reset-speed-btn',
    'help-speed-btn',
    'close-speed-panel'
  ];

  headerButtons.forEach(id => {
    const btn = document.getElementById(id);
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(255,255,255,0.2)';
      btn.style.color = '#fff';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(255,255,255,0.1)';
      btn.style.color = '#9CA3AF';
    });
  });

  // Hover effects for +/- buttons
  ['decrease-speed-btn', 'increase-speed-btn'].forEach(id => {
    const btn = document.getElementById(id);
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(59, 130, 246, 0.2)';
      btn.style.borderColor = '#3B82F6';
      btn.style.transform = 'scale(1.05)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(255,255,255,0.08)';
      btn.style.borderColor = 'rgba(255,255,255,0.15)';
      btn.style.transform = 'scale(1)';
    });
  });

  // Hover effect for apply button
  const applyBtn = document.getElementById('apply-speed-btn');
  applyBtn.addEventListener('mouseenter', () => {
    applyBtn.style.transform = 'scale(1.05)';
    applyBtn.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
  });
  applyBtn.addEventListener('mouseleave', () => {
    applyBtn.style.transform = 'scale(1)';
    applyBtn.style.boxShadow = 'none';
  });

  console.log('Video Speed Control initialized');

  return {
    cleanup: () => {
      panel.remove();
      clearInterval(videoCheckInterval);
      if (video) {
        video.playbackRate = 1;
      }
      console.log('Video Speed Control disabled');
    }
  };
}


// ========== youtube-adblock.js ==========
// YouTube Ad Blocker - Content Script
function initYouTubeAdBlock() {
  if (!window.location.hostname.includes('youtube.com')) {
    return { cleanup: () => {} };
  }

  console.log('YouTube Ad Blocker initialized');

  // CSS to hide ad elements
  const style = document.createElement('style');
  style.id = 'youtube-adblock-style';
  style.textContent = `
    /* Hide video ads */
    .video-ads,
    .ytp-ad-module,
    .ytp-ad-overlay-container,
    .ytp-ad-text-overlay,
    .ytp-ad-player-overlay,
    .ytp-ad-image-overlay,
    ytd-display-ad-renderer,
    ytd-promoted-sparkles-web-renderer,
    ytd-promoted-video-renderer,
    ytd-compact-promoted-video-renderer,
    ytd-promoted-sparkles-text-search-renderer,
    
    /* Hide banner ads */
    #masthead-ad,
    ytd-banner-promo-renderer,
    ytd-statement-banner-renderer,
    
    /* Hide sidebar ads */
    ytd-ad-slot-renderer,
    ytd-in-feed-ad-layout-renderer,
    yt-mealbar-promo-renderer,
    
    /* Hide overlay ads */
    .ytp-ad-overlay-container,
    .ytp-ad-overlay-image,
    .ytp-ad-text-overlay,
    
    /* Hide companion ads */
    #player-ads,
    #watch-channel-brand-div,
    
    /* Hide shorts ads */
    ytd-reel-video-renderer[is-ad],
    
    /* Hide search ads */
    ytd-search-pyv-renderer,
    
    /* Hide homepage ads */
    ytd-rich-item-renderer[is-ad],
    
    /* Additional ad containers */
    .ytd-display-ad-renderer,
    .ytd-promoted-sparkles-web-renderer,
    .ytd-video-masthead-ad-v3-renderer,
    .ytd-statement-banner-renderer,
    .ytd-primetime-promo-renderer {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      min-height: 0 !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
    
    /* Speed up video when ad is detected */
    .ad-showing video {
      playback-rate: 16 !important;
    }
  `;
  document.head.appendChild(style);

  // Function to skip video ads
  function skipAds() {
    try {
      // Skip button
      const skipButton = document.querySelector('.ytp-ad-skip-button, .ytp-skip-ad-button, .ytp-ad-skip-button-modern');
      if (skipButton) {
        skipButton.click();
        console.log('Clicked skip button');
      }

      // Close overlay ads
      const closeButtons = document.querySelectorAll('.ytp-ad-overlay-close-button, .ytp-ad-overlay-close-container');
      closeButtons.forEach(btn => btn.click());

      // Speed up ads if they can't be skipped
      const video = document.querySelector('video');
      const adContainer = document.querySelector('.ad-showing, .ad-interrupting');
      
      if (video && adContainer) {
        video.playbackRate = 16;
        video.muted = true;
        console.log('Speeding up ad');
      }

      // Remove ad elements from DOM
      const adElements = document.querySelectorAll(`
        ytd-display-ad-renderer,
        ytd-promoted-sparkles-web-renderer,
        ytd-ad-slot-renderer,
        ytd-in-feed-ad-layout-renderer,
        .video-ads,
        .ytp-ad-module,
        ytd-banner-promo-renderer,
        ytd-statement-banner-renderer,
        #player-ads
      `);
      
      adElements.forEach(el => {
        if (el && el.parentNode) {
          el.remove();
          console.log('Removed ad element:', el.tagName);
        }
      });

      // Check if video is playing an ad and try to skip
      if (video) {
        const adIndicator = document.querySelector('.ytp-ad-text, .ytp-ad-preview-text');
        if (adIndicator) {
          // Try to seek to end of ad
          const duration = video.duration;
          if (duration && duration > 0 && duration < 60) {
            video.currentTime = duration - 0.1;
            console.log('Skipped to end of ad');
          }
        }
      }

    } catch (error) {
      console.error('Error in skipAds:', error);
    }
  }

  // Run immediately
  skipAds();

  // Run periodically
  const interval = setInterval(skipAds, 500);

  // Observer for dynamic content
  const observer = new MutationObserver((mutations) => {
    skipAds();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Listen for video events
  document.addEventListener('yt-navigate-finish', skipAds);
  document.addEventListener('yt-page-data-updated', skipAds);

  // Intercept ad requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string') {
      // Block ad-related requests
      if (url.includes('/api/stats/ads') || 
          url.includes('/pagead/') || 
          url.includes('/ptracking') ||
          url.includes('doubleclick.net') ||
          url.includes('googlesyndication.com')) {
        console.log('Blocked ad request:', url);
        return Promise.reject(new Error('Ad blocked'));
      }
    }
    return originalFetch.apply(this, args);
  };

  // Intercept XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    if (typeof url === 'string') {
      if (url.includes('/api/stats/ads') || 
          url.includes('/pagead/') || 
          url.includes('/ptracking') ||
          url.includes('doubleclick.net') ||
          url.includes('googlesyndication.com')) {
        console.log('Blocked XHR ad request:', url);
        return;
      }
    }
    return originalOpen.call(this, method, url, ...rest);
  };

  console.log('YouTube ad blocking active');

  return {
    cleanup: () => {
      clearInterval(interval);
      observer.disconnect();
      style.remove();
      document.removeEventListener('yt-navigate-finish', skipAds);
      document.removeEventListener('yt-page-data-updated', skipAds);
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalOpen;
      console.log('YouTube ad blocking disabled');
    }
  };
}


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
