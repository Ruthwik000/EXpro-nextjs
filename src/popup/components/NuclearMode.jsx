import React, { useState, useEffect } from 'react';

const NuclearMode = () => {
  const [whitelist, setWhitelist] = useState([]);
  const [newSite, setNewSite] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(30);
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    // Load nuclear mode state
    chrome.storage.local.get(['nuclearMode'], (result) => {
      if (result.nuclearMode) {
        setWhitelist(result.nuclearMode.whitelist || []);
        setIsActive(result.nuclearMode.isActive || false);
        
        if (result.nuclearMode.timerEndTime) {
          const remaining = Math.max(0, result.nuclearMode.timerEndTime - Date.now());
          setTimeRemaining(remaining);
        }
      }
    });

    // Update timer every second
    const interval = setInterval(() => {
      chrome.storage.local.get(['nuclearMode'], (result) => {
        if (result.nuclearMode?.timerEndTime) {
          const remaining = Math.max(0, result.nuclearMode.timerEndTime - Date.now());
          setTimeRemaining(remaining);
          
          if (remaining === 0 && isActive) {
            setIsActive(false);
          }
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const addSite = () => {
    if (!newSite.trim()) return;
    
    const cleanSite = newSite.trim().replace(/^https?:\/\//, '').replace(/^www\./, '');
    if (whitelist.includes(cleanSite)) {
      alert('Site already in whitelist');
      return;
    }

    const updatedWhitelist = [...whitelist, cleanSite];
    setWhitelist(updatedWhitelist);
    setNewSite('');
    
    chrome.storage.local.get(['nuclearMode'], (result) => {
      const nuclearMode = result.nuclearMode || {};
      nuclearMode.whitelist = updatedWhitelist;
      chrome.storage.local.set({ nuclearMode });
    });
  };

  const removeSite = (site) => {
    const updatedWhitelist = whitelist.filter(s => s !== site);
    setWhitelist(updatedWhitelist);
    
    chrome.storage.local.get(['nuclearMode'], (result) => {
      const nuclearMode = result.nuclearMode || {};
      nuclearMode.whitelist = updatedWhitelist;
      chrome.storage.local.set({ nuclearMode });
    });
  };

  const toggleNuclearMode = () => {
    const newActiveState = !isActive;
    setIsActive(newActiveState);

    // Ensure whitelist is always an array
    const currentWhitelist = Array.isArray(whitelist) ? whitelist : [];
    
    const nuclearMode = {
      isActive: newActiveState,
      whitelist: currentWhitelist,
      timerEndTime: newActiveState ? Date.now() + (timerMinutes * 60 * 1000) : null
    };

    console.log('Toggling Nuclear Mode:', nuclearMode);

    chrome.storage.local.set({ nuclearMode }, () => {
      console.log('Nuclear Mode saved to storage');
      chrome.runtime.sendMessage({
        type: 'NUCLEAR_MODE_UPDATE',
        data: nuclearMode
      });
    });

    if (newActiveState) {
      setTimeRemaining(timerMinutes * 60 * 1000);
    } else {
      setTimeRemaining(null);
    }
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-white mb-2">Nuclear Mode Settings</h3>
        <p className="text-xs text-gray-400 mb-3">
          Block all sites except whitelisted ones. Only whitelisted sites will be accessible.
        </p>
      </div>

      {/* Timer Settings */}
      <div className="mb-3">
        <label className="text-xs text-gray-300 block mb-1">Timer Duration (minutes)</label>
        <input
          type="number"
          min="1"
          max="480"
          value={timerMinutes}
          onChange={(e) => setTimerMinutes(parseInt(e.target.value) || 30)}
          disabled={isActive}
          className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white disabled:opacity-50"
        />
      </div>

      {/* Active Status */}
      {isActive && timeRemaining !== null && (
        <div className="mb-3 p-2 bg-red-900/30 border border-red-700 rounded">
          <div className="text-xs text-red-300 font-semibold">🔥 Nuclear Mode Active</div>
          <div className="text-xs text-red-400 mt-1">Time Remaining: {formatTime(timeRemaining)}</div>
        </div>
      )}

      {/* Whitelist Management */}
      <div className="mb-3">
        <label className="text-xs text-gray-300 block mb-1">Whitelisted Sites</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="example.com"
            value={newSite}
            onChange={(e) => setNewSite(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addSite()}
            className="flex-1 px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500"
          />
          <button
            onClick={addSite}
            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Add
          </button>
        </div>

        <div className="space-y-1 max-h-32 overflow-y-auto">
          {whitelist.length === 0 ? (
            <div className="text-xs text-gray-500 italic">No sites whitelisted</div>
          ) : (
            whitelist.map((site) => (
              <div
                key={site}
                className="flex items-center justify-between p-2 bg-gray-700 rounded text-xs"
              >
                <span className="text-gray-200">{site}</span>
                <button
                  onClick={() => removeSite(site)}
                  className="text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Activate/Deactivate Button */}
      <button
        onClick={toggleNuclearMode}
        className={`w-full py-2 text-sm font-semibold rounded ${
          isActive
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {isActive ? '🔓 Deactivate Nuclear Mode' : '🔒 Activate Nuclear Mode'}
      </button>
    </div>
  );
};

export default NuclearMode;
