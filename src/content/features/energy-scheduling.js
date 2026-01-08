export function initEnergyScheduling() {
  const panel = document.createElement('div');
  panel.id = 'energy-scheduling-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 280px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;

  panel.innerHTML = `
    <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 12px; font-weight: 600; border-radius: 8px 8px 0 0;">
      ⚡ Energy Level
      <button id="close-energy-panel" style="float: right; background: none; border: none; color: white; cursor: pointer; font-size: 18px;">×</button>
    </div>
    <div style="padding: 16px;">
      <div style="margin-bottom: 12px; font-size: 13px; color: #6b7280;">How's your energy?</div>
      <div style="display: flex; gap: 8px; margin-bottom: 16px;">
        <button class="energy-btn" data-level="high" style="flex: 1; padding: 8px; border: 2px solid #10b981; background: white; border-radius: 6px; cursor: pointer; font-size: 12px;">
          🔥 High
        </button>
        <button class="energy-btn" data-level="low" style="flex: 1; padding: 8px; border: 2px solid #f59e0b; background: white; border-radius: 6px; cursor: pointer; font-size: 12px;">
          😴 Low
        </button>
      </div>
      <div id="energy-suggestion" style="font-size: 12px; color: #374151; padding: 12px; background: #f3f4f6; border-radius: 6px; display: none;"></div>
    </div>
  `;

  document.body.appendChild(panel);

  const suggestions = {
    high: '💪 Great! Focus on complex tasks, coding, or problem-solving.',
    low: '🧘 Take it easy. Review docs, organize tasks, or take a break.'
  };

  document.querySelectorAll('.energy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const level = e.target.dataset.level;
      const suggestionEl = document.getElementById('energy-suggestion');
      suggestionEl.textContent = suggestions[level];
      suggestionEl.style.display = 'block';
      
      // Highlight selected button
      document.querySelectorAll('.energy-btn').forEach(b => {
        b.style.background = 'white';
      });
      e.target.style.background = level === 'high' ? '#d1fae5' : '#fef3c7';
    });
  });

  document.getElementById('close-energy-panel').addEventListener('click', () => {
    panel.remove();
  });

  return {
    cleanup: () => panel.remove()
  };
}
