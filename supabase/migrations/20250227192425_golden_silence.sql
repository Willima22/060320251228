/*
  # Create reports table

  1. New Tables
    - `reports`
      - `id` (uuid, primary key)
      - `survey_id` (uuid, references surveys.id)
      - `type` (text, not null)
      - `parameters` (jsonb, default empty object)
      - `data` (jsonb, not null)
      - `created_at` (timestamp with time zone, default now())
  2. Security
    - Enable RLS on `reports` table
    - Add policy for admins to manage reports
*/

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('variable', 'cross', 'sample', 'item')),
  parameters jsonb DEFAULT '{}'::jsonb,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policy for admins to read all reports
CREATE POLICY "Admins can read all reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));

-- Policy for admins to insert reports
CREATE POLICY "Admins can insert reports"
  ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));

-- Policy for admins to delete reports
CREATE POLICY "Admins can delete reports"
  ON reports
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));