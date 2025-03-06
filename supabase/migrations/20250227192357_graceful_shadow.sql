/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `email` (text, unique, not null)
      - `cpf` (text, unique, not null)
      - `role` (text, not null)
      - `first_access` (boolean, default true)
      - `created_at` (timestamp with time zone, default now())
  2. Security
    - Enable RLS on `users` table
    - Add policy for authenticated users to read their own data
    - Add policy for admins to read all users
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  cpf text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'researcher')),
  first_access boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy for users to update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Policy for admins to read all users
CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (role = 'admin');

-- Policy for admins to insert users
CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (role = 'admin');

-- Policy for admins to update users
CREATE POLICY "Admins can update users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (role = 'admin');

-- Policy for admins to delete users
CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (role = 'admin');