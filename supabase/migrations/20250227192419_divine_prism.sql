/*
  # Create answers table

  1. New Tables
    - `answers`
      - `id` (uuid, primary key)
      - `survey_id` (uuid, references surveys.id)
      - `question_id` (text, not null)
      - `researcher_id` (uuid, references users.id)
      - `answer` (text, not null)
      - `created_at` (timestamp with time zone, default now())
  2. Security
    - Enable RLS on `answers` table
    - Add policy for admins to read all answers
    - Add policy for researchers to read and insert their own answers
*/

CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  researcher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answer text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(survey_id, question_id, researcher_id)
);

ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Policy for admins to read all answers
CREATE POLICY "Admins can read all answers"
  ON answers
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));

-- Policy for admins to insert answers
CREATE POLICY "Admins can insert answers"
  ON answers
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));

-- Policy for researchers to read their own answers
CREATE POLICY "Researchers can read own answers"
  ON answers
  FOR SELECT
  TO authenticated
  USING (researcher_id = auth.uid());

-- Policy for researchers to insert their own answers
CREATE POLICY "Researchers can insert own answers"
  ON answers
  FOR INSERT
  TO authenticated
  WITH CHECK (researcher_id = auth.uid());

-- Policy for researchers to update their own answers
CREATE POLICY "Researchers can update own answers"
  ON answers
  FOR UPDATE
  TO authenticated
  USING (researcher_id = auth.uid());