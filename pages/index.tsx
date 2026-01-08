import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Dev Productivity Suite</title>
        <meta name="description" content="Developer productivity tools with GitHub RAG integration" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Dev Productivity Suite
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Chrome extension with integrated GitHub RAG capabilities
          </p>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">GitHub Agent API</h2>
            <p className="text-gray-700 mb-4">
              The GitHub agent is now integrated into this Next.js application.
              No separate backend microservice needed!
            </p>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Available Endpoints:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/github/health</code> - Health check</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/github/stats</code> - System statistics</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/github/ingest</code> - Ingest repository</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/github/query</code> - Query repository</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/github/status/:jobId</code> - Check job status</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">DELETE /api/github/repo/:repoId</code> - Delete repository</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2">Getting Started</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Install dependencies: <code className="bg-white px-2 py-1 rounded">npm install</code></li>
              <li>Configure environment variables in <code className="bg-white px-2 py-1 rounded">.env.local</code></li>
              <li>Start the development server: <code className="bg-white px-2 py-1 rounded">npm run dev</code></li>
              <li>Build the Chrome extension: <code className="bg-white px-2 py-1 rounded">npm run build:extension</code></li>
            </ol>
          </div>
        </div>
      </main>
    </>
  );
}
