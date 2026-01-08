// Cookie Editor Feature - Comprehensive with Dark UI
export function initEditCookie() {
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
