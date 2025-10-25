/*
  # Add default form fields for session registration

  1. New Data
    - Add default form fields for session registration
  2. Changes
    - Insert default form fields for all sessions
*/

-- Insert default form fields for all sessions
INSERT INTO form_fields (session_id, field_name, field_label, field_type, required, order_position)
SELECT 
  id as session_id,
  'name' as field_name,
  'Full Name' as field_label,
  'text' as field_type,
  true as required,
  1 as order_position
FROM sessions;

INSERT INTO form_fields (session_id, field_name, field_label, field_type, required, order_position)
SELECT 
  id as session_id,
  'email' as field_name,
  'Email Address' as field_label,
  'email' as field_type,
  true as required,
  2 as order_position
FROM sessions;

INSERT INTO form_fields (session_id, field_name, field_label, field_type, required, order_position)
SELECT 
  id as session_id,
  'phone' as field_name,
  'Phone Number' as field_label,
  'text' as field_type,
  false as required,
  3 as order_position
FROM sessions;