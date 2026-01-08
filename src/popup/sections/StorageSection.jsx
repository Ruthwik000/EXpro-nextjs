import React, { useState, useEffect } from 'react';
import Section from '../components/Section';
import ActionButton from '../components/ActionButton';

const StorageSection = ({ expanded, onToggle }) => {
  const [storageData, setStorageData] = useState({
    repoMemory: [],
    learningHistory: [],
    savedSessions: []
  });

  useEffect(() => {
    if (expanded) {
      loadStorageData();
    }
  }, [expanded]);

  const loadStorageData = () => {
    chrome.storage.local.get(['repoMemory', 'learningHistory', 'savedSessions'], (result) => {
      setStorageData({
        repoMemory: result.repoMemory || [
          { repo: 'example/repo', lastVisit: new Date().toISOString() }
        ],
        learningHistory: result.learningHistory || [
          { topic: 'React Hooks', timestamp: new Date().toISOString() }
        ],
        savedSessions: result.savedSessions || [
          { name: 'Work Session', tabs: 5, saved: new Date().toISOString() }
        ]
      });
    });
  };

  const clearAllData = () => {
    if (confirm('Clear all stored data? This cannot be undone.')) {
      chrome.storage.local.clear(() => {
        setStorageData({ repoMemory: [], learningHistory: [], savedSessions: [] });
        alert('All data cleared!');
      });
    }
  };

  const deleteItem = (category, index) => {
    const newData = { ...storageData };
    newData[category].splice(index, 1);
    setStorageData(newData);
    chrome.storage.local.set({ [category]: newData[category] });
  };

  const renderItems = (items, category, emptyMessage) => {
    if (items.length === 0) {
      return <div className="text-xs text-gray-500 italic">{emptyMessage}</div>;
    }
    return items.map((item, idx) => (
      <div key={idx} className="flex items-center justify-between text-xs bg-gray-750 p-2 rounded border border-gray-700">
        <span className="text-gray-300 truncate flex-1">
          {item.repo || item.topic || item.name}
        </span>
        <button
          onClick={() => deleteItem(category, idx)}
          className="text-red-400 hover:text-red-300 ml-2 text-base"
        >
          ×
        </button>
      </div>
    ));
  };

  return (
    <Section title="Storage" expanded={expanded} onToggle={onToggle}>
      <div className="space-y-3">
        <div>
          <div className="text-sm font-medium text-gray-300 mb-1">Repo Memory</div>
          <div className="space-y-1">
            {renderItems(storageData.repoMemory, 'repoMemory', 'No repos stored')}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-300 mb-1">Learning History</div>
          <div className="space-y-1">
            {renderItems(storageData.learningHistory, 'learningHistory', 'No history')}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-300 mb-1">Saved Sessions</div>
          <div className="space-y-1">
            {renderItems(storageData.savedSessions, 'savedSessions', 'No sessions')}
          </div>
        </div>

        <div className="pt-2 border-t border-gray-700">
          <ActionButton label="Clear All Data" onClick={clearAllData} variant="danger" />
        </div>
      </div>
    </Section>
  );
};

export default StorageSection;
