/*
  # Update annotation schema to use start/end times

  1. Changes
    - Add default_duration column to annotation_projects table
    - Remove fade_duration and fade_enabled columns from annotation_projects table
  
  2. Notes
    - This migration supports the new timestamp-based visibility system
    - Existing annotations will be automatically migrated to use start/end times
*/

-- Add default_duration column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'annotation_projects' AND column_name = 'default_duration'
  ) THEN
    ALTER TABLE annotation_projects ADD COLUMN default_duration INTEGER DEFAULT 5;
  END IF;
END $$;

-- Remove fade-related columns if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'annotation_projects' AND column_name = 'fade_duration'
  ) THEN
    ALTER TABLE annotation_projects DROP COLUMN fade_duration;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'annotation_projects' AND column_name = 'fade_enabled'
  ) THEN
    ALTER TABLE annotation_projects DROP COLUMN fade_enabled;
  END IF;
END $$;