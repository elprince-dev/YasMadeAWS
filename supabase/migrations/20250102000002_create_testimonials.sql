-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  feedback TEXT NOT NULL,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for testimonials
CREATE POLICY "Testimonials are viewable by everyone" 
  ON testimonials FOR SELECT 
  USING (true);

CREATE POLICY "Testimonials are editable by authenticated users only" 
  ON testimonials FOR ALL 
  TO authenticated 
  USING (true);

-- Create index for better performance
CREATE INDEX idx_testimonials_featured ON testimonials(is_featured, created_at DESC);