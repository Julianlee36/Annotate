import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, ChevronRight, ChevronLeft,
  Square, Circle, Pencil, Eraser, Trash2, Download,
  X, Eye, EyeOff, Bug
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import AnnotationCanvas from '../components/AnnotationCanvas';
import ToolBar from '../components/ToolBar';
import SpeedControl from '../components/SpeedControl';
import VideoImport from '../components/VideoImport';
import Header from '../components/layout/Header';
import FolderManager from '../components/FolderManager';
import SceneManager from '../components/SceneManager';
import { Annotation, DrawingTool, VideoSource, Scene } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

function VideoAnnotator() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Video state
  const [videoSource, setVideoSource] = useState<VideoSource | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Drawing state
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('pencil');
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [lineWidth, setLineWidth] = useState(3);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [defaultDuration, setDefaultDuration] = useState(5);
  const [debugMode, setDebugMode] = useState(false);

  // Scene state
  const [isRecording, setIsRecording] = useState(false);
  const [sceneStartTime, setSceneStartTime] = useState<number | null>(null);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [isLooping, setIsLooping] = useState(false);
  const [isSceneLocked, setIsSceneLocked] = useState(false);
  
  // UI state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Add effect to handle video source changes
  useEffect(() => {
    if (!selectedScene || !videoSource) return;

    // If video source is different, update it
    if (JSON.stringify(selectedScene.video_source) !== JSON.stringify(videoSource)) {
      setVideoSource(selectedScene.video_source);
      setIsVideoReady(false); // Reset video ready state
    }
  }, [selectedScene]);

  // Handle scene playback and looping
  useEffect(() => {
    if (!selectedScene || !videoRef.current || !isVideoReady) return;

    const checkSceneEnd = () => {
      if (!videoRef.current || !selectedScene) return;

      if (debugMode) {
        console.log(
          'checkSceneEnd =>',
          'currentTime:', videoRef.current.currentTime,
          'end_time:', selectedScene.end_time,
          'isSceneLocked:', isSceneLocked,
          'isLooping:', isLooping
        );
      }
      
      if (videoRef.current.currentTime >= selectedScene.end_time) {
        if (isLooping && isSceneLocked) {
          // Loop: reset to start_time
          videoRef.current.currentTime = selectedScene.start_time;
          if (!isPlaying) {
            videoRef.current.play().catch(console.error);
            setIsPlaying(true);
          }
        } else if (isSceneLocked) {
          // Stop: pause video
          videoRef.current.pause();
          setIsPlaying(false);
        }
        // If not locked, do nothing (continue playback)
      }
    };

    const interval = setInterval(checkSceneEnd, 100);

    return () => clearInterval(interval);
  }, [selectedScene, isLooping, isSceneLocked, isVideoReady, debugMode, isPlaying]);

  const handleVideoImport = (source: VideoSource) => {
    setVideoSource(source);
    setAnnotations([]);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setSelectedScene(null);
    setIsSceneLocked(false);
    setIsLooping(false);
    setIsVideoReady(false);
  };

  const handleStartRecording = () => {
    if (!videoRef.current) return;
    setIsRecording(true);
    setSceneStartTime(videoRef.current.currentTime);
  };

  const handleStopRecording = async () => {
    if (!user || !videoSource || !sceneStartTime || !videoRef.current) {
      setSaveMessage({ type: 'error', text: 'Unable to save scene' });
      return;
    }

    const sceneName = prompt('Enter a name for this scene:');
    if (!sceneName?.trim()) {
      setSaveMessage({ type: 'error', text: 'Scene name is required' });
      return;
    }

    try {
      const sceneData = {
        user_id: user.id,
        name: sceneName.trim(),
        video_source: videoSource,
        start_time: sceneStartTime,
        end_time: videoRef.current.currentTime,
        folder_id: selectedFolderId
      };

      const { data, error } = await supabase
        .from('scenes')
        .insert([sceneData])
        .select()
        .single();

      if (error) throw error;

      setIsRecording(false);
      setSceneStartTime(null);
      setSaveMessage({ type: 'success', text: 'Scene saved successfully!' });
    } catch (error: any) {
      console.error('Error saving scene:', error);
      setSaveMessage({ type: 'error', text: error.message || 'Failed to save scene' });
    }
  };

  const handleSceneSelect = (scene: Scene) => {
    setSelectedScene(scene);
    setIsLooping(true);
    setIsSceneLocked(true);
    
    if (!videoRef.current || !scene) return;

    // If video source is different, update it
    if (JSON.stringify(scene.video_source) !== JSON.stringify(videoSource)) {
      setVideoSource(scene.video_source);
    }

    // Once video is ready, seek to start time
    if (isVideoReady) {
      videoRef.current.currentTime = scene.start_time;
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const handleReleaseScene = () => {
    setIsSceneLocked(false);
    setIsLooping(false);
    if (videoRef.current && !isPlaying) {
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const handleMoveToFolder = async (sceneId: string, folderId: string | null) => {
    try {
      const { error } = await supabase
        .from('scenes')
        .update({ folder_id: folderId })
        .eq('id', sceneId)
        .eq('user_id', user?.id);

      if (error) throw error;

      if (selectedScene?.id === sceneId) {
        setSelectedScene(prev => prev ? { ...prev, folder_id: folderId } : null);
      }
      
      // Refresh scenes list after moving a scene
      const { data, error: scenesError } = await supabase
        .from('scenes')
        .select('*')
        .eq('user_id', user?.id)
        .eq('folder_id', selectedFolderId);
        
      if (!scenesError) {
        // Refresh the scenes view
        setSaveMessage({ type: 'success', text: 'Scene moved successfully' });
        setTimeout(() => setSaveMessage(null), 2000);
      }
    } catch (error: any) {
      console.error('Error moving scene to folder:', error);
      setSaveMessage({
        type: 'error',
        text: error.message || 'Failed to move scene to folder'
      });
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleDurationChange = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const skipForward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 5, videoRef.current.duration);
  };

  const skipBackward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 5, 0);
  };

  const nextFrame = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 1/30, videoRef.current.duration);
  };

  const prevFrame = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 1/30, 0);
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const handleAnnotationChange = (annotation: Annotation | null) => {
    if (annotation && !annotation.id) {
      annotation.id = uuidv4();
    }
    
    setCurrentAnnotation(annotation);
    
    if (debugMode && annotation) {
      console.log(`Current annotation updated: id=${annotation.id}, points=${annotation.points.length}`);
    }
    
    if (annotation && annotation.points.length > 1) {
      saveAnnotation(annotation);
    }
  };

  const saveAnnotation = (annotationToSave = currentAnnotation) => {
    if (annotationToSave) {
      const newAnnotation = {
        ...annotationToSave,
        timestamp: currentTime,
        startTime: currentTime,
        endTime: currentTime + defaultDuration,
        id: annotationToSave.id || uuidv4()
      };
      
      if (debugMode) {
        console.log(`Saving new annotation: id=${newAnnotation.id}, timestamp=${currentTime.toFixed(2)}s, visible from ${newAnnotation.startTime.toFixed(2)}s to ${newAnnotation.endTime.toFixed(2)}s`);
      }
      
      setAnnotations(prevAnnotations => {
        const updatedAnnotations = [...prevAnnotations, newAnnotation];
        if (debugMode) {
          console.log(`Updated annotations array now has ${updatedAnnotations.length} items`);
        }
        return updatedAnnotations;
      });
      
      setCurrentAnnotation(null);
    }
  };

  const toggleAnnotationVisibility = () => {
    setShowAnnotations(!showAnnotations);
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  const clearAllAnnotations = () => {
    if (window.confirm('Are you sure you want to clear all annotations?')) {
      setAnnotations([]);
      setCurrentAnnotation(null);
    }
  };

  if (!videoSource) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <Header />
        <main className="flex-grow p-4 flex items-center justify-center">
          <VideoImport onImport={handleVideoImport} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header />
      
      <main className="flex-grow p-4 flex flex-col md:flex-row gap-4">
        {/* Video Player Section */}
        <div className="flex-grow relative">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <VideoPlayer
              ref={videoRef}
              source={videoSource}
              isPlaying={isPlaying}
              playbackRate={playbackRate}
              onTimeUpdate={handleTimeUpdate}
              onDurationChange={handleDurationChange}
              onReady={() => {
                setIsVideoReady(true);
                if (selectedScene && videoRef.current) {
                  videoRef.current.currentTime = selectedScene.start_time;
                  if (isPlaying) {
                    videoRef.current.play().catch(console.error);
                  }
                }
              }}
              initialTime={selectedScene?.start_time}
            />
            <AnnotationCanvas
              ref={canvasRef}
              videoRef={videoRef}
              selectedTool={selectedTool}
              selectedColor={selectedColor}
              lineWidth={lineWidth}
              annotations={annotations}
              currentTime={currentTime}
              onAnnotationChange={handleAnnotationChange}
              visible={showAnnotations}
              defaultDuration={defaultDuration}
              debugMode={debugMode}
            />
          </div>
          
          {/* Video Controls */}
          <div className="mt-4 bg-gray-800 p-4 rounded-lg">
            {selectedScene && (
              <div className="mb-4 p-2 bg-blue-600/20 border border-blue-500 rounded">
                <p className="font-medium">Playing Scene: {selectedScene.name}</p>
                <p className="text-sm text-gray-300">
                  {formatTime(selectedScene.start_time)} - {formatTime(selectedScene.end_time)}
                </p>
                <button
                  onClick={handleReleaseScene}
                  className={`mt-2 w-full py-1 px-2 rounded ${
                    !isSceneLocked ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  disabled={!isSceneLocked}
                >
                  {isSceneLocked ? 'Release Scene' : 'Scene Released'}
                </button>
              </div>
            )}
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={togglePlayPause}
                  className="p-2 rounded-full hover:bg-gray-700"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <button
                  onClick={skipBackward}
                  className="p-2 rounded-full hover:bg-gray-700"
                  title="Skip 5s Backward"
                >
                  <SkipBack size={20} />
                </button>
                <button
                  onClick={skipForward}
                  className="p-2 rounded-full hover:bg-gray-700"
                  title="Skip 5s Forward"
                >
                  <SkipForward size={20} />
                </button>
              </div>
              
              <div className="flex-grow mx-4">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.01"
                  value={currentTime}
                  onChange={(e) => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = parseFloat(e.target.value);
                    }
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              
              <SpeedControl
                currentSpeed={playbackRate}
                onSpeedChange={changePlaybackRate}
              />
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="w-full md:w-80 space-y-4">
          {/* Drawing Tools */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <ToolBar
              selectedTool={selectedTool}
              onToolChange={setSelectedTool}
              selectedColor={selectedColor}
              onColorChange={setSelectedColor}
              lineWidth={lineWidth}
              onLineWidthChange={setLineWidth}
            />
          </div>

          {/* Scene Manager */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <SceneManager
              currentTime={currentTime}
              onSceneSelect={handleSceneSelect}
              isRecording={isRecording}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              selectedFolderId={selectedFolderId}
              onMoveToFolder={handleMoveToFolder}
              videoSource={videoSource}
              isLooping={isLooping}
              onLoopingChange={setIsLooping}
            />
          </div>

          {/* Folder Manager */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <FolderManager
              selectedFolderId={selectedFolderId}
              onFolderSelect={setSelectedFolderId}
            />
          </div>
          
          {/* Actions */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={toggleAnnotationVisibility}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-700 rounded hover:bg-gray-600"
              >
                {showAnnotations ? <EyeOff size={16} /> : <Eye size={16} />}
                {showAnnotations ? 'Hide Annotations' : 'Show Annotations'}
              </button>
              
              <button
                onClick={toggleDebugMode}
                className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded hover:bg-gray-600 ${
                  debugMode ? 'bg-purple-600' : 'bg-gray-700'
                }`}
              >
                <Bug size={16} />
                {debugMode ? 'Disable Debug Mode' : 'Enable Debug Mode'}
              </button>
              
              <button
                onClick={clearAllAnnotations}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-600 rounded hover:bg-red-700"
              >
                <Trash2 size={16} />
                Clear All
              </button>
              
              <button 
                onClick={() => setVideoSource(null)}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-600 rounded hover:bg-gray-700"
              >
                <X size={16} />
                Change Video
              </button>
            </div>
          </div>
          
          {/* Messages */}
          {saveMessage && (
            <div className={`p-3 rounded ${
              saveMessage.type === 'success'
                ? 'bg-green-900/50 border border-green-700 text-green-200'
                : 'bg-red-900/50 border border-red-700 text-red-200'
            }`}>
              {saveMessage.text}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default VideoAnnotator;