import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Settings() {
  const [githubToken, setGithubToken] = useState('');
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    // Load saved token from localStorage
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
      setGithubToken(savedToken);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('github_token', githubToken);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/github/test-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: githubToken }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: `✅ Token valid! User: ${data.user}, Rate limit: ${data.rateLimit.remaining}/${data.rateLimit.limit}`,
        });
      } else {
        setTestResult({
          success: false,
          message: `❌ ${data.error || 'Invalid token'}`,
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: '❌ Failed to test token',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClear = () => {
    setGithubToken('');
    localStorage.removeItem('github_token');
    setTestResult(null);
  };

  return (
    <>
      <Head>
        <title>Settings - Dev Productivity Suite</title>
      </Head>
      <main className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← Back to Home
            </Link>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-8">Settings</h1>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">GitHub Token</h2>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-4">
                Enter your GitHub Personal Access Token to enable:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 mb-4">
                <li>Access to private repositories</li>
                <li>Higher rate limits (5,000/hour vs 60/hour)</li>
                <li>Issues and pull requests access</li>
              </ul>
            </div>

            <div className="mb-4">
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                Personal Access Token
              </label>
              <input
                id="token"
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-2">
                Generate at:{' '}
                <a
                  href="https://github.com/settings/tokens/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  github.com/settings/tokens/new
                </a>
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-sm mb-2">Required Scopes:</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✅ <code className="bg-white px-2 py-0.5 rounded">public_repo</code> - For public repositories</li>
                <li>✅ <code className="bg-white px-2 py-0.5 rounded">repo</code> - For private repositories (optional)</li>
              </ul>
            </div>

            {testResult && (
              <div
                className={`mb-4 p-4 rounded-lg ${
                  testResult.success
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {testResult.message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {saved ? '✓ Saved!' : 'Save Token'}
              </button>
              <button
                onClick={handleTest}
                disabled={!githubToken || testing}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {testing ? 'Testing...' : 'Test Token'}
              </button>
              <button
                onClick={handleClear}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2">⚠️ Security Note</h3>
            <p className="text-gray-700">
              Your token is stored locally in your browser (localStorage) and sent directly to GitHub API.
              It is never stored on our servers. For production use, consider implementing proper authentication.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
