import React, { useState, useEffect } from 'react';
import { Folder, Plus, FolderOpen, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Folder as FolderType } from '../types';

interface FolderManagerProps {
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

const FolderManager: React.FC<FolderManagerProps> = ({
  selectedFolderId,
  onFolderSelect
}) => {
  const { user } = useAuth();
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchFolders();
    }
  }, [user]);

  const fetchFolders = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setFolders(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching folders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!user || !newFolderName.trim()) return;

    try {
      setError(null);
      const { data, error } = await supabase
        .from('folders')
        .insert([{
          user_id: user.id,
          name: newFolderName.trim(),
          parent_id: parentFolderId,
          level: parentFolderId ? 1 : 0
        }])
        .select()
        .single();

      if (error) throw error;

      setFolders([...folders, data]);
      setNewFolderName('');
      setIsCreating(false);
      setParentFolderId(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error creating folder:', err);
    }
  };

  const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this folder? Scenes in this folder will be moved to "Uncategorized".')) {
      return;
    }

    try {
      setError(null);
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setFolders(folders.filter(folder => folder.id !== folderId));
      if (selectedFolderId === folderId) {
        onFolderSelect(null);
      }
    } catch (err: any) {
      console.error('Error deleting folder:', err);
      setError('Failed to delete folder');
    }
  };

  const toggleFolderExpanded = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const getChildFolders = (parentId: string | null) => {
    return folders.filter(folder => folder.parent_id === parentId);
  };

  const renderFolder = (folder: FolderType, level = 0) => {
    const childFolders = getChildFolders(folder.id);
    const isExpanded = expandedFolders[folder.id];
    const canHaveChildren = folder.level < 2;

    return (
      <div key={folder.id} className="ml-2">
        <div
          className={`flex items-center justify-between p-2 rounded cursor-pointer ${
            selectedFolderId === folder.id
              ? 'bg-blue-600'
              : 'bg-gray-700 hover:bg-gray-600'
          } group`}
          onClick={() => onFolderSelect(folder.id)}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('bg-blue-400');
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('bg-blue-400');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('bg-blue-400');
            if (draggedSceneId) {
              window.dispatchEvent(new CustomEvent('sceneDrop', { 
                detail: { sceneId: draggedSceneId, folderId: folder.id }
              }));
              setDraggedSceneId(null);
            }
          }}
        >
          <div className="flex items-center gap-2">
            {childFolders.length > 0 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolderExpanded(folder.id);
                }}
                className="p-1 hover:bg-gray-600 rounded"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <div className="w-6"></div>
            )}
            <Folder size={16} />
            <span>{folder.name}</span>
          </div>
          <div className="flex items-center">
            {canHaveChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreating(true);
                  setParentFolderId(folder.id);
                }}
                className="p-1 hover:bg-green-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title="Create Subfolder"
              >
                <Plus size={14} />
              </button>
            )}
            <button
              onClick={(e) => handleDeleteFolder(folder.id, e)}
              className="p-1 hover:bg-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity ml-1"
              title="Delete Folder"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        
        {isExpanded && childFolders.length > 0 && (
          <div className="pl-4 border-l border-gray-600 ml-3 mt-1">
            {childFolders.map(childFolder => renderFolder(childFolder, level + 1))}
          </div>
        )}
      </div>
    );
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
        <h3 className="text-lg font-medium">Library</h3>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700"
          title="Create New Folder"
        >
          <Plus size={16} />
          <span>New</span>
        </button>
      </div>

      {isCreating && (
        <div className="flex flex-col gap-2 p-3 bg-gray-700 rounded">
          <p className="text-sm text-gray-300">
            {parentFolderId ? 'Creating subfolder in: ' + (folders.find(f => f.id === parentFolderId)?.name || 'Unknown') : 'Creating root folder'}
          </p>
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            className="flex-grow px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') {
                setIsCreating(false);
                setNewFolderName('');
              }
            }}
          />
          <button
            onClick={handleCreateFolder}
            disabled={!newFolderName.trim()}
            className="px-3 py-2 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
          >
            Create
          </button>
          <button
            onClick={() => {
              setIsCreating(false);
              setNewFolderName('');
            }}
            className="px-3 py-2 bg-gray-600 rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <div className="p-2 text-sm bg-red-900/50 border border-red-700 rounded text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto">
        <div
          className={`flex items-center justify-between p-2 rounded cursor-pointer ${
            selectedFolderId === null
              ? 'bg-blue-600'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          onClick={() => onFolderSelect(null)}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('bg-blue-400');
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('bg-blue-400');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('bg-blue-400');
            if (draggedSceneId) {
              window.dispatchEvent(new CustomEvent('sceneDrop', { 
                detail: { sceneId: draggedSceneId, folderId: null }
              }));
              setDraggedSceneId(null);
            }
          }}
        >
          <div className="flex items-center gap-2">
            <FolderOpen size={16} />
            <span>All Scenes</span>
          </div>
        </div>

        {getChildFolders(null).map(rootFolder => renderFolder(rootFolder))}

        {folders.length === 0 && !isCreating && (
          <div className="text-center py-4 text-gray-400">
            No folders created yet
          </div>
        )}
      </div>
    </div>
  );
};

export default FolderManager;