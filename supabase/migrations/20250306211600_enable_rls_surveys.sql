/*
  # Enable RLS on surveys table
*/

-- Habilitar RLS na tabela surveys
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

-- Garantir que a tabela surveys existe
CREATE TABLE IF NOT EXISTS surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  date text NOT NULL,
  contractor text NOT NULL,
  code text NOT NULL,
  current_manager jsonb NOT NULL,
  questions jsonb[] DEFAULT array[]::jsonb[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
); 