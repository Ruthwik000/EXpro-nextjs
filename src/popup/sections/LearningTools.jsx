import React from 'react';
import Section from '../components/Section';
import Toggle from '../components/Toggle';

const LearningTools = ({ expanded, onToggle, toggles, onToggleChange }) => {
  return (
    <Section title="Learning Tools" expanded={expanded} onToggle={onToggle}>
      <Toggle
        label="Ad Blocker"
        description="Block ads and trackers on websites"
        enabled={toggles.adBlocker || false}
        onChange={(val) => onToggleChange('adBlocker', val)}
      />
      
      <Toggle
        label="Speed Improver"
        description="Defer images, block heavy scripts"
        enabled={toggles.speedImprover || false}
        onChange={(val) => onToggleChange('speedImprover', val)}
      />
      
      <Toggle
        label="Learning Agent"
        description="Integration hook"
        enabled={toggles.learningAgent || false}
        onChange={(val) => onToggleChange('learningAgent', val)}
      />
    </Section>
  );
};

export default LearningTools;
