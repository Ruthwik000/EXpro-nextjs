// Nuclear Mode - Website blocker with whitelist and timer
export function initPassiveWatching() {
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
