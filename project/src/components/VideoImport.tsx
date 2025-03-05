import React, { useState } from 'react';
import { Link, Upload } from 'lucide-react';
import { VideoSource } from '../types';

interface VideoImportProps {
  onImport: (source: VideoSource) => void;
}

const VideoImport: React.FC<VideoImportProps> = ({ onImport }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  
  const handleUrlImport = () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }
    
    setError('');
    
    // Determine the type of URL and extract video ID if needed
    if (isYouTubeUrl(url)) {
      const videoId = extractYouTubeVideoId(url);
      if (videoId) {
        onImport({ 
          type: 'youtube', 
          src: url,
          videoId: videoId
        });
      } else {
        setError('Invalid YouTube URL. Please check the URL and try again.');
      }
    } else if (url.includes('vimeo.com')) {
      onImport({ type: 'vimeo', src: url });
    } else {
      // Assume it's a direct video URL
      onImport({ type: 'url', src: url });
    }
  };
  
  const isYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };
  
  const extractYouTubeVideoId = (url: string): string | null => {
    // Handle youtube.com/watch?v=VIDEO_ID
    let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (match && match[1]) {
      return match[1];
    }
    
    // Handle youtube.com/embed/VIDEO_ID
    match = url.match(/youtube\.com\/embed\/([^?]+)/);
    if (match && match[1]) {
      return match[1];
    }
    
    // Handle youtu.be/VIDEO_ID
    match = url.match(/youtu\.be\/([^?]+)/);
    if (match && match[1]) {
      return match[1];
    }
    
    return null;
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.items) {
      // Use DataTransferItemList interface
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        if (e.dataTransfer.items[i].kind === 'file') {
          const file = e.dataTransfer.items[i].getAsFile();
          if (file && file.type.startsWith('video/')) {
            const url = URL.createObjectURL(file);
            onImport({ type: 'url', src: url });
            return;
          }
        }
      }
    }
    
    setError('Please drop a valid video file');
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        onImport({ type: 'url', src: url });
      } else {
        setError('Please select a valid video file');
      }
    }
  };
  
  return (
    <div className="w-full max-w-2xl p-8 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold mb-6 text-center">Import Video</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Video URL</label>
        <div className="flex">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter video URL (YouTube, Vimeo, or direct MP4 link)"
            className="flex-grow px-4 py-2 bg-gray-700 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleUrlImport}
            className="px-4 py-2 bg-blue-600 rounded-r hover:bg-blue-700 flex items-center"
          >
            <Link size={16} className="mr-2" />
            Import
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
        >
          <Upload size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="mb-2">Drag and drop a video file here</p>
          <p className="text-sm text-gray-400">or</p>
          <label className="mt-4 inline-block px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer">
            Browse Files
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>
      
      {error && (
        <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-200 mb-4">
          {error}
        </div>
      )}
      
      <div className="text-sm text-gray-400">
        <p className="mb-2">Supported formats:</p>
        <ul className="list-disc list-inside">
          <li>YouTube links (e.g., youtube.com/watch?v=VIDEO_ID, youtu.be/VIDEO_ID)</li>
          <li>Direct video URLs (MP4, WebM, etc.)</li>
          <li>Vimeo links</li>
          <li>Local video files (drag & drop or browse)</li>
        </ul>
      </div>
    </div>
  );
};

export default VideoImport;