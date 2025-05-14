/*
  # Add contact form submissions management

  1. New Tables
    - `contact_submissions` - Stores contact form submissions
  2. Security
    - Enable RLS
    - Add appropriate policies for viewing and managing submissions
*/

CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view submissions
CREATE POLICY "Contact submissions are viewable by authenticated users only"
  ON contact_submissions FOR SELECT
  TO authenticated
  USING (true);

-- Anyone can create submissions
CREATE POLICY "Contact submissions can be created by anyone"
  ON contact_submissions FOR INSERT
  TO public
  WITH CHECK (true);

-- Only authenticated users can delete submissions
CREATE POLICY "Contact submissions can be deleted by authenticated users only"
  ON contact_submissions FOR DELETE
  TO authenticated
  USING (true);