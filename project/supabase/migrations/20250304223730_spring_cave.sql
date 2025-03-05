-- Create scenes table
CREATE TABLE IF NOT EXISTS scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES annotation_projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  start_time FLOAT NOT NULL,
  end_time FLOAT,
  annotations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own scenes"
  ON scenes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM annotation_projects
      WHERE annotation_projects.id = scenes.project_id
      AND annotation_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create scenes for their projects"
  ON scenes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM annotation_projects
      WHERE annotation_projects.id = project_id
      AND annotation_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own scenes"
  ON scenes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM annotation_projects
      WHERE annotation_projects.id = scenes.project_id
      AND annotation_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own scenes"
  ON scenes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM annotation_projects
      WHERE annotation_projects.id = scenes.project_id
      AND annotation_projects.user_id = auth.uid()
    )
  );

-- Add public access policy for shared projects
CREATE POLICY "Public can view scenes from shared projects"
  ON scenes
  FOR SELECT
  TO anon
  USING (true);