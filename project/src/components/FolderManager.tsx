import React, { useState, useEffect } from 'react';
import { Folder, Plus, FolderOpen, Trash2 } from 'lucide-react';
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
          name: newFolderName.trim()
        }])
        .select()
        .single();

      if (error) throw error;

      setFolders([...folders, data]);
      setNewFolderName('');
      setIsCreating(false);
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
        <div className="flex gap-2">
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
        >
          <div className="flex items-center gap-2">
            <FolderOpen size={16} />
            <span>All Scenes</span>
          </div>
        </div>

        {folders.map(folder => (
          <div
            key={folder.id}
            className={`flex items-center justify-between p-2 rounded cursor-pointer ${
              selectedFolderId === folder.id
                ? 'bg-blue-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            onClick={() => onFolderSelect(folder.id)}
          >
            <div className="flex items-center gap-2">
              <Folder size={16} />
              <span>{folder.name}</span>
            </div>
            <button
              onClick={(e) => handleDeleteFolder(folder.id, e)}
              className="p-1 hover:bg-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete Folder"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

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