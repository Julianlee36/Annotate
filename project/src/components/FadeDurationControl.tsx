import React from 'react';
import { FadeDuration } from '../types';

interface FadeDurationControlProps {
  fadeDuration: FadeDuration;
  onFadeDurationChange: (duration: FadeDuration) => void;
}

const FadeDurationControl: React.FC<FadeDurationControlProps> = ({ 
  fadeDuration, 
  onFadeDurationChange 
}) => {
  const presetDurations = [
    { visible: 2, transition: 1, label: '2s' },
    { visible: 5, transition: 2.5, label: '5s' },
    { visible: 10, transition: 3, label: '10s' },
    { visible: 30, transition: 5, label: '30s' },
    { visible: 0, transition: 0, label: 'Forever' }
  ];
  
  const handlePresetClick = (preset: FadeDuration) => {
    onFadeDurationChange(preset);
  };
  
  const handleVisibleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    onFadeDurationChange({
      ...fadeDuration,
      visible: value
    });
  };
  
  const handleTransitionDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    onFadeDurationChange({
      ...fadeDuration,
      transition: value
    });
  };
  
  return (
    <div>
      <label className="block text-sm font-medium mb-1">Annotation Visibility</label>
      
      <div className="flex space-x-2 mb-3">
        {presetDurations.map((preset, index) => (
          <button
            key={index}
            onClick={() => handlePresetClick(preset)}
            className={`flex-1 py-1 px-2 rounded text-sm ${
              fadeDuration.visible === preset.visible && 
              fadeDuration.transition === preset.transition
                ? 'bg-blue-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={preset.visible === 0 ? 'Annotations never fade' : `Visible for ${preset.visible}s, then fade for ${preset.transition}s`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      
      {fadeDuration.visible > 0 && (
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Visible Duration: {fadeDuration.visible}s
            </label>
            <input
              type="range"
              min="1"
              max="60"
              step="1"
              value={fadeDuration.visible}
              onChange={handleVisibleDurationChange}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Fade Transition: {fadeDuration.transition}s
            </label>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={fadeDuration.transition}
              onChange={handleTransitionDurationChange}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FadeDurationControl;