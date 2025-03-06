/*
  # Create survey assignments table

  1. New Tables
    - `survey_assignments`
      - `id` (uuid, primary key)
      - `survey_id` (uuid, references surveys.id)
      - `researcher_id` (uuid, references users.id)
      - `status` (text, not null)
      - `assigned_at` (timestamp with time zone, default now())
      - `completed_at` (timestamp with time zone, null)
  2. Security
    - Enable RLS on `survey_assignments` table
    - Add policy for admins to manage assignments
    - Add policy for researchers to read their own assignments
*/

CREATE TABLE IF NOT EXISTS survey_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  researcher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
  assigned_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(survey_id, researcher_id)
);

ALTER TABLE survey_assignments ENABLE ROW LEVEL SECURITY;

-- Policy for admins to read all assignments
CREATE POLICY "Admins can read all assignments"
  ON survey_assignments
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));

-- Policy for admins to insert assignments
CREATE POLICY "Admins can insert assignments"
  ON survey_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));

-- Policy for admins to update assignments
CREATE POLICY "Admins can update assignments"
  ON survey_assignments
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));

-- Policy for admins to delete assignments
CREATE POLICY "Admins can delete assignments"
  ON survey_assignments
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));

-- Policy for researchers to read their own assignments
CREATE POLICY "Researchers can read own assignments"
  ON survey_assignments
  FOR SELECT
  TO authenticated
  USING (researcher_id = auth.uid());

-- Policy for researchers to update their own assignments
CREATE POLICY "Researchers can update own assignments"
  ON survey_assignments
  FOR UPDATE
  TO authenticated
  USING (researcher_id = auth.uid());