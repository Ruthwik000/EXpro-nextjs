// SEO & Performance Checker Feature - Comprehensive like Checkbot
export function initCheckSEO() {
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  
  // Dragging state
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let panelStartX = 0;
  let panelStartY = 0;

  // Resizing state
  let isResizing = false;
  let resizeStartX = 0;
  let resizeStartY = 0;
  let panelStartWidth = 0;
  let panelStartHeight = 0;

  // Analysis results
  let analysisResults = {
    overview: { pass: 0, warn: 0, fail: 0 },
    seo: [],
    performance: [],
    security: [],
    accessibility: []
  };

  const panel = document.createElement('div');
  panel.id = 'seo-checker-panel';
  panel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 800px;
    height: 600px;
    min-width: 600px;
    min-height: 400px;
    max-width: 95vw;
    max-height: 95vh;
    background: #1F2937;
    border-radius: 12px;
    border: 1px solid #374151;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    z-index: 999999;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #E5E7EB;
    overflow: hidden;
  `;

  panel.innerHTML = `
    <div id="seo-header" style="background: #111827; padding: 16px; border-radius: 12px 12px 0 0; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #374151; cursor: move; user-select: none;">
      <div style="font-weight: 600; font-size: 16px; color: #E5E7EB;">SEO & Performance Checker</div>
      <button id="close-seo-panel" style="background: none; border: none; color: #9CA3AF; cursor: pointer; font-size: 24px; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: all 0.2s;">×</button>
    </div>

    <div style="display: flex; background: #111827; border-bottom: 1px solid #374151; padding: 0 16px;">
      <button class="tab-btn active" data-tab="overview" style="padding: 12px 20px; background: none; border: none; color: #9CA3AF; cursor: pointer; font-size: 14px; font-weight: 500; border-bottom: 2px solid transparent; transition: all 0.2s;">Overview</button>
      <button class="tab-btn" data-tab="seo" style="padding: 12px 20px; background: none; border: none; color: #9CA3AF; cursor: pointer; font-size: 14px; font-weight: 500; border-bottom: 2px solid transparent; transition: all 0.2s;">SEO</button>
      <button class="tab-btn" data-tab="performance" style="padding: 12px 20px; background: none; border: none; color: #9CA3AF; cursor: pointer; font-size: 14px; font-weight: 500; border-bottom: 2px solid transparent; transition: all 0.2s;">Performance</button>
      <button class="tab-btn" data-tab="security" style="padding: 12px 20px; background: none; border: none; color: #9CA3AF; cursor: pointer; font-size: 14px; font-weight: 500; border-bottom: 2px solid transparent; transition: all 0.2s;">Security</button>
      <button class="tab-btn" data-tab="accessibility" style="padding: 12px 20px; background: none; border: none; color: #9CA3AF; cursor: pointer; font-size: 14px; font-weight: 500; border-bottom: 2px solid transparent; transition: all 0.2s;">Accessibility</button>
    </div>

    <div style="flex: 1; overflow-y: auto; padding: 20px;">
      <div id="tab-content-overview" class="tab-content">
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #E5E7EB;">Analysis Summary</h3>
          
          <!-- Performance Meters -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
            <!-- Overall Score Circle -->
            <div style="display: flex; align-items: center; justify-content: center; background: #111827; padding: 30px; border-radius: 12px; border: 1px solid #374151;">
              <div style="position: relative; width: 180px; height: 180px;">
                <svg width="180" height="180" style="transform: rotate(-90deg);">
                  <circle cx="90" cy="90" r="75" fill="none" stroke="#374151" stroke-width="12"/>
                  <circle id="overall-circle" cx="90" cy="90" r="75" fill="none" stroke="#3B82F6" stroke-width="12" stroke-dasharray="471" stroke-dashoffset="471" stroke-linecap="round" style="transition: stroke-dashoffset 1s ease, stroke 0.3s ease;"/>
                </svg>
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                  <div id="overall-score" style="font-size: 48px; font-weight: 700; color: #E5E7EB; line-height: 1;">0%</div>
                  <div style="font-size: 13px; color: #9CA3AF; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Overall</div>
                </div>
              </div>
            </div>

            <!-- Category Scores -->
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <div style="background: #111827; padding: 16px; border-radius: 8px; border: 1px solid #374151;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 14px; color: #E5E7EB; font-weight: 500;">SEO</span>
                  <span id="seo-score" style="font-size: 18px; font-weight: 700; color: #3B82F6;">0%</span>
                </div>
                <div style="height: 8px; background: #374151; border-radius: 4px; overflow: hidden;">
                  <div id="seo-bar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #3B82F6, #60A5FA); transition: width 1s ease, background 0.3s ease; border-radius: 4px;"></div>
                </div>
              </div>

              <div style="background: #111827; padding: 16px; border-radius: 8px; border: 1px solid #374151;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 14px; color: #E5E7EB; font-weight: 500;">Performance</span>
                  <span id="performance-score" style="font-size: 18px; font-weight: 700; color: #3B82F6;">0%</span>
                </div>
                <div style="height: 8px; background: #374151; border-radius: 4px; overflow: hidden;">
                  <div id="performance-bar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #3B82F6, #60A5FA); transition: width 1s ease, background 0.3s ease; border-radius: 4px;"></div>
                </div>
              </div>

              <div style="background: #111827; padding: 16px; border-radius: 8px; border: 1px solid #374151;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 14px; color: #E5E7EB; font-weight: 500;">Security</span>
                  <span id="security-score" style="font-size: 18px; font-weight: 700; color: #3B82F6;">0%</span>
                </div>
                <div style="height: 8px; background: #374151; border-radius: 4px; overflow: hidden;">
                  <div id="security-bar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #3B82F6, #60A5FA); transition: width 1s ease, background 0.3s ease; border-radius: 4px;"></div>
                </div>
              </div>

              <div style="background: #111827; padding: 16px; border-radius: 8px; border: 1px solid #374151;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 14px; color: #E5E7EB; font-weight: 500;">Accessibility</span>
                  <span id="accessibility-score" style="font-size: 18px; font-weight: 700; color: #3B82F6;">0%</span>
                </div>
                <div style="height: 8px; background: #374151; border-radius: 4px; overflow: hidden;">
                  <div id="accessibility-bar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #3B82F6, #60A5FA); transition: width 1s ease, background 0.3s ease; border-radius: 4px;"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Stats Grid -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
            <div style="background: #111827; padding: 20px; border-radius: 8px; border: 1px solid #374151; text-align: center;">
              <div style="font-size: 36px; font-weight: 700; color: #10B981; margin-bottom: 4px;" id="pass-count">0</div>
              <div style="font-size: 13px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px;">Passed</div>
            </div>
            <div style="background: #111827; padding: 20px; border-radius: 8px; border: 1px solid #374151; text-align: center;">
              <div style="font-size: 36px; font-weight: 700; color: #F59E0B; margin-bottom: 4px;" id="warn-count">0</div>
              <div style="font-size: 13px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px;">Warnings</div>
            </div>
            <div style="background: #111827; padding: 20px; border-radius: 8px; border: 1px solid #374151; text-align: center;">
              <div style="font-size: 36px; font-weight: 700; color: #EF4444; margin-bottom: 4px;" id="fail-count">0</div>
              <div style="font-size: 13px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px;">Failed</div>
            </div>
          </div>

          <!-- Page Statistics -->
          <div style="background: #111827; padding: 20px; border-radius: 8px; border: 1px solid #374151; margin-bottom: 24px;">
            <h4 style="font-size: 14px; font-weight: 600; color: #E5E7EB; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">Page Statistics</h4>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #374151;">
                <span style="font-size: 13px; color: #9CA3AF;">Images</span>
                <span id="stat-images" style="font-size: 14px; color: #60A5FA; font-weight: 600;">0</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #374151;">
                <span style="font-size: 13px; color: #9CA3AF;">Links</span>
                <span id="stat-links" style="font-size: 14px; color: #60A5FA; font-weight: 600;">0</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #374151;">
                <span style="font-size: 13px; color: #9CA3AF;">CSS Files</span>
                <span id="stat-css" style="font-size: 14px; color: #60A5FA; font-weight: 600;">0</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #374151;">
                <span style="font-size: 13px; color: #9CA3AF;">JavaScript Files</span>
                <span id="stat-js" style="font-size: 14px; color: #60A5FA; font-weight: 600;">0</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #374151;">
                <span style="font-size: 13px; color: #9CA3AF;">Headings</span>
                <span id="stat-headings" style="font-size: 14px; color: #60A5FA; font-weight: 600;">0</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #374151;">
                <span style="font-size: 13px; color: #9CA3AF;">Forms</span>
                <span id="stat-forms" style="font-size: 14px; color: #60A5FA; font-weight: 600;">0</span>
              </div>
            </div>
          </div>
        </div>
        <div id="overview-details"></div>
      </div>

      <div id="tab-content-seo" class="tab-content" style="display: none;"></div>
      <div id="tab-content-performance" class="tab-content" style="display: none;"></div>
      <div id="tab-content-security" class="tab-content" style="display: none;"></div>
      <div id="tab-content-accessibility" class="tab-content" style="display: none;"></div>
    </div>
  `;

  document.body.appendChild(panel);

  // Add resize handle
  const resizeHandle = document.createElement('div');
  resizeHandle.id = 'resize-handle-seo';
  resizeHandle.style.cssText = `
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    cursor: nwse-resize;
    background: linear-gradient(135deg, transparent 50%, #666 50%);
    border-radius: 0 0 12px 0;
    z-index: 10;
  `;
  panel.appendChild(resizeHandle);

  // Make panel draggable
  const header = document.getElementById('seo-header');
  
  header.addEventListener('mousedown', (e) => {
    if (e.target.id === 'close-seo-panel' || e.target.closest('#close-seo-panel')) {
      return;
    }
    
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    
    const rect = panel.getBoundingClientRect();
    panelStartX = rect.left;
    panelStartY = rect.top;
    
    panel.style.transform = 'none';
    panel.style.left = panelStartX + 'px';
    panel.style.top = panelStartY + 'px';
    
    header.style.cursor = 'grabbing';
    e.preventDefault();
  });

  // Make panel resizable
  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    
    panelStartWidth = panel.offsetWidth;
    panelStartHeight = panel.offsetHeight;
    
    e.preventDefault();
    e.stopPropagation();
  });

  // Mouse move handler
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;
      
      let newX = panelStartX + deltaX;
      let newY = panelStartY + deltaY;
      
      const maxX = window.innerWidth - panel.offsetWidth;
      const maxY = window.innerHeight - panel.offsetHeight;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      panel.style.left = newX + 'px';
      panel.style.top = newY + 'px';
    }
    
    if (isResizing) {
      const deltaX = e.clientX - resizeStartX;
      const deltaY = e.clientY - resizeStartY;
      
      let newWidth = panelStartWidth + deltaX;
      let newHeight = panelStartHeight + deltaY;
      
      newWidth = Math.max(600, Math.min(newWidth, window.innerWidth * 0.95));
      newHeight = Math.max(400, Math.min(newHeight, window.innerHeight * 0.95));
      
      panel.style.width = newWidth + 'px';
      panel.style.height = newHeight + 'px';
    }
  });

  // Mouse up handler
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      header.style.cursor = 'move';
    }
    if (isResizing) {
      isResizing = false;
    }
  });

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      
      // Update active tab button
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
        b.style.color = '#9CA3AF';
        b.style.borderBottomColor = 'transparent';
      });
      btn.classList.add('active');
      btn.style.color = '#60A5FA';
      btn.style.borderBottomColor = '#3B82F6';
      
      // Show corresponding content
      document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
      });
      document.getElementById(`tab-content-${tab}`).style.display = 'block';
    });
  });

  // Close panel
  document.getElementById('close-seo-panel').addEventListener('click', () => {
    panel.remove();
    browserAPI.storage.sync.set({ checkSeo: false });
  });

  // Hover effect for close button
  const closeBtn = document.getElementById('close-seo-panel');
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = '#374151';
    closeBtn.style.color = '#fff';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = 'none';
    closeBtn.style.color = '#9CA3AF';
  });

  // Analysis functions
  function analyzeSEO() {
    const checks = [];
    
    // Title check
    const title = document.querySelector('title');
    if (title && title.textContent.trim()) {
      const titleLength = title.textContent.trim().length;
      if (titleLength >= 30 && titleLength <= 60) {
        checks.push({
          status: 'pass',
          title: 'Page Title',
          value: title.textContent.trim(),
          message: 'Title length is optimal (30-60 characters)',
          improve: ''
        });
      } else {
        checks.push({
          status: 'warn',
          title: 'Page Title',
          value: title.textContent.trim(),
          message: `Title length is ${titleLength} characters`,
          improve: 'Keep your title between 30-60 characters for optimal display in search results. Titles that are too short may not be descriptive enough, while titles that are too long will be truncated.'
        });
      }
    } else {
      checks.push({
        status: 'fail',
        title: 'Page Title',
        value: 'Missing',
        message: 'No title tag found',
        improve: 'Add a <title> tag in the <head> section. The title should be unique, descriptive, and between 30-60 characters. It appears in search results and browser tabs.'
      });
    }

    // Meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && metaDesc.content.trim()) {
      const descLength = metaDesc.content.trim().length;
      if (descLength >= 120 && descLength <= 160) {
        checks.push({
          status: 'pass',
          title: 'Meta Description',
          value: metaDesc.content.trim(),
          message: 'Description length is optimal (120-160 characters)',
          improve: ''
        });
      } else {
        checks.push({
          status: 'warn',
          title: 'Meta Description',
          value: metaDesc.content.trim(),
          message: `Description length is ${descLength} characters`,
          improve: 'Keep your meta description between 120-160 characters. This text appears in search results below your title and should accurately summarize your page content.'
        });
      }
    } else {
      checks.push({
        status: 'fail',
        title: 'Meta Description',
        value: 'Missing',
        message: 'No meta description found',
        improve: 'Add a <meta name="description" content="..."> tag in the <head> section. Write a compelling 120-160 character summary that encourages clicks from search results.'
      });
    }

    // H1 headings
    const h1s = document.querySelectorAll('h1');
    if (h1s.length === 1) {
      checks.push({
        status: 'pass',
        title: 'H1 Heading',
        value: h1s[0].textContent.trim().substring(0, 100),
        message: 'One H1 heading found',
        improve: ''
      });
    } else if (h1s.length === 0) {
      checks.push({
        status: 'fail',
        title: 'H1 Heading',
        value: 'Missing',
        message: 'No H1 heading found',
        improve: 'Add exactly one <h1> tag to your page. The H1 should contain your main keyword and clearly describe the page content. It helps search engines understand your page topic.'
      });
    } else {
      checks.push({
        status: 'warn',
        title: 'H1 Heading',
        value: `${h1s.length} H1 tags found`,
        message: 'Multiple H1 headings found',
        improve: 'Use only one <h1> tag per page. Multiple H1s can confuse search engines about your page\'s main topic. Use <h2>, <h3>, etc. for subheadings.'
      });
    }

    // Images with alt text
    const images = document.querySelectorAll('img');
    const imagesWithoutAlt = Array.from(images).filter(img => !img.alt || img.alt.trim() === '');
    if (images.length > 0) {
      if (imagesWithoutAlt.length === 0) {
        checks.push({
          status: 'pass',
          title: 'Image Alt Text',
          value: `${images.length} images, all have alt text`,
          message: 'All images have alt attributes',
          improve: ''
        });
      } else {
        checks.push({
          status: 'warn',
          title: 'Image Alt Text',
          value: `${imagesWithoutAlt.length} of ${images.length} images missing alt text`,
          message: 'Some images are missing alt attributes',
          improve: 'Add descriptive alt text to all images. Alt text helps search engines understand image content and improves accessibility for screen readers. Describe what the image shows in 10-15 words.'
        });
      }
    }

    // Canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && canonical.href) {
      checks.push({
        status: 'pass',
        title: 'Canonical URL',
        value: canonical.href,
        message: 'Canonical URL is set',
        improve: ''
      });
    } else {
      checks.push({
        status: 'warn',
        title: 'Canonical URL',
        value: 'Not set',
        message: 'No canonical URL found',
        improve: 'Add a <link rel="canonical" href="..."> tag to specify the preferred URL for this page. This prevents duplicate content issues when the same content is accessible via multiple URLs.'
      });
    }

    // Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    const ogCount = [ogTitle, ogDesc, ogImage].filter(Boolean).length;
    
    if (ogCount === 3) {
      checks.push({
        status: 'pass',
        title: 'Open Graph Tags',
        value: 'All essential tags present',
        message: 'og:title, og:description, og:image found',
        improve: ''
      });
    } else if (ogCount > 0) {
      checks.push({
        status: 'warn',
        title: 'Open Graph Tags',
        value: `${ogCount} of 3 essential tags found`,
        message: 'Some Open Graph tags are missing',
        improve: 'Add og:title, og:description, and og:image meta tags. These control how your page appears when shared on social media platforms like Facebook, LinkedIn, and Slack.'
      });
    } else {
      checks.push({
        status: 'fail',
        title: 'Open Graph Tags',
        value: 'Missing',
        message: 'No Open Graph tags found',
        improve: 'Add Open Graph meta tags (og:title, og:description, og:image) to control how your page appears when shared on social media. This significantly improves click-through rates from social platforms.'
      });
    }

    // Robots meta tag
    const robots = document.querySelector('meta[name="robots"]');
    if (robots) {
      const content = robots.content.toLowerCase();
      if (content.includes('noindex') || content.includes('nofollow')) {
        checks.push({
          status: 'warn',
          title: 'Robots Meta Tag',
          value: robots.content,
          message: 'Page has indexing restrictions',
          improve: 'Your robots meta tag contains "noindex" or "nofollow". This prevents search engines from indexing your page or following links. Remove these directives if you want this page to appear in search results.'
        });
      } else {
        checks.push({
          status: 'pass',
          title: 'Robots Meta Tag',
          value: robots.content,
          message: 'Robots tag allows indexing',
          improve: ''
        });
      }
    }

    // Structured data
    const jsonLd = document.querySelectorAll('script[type="application/ld+json"]');
    if (jsonLd.length > 0) {
      checks.push({
        status: 'pass',
        title: 'Structured Data',
        value: `${jsonLd.length} schema(s) found`,
        message: 'Structured data is present',
        improve: ''
      });
    } else {
      checks.push({
        status: 'warn',
        title: 'Structured Data',
        value: 'Not found',
        message: 'No structured data detected',
        improve: 'Add JSON-LD structured data to help search engines better understand your content. Use Schema.org vocabulary to mark up products, articles, events, reviews, and other content types for rich search results.'
      });
    }

    // Language declaration
    const htmlLang = document.documentElement.lang;
    if (htmlLang && htmlLang.trim()) {
      checks.push({
        status: 'pass',
        title: 'Language Declaration',
        value: htmlLang,
        message: 'Page language is declared',
        improve: ''
      });
    } else {
      checks.push({
        status: 'warn',
        title: 'Language Declaration',
        value: 'Not set',
        message: 'No language attribute on <html> tag',
        improve: 'Add a lang attribute to your <html> tag (e.g., <html lang="en">). This helps search engines understand your content language and improves accessibility for screen readers.'
      });
    }

    return checks;
  }

  function analyzePerformance() {
    const checks = [];
    
    // Page load time (using Navigation Timing API)
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      
      if (loadTime < 3000) {
        checks.push({
          status: 'pass',
          title: 'Page Load Time',
          value: `${(loadTime / 1000).toFixed(2)}s`,
          message: 'Page loads quickly',
          improve: ''
        });
      } else if (loadTime < 5000) {
        checks.push({
          status: 'warn',
          title: 'Page Load Time',
          value: `${(loadTime / 1000).toFixed(2)}s`,
          message: 'Page load time is moderate',
          improve: 'Optimize your page to load in under 3 seconds. Compress images, minify CSS/JS, enable browser caching, use a CDN, and consider lazy loading for below-the-fold content.'
        });
      } else {
        checks.push({
          status: 'fail',
          title: 'Page Load Time',
          value: `${(loadTime / 1000).toFixed(2)}s`,
          message: 'Page loads slowly',
          improve: 'Your page takes over 5 seconds to load. This significantly impacts user experience and SEO. Prioritize: image optimization, code minification, server response time, and removing render-blocking resources.'
        });
      }
    }

    // Image optimization
    const images = document.querySelectorAll('img');
    const largeImages = Array.from(images).filter(img => {
      return img.naturalWidth > 2000 || img.naturalHeight > 2000;
    });
    
    if (images.length > 0) {
      if (largeImages.length === 0) {
        checks.push({
          status: 'pass',
          title: 'Image Sizes',
          value: `${images.length} images checked`,
          message: 'No oversized images detected',
          improve: ''
        });
      } else {
        checks.push({
          status: 'warn',
          title: 'Image Sizes',
          value: `${largeImages.length} oversized images found`,
          message: 'Some images are very large',
          improve: 'Resize images to appropriate dimensions before uploading. Use responsive images with srcset, compress images (aim for <200KB), and consider modern formats like WebP for better compression.'
        });
      }
    }

    // CSS files
    const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
    if (cssLinks.length <= 3) {
      checks.push({
        status: 'pass',
        title: 'CSS Files',
        value: `${cssLinks.length} stylesheet(s)`,
        message: 'Reasonable number of CSS files',
        improve: ''
      });
    } else {
      checks.push({
        status: 'warn',
        title: 'CSS Files',
        value: `${cssLinks.length} stylesheet(s)`,
        message: 'Many CSS files detected',
        improve: 'Combine multiple CSS files into one to reduce HTTP requests. Minify CSS, remove unused styles, and consider inlining critical CSS for above-the-fold content.'
      });
    }

    // JavaScript files
    const scripts = document.querySelectorAll('script[src]');
    if (scripts.length <= 5) {
      checks.push({
        status: 'pass',
        title: 'JavaScript Files',
        value: `${scripts.length} script(s)`,
        message: 'Reasonable number of JS files',
        improve: ''
      });
    } else {
      checks.push({
        status: 'warn',
        title: 'JavaScript Files',
        value: `${scripts.length} script(s)`,
        message: 'Many JavaScript files detected',
        improve: 'Combine and minify JavaScript files. Use async or defer attributes to prevent render blocking. Consider code splitting to load only necessary scripts per page.'
      });
    }

    // Inline styles
    const elementsWithStyle = document.querySelectorAll('[style]');
    if (elementsWithStyle.length < 10) {
      checks.push({
        status: 'pass',
        title: 'Inline Styles',
        value: `${elementsWithStyle.length} elements`,
        message: 'Minimal inline styles',
        improve: ''
      });
    } else {
      checks.push({
        status: 'warn',
        title: 'Inline Styles',
        value: `${elementsWithStyle.length} elements`,
        message: 'Many inline styles detected',
        improve: 'Move inline styles to external CSS files. This improves caching, reduces HTML size, and makes maintenance easier. Use CSS classes instead of inline style attributes.'
      });
    }

    // Viewport meta tag
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      checks.push({
        status: 'pass',
        title: 'Mobile Viewport',
        value: viewport.content,
        message: 'Viewport meta tag is present',
        improve: ''
      });
    } else {
      checks.push({
        status: 'fail',
        title: 'Mobile Viewport',
        value: 'Missing',
        message: 'No viewport meta tag found',
        improve: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the <head>. This ensures your page displays correctly on mobile devices and is required for mobile-friendly ranking.'
      });
    }

    return checks;
  }

  function analyzeSecurity() {
    const checks = [];
    
    // HTTPS
    if (window.location.protocol === 'https:') {
      checks.push({
        status: 'pass',
        title: 'HTTPS',
        value: 'Enabled',
        message: 'Page is served over HTTPS',
        improve: ''
      });
    } else {
      checks.push({
        status: 'fail',
        title: 'HTTPS',
        value: 'Not enabled',
        message: 'Page is not served over HTTPS',
        improve: 'Enable HTTPS for your entire site. HTTPS encrypts data between users and your server, protects against man-in-the-middle attacks, and is required for many modern web features. It\'s also a ranking factor.'
      });
    }

    // Mixed content
    const httpResources = Array.from(document.querySelectorAll('img[src^="http:"], script[src^="http:"], link[href^="http:"]'));
    if (window.location.protocol === 'https:' && httpResources.length > 0) {
      checks.push({
        status: 'warn',
        title: 'Mixed Content',
        value: `${httpResources.length} insecure resource(s)`,
        message: 'HTTP resources on HTTPS page',
        improve: 'Replace all HTTP URLs with HTTPS. Mixed content (HTTP resources on HTTPS pages) can be blocked by browsers and creates security vulnerabilities. Update all resource URLs to use HTTPS.'
      });
    } else {
      checks.push({
        status: 'pass',
        title: 'Mixed Content',
        value: 'None detected',
        message: 'No mixed content issues',
        improve: ''
      });
    }

    // Content Security Policy
    const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (csp) {
      checks.push({
        status: 'pass',
        title: 'Content Security Policy',
        value: 'Implemented',
        message: 'CSP header is present',
        improve: ''
      });
    } else {
      checks.push({
        status: 'warn',
        title: 'Content Security Policy',
        value: 'Not found',
        message: 'No CSP detected',
        improve: 'Implement Content Security Policy headers to prevent XSS attacks, clickjacking, and other code injection attacks. Start with a report-only policy to test before enforcing.'
      });
    }

    // X-Frame-Options
    checks.push({
      status: 'warn',
      title: 'Clickjacking Protection',
      value: 'Cannot verify from client',
      message: 'X-Frame-Options header check requires server',
      improve: 'Ensure X-Frame-Options or CSP frame-ancestors is set on your server to prevent clickjacking attacks. Use "SAMEORIGIN" to allow framing only from same origin, or "DENY" to block all framing.'
    });

    // Inline JavaScript
    const inlineScripts = document.querySelectorAll('script:not([src])');
    const inlineEventHandlers = document.querySelectorAll('[onclick], [onload], [onerror]');
    const totalInline = inlineScripts.length + inlineEventHandlers.length;
    
    if (totalInline < 5) {
      checks.push({
        status: 'pass',
        title: 'Inline JavaScript',
        value: `${totalInline} instance(s)`,
        message: 'Minimal inline JavaScript',
        improve: ''
      });
    } else {
      checks.push({
        status: 'warn',
        title: 'Inline JavaScript',
        value: `${totalInline} instance(s)`,
        message: 'Multiple inline scripts detected',
        improve: 'Move inline JavaScript to external files. This improves security (enables stricter CSP), caching, and code maintainability. Avoid inline event handlers like onclick.'
      });
    }

    return checks;
  }

  function analyzeAccessibility() {
    const checks = [];
    
    // Alt text on images
    const images = document.querySelectorAll('img');
    const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
    
    if (images.length > 0) {
      if (imagesWithoutAlt.length === 0) {
        checks.push({
          status: 'pass',
          title: 'Image Alt Text',
          value: `${images.length} images checked`,
          message: 'All images have alt attributes',
          improve: ''
        });
      } else {
        checks.push({
          status: 'fail',
          title: 'Image Alt Text',
          value: `${imagesWithoutAlt.length} missing alt text`,
          message: 'Some images lack alt attributes',
          improve: 'Add alt text to all images. Screen readers use alt text to describe images to visually impaired users. Decorative images should have empty alt="" attributes.'
        });
      }
    }

    // Form labels
    const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
    const inputsWithoutLabels = Array.from(inputs).filter(input => {
      const id = input.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = input.getAttribute('aria-label');
      return !hasLabel && !hasAriaLabel;
    });
    
    if (inputs.length > 0) {
      if (inputsWithoutLabels.length === 0) {
        checks.push({
          status: 'pass',
          title: 'Form Labels',
          value: `${inputs.length} inputs checked`,
          message: 'All form inputs have labels',
          improve: ''
        });
      } else {
        checks.push({
          status: 'fail',
          title: 'Form Labels',
          value: `${inputsWithoutLabels.length} inputs without labels`,
          message: 'Some form inputs lack labels',
          improve: 'Associate every form input with a <label> element using the for attribute, or use aria-label. This helps screen reader users understand what each field is for.'
        });
      }
    }

    // Heading hierarchy
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const headingLevels = headings.map(h => parseInt(h.tagName[1]));
    let hierarchyIssue = false;
    
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i-1] > 1) {
        hierarchyIssue = true;
        break;
      }
    }
    
    if (headings.length > 0) {
      if (!hierarchyIssue) {
        checks.push({
          status: 'pass',
          title: 'Heading Hierarchy',
          value: `${headings.length} headings checked`,
          message: 'Heading structure is logical',
          improve: ''
        });
      } else {
        checks.push({
          status: 'warn',
          title: 'Heading Hierarchy',
          value: 'Hierarchy issues detected',
          message: 'Heading levels are skipped',
          improve: 'Maintain proper heading hierarchy (h1 → h2 → h3). Don\'t skip levels (e.g., h1 → h3). This helps screen reader users navigate your content structure.'
        });
      }
    }

    // Link text
    const links = document.querySelectorAll('a[href]');
    const vagueLinkText = ['click here', 'read more', 'here', 'more', 'link'];
    const vagueLinks = Array.from(links).filter(link => {
      const text = link.textContent.trim().toLowerCase();
      return vagueLinkText.includes(text);
    });
    
    if (links.length > 0) {
      if (vagueLinks.length === 0) {
        checks.push({
          status: 'pass',
          title: 'Link Text',
          value: `${links.length} links checked`,
          message: 'Link text is descriptive',
          improve: ''
        });
      } else {
        checks.push({
          status: 'warn',
          title: 'Link Text',
          value: `${vagueLinks.length} vague links found`,
          message: 'Some links have non-descriptive text',
          improve: 'Use descriptive link text that makes sense out of context. Avoid generic phrases like "click here" or "read more". Screen reader users often navigate by links alone.'
        });
      }
    }

    // Color contrast (basic check)
    checks.push({
      status: 'warn',
      title: 'Color Contrast',
      value: 'Manual check recommended',
      message: 'Automated contrast checking is limited',
      improve: 'Ensure text has sufficient contrast against backgrounds (4.5:1 for normal text, 3:1 for large text). Use tools like WebAIM Contrast Checker or browser DevTools to verify contrast ratios.'
    });

    return checks;
  }

  // Render check item
  function renderCheckItem(check) {
    const statusColors = {
      pass: { bg: 'rgba(16, 185, 129, 0.1)', border: '#10B981', text: '#10B981', icon: '✓' },
      warn: { bg: 'rgba(245, 158, 11, 0.1)', border: '#F59E0B', text: '#F59E0B', icon: '⚠' },
      fail: { bg: 'rgba(239, 68, 68, 0.1)', border: '#EF4444', text: '#EF4444', icon: '✕' }
    };
    
    const color = statusColors[check.status];
    const hasImprove = check.improve && check.improve.trim();
    
    const item = document.createElement('div');
    item.style.cssText = `
      background: #111827;
      border: 1px solid #374151;
      border-left: 3px solid ${color.border};
      border-radius: 8px;
      margin-bottom: 12px;
      overflow: hidden;
    `;
    
    item.innerHTML = `
      <div class="check-header" style="padding: 16px; cursor: ${hasImprove ? 'pointer' : 'default'}; user-select: none;">
        <div style="display: flex; align-items: start; gap: 12px;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background: ${color.bg}; border: 2px solid ${color.border}; display: flex; align-items: center; justify-content: center; color: ${color.text}; font-weight: bold; font-size: 14px; flex-shrink: 0;">
            ${color.icon}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <div style="font-weight: 600; font-size: 14px; color: #E5E7EB;">${check.title}</div>
              ${hasImprove ? '<div style="color: #9CA3AF; font-size: 18px; transform: rotate(0deg); transition: transform 0.2s;">›</div>' : ''}
            </div>
            <div style="font-size: 13px; color: #9CA3AF; margin-bottom: 4px;">${check.message}</div>
            <div style="font-size: 12px; color: #6B7280; font-family: monospace; word-break: break-all;">${check.value}</div>
          </div>
        </div>
      </div>
      ${hasImprove ? `
        <div class="check-details" style="display: none; padding: 0 16px 16px 52px; border-top: 1px solid #374151;">
          <div style="margin-top: 12px; padding: 12px; background: #1F2937; border-radius: 6px; border-left: 3px solid #3B82F6;">
            <div style="font-size: 11px; color: #60A5FA; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">How to Improve</div>
            <div style="font-size: 13px; color: #D1D5DB; line-height: 1.6;">${check.improve}</div>
          </div>
        </div>
      ` : ''}
    `;
    
    if (hasImprove) {
      const header = item.querySelector('.check-header');
      const details = item.querySelector('.check-details');
      const arrow = item.querySelector('.check-header > div > div > div:last-child');
      
      header.addEventListener('click', () => {
        const isOpen = details.style.display === 'block';
        details.style.display = isOpen ? 'none' : 'block';
        if (arrow) {
          arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
        }
      });
      
      header.addEventListener('mouseenter', () => {
        header.style.background = '#1F2937';
      });
      
      header.addEventListener('mouseleave', () => {
        header.style.background = 'transparent';
      });
    }
    
    return item;
  }

  // Run analysis
  function runAnalysis() {
    analysisResults.seo = analyzeSEO();
    analysisResults.performance = analyzePerformance();
    analysisResults.security = analyzeSecurity();
    analysisResults.accessibility = analyzeAccessibility();
    
    // Calculate overview stats
    const allChecks = [
      ...analysisResults.seo,
      ...analysisResults.performance,
      ...analysisResults.security,
      ...analysisResults.accessibility
    ];
    
    analysisResults.overview = {
      pass: allChecks.filter(c => c.status === 'pass').length,
      warn: allChecks.filter(c => c.status === 'warn').length,
      fail: allChecks.filter(c => c.status === 'fail').length
    };
    
    // Calculate scores for each category
    const calculateScore = (checks) => {
      if (checks.length === 0) return 100;
      const passCount = checks.filter(c => c.status === 'pass').length;
      const warnCount = checks.filter(c => c.status === 'warn').length;
      const failCount = checks.filter(c => c.status === 'fail').length;
      // Pass = 100%, Warn = 50%, Fail = 0%
      return Math.round(((passCount * 100) + (warnCount * 50)) / checks.length);
    };
    
    const seoScore = calculateScore(analysisResults.seo);
    const perfScore = calculateScore(analysisResults.performance);
    const secScore = calculateScore(analysisResults.security);
    const a11yScore = calculateScore(analysisResults.accessibility);
    const overallScore = Math.round((seoScore + perfScore + secScore + a11yScore) / 4);
    
    // Update scores with animation
    setTimeout(() => {
      updateScore('overall', overallScore);
      updateScore('seo', seoScore);
      updateScore('performance', perfScore);
      updateScore('security', secScore);
      updateScore('accessibility', a11yScore);
    }, 100);
    
    // Update stats
    document.getElementById('pass-count').textContent = analysisResults.overview.pass;
    document.getElementById('warn-count').textContent = analysisResults.overview.warn;
    document.getElementById('fail-count').textContent = analysisResults.overview.fail;
    
    // Update page statistics
    document.getElementById('stat-images').textContent = document.querySelectorAll('img').length;
    document.getElementById('stat-links').textContent = document.querySelectorAll('a[href]').length;
    document.getElementById('stat-css').textContent = document.querySelectorAll('link[rel="stylesheet"]').length;
    document.getElementById('stat-js').textContent = document.querySelectorAll('script[src]').length;
    document.getElementById('stat-headings').textContent = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
    document.getElementById('stat-forms').textContent = document.querySelectorAll('form').length;
    
    // Render overview details
    const overviewDetails = document.getElementById('overview-details');
    overviewDetails.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h4 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #E5E7EB;">Critical Issues</h4>
        <div id="overview-critical"></div>
      </div>
      <div>
        <h4 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #E5E7EB;">Warnings</h4>
        <div id="overview-warnings"></div>
      </div>
    `;
    
    const criticalIssues = allChecks.filter(c => c.status === 'fail');
    const warnings = allChecks.filter(c => c.status === 'warn').slice(0, 5);
    
    const criticalContainer = document.getElementById('overview-critical');
    if (criticalIssues.length > 0) {
      criticalIssues.forEach(check => {
        criticalContainer.appendChild(renderCheckItem(check));
      });
    } else {
      criticalContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #6B7280; background: #111827; border-radius: 8px; border: 1px solid #374151;">No critical issues found</div>';
    }
    
    const warningsContainer = document.getElementById('overview-warnings');
    if (warnings.length > 0) {
      warnings.forEach(check => {
        warningsContainer.appendChild(renderCheckItem(check));
      });
    } else {
      warningsContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #6B7280; background: #111827; border-radius: 8px; border: 1px solid #374151;">No warnings found</div>';
    }
    
    // Render SEO tab
    const seoContent = document.getElementById('tab-content-seo');
    seoContent.innerHTML = `
      <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #E5E7EB;">SEO Analysis</h3>
      <div id="seo-checks"></div>
    `;
    const seoChecks = document.getElementById('seo-checks');
    analysisResults.seo.forEach(check => {
      seoChecks.appendChild(renderCheckItem(check));
    });
    
    // Render Performance tab
    const perfContent = document.getElementById('tab-content-performance');
    perfContent.innerHTML = `
      <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #E5E7EB;">Performance Analysis</h3>
      <div id="performance-checks"></div>
    `;
    const perfChecks = document.getElementById('performance-checks');
    analysisResults.performance.forEach(check => {
      perfChecks.appendChild(renderCheckItem(check));
    });
    
    // Render Security tab
    const secContent = document.getElementById('tab-content-security');
    secContent.innerHTML = `
      <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #E5E7EB;">Security Analysis</h3>
      <div id="security-checks"></div>
    `;
    const secChecks = document.getElementById('security-checks');
    analysisResults.security.forEach(check => {
      secChecks.appendChild(renderCheckItem(check));
    });
    
    // Render Accessibility tab
    const a11yContent = document.getElementById('tab-content-accessibility');
    a11yContent.innerHTML = `
      <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #E5E7EB;">Accessibility Analysis</h3>
      <div id="accessibility-checks"></div>
    `;
    const a11yChecks = document.getElementById('accessibility-checks');
    analysisResults.accessibility.forEach(check => {
      a11yChecks.appendChild(renderCheckItem(check));
    });
  }

  // Update score with animation
  function updateScore(category, score) {
    const getColor = (score) => {
      if (score >= 80) return { stroke: '#10B981', gradient: 'linear-gradient(90deg, #10B981, #34D399)' };
      if (score >= 60) return { stroke: '#3B82F6', gradient: 'linear-gradient(90deg, #3B82F6, #60A5FA)' };
      if (score >= 40) return { stroke: '#F59E0B', gradient: 'linear-gradient(90deg, #F59E0B, #FBBF24)' };
      return { stroke: '#EF4444', gradient: 'linear-gradient(90deg, #EF4444, #F87171)' };
    };
    
    const color = getColor(score);
    
    if (category === 'overall') {
      const circle = document.getElementById('overall-circle');
      const scoreText = document.getElementById('overall-score');
      const circumference = 2 * Math.PI * 75;
      const offset = circumference - (score / 100) * circumference;
      
      circle.style.strokeDashoffset = offset;
      circle.style.stroke = color.stroke;
      scoreText.textContent = score + '%';
      scoreText.style.color = color.stroke;
    } else {
      const bar = document.getElementById(`${category}-bar`);
      const scoreText = document.getElementById(`${category}-score`);
      
      bar.style.width = score + '%';
      bar.style.background = color.gradient;
      scoreText.textContent = score + '%';
      scoreText.style.color = color.stroke;
    }
  }

  // Initialize active tab styling
  const activeTab = document.querySelector('.tab-btn.active');
  if (activeTab) {
    activeTab.style.color = '#60A5FA';
    activeTab.style.borderBottomColor = '#3B82F6';
  }

  // Run analysis
  runAnalysis();

  return {
    cleanup: () => panel.remove()
  };
}
