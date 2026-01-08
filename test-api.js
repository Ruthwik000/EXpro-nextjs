#!/usr/bin/env node

/**
 * Simple API test script for the GitHub agent
 * Run with: node test-api.js
 */

const API_BASE = 'http://localhost:3000/api/github';

async function testHealth() {
  console.log('\n🔍 Testing Health Endpoint...');
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    console.log('✅ Health check passed:', data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testStats() {
  console.log('\n📊 Testing Stats Endpoint...');
  try {
    const response = await fetch(`${API_BASE}/stats`);
    const data = await response.json();
    console.log('✅ Stats retrieved:', data);
    return true;
  } catch (error) {
    console.error('❌ Stats failed:', error.message);
    return false;
  }
}

async function testIngest() {
  console.log('\n📥 Testing Ingest Endpoint...');
  try {
    const response = await fetch(`${API_BASE}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repoUrl: 'https://github.com/vercel/next.js',
        branch: 'canary'
      })
    });
    const data = await response.json();
    console.log('✅ Ingestion started:', data);
    return data.jobId;
  } catch (error) {
    console.error('❌ Ingestion failed:', error.message);
    return null;
  }
}

async function testStatus(jobId) {
  console.log('\n⏳ Testing Status Endpoint...');
  try {
    const response = await fetch(`${API_BASE}/status/${jobId}`);
    const data = await response.json();
    console.log('✅ Status retrieved:', data);
    return true;
  } catch (error) {
    console.error('❌ Status check failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests...');
  console.log(`📍 API Base URL: ${API_BASE}`);
  console.log('⚠️  Make sure the Next.js dev server is running (npm run dev)');

  // Test health
  const healthOk = await testHealth();
  if (!healthOk) {
    console.log('\n❌ Health check failed. Is the server running?');
    process.exit(1);
  }

  // Test stats
  await testStats();

  // Test ingest (optional - commented out to avoid accidental ingestion)
  // const jobId = await testIngest();
  // if (jobId) {
  //   await new Promise(resolve => setTimeout(resolve, 2000));
  //   await testStatus(jobId);
  // }

  console.log('\n✅ All tests completed!');
  console.log('\n📝 To test ingestion and query:');
  console.log('   1. Uncomment the ingest test in this file');
  console.log('   2. Or use curl commands from MIGRATION_GUIDE.md');
}

runTests().catch(error => {
  console.error('\n💥 Test suite failed:', error);
  process.exit(1);
});
