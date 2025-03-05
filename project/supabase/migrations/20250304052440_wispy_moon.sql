/*
  # Add public access to annotation projects
  
  1. Changes
    - Add policy to allow anonymous users to view annotation projects
    
  2. Security
    - Enable public read access to annotation projects for sharing functionality
*/

-- Create a policy to allow public read access to annotation projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'annotation_projects' AND policyname = 'Public can view shared projects'
  ) THEN
    CREATE POLICY "Public can view shared projects"
      ON annotation_projects
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END
$$;