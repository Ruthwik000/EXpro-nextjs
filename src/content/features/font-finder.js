// Font Finder Feature
export function initFontFinder() {
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
