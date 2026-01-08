// Video Speed Control - Advanced playback speed controller
export function initSpeedImprover() {
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
