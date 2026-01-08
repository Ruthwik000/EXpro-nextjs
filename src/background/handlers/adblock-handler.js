export async function handleAdBlocker(enabled) {
  try {
    const rulesetIds = ['adblock_rules'];
    
    if (enabled) {
      // First, get current enabled rulesets
      const enabledRulesets = await chrome.declarativeNetRequest.getEnabledRulesets();
      console.log('Currently enabled rulesets:', enabledRulesets);
      
      // Enable the adblock rules
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: rulesetIds
      });
      
      // Verify it was enabled
      const newEnabledRulesets = await chrome.declarativeNetRequest.getEnabledRulesets();
      console.log('Ad blocker enabled. New enabled rulesets:', newEnabledRulesets);
      
      // Get dynamic rules to verify
      const rules = await chrome.declarativeNetRequest.getDynamicRules();
      console.log('Current dynamic rules:', rules);
    } else {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: rulesetIds
      });
      console.log('Ad blocker disabled');
    }
  } catch (error) {
    console.error('Error toggling ad blocker:', error);
    console.error('Error details:', error.message, error.stack);
  }
}
