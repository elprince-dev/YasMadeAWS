/*
  # Add image field to sessions table

  1. Changes
    - Add image_url field to sessions table
*/

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS image_url TEXT;