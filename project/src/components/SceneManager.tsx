import React, { useState, useEffect } from 'react';
import { Play, Square, Trash2, FolderPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Scene, VideoSource } from '../types';
import { useAuth } from '../context/AuthContext';

interface SceneManagerProps {
  currentTime: number;
  onSceneSelect: (scene: Scene) => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => Promise<void>;
  selectedFolderId: string | null;
  onMoveToFolder: (sceneId: string, folderId: string | null) => void;
  videoSource: VideoSource | null;
  isLooping: boolean;
  onLoopingChange: (isLooping: boolean) => void;
}

const SceneManager: React.FC<SceneManagerProps> = ({
  currentTime,
  onSceneSelect,
  isRecording,
  onStartRecording,
  onStopRecording,
  selectedFolderId,
  onMoveToFolder,
  videoSource,
  isLooping,
  onLoopingChange
}) => {
  const { user } = useAuth();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [showFolderMenu, setShowFolderMenu] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchScenes();
      fetchFolders();
    }
  }, [user, selectedFolderId]);

  const fetchScenes = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('scenes')
        .select('*')
        .eq('user_id', user.id);

      if (selectedFolderId) {
        query = query.eq('folder_id', selectedFolderId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setScenes(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching scenes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('folders')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      setFolders(data || []);
    } catch (err) {
      console.error('Error fetching folders:', err);
    }
  };

  const handleSceneClick = (scene: Scene) => {
    setSelectedScene(scene.id);
    onSceneSelect(scene);
  };

  const handleDeleteScene = async (sceneId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this scene?')) {
      return;
    }

    try {
      setError(null);
      const { error } = await supabase
        .from('scenes')
        .delete()
        .eq('id', sceneId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setScenes(scenes.filter(scene => scene.id !== sceneId));
      if (selectedScene === sceneId) {
        setSelectedScene(null);
      }
    } catch (err: any) {
      console.error('Error deleting scene:', err);
      setError('Failed to delete scene');
    }
  };

  const handleStopRecordingAndSave = async () => {
    if (!user) {
      setError("You must be signed in to save scenes");
      return;
    }

    if (!videoSource) {
      setError("No video source available");
      return;
    }

    try {
      setError(null);
      await onStopRecording();
      await fetchScenes();
    } catch (err) {
      console.error("Error saving scene:", err);
      setError("Failed to save scene");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Scenes</h3>
        <div className="flex space-x-2">
          <button
            onClick={isRecording ? handleStopRecordingAndSave : onStartRecording}
            className={`flex items-center gap-2 px-3 py-1 rounded ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            {isRecording ? <Square size={16} /> : <Play size={16} />}
            <span>{isRecording ? 'Stop' : 'Record'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-2 text-sm bg-red-900/50 border border-red-700 rounded text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {scenes.map(scene => (
          <div
            key={scene.id}
            className={`group flex items-center justify-between p-2 rounded cursor-pointer ${
              selectedScene === scene.id
                ? 'bg-blue-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            onClick={() => handleSceneClick(scene)}
          >
            <div className="flex-grow px-2">
              <div className="font-medium">{scene.name}</div>
              <div className="text-sm text-gray-400">
                {formatTime(scene.start_time)} - {formatTime(scene.end_time)}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFolderMenu(showFolderMenu === scene.id ? null : scene.id);
                  }}
                  className="p-1 hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Move to Folder"
                >
                  <FolderPlus size={16} />
                </button>
                {showFolderMenu === scene.id && (
                  <div className="absolute right-0 mt-1 w-48 bg-gray-800 rounded-lg shadow-lg z-10">
                    <div className="py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveToFolder(scene.id, null);
                          setShowFolderMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-700"
                      >
                        Uncategorized
                      </button>
                      {folders.map(folder => (
                        <button
                          key={folder.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveToFolder(scene.id, folder.id);
                            setShowFolderMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-700"
                        >
                          {folder.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={(e) => handleDeleteScene(scene.id, e)}
                className="p-1 hover:bg-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete Scene"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {scenes.length === 0 && (
          <div className="text-center py-4 text-gray-400">
            {isRecording 
              ? 'Recording in progress...'
              : selectedFolderId
                ? 'No scenes in this folder'
                : 'No scenes recorded yet'
            }
          </div>
        )}
      </div>

      {selectedScene && (
        <div className="mt-4">
          <button
            onClick={() => onLoopingChange(!isLooping)}
            className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded ${
              isLooping ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isLooping ? 'Release Player' : 'Loop Scene'}
          </button>
        </div>
      )}
    </div>
  );
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default SceneManager;