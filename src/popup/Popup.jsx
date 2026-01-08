import React, { useState, useEffect } from 'react';
import DeveloperTools from './sections/DeveloperTools';
import LearningTools from './sections/LearningTools';
import ProductivityTools from './sections/ProductivityTools';
import StorageSection from './sections/StorageSection';

const Popup = () => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [toggles, setToggles] = useState({});

  useEffect(() => {
    // Load toggles from storage
    chrome.storage.sync.get(['toggles'], (result) => {
      if (result.toggles) {
        setToggles(result.toggles);
      }
    });
  }, []);

  const handleToggle = (key, value) => {
    const newToggles = { ...toggles, [key]: value };
    setToggles(newToggles);
    chrome.storage.sync.set({ toggles: newToggles });
    
    // Notify background script
    chrome.runtime.sendMessage({
      type: 'TOGGLE_CHANGED',
      key,
      value
    });
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="bg-gray-900 min-h-full text-gray-100">
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <h1 className="text-lg font-semibold text-white">ExPro</h1>
        <p className="text-xs text-gray-400 mt-1">Control Center</p>
      </div>

      <div className="p-3 space-y-2">
        <DeveloperTools
          expanded={expandedSection === 'developer'}
          onToggle={() => toggleSection('developer')}
          toggles={toggles}
          onToggleChange={handleToggle}
        />

        <LearningTools
          expanded={expandedSection === 'learning'}
          onToggle={() => toggleSection('learning')}
          toggles={toggles}
          onToggleChange={handleToggle}
        />

        <ProductivityTools
          expanded={expandedSection === 'productivity'}
          onToggle={() => toggleSection('productivity')}
          toggles={toggles}
          onToggleChange={handleToggle}
        />

        <StorageSection
          expanded={expandedSection === 'storage'}
          onToggle={() => toggleSection('storage')}
        />
      </div>
    </div>
  );
};

export default Popup;
