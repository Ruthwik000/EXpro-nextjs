import React from 'react';
import Section from '../components/Section';
import Toggle from '../components/Toggle';
import FocusDetection from '../components/FocusDetection';
import NuclearModeSimple from '../components/NuclearModeSimple';

const ProductivityTools = ({ expanded, onToggle, toggles, onToggleChange }) => {
  return (
    <Section title="Productivity Tools" expanded={expanded} onToggle={onToggle}>
      <Toggle
        label="YouTube Focus Mode"
        description="Remove distractions, block shorts"
        enabled={toggles.focusMode || false}
        onChange={(val) => onToggleChange('focusMode', val)}
      />
      
      <Toggle
        label="Focus Detection"
        description="Detect mobile phone usage via webcam"
        enabled={toggles.focusDetection || false}
        onChange={(val) => onToggleChange('focusDetection', val)}
      />

      {/* Focus Detection UI - Only show when enabled */}
      {toggles.focusDetection && <FocusDetection />}
      
      {/* Nuclear Mode - Simple Version with Toggle */}
      <NuclearModeSimple />
      
      <Toggle
        label="Passive Watching"
        description="Detect inactivity and suggest actions"
        enabled={toggles.passiveWatching || false}
        onChange={(val) => onToggleChange('passiveWatching', val)}
      />
      
      <Toggle
        label="Live Tracer"
        description="Match tasks to energy levels"
        enabled={toggles.energyScheduling || false}
        onChange={(val) => onToggleChange('energyScheduling', val)}
      />
    </Section>
  );
};

export default ProductivityTools;
