-- Step 1: Drop dependent objects from session_registrations and form_fields
-- Drop the foreign key constraint from session_registrations to sessions
ALTER TABLE session_registrations DROP CONSTRAINT IF EXISTS session_registrations_session_id_fkey;
-- Drop the foreign key constraint from form_fields to sessions
ALTER TABLE form_fields DROP CONSTRAINT IF EXISTS form_fields_session_id_fkey;

-- Step 2: Drop the tables
DROP TABLE IF EXISTS session_registrations;
DROP TABLE IF EXISTS form_fields;

-- Step 3: Add the new google_form_link column to the sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS google_form_link TEXT;
