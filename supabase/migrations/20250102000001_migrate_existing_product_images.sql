-- Migrate existing product images from products.image_url to product_images table
INSERT INTO product_images (product_id, image_url, order_position)
SELECT 
  id as product_id,
  image_url,
  0 as order_position
FROM products 
WHERE image_url IS NOT NULL AND image_url != '';