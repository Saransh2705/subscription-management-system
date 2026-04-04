-- ============================================================
-- 020: Auto-Generate Product SKU
-- Automatically generate unique SKU for products
-- ============================================================

-- Create function to generate SKU
CREATE OR REPLACE FUNCTION generate_product_sku()
RETURNS TEXT AS $$
DECLARE
  new_sku TEXT;
  sku_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate SKU in format: PROD-YYYYMMDD-XXXX (where XXXX is random 4-digit number)
    new_sku := 'PROD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Check if SKU already exists
    SELECT EXISTS(SELECT 1 FROM products WHERE sku = new_sku) INTO sku_exists;
    
    -- Exit loop if SKU is unique
    EXIT WHEN NOT sku_exists;
  END LOOP;
  
  RETURN new_sku;
END;
$$ LANGUAGE plpgsql;

-- Update products table to auto-generate SKU if not provided
ALTER TABLE public.products 
  ALTER COLUMN sku SET DEFAULT generate_product_sku();

-- Update existing products without SKU
UPDATE public.products
SET sku = generate_product_sku()
WHERE sku IS NULL OR sku = '';

-- Make SKU NOT NULL after setting defaults
ALTER TABLE public.products 
  ALTER COLUMN sku SET NOT NULL;

-- ============================================================
-- Migration Complete
-- ============================================================
