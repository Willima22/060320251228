/*
  # Fix survey policies

  1. Add policy for researchers to read surveys assigned to them
*/

-- Policy for researchers to read assigned surveys
CREATE POLICY "Researchers can read assigned surveys"
ON surveys
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM survey_assignments
    WHERE survey_assignments.survey_id = id
    AND survey_assignments.researcher_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy for researchers to read surveys through join
CREATE POLICY "Researchers can read surveys through join"
ON surveys
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM survey_assignments
    WHERE survey_assignments.survey_id = id
    AND survey_assignments.researcher_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
); 