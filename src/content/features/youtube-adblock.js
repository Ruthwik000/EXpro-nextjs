// YouTube Ad Blocker - Content Script
export function initYouTubeAdBlock() {
  if (!window.location.hostname.includes('youtube.com')) {
    return { cleanup: () => {} };
  }

  console.log('YouTube Ad Blocker initialized');

  // CSS to hide ad elements
  const style = document.createElement('style');
  style.id = 'youtube-adblock-style';
  style.textContent = `
    /* Hide video ads */
    .video-ads,
    .ytp-ad-module,
    .ytp-ad-overlay-container,
    .ytp-ad-text-overlay,
    .ytp-ad-player-overlay,
    .ytp-ad-image-overlay,
    ytd-display-ad-renderer,
    ytd-promoted-sparkles-web-renderer,
    ytd-promoted-video-renderer,
    ytd-compact-promoted-video-renderer,
    ytd-promoted-sparkles-text-search-renderer,
    
    /* Hide banner ads */
    #masthead-ad,
    ytd-banner-promo-renderer,
    ytd-statement-banner-renderer,
    
    /* Hide sidebar ads */
    ytd-ad-slot-renderer,
    ytd-in-feed-ad-layout-renderer,
    yt-mealbar-promo-renderer,
    
    /* Hide overlay ads */
    .ytp-ad-overlay-container,
    .ytp-ad-overlay-image,
    .ytp-ad-text-overlay,
    
    /* Hide companion ads */
    #player-ads,
    #watch-channel-brand-div,
    
    /* Hide shorts ads */
    ytd-reel-video-renderer[is-ad],
    
    /* Hide search ads */
    ytd-search-pyv-renderer,
    
    /* Hide homepage ads */
    ytd-rich-item-renderer[is-ad],
    
    /* Additional ad containers */
    .ytd-display-ad-renderer,
    .ytd-promoted-sparkles-web-renderer,
    .ytd-video-masthead-ad-v3-renderer,
    .ytd-statement-banner-renderer,
    .ytd-primetime-promo-renderer {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      min-height: 0 !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
    
    /* Speed up video when ad is detected */
    .ad-showing video {
      playback-rate: 16 !important;
    }
  `;
  document.head.appendChild(style);

  // Function to skip video ads
  function skipAds() {
    try {
      // Skip button
      const skipButton = document.querySelector('.ytp-ad-skip-button, .ytp-skip-ad-button, .ytp-ad-skip-button-modern');
      if (skipButton) {
        skipButton.click();
        console.log('Clicked skip button');
      }

      // Close overlay ads
      const closeButtons = document.querySelectorAll('.ytp-ad-overlay-close-button, .ytp-ad-overlay-close-container');
      closeButtons.forEach(btn => btn.click());

      // Speed up ads if they can't be skipped
      const video = document.querySelector('video');
      const adContainer = document.querySelector('.ad-showing, .ad-interrupting');
      
      if (video && adContainer) {
        video.playbackRate = 16;
        video.muted = true;
        console.log('Speeding up ad');
      }

      // Remove ad elements from DOM
      const adElements = document.querySelectorAll(`
        ytd-display-ad-renderer,
        ytd-promoted-sparkles-web-renderer,
        ytd-ad-slot-renderer,
        ytd-in-feed-ad-layout-renderer,
        .video-ads,
        .ytp-ad-module,
        ytd-banner-promo-renderer,
        ytd-statement-banner-renderer,
        #player-ads
      `);
      
      adElements.forEach(el => {
        if (el && el.parentNode) {
          el.remove();
          console.log('Removed ad element:', el.tagName);
        }
      });

      // Check if video is playing an ad and try to skip
      if (video) {
        const adIndicator = document.querySelector('.ytp-ad-text, .ytp-ad-preview-text');
        if (adIndicator) {
          // Try to seek to end of ad
          const duration = video.duration;
          if (duration && duration > 0 && duration < 60) {
            video.currentTime = duration - 0.1;
            console.log('Skipped to end of ad');
          }
        }
      }

    } catch (error) {
      console.error('Error in skipAds:', error);
    }
  }

  // Run immediately
  skipAds();

  // Run periodically
  const interval = setInterval(skipAds, 500);

  // Observer for dynamic content
  const observer = new MutationObserver((mutations) => {
    skipAds();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Listen for video events
  document.addEventListener('yt-navigate-finish', skipAds);
  document.addEventListener('yt-page-data-updated', skipAds);

  // Intercept ad requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string') {
      // Block ad-related requests
      if (url.includes('/api/stats/ads') || 
          url.includes('/pagead/') || 
          url.includes('/ptracking') ||
          url.includes('doubleclick.net') ||
          url.includes('googlesyndication.com')) {
        console.log('Blocked ad request:', url);
        return Promise.reject(new Error('Ad blocked'));
      }
    }
    return originalFetch.apply(this, args);
  };

  // Intercept XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    if (typeof url === 'string') {
      if (url.includes('/api/stats/ads') || 
          url.includes('/pagead/') || 
          url.includes('/ptracking') ||
          url.includes('doubleclick.net') ||
          url.includes('googlesyndication.com')) {
        console.log('Blocked XHR ad request:', url);
        return;
      }
    }
    return originalOpen.call(this, method, url, ...rest);
  };

  console.log('YouTube ad blocking active');

  return {
    cleanup: () => {
      clearInterval(interval);
      observer.disconnect();
      style.remove();
      document.removeEventListener('yt-navigate-finish', skipAds);
      document.removeEventListener('yt-page-data-updated', skipAds);
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalOpen;
      console.log('YouTube ad blocking disabled');
    }
  };
}
