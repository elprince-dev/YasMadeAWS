/*
  # Add subscribers management

  1. New Tables
    - `subscribers` - Stores email newsletter subscribers
  2. Security
    - Enable RLS on subscribers table
    - Add appropriate policies for CRUD operations
*/

CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view subscribers
CREATE POLICY "Subscribers are viewable by authenticated users only"
  ON subscribers FOR SELECT
  TO authenticated
  USING (true);

-- Anyone can subscribe
CREATE POLICY "Anyone can subscribe"
  ON subscribers FOR INSERT
  TO public
  WITH CHECK (true);

-- Only authenticated users can delete subscribers
CREATE POLICY "Only authenticated users can delete subscribers"
  ON subscribers FOR DELETE
  TO authenticated
  USING (true);