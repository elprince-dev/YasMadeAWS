/*
  # Initial Schema Setup for YasMade Website

  1. New Tables
    - `products` - Stores embroidery product information
    - `blogs` - Stores blog posts information
    - `sessions` - Stores embroidery session information
    - `session_registrations` - Stores session registration submissions
    - `settings` - Stores website settings including Qur'anic verse
    - `form_fields` - Stores custom form fields for session registration
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  image_url TEXT,
  featured BOOLEAN DEFAULT false,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create blogs table
CREATE TABLE IF NOT EXISTS blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  session_date DATE NOT NULL,
  session_time TEXT,
  location TEXT,
  price DECIMAL(10, 2) DEFAULT 0,
  max_participants INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create form_fields table for custom session registration forms
CREATE TABLE IF NOT EXISTS form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text', -- text, email, number, textarea, select, checkbox
  field_options TEXT, -- For select fields, JSON array of options
  required BOOLEAN DEFAULT false,
  order_position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create session_registrations table
CREATE TABLE IF NOT EXISTS session_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  form_data JSONB NOT NULL, -- Stores all form field values
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quran_verse TEXT DEFAULT 'Indeed, with hardship comes ease.',
  quran_verse_source TEXT DEFAULT 'Surah Ash-Sharh 94:6',
  social_links JSONB DEFAULT '{}',
  site_title TEXT DEFAULT 'YasMade | Handmade Embroidery & Creative Sessions',
  site_description TEXT DEFAULT 'YasMade - Handmade embroidery, creative sessions for kids, and personal blog by Yas',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT settings_singleton CHECK (id = '00000000-0000-0000-0000-000000000000')
);

-- Insert default settings
INSERT INTO settings (id)
VALUES ('00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Products are viewable by everyone" 
  ON products FOR SELECT 
  USING (true);

CREATE POLICY "Products are editable by authenticated users only" 
  ON products FOR ALL 
  TO authenticated 
  USING (true);

-- RLS Policies for blogs
CREATE POLICY "Published blogs are viewable by everyone" 
  ON blogs FOR SELECT 
  USING (published = true);

CREATE POLICY "All blogs are viewable by authenticated users" 
  ON blogs FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Blogs are editable by authenticated users only" 
  ON blogs FOR ALL 
  TO authenticated 
  USING (true);

-- RLS Policies for sessions
CREATE POLICY "Sessions are viewable by everyone" 
  ON sessions FOR SELECT 
  USING (true);

CREATE POLICY "Sessions are editable by authenticated users only" 
  ON sessions FOR ALL 
  TO authenticated 
  USING (true);

-- RLS Policies for form_fields
CREATE POLICY "Form fields are viewable by everyone" 
  ON form_fields FOR SELECT 
  USING (true);

CREATE POLICY "Form fields are editable by authenticated users only" 
  ON form_fields FOR ALL 
  TO authenticated 
  USING (true);

-- RLS Policies for session_registrations
CREATE POLICY "Registrations are insertable by everyone" 
  ON session_registrations FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Registrations are viewable by authenticated users only" 
  ON session_registrations FOR SELECT 
  TO authenticated 
  USING (true);

-- RLS Policies for settings
CREATE POLICY "Settings are viewable by everyone" 
  ON settings FOR SELECT 
  USING (true);

CREATE POLICY "Settings are editable by authenticated users only" 
  ON settings FOR UPDATE 
  TO authenticated 
  USING (true);