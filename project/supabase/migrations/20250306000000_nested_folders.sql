/*
  # Add support for nested folders
  
  1. Changes:
    - Add parent_id and level columns to folders table
    - Add constraint to ensure maximum nesting level is 2
    - Update folder policies
*/

-- Add parent_id and level columns to folders table
ALTER TABLE folders 
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 0;

-- Add check constraint for maximum nesting level
ALTER TABLE folders ADD CONSTRAINT max_nesting_level CHECK (level <= 2);

-- Create an index on parent_id for better performance
CREATE INDEX IF NOT EXISTS folders_parent_id_idx ON folders(parent_id);

-- Update the folders when parent changes
CREATE OR REPLACE FUNCTION update_folder_level()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    -- Get the level of the parent and add 1
    SELECT level + 1 INTO NEW.level FROM folders WHERE id = NEW.parent_id;
  ELSE
    -- Root folders are level 0
    NEW.level := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER folder_level_trigger
BEFORE INSERT OR UPDATE ON folders
FOR EACH ROW EXECUTE FUNCTION update_folder_level();
