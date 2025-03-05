import React from 'react';
import { Pencil, Square, Circle, Minus, Eraser } from 'lucide-react';
import { DrawingTool } from '../types';

interface ToolBarProps {
  selectedTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  lineWidth: number;
  onLineWidthChange: (width: number) => void;
}

const ToolBar: React.FC<ToolBarProps> = ({
  selectedTool,
  onToolChange,
  selectedColor,
  onColorChange,
  lineWidth,
  onLineWidthChange
}) => {
  const tools = [
    { id: 'pencil', icon: <Pencil size={20} />, label: 'Pencil' },
    { id: 'line', icon: <Minus size={20} />, label: 'Line' },
    { id: 'rectangle', icon: <Square size={20} />, label: 'Rectangle' },
    { id: 'circle', icon: <Circle size={20} />, label: 'Circle' },
    { id: 'eraser', icon: <Eraser size={20} />, label: 'Eraser' }
  ];
  
  const colors = [
    { id: 'red', value: '#FF0000', label: 'Red' },
    { id: 'green', value: '#00FF00', label: 'Green' },
    { id: 'blue', value: '#0000FF', label: 'Blue' },
    { id: 'yellow', value: '#FFFF00', label: 'Yellow' },
    { id: 'white', value: '#FFFFFF', label: 'White' },
    { id: 'black', value: '#000000', label: 'Black' }
  ];
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Drawing Tools</h3>
      
      <div className="grid grid-cols-3 gap-2 mb-4">
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id as DrawingTool)}
            className={`p-2 flex flex-col items-center justify-center rounded ${
              selectedTool === tool.id ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={tool.label}
          >
            {tool.icon}
            <span className="text-xs mt-1">{tool.label}</span>
          </button>
        ))}
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Color</label>
        <div className="grid grid-cols-6 gap-2">
          {colors.map(color => (
            <button
              key={color.id}
              onClick={() => onColorChange(color.value)}
              className={`w-8 h-8 rounded-full border-2 ${
                selectedColor === color.value ? 'border-white' : 'border-transparent'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.label}
            />
          ))}
        </div>
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="mt-2 w-full h-8 cursor-pointer"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Line Width: {lineWidth}px</label>
        <input
          type="range"
          min="1"
          max="20"
          value={lineWidth}
          onChange={(e) => onLineWidthChange(parseInt(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default ToolBar;