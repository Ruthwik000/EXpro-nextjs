import React, { useState, useEffect } from 'react';

const GitHubSettings = () => {
  const [token, setToken] = useState('');
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    // Load saved token
    chrome.storage.sync.get(['githubToken'], (result) => {
      if (result.githubToken) {
        setToken(result.githubToken);
      }
    });
  }, []);

  const handleSave = () => {
    chrome.storage.sync.set({ githubToken: token }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleTest = async () => {
    if (!token.trim()) return;

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const rateLimitResponse = await fetch('https://api.github.com/rate_limit', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        const rateData = await rateLimitResponse.json();

        setTestResult({
          success: true,
          user: data.login,
          rateLimit: `${rateData.rate.remaining}/${rateData.rate.limit}`
        });
      } else {
        setTestResult({
          success: false,
          message: 'Invalid token'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Test failed'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClear = () => {
    setToken('');
    chrome.storage.sync.remove('githubToken');
    setTestResult(null);
  };

  return (
    <div className="bg-gray-750 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200">GitHub Token</h3>
        <a
          href="https://github.com/settings/tokens/new"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          Generate →
        </a>
      </div>

      <p className="text-xs text-gray-400">
        Add your token for private repos and higher rate limits (5000/hr vs 60/hr)
      </p>

      <div className="relative">
        <input
          type={showToken ? 'text' : 'password'}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 pr-10 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
        />
        <button
          onClick={() => setShowToken(!showToken)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
        >
          {showToken ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>

      {testResult && (
        <div className={`text-xs p-2 rounded ${
          testResult.success
            ? 'bg-green-900/30 text-green-300 border border-green-500/30'
            : 'bg-red-900/30 text-red-300 border border-red-500/30'
        }`}>
          {testResult.success ? (
            <div>
              ✅ Valid! User: <span className="font-semibold">{testResult.user}</span>
              <br />
              Rate limit: {testResult.rateLimit}
            </div>
          ) : (
            <div>❌ {testResult.message}</div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded text-xs font-medium transition-colors"
        >
          {saved ? '✓ Saved!' : 'Save'}
        </button>
        <button
          onClick={handleTest}
          disabled={!token.trim() || testing}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-1.5 px-3 rounded text-xs font-medium transition-colors"
        >
          {testing ? 'Testing...' : 'Test'}
        </button>
        <button
          onClick={handleClear}
          className="bg-gray-600 hover:bg-gray-700 text-white py-1.5 px-3 rounded text-xs font-medium transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-2">
        <p className="text-xs text-yellow-300">
          <span className="font-semibold">Scopes needed:</span> <code className="bg-gray-800 px-1 rounded">public_repo</code> or <code className="bg-gray-800 px-1 rounded">repo</code>
        </p>
      </div>
    </div>
  );
};

export default GitHubSettings;
