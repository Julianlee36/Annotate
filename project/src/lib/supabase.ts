import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

export type UserProfile = {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  created_at: string;
};

export type AnnotationProject = {
  id: string;
  user_id: string;
  name: string;
  video_source: any;
  annotations: any[];
  fade_duration?: {
    visible: number;
    transition: number;
  };
  fade_enabled: boolean;
  created_at: string;
  updated_at: string;
};