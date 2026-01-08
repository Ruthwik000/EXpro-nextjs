import React, { useState, useEffect } from 'react';

const NuclearModeSimple = () => {
  const [isActive, setIsActive] = useState(false);
  const [whitelist, setWhitelist] = useState([]);
  const [newSite, setNewSite] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    // Get current status and whitelist
    chrome.runtime.sendMessage({ type: 'GET_NUCLEAR_MODE_STATUS' }, (response) => {
      if (response) {
        setIsActive(response.isActive);
        setWhitelist(response.whitelist || []);
      }
    });
  }, []);

  const toggleNuclearMode = (enabled) => {
    setIsActive(enabled);
    
    chrome.runtime.sendMessage({
      type: 'TOGGLE_NUCLEAR_MODE',
      isActive: enabled
    });
  };

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
    
    chrome.runtime.sendMessage({
      type: 'UPDATE_WHITELIST',
      whitelist: updatedWhitelist
    });
  };

  const removeSite = (site) => {
    const updatedWhitelist = whitelist.filter(s => s !== site);
    setWhitelist(updatedWhitelist);
    
    chrome.runtime.sendMessage({
      type: 'UPDATE_WHITELIST',
      whitelist: updatedWhitelist
    });
  };

  return (
    <div className="py-3 border-b border-gray-700">
      {/* Toggle Row */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-white">Nuclear Mode</div>
          <div className="text-xs text-gray-400 mt-0.5">Block all sites except whitelisted</div>
        </div>
        <button
          onClick={() => toggleNuclearMode(!isActive)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isActive ? 'bg-blue-600' : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Configuration Section - Show when toggle is on */}
      {isActive && (
        <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-white">Whitelisted Sites</h4>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              {showConfig ? 'Hide' : 'Configure'}
            </button>
          </div>

          {showConfig && (
            <>
              {/* Add Site Input */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="example.com"
                  value={newSite}
                  onChange={(e) => setNewSite(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSite()}
                  className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500"
                />
                <button
                  onClick={addSite}
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Add
                </button>
              </div>

              {/* Whitelist Display */}
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {whitelist.length === 0 ? (
                  <div className="text-xs text-gray-500 italic text-center py-2">No sites whitelisted</div>
                ) : (
                  whitelist.map((site) => (
                    <div
                      key={site}
                      className="flex items-center justify-between p-2 bg-gray-700 rounded text-xs"
                    >
                      <span className="text-gray-200">{site}</span>
                      <button
                        onClick={() => removeSite(site)}
                        className="text-red-400 hover:text-red-300 ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {!showConfig && (
            <div className="text-xs text-gray-400">
              {whitelist.length} site{whitelist.length !== 1 ? 's' : ''} whitelisted
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NuclearModeSimple;
