/*
  # Add Scenes Support
  
  1. New Tables
    - `scenes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `video_source` (jsonb)
      - `start_time` (float)
      - `end_time` (float)
      - `folder_id` (uuid, references folders)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on scenes table
    - Add policies for authenticated users to manage their scenes
    - Add policy for public access to shared scenes
*/

-- Create scenes table if it doesn't exist
CREATE TABLE IF NOT EXISTS scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  video_source JSONB NOT NULL,
  start_time FLOAT NOT NULL,
  end_time FLOAT NOT NULL,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own scenes" ON scenes;
  DROP POLICY IF EXISTS "Users can create their own scenes" ON scenes;
  DROP POLICY IF EXISTS "Users can update their own scenes" ON scenes;
  DROP POLICY IF EXISTS "Users can delete their own scenes" ON scenes;
  DROP POLICY IF EXISTS "Public can view scenes" ON scenes;
END $$;

-- Create policies
CREATE POLICY "Users can view their own scenes"
  ON scenes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own scenes"
  ON scenes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own scenes"
  ON scenes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own scenes"
  ON scenes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Allow public access to scenes (for sharing)
CREATE POLICY "Public can view scenes"
  ON scenes
  FOR SELECT
  TO anon
  USING (true);