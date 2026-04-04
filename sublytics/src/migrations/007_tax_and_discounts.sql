-- ============================================================
-- 007: Tax on Products, Discounts on Subscription Products & Subscriptions
-- ============================================================

-- ============================================================
-- 1. ADD TAX COLUMN TO PRODUCTS (percentage)
-- ============================================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS tax_percent NUMERIC(5, 2) NOT NULL DEFAULT 0;

-- ============================================================
-- 2. ADD DISCOUNT COLUMNS TO SUBSCRIPTION_PRODUCTS
--    discount_type: 'percentage' or 'value'
--    discount_value: the raw discount number
-- ============================================================

-- Create discount type enum
DO $$ BEGIN
  CREATE TYPE public.discount_type AS ENUM ('percentage', 'value');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.subscription_products
  ADD COLUMN IF NOT EXISTS discount_type public.discount_type NOT NULL DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS discount_value NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- We need to drop and recreate the generated column because it must reflect discount + tax now
-- First drop the old generated column
ALTER TABLE public.subscription_products
  DROP COLUMN IF EXISTS total_price;

-- Recreate total_price as a regular column (we compute it via trigger since
-- generated columns cannot reference other tables for tax_percent)
ALTER TABLE public.subscription_products
  ADD COLUMN total_price NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- ============================================================
-- 3. CREATE VIEW: subscription_products_detailed
--    Shows each subscription product with discount amount, price after discount,
--    tax amount, and final price after tax
-- ============================================================

CREATE OR REPLACE VIEW public.subscription_products_detailed AS
SELECT
  sp.id,
  sp.subscription_id,
  sp.product_id,
  sp.plan_product_id,
  sp.quantity,
  sp.unit_price,
  sp.discount_type,
  sp.discount_value,
  -- Amount after discount per unit
  CASE
    WHEN sp.discount_type = 'percentage' THEN
      sp.unit_price * (1 - sp.discount_value / 100)
    ELSE
      GREATEST(sp.unit_price - sp.discount_value, 0)
  END AS discounted_unit_price,
  -- Total discount amount
  CASE
    WHEN sp.discount_type = 'percentage' THEN
      sp.quantity * sp.unit_price * (sp.discount_value / 100)
    ELSE
      sp.quantity * LEAST(sp.discount_value, sp.unit_price)
  END AS discount_amount,
  -- Subtotal (quantity * discounted unit price)
  sp.quantity * (
    CASE
      WHEN sp.discount_type = 'percentage' THEN
        sp.unit_price * (1 - sp.discount_value / 100)
      ELSE
        GREATEST(sp.unit_price - sp.discount_value, 0)
    END
  ) AS subtotal_after_discount,
  -- Tax percent from product
  p.tax_percent,
  -- Tax amount on discounted subtotal
  sp.quantity * (
    CASE
      WHEN sp.discount_type = 'percentage' THEN
        sp.unit_price * (1 - sp.discount_value / 100)
      ELSE
        GREATEST(sp.unit_price - sp.discount_value, 0)
    END
  ) * (p.tax_percent / 100) AS tax_amount,
  -- Final total (after discount + tax)
  sp.quantity * (
    CASE
      WHEN sp.discount_type = 'percentage' THEN
        sp.unit_price * (1 - sp.discount_value / 100)
      ELSE
        GREATEST(sp.unit_price - sp.discount_value, 0)
    END
  ) * (1 + p.tax_percent / 100) AS total_price_with_tax,
  sp.added_at,
  sp.removed_at,
  sp.is_active,
  sp.created_at,
  sp.updated_at,
  -- Product info for convenience
  p.name AS product_name,
  p.sku AS product_sku
FROM public.subscription_products sp
JOIN public.products p ON sp.product_id = p.id;

-- ============================================================
-- 4. TRIGGER: Auto-compute total_price on subscription_products insert/update
--    total_price = quantity * discounted_unit_price * (1 + tax_percent/100)
-- ============================================================

CREATE OR REPLACE FUNCTION public.compute_subscription_product_total()
RETURNS TRIGGER AS $$
DECLARE
  product_tax NUMERIC;
  discounted_price NUMERIC;
BEGIN
  -- Get tax from product
  SELECT tax_percent INTO product_tax
  FROM public.products
  WHERE id = NEW.product_id;

  -- Compute discounted unit price
  IF NEW.discount_type = 'percentage' THEN
    discounted_price := NEW.unit_price * (1 - NEW.discount_value / 100);
  ELSE
    discounted_price := GREATEST(NEW.unit_price - NEW.discount_value, 0);
  END IF;

  -- Set total_price = quantity * discounted * (1 + tax)
  NEW.total_price := NEW.quantity * discounted_price * (1 + COALESCE(product_tax, 0) / 100);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_subscription_product_total ON public.subscription_products;

CREATE TRIGGER trg_compute_subscription_product_total
  BEFORE INSERT OR UPDATE ON public.subscription_products
  FOR EACH ROW EXECUTE FUNCTION public.compute_subscription_product_total();

-- ============================================================
-- 5. SUBSCRIPTION-LEVEL DISCOUNT (already exists as discount_percent)
--    Add discount_type and discount_value for flexibility
-- ============================================================

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS subscription_discount_type public.discount_type NOT NULL DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS subscription_discount_value NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- ============================================================
-- 6. CREATE VIEW: subscriptions_with_totals
--    Shows each subscription with products total, subscription discount,
--    and final discounted amount
-- ============================================================

CREATE OR REPLACE VIEW public.subscriptions_with_totals AS
SELECT
  s.id,
  s.customer_id,
  s.plan_id,
  s.status,
  s.start_date,
  s.end_date,
  s.trial_end_date,
  s.next_billing_date,
  s.quantity,
  s.notes,
  s.created_by,
  s.created_at,
  s.updated_at,
  -- Plan base price
  sp.price AS plan_price,
  sp.name AS plan_name,
  -- Sum of all active product totals (already includes per-product discount + tax)
  COALESCE(products_agg.products_total, 0) AS products_total,
  -- Gross total before subscription discount
  (sp.price + COALESCE(products_agg.products_total, 0)) AS gross_total,
  -- Subscription-level discount
  s.subscription_discount_type,
  s.subscription_discount_value,
  -- Subscription discount amount
  CASE
    WHEN s.subscription_discount_type = 'percentage' THEN
      (sp.price + COALESCE(products_agg.products_total, 0)) * (s.subscription_discount_value / 100)
    ELSE
      LEAST(s.subscription_discount_value, sp.price + COALESCE(products_agg.products_total, 0))
  END AS subscription_discount_amount,
  -- Final amount after subscription discount
  CASE
    WHEN s.subscription_discount_type = 'percentage' THEN
      (sp.price + COALESCE(products_agg.products_total, 0)) * (1 - s.subscription_discount_value / 100)
    ELSE
      GREATEST((sp.price + COALESCE(products_agg.products_total, 0)) - s.subscription_discount_value, 0)
  END AS final_amount
FROM public.subscriptions s
JOIN public.subscription_plans sp ON s.plan_id = sp.id
LEFT JOIN (
  SELECT
    subscription_id,
    SUM(total_price) AS products_total
  FROM public.subscription_products
  WHERE is_active = true
  GROUP BY subscription_id
) products_agg ON products_agg.subscription_id = s.id;

-- ============================================================
-- 7. UPDATE calculate_subscription_total FUNCTION
--    Now uses subscription_discount_type/value instead of just discount_percent
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_subscription_total(subscription_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  plan_price NUMERIC;
  products_total NUMERIC;
  sub_discount_type public.discount_type;
  sub_discount_value NUMERIC;
  gross_total NUMERIC;
  final_total NUMERIC;
BEGIN
  -- Get plan base price
  SELECT sp.price INTO plan_price
  FROM public.subscriptions s
  JOIN public.subscription_plans sp ON s.plan_id = sp.id
  WHERE s.id = subscription_uuid;

  -- Get total of all active products (already includes per-product discounts + tax)
  SELECT COALESCE(SUM(total_price), 0) INTO products_total
  FROM public.subscription_products
  WHERE subscription_id = subscription_uuid AND is_active = true;

  -- Get subscription discount
  SELECT s.subscription_discount_type, s.subscription_discount_value
  INTO sub_discount_type, sub_discount_value
  FROM public.subscriptions s
  WHERE s.id = subscription_uuid;

  gross_total := plan_price + products_total;

  -- Apply subscription-level discount
  IF sub_discount_type = 'percentage' THEN
    final_total := gross_total * (1 - sub_discount_value / 100);
  ELSE
    final_total := GREATEST(gross_total - sub_discount_value, 0);
  END IF;

  RETURN final_total;
END;
$$ LANGUAGE plpgsql;
