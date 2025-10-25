-- Create product_images table for multiple images per product
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  order_position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_images
CREATE POLICY "Product images are viewable by everyone" 
  ON product_images FOR SELECT 
  USING (true);

CREATE POLICY "Product images are editable by authenticated users only" 
  ON product_images FOR ALL 
  TO authenticated 
  USING (true);

-- Create index for better performance
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_order ON product_images(product_id, order_position);