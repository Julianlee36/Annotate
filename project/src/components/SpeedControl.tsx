import React from 'react';

interface SpeedControlProps {
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
}

const SpeedControl: React.FC<SpeedControlProps> = ({ currentSpeed, onSpeedChange }) => {
  const speeds = [0.5, 1, 1.5, 2];
  
  return (
    <div>
      <label className="block text-sm font-medium mb-1">Playback Speed</label>
      <div className="flex space-x-2">
        {speeds.map(speed => (
          <button
            key={speed}
            onClick={() => onSpeedChange(speed)}
            className={`flex-1 py-1 px-2 rounded text-sm ${
              currentSpeed === speed ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>
    </div>
  );
};

export default SpeedControl;