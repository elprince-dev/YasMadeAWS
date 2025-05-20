/*
  # Add Order Upload Support

  1. Changes
    - Add payment_proof column to orders table
    - Add payment_status column to orders table
    - Add payment_confirmed_at column to orders table
    - Add payment_notes column to orders table

  2. Security
    - Enable RLS policies for secure access
*/

-- Add new columns to orders table
ALTER TABLE orders 
  ADD COLUMN payment_proof text,
  ADD COLUMN payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed', 'rejected')),
  ADD COLUMN payment_confirmed_at timestamptz,
  ADD COLUMN payment_notes text;

-- Update order status check constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text]));

-- Create policy for payment proof uploads
CREATE POLICY "Users can upload payment proof"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'payment-proofs');