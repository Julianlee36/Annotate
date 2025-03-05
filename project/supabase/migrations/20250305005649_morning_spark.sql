/*
  # Add user_id to scenes table

  1. Changes
    - Add user_id column to scenes table
    - Add foreign key constraint to profiles
    - Update RLS policies to use user_id directly
    - Make project_id optional since we're not using projects anymore

  2. Security
    - Enable RLS
    - Update policies to use user_id instead of project_id
*/

-- Add user_id column and make project_id optional
ALTER TABLE scenes 
  ADD COLUMN user_id UUID REFERENCES profiles(id),
  ALTER COLUMN project_id DROP NOT NULL;

-- Update RLS policies to use user_id
DROP POLICY IF EXISTS "Users can view their own scenes" ON scenes;
DROP POLICY IF EXISTS "Users can create scenes for their projects" ON scenes;
DROP POLICY IF EXISTS "Users can update their own scenes" ON scenes;
DROP POLICY IF EXISTS "Users can delete their own scenes" ON scenes;

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