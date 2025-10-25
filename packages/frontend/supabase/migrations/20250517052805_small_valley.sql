/*
  # Add e-commerce features

  1. New Tables
    - `product_images` - Stores multiple images per product
    - `orders` - Stores customer orders
    - `order_items` - Stores items within each order
    - `shipping_rates` - Stores shipping rates
    - `promo_codes` - Stores promotional codes
    
  2. Changes
    - Add Stripe-related fields to products table
    - Add shipping-related fields to orders table
    
  3. Security
    - Enable RLS
    - Add appropriate policies
*/

-- Add product_images table
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  order_position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_purchase_amount DECIMAL(10, 2),
  max_discount_amount DECIMAL(10, 2),
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add shipping_rates table
CREATE TABLE IF NOT EXISTS shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,
  shipping_rate_id UUID REFERENCES shipping_rates(id),
  promo_code_id UUID REFERENCES promo_codes(id),
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping_fee DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price_at_time DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add Stripe-related fields to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Enable RLS
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_images
CREATE POLICY "Product images are viewable by everyone"
  ON product_images FOR SELECT
  USING (true);

CREATE POLICY "Product images are editable by authenticated users only"
  ON product_images FOR ALL
  TO authenticated
  USING (true);

-- RLS Policies for promo_codes
CREATE POLICY "Active promo codes are viewable by everyone"
  ON promo_codes FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Promo codes are editable by authenticated users only"
  ON promo_codes FOR ALL
  TO authenticated
  USING (true);

-- RLS Policies for shipping_rates
CREATE POLICY "Active shipping rates are viewable by everyone"
  ON shipping_rates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Shipping rates are editable by authenticated users only"
  ON shipping_rates FOR ALL
  TO authenticated
  USING (true);

-- RLS Policies for orders
CREATE POLICY "Orders are viewable by authenticated users only"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Orders can be created by anyone"
  ON orders FOR INSERT
  TO public
  WITH CHECK (true);

-- RLS Policies for order_items
CREATE POLICY "Order items are viewable by authenticated users only"
  ON order_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Order items can be created by anyone"
  ON order_items FOR INSERT
  TO public
  WITH CHECK (true);