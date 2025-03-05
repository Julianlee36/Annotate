/*
  # Add video source to scenes table

  1. Changes
    - Add `video_source` column to `scenes` table to store video source information
    - Column type is `jsonb` to store structured video source data
    - Make column nullable to support existing records
    
  2. Purpose
    - Enable storing video source information for each scene
    - Support switching to correct video when playing scenes
    - Maintain video context for shared scenes
*/

-- Add video_source column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenes' AND column_name = 'video_source'
  ) THEN
    ALTER TABLE scenes ADD COLUMN video_source jsonb;
  END IF;
END $$;