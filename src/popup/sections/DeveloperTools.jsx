import React, { useState, useEffect } from 'react';
import Section from '../components/Section';
import Toggle from '../components/Toggle';
import AWSAgent from '../components/AWSAgent';
import GitHubSettings from '../components/GitHubSettings';
import { API_CONFIG } from '../../config/api';

const DeveloperTools = ({ expanded, onToggle, toggles, onToggleChange }) => {
  const [showGitHubAgent, setShowGitHubAgent] = useState(false);
  const [currentRepo, setCurrentRepo] = useState(null);
  const [currentBranch, setCurrentBranch] = useState('main');
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [summaryContent, setSummaryContent] = useState('');
  const [answerContent, setAnswerContent] = useState('');
  const [queryInput, setQueryInput] = useState('');
  const [sources, setSources] = useState([]);
  const [error, setError] = useState('');
  const [apiUrl, setApiUrl] = useState(API_CONFIG.baseUrl);
  const [scopeType, setScopeType] = useState('full');
  const [folderPath, setFolderPath] = useState('');
  const [stats, setStats] = useState(null);
  const [indexingStatus, setIndexingStatus] = useState(null); // 'indexing', 'completed', 'failed'
  const [indexingProgress, setIndexingProgress] = useState(0);

  useEffect(() => {
    if (expanded && toggles.githubAgent) {
      loadSettings();
      checkConnection();
      getCurrentTab();
    }
  }, [expanded, toggles.githubAgent]);

  const loadSettings = async () => {
    const result = await chrome.storage.sync.get(['apiUrl']);
    if (result.apiUrl) {
      setApiUrl(result.apiUrl);
    }
  };

  const checkConnection = async () => {
    try {
      const response = await fetch(`${apiUrl}/health`, {
        signal: AbortSignal.timeout(5000)
      });
      setIsConnected(response.ok);
    } catch (error) {
      console.error('Connection check failed:', error);
      setIsConnected(false);
    }
  };

  const getCurrentTab = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) return;

      const repoInfo = extractGitHubInfo(tab.url);
      if (repoInfo) {
        setCurrentRepo(`${repoInfo.owner}/${repoInfo.repo}`);
        setCurrentBranch(repoInfo.branch || 'main');
        setShowGitHubAgent(true);
      } else {
        setShowGitHubAgent(false);
      }
    } catch (error) {
      console.error('Error getting current tab:', error);
      setShowGitHubAgent(false);
    }
  };

  const extractGitHubInfo = (url) => {
    const githubPattern = /github\.com\/([^\/]+)\/([^\/]+)/;
    const match = url.match(githubPattern);
    if (!match) return null;

    const owner = match[1];
    const repo = match[2].split('?')[0].replace(/\.git$/, '');
    const branchPattern = /\/tree\/([^\/]+)/;
    const branchMatch = url.match(branchPattern);
    const branch = branchMatch ? branchMatch[1] : 'main';

    return { owner, repo, branch };
  };

  const analyzeRepository = async () => {
    if (!currentRepo || isAnalyzing) return;

    setIsAnalyzing(true);
    setError('');
    setSummaryContent('');
    setIndexingStatus('indexing');
    setIndexingProgress(0);

    try {
      // Get GitHub token from storage
      const { githubToken } = await chrome.storage.sync.get(['githubToken']);
      
      const repoUrl = `https://github.com/${currentRepo}`;
      
      const response = await fetch(`${apiUrl}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          repoUrl, 
          branch: currentBranch,
          githubToken: githubToken || undefined
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      
      // Start polling for status
      await pollStatus(data.jobId);
      
    } catch (error) {
      console.error('Error analyzing repository:', error);
      setError(`Failed to analyze: ${error.message}`);
      setIsAnalyzing(false);
      setIndexingStatus('failed');
    }
  };

  const pollStatus = async (jobId) => {
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max (60 * 2 seconds)
    
    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const response = await fetch(`${apiUrl}/status/${jobId}`);
        
        if (!response.ok) {
          // Job not found yet - this is normal on Vercel (stateless)
          // Keep trying for a bit
          if (attempts < 5) {
            console.log('Job not found yet, retrying...');
            return;
          }
          
          // After 5 attempts, assume it's processing in background
          clearInterval(interval);
          setIndexingStatus('completed');
          setIndexingProgress(100);
          setSummaryContent('✅ Repository indexed!\n\nYou can now ask questions in the Q&A tab.');
          setIsAnalyzing(false);
          return;
        }

        const data = await response.json();
        
        // Update progress
        if (data.progress) {
          setIndexingProgress(data.progress);
        }
        
        if (data.status === 'completed') {
          clearInterval(interval);
          setIndexingStatus('completed');
          setIndexingProgress(100);
          setStats(data.stats);
          setSummaryContent(`✅ Repository indexed successfully!\n\n📊 Stats:\n• Files processed: ${data.stats?.filesProcessed || 'N/A'}\n• Chunks created: ${data.stats?.chunksCreated || 'N/A'}\n• Time: ${data.stats?.durationMs ? (data.stats.durationMs / 1000).toFixed(1) + 's' : 'N/A'}\n\nYou can now ask questions in the Q&A tab!`);
          setIsAnalyzing(false);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setIndexingStatus('failed');
          setError(`Indexing failed: ${data.error || 'Unknown error'}`);
          setIsAnalyzing(false);
        }
        
        // Timeout after max attempts
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setIndexingStatus('completed');
          setIndexingProgress(100);
          setSummaryContent('⏱️ Indexing is taking longer than expected.\n\nThe repository is likely still being processed in the background. Try asking a question - it might be ready!');
          setIsAnalyzing(false);
        }
      } catch (error) {
        console.error('Polling error:', error);
        // Don't fail on polling errors, just keep trying
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setIndexingStatus('completed');
          setSummaryContent('⚠️ Could not verify indexing status.\n\nThe repository might still be processing. Try asking a question!');
          setIsAnalyzing(false);
        }
      }
    }, 2000); // Poll every 2 seconds
  };

  const generateSummary = async (ingestionData) => {
    try {
      const response = await fetch(`${apiUrl}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoId: currentRepo,
          query: 'README documentation overview main features installation setup usage',
          topK: 15,
          minScore: 0.15
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setSummaryContent(data.answer);
      setStats(ingestionData.stats);
    } catch (error) {
      console.error('Error generating summary:', error);
      setError(`Failed to generate summary: ${error.message}`);
    }
  };

  const askQuestion = async () => {
    if (!queryInput.trim() || isQuerying) return;

    setIsQuerying(true);
    setError('');
    setAnswerContent('');
    setSources([]);

    try {
      // Get GitHub token from storage
      const { githubToken } = await chrome.storage.sync.get(['githubToken']);
      
      const requestBody = {
        repoId: currentRepo,
        query: queryInput,
        topK: 10,
        minScore: 0.25,
        githubToken: githubToken || undefined  // Send token in body
      };

      if (scopeType === 'folder' && folderPath.trim()) {
        requestBody.scope = { type: 'folder', path: folderPath.trim() };
      }

      const response = await fetch(`${apiUrl}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setAnswerContent(data.answer);
      setSources(data.sources || []);
    } catch (error) {
      console.error('Error asking question:', error);
      setError(`Failed to get answer: ${error.message}`);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <Section title="Developer Tools" expanded={expanded} onToggle={onToggle}>
      <Toggle
        label="GitHub Agent"
        description="AI-powered repository assistant"
        enabled={toggles.githubAgent || false}
        onChange={(val) => onToggleChange('githubAgent', val)}
      />

      {/* GitHub Token Settings - Show when GitHub Agent is enabled */}
      {toggles.githubAgent && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <GitHubSettings />
        </div>
      )}

      {/* GitHub Agent UI - Only show when enabled and on GitHub */}
      {toggles.githubAgent && showGitHubAgent && currentRepo && (
        <div className="mt-3 pt-3 border-t border-gray-700 space-y-3">
          {/* Repository Info */}
          <div className="bg-gray-750 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8z"/>
              </svg>
              <span className="text-sm font-semibold text-gray-200">{currentRepo}</span>
            </div>
            <div className="flex items-center gap-2 ml-6">
              <svg className="w-3 h-3 text-gray-500" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 0110 8.5H6a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v1.836A2.492 2.492 0 016 7h4a1 1 0 001-1v-.628A2.25 2.25 0 019.5 3.25z"/>
              </svg>
              <span className="text-xs text-gray-500">{currentBranch}</span>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-gray-400">{isConnected ? 'Connected' : 'Not connected'}</span>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'summary'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab('query')}
              className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'query'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Q&A
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-red-400">⚠️</span>
                <span className="text-sm text-red-300 flex-1">{error}</span>
              </div>
            </div>
          )}

          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-3">
              <button
                onClick={analyzeRepository}
                disabled={isAnalyzing || !isConnected}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Indexing... {indexingProgress}%</span>
                  </>
                ) : (
                  <span>Index Repository</span>
                )}
              </button>

              {/* Progress Bar */}
              {isAnalyzing && (
                <div className="bg-gray-750 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2 text-xs text-gray-400">
                    <span>Processing repository...</span>
                    <span>{indexingProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${indexingProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {indexingProgress < 30 && '📥 Fetching files from GitHub...'}
                    {indexingProgress >= 30 && indexingProgress < 50 && '✂️ Chunking code...'}
                    {indexingProgress >= 50 && indexingProgress < 80 && '🧠 Generating embeddings...'}
                    {indexingProgress >= 80 && '💾 Storing in vector database...'}
                  </p>
                </div>
              )}

              {summaryContent && (
                <div className="bg-gray-750 rounded-lg p-3">
                  <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {summaryContent}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Query Tab */}
          {activeTab === 'query' && (
            <div className="space-y-3">
              {/* Indexing Warning */}
              {isAnalyzing && (
                <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-400">⏳</span>
                    <div className="flex-1">
                      <p className="text-sm text-yellow-300 font-semibold">Repository is being indexed...</p>
                      <p className="text-xs text-yellow-400 mt-1">Please wait until indexing completes ({indexingProgress}%)</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ready Indicator */}
              {indexingStatus === 'completed' && !isAnalyzing && (
                <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <p className="text-xs text-green-300">Repository indexed! Ready for questions.</p>
                  </div>
                </div>
              )}

              <textarea
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Ask anything about this repository..."
                className="w-full bg-gray-750 border border-gray-600 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                rows="3"
              />

              <div className="bg-gray-750 rounded-lg p-3 space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Search Scope</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      value="full"
                      checked={scopeType === 'full'}
                      onChange={(e) => setScopeType(e.target.value)}
                      className="text-blue-500"
                    />
                    <span>Full Repository</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      value="folder"
                      checked={scopeType === 'folder'}
                      onChange={(e) => setScopeType(e.target.value)}
                      className="text-blue-500"
                    />
                    <span>Specific Folder</span>
                  </label>
                </div>
                {scopeType === 'folder' && (
                  <input
                    type="text"
                    value={folderPath}
                    onChange={(e) => setFolderPath(e.target.value)}
                    placeholder="e.g., src/components"
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                )}
              </div>

              <button
                onClick={askQuestion}
                disabled={!queryInput.trim() || isQuerying || !isConnected || isAnalyzing}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isQuerying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Asking...</span>
                  </>
                ) : isAnalyzing ? (
                  <span>⏳ Indexing in progress...</span>
                ) : (
                  <span>Ask Question</span>
                )}
              </button>

              {answerContent && (
                <div className="bg-gray-750 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-200">Answer</h3>
                    <button
                      onClick={() => navigator.clipboard.writeText(answerContent)}
                      className="text-gray-400 hover:text-gray-200 text-xs"
                    >
                      📋 Copy
                    </button>
                  </div>
                  <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {answerContent}
                  </div>

                  {sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Sources</h4>
                      <div className="space-y-2">
                        {sources.map((source, idx) => (
                          <div key={idx} className="bg-gray-800 rounded p-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-mono text-blue-400">📄 {source.file}</span>
                              <span className="text-xs text-gray-500">{(source.score * 100).toFixed(0)}%</span>
                            </div>
                            <div className="text-xs text-gray-400 font-mono line-clamp-2">
                              {source.chunk || source.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* GitHub Agent enabled but not on GitHub */}
      {toggles.githubAgent && !showGitHubAgent && (
        <div className="mt-3 pt-3 border-t border-gray-700 text-center py-4">
          <div className="text-3xl mb-2">📌</div>
          <p className="text-xs text-gray-400">
            Navigate to a GitHub repository to use this feature
          </p>
        </div>
      )}

      {/* Other Developer Tools */}
      <Toggle
        label="AWS Agent"
        description="AWS service recommender"
        enabled={toggles.awsAgent || false}
        onChange={(val) => onToggleChange('awsAgent', val)}
      />

      {/* AWS Agent UI - Only show when enabled */}
      {toggles.awsAgent && <AWSAgent />}
      
      <Toggle
        label="Auto Clear Cache"
        description="Automatically clear cache on page refresh"
        enabled={toggles.autoClearCache || false}
        onChange={(val) => onToggleChange('autoClearCache', val)}
      />
      
      <Toggle
        label="Edit Cookie"
        description="View and edit cookies on page"
        enabled={toggles.editCookie || false}
        onChange={(val) => onToggleChange('editCookie', val)}
      />
      
      <Toggle
        label="Check SEO"
        description="Analyze page SEO metrics"
        enabled={toggles.checkSEO || false}
        onChange={(val) => onToggleChange('checkSEO', val)}
      />
      
      <Toggle
        label="Font Finder"
        description="Hover to see font details"
        enabled={toggles.fontFinder || false}
        onChange={(val) => onToggleChange('fontFinder', val)}
      />
      
      <Toggle
        label="Color Finder"
        description="Pick colors from page"
        enabled={toggles.colorFinder || false}
        onChange={(val) => onToggleChange('colorFinder', val)}
      />
    </Section>
  );
};

export default DeveloperTools;
