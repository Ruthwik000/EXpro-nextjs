export async function clearCache() {
  try {
    // Clear browsing data
    await chrome.browsingData.remove({
      since: 0
    }, {
      cache: true,
      localStorage: true,
      sessionStorage: true
    });
    
    console.log('Cache cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
}
