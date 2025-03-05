/*
  # Add sharing support for annotation projects

  1. Changes
    - Add public read access policy for annotation projects
    - Ensure all users can view shared projects
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