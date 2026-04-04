-- ============================================================
-- SUBSCRIPTION PLANS - DISCOUNT MODEL RESTRUCTURE
-- ============================================================
-- Migration: 013
-- Description: Convert subscription plans from fixed pricing to discount-based model
--              Add subscription_plan_products junction table for product selection
-- Date: 2024-04-04

-- ============================================================
-- 1. DROP DEPENDENT VIEWS AND FUNCTIONS
-- ============================================================

-- Drop views that reference subscription_plans.price
DROP VIEW IF EXISTS public.subscriptions_with_totals CASCADE;
DROP VIEW IF EXISTS public.subscription_products_detailed CASCADE;

-- Drop functions that reference subscription_plans.price
DROP FUNCTION IF EXISTS public.calculate_subscription_total(UUID) CASCADE;

-- ============================================================
-- 2. ALTER SUBSCRIPTION PLANS TABLE
-- ============================================================

-- Add discount_percentage column (0-100)
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.subscription_plans.discount_percentage IS 'Discount percentage (0-100) applied to selected products. Final price = product_price * (1 - discount_percentage/100)';

-- Drop old pricing columns (will be calculated from products + discount)
ALTER TABLE public.subscription_plans 
DROP COLUMN IF EXISTS price,
DROP COLUMN IF EXISTS currency,
DROP COLUMN IF EXISTS billing_cycle;

-- ============================================================
-- 3. CREATE SUBSCRIPTION_PLAN_PRODUCTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.subscription_plan_products (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL,
  product_id UUID NOT NULL,
  tier_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  is_included BOOLEAN NOT NULL DEFAULT true,
  quantity_limit INTEGER NULL,
  notes TEXT NULL,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subscription_plan_products_pkey PRIMARY KEY (id),
  CONSTRAINT subscription_plan_products_plan_id_product_id_key UNIQUE (plan_id, product_id),
  CONSTRAINT subscription_plan_products_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  CONSTRAINT subscription_plan_products_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  CONSTRAINT subscription_plan_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.subscription_plan_products IS 'Junction table linking subscription plans to their included products with tier-specific pricing';
COMMENT ON COLUMN public.subscription_plan_products.tier_price IS 'Price override for this product in this plan tier (0 = use product base price)';
COMMENT ON COLUMN public.subscription_plan_products.is_included IS 'Whether this product is included in the plan';
COMMENT ON COLUMN public.subscription_plan_products.quantity_limit IS 'Max quantity allowed per billing cycle (NULL = unlimited)';

-- ============================================================
-- 3. CREATE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_subscription_plan_products_plan_id 
ON public.subscription_plan_products USING btree (plan_id);

CREATE INDEX IF NOT EXISTS idx_subscription_plan_products_product_id 
ON public.subscription_plan_products USING btree (product_id);

CREATE INDEX IF NOT EXISTS idx_subscription_plan_products_is_included 
ON public.subscription_plan_products USING btree (is_included);

-- ============================================================
-- 5. CREATE TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS set_updated_at_subscription_plan_products ON public.subscription_plan_products;

CREATE TRIGGER set_updated_at_subscription_plan_products 
BEFORE UPDATE ON public.subscription_plan_products 
FOR EACH ROW 
EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- 6. UPDATE EXISTING PLAN DATA WITH DISCOUNT PERCENTAGES
-- ============================================================

-- Assign discount percentages to existing plans based on their tier
-- Starter: 0% discount (full price)
-- Professional: 10% discount
-- Business: 20% discount  
-- Enterprise: 25% discount

UPDATE public.subscription_plans SET discount_percentage = 0 WHERE name = 'Starter';
UPDATE public.subscription_plans SET discount_percentage = 10 WHERE name = 'Professional';
UPDATE public.subscription_plans SET discount_percentage = 20 WHERE name = 'Business';
UPDATE public.subscription_plans SET discount_percentage = 25 WHERE name = 'Enterprise';

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on subscription_plan_products
ALTER TABLE public.subscription_plan_products ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view subscription plan products
CREATE POLICY "subscription_plan_products_select" 
ON public.subscription_plan_products 
FOR SELECT 
TO authenticated 
USING (true);

-- Policy: Only SYSTEM_ADMIN and ADMIN can manage plan products
CREATE POLICY "subscription_plan_products_insert" 
ON public.subscription_plan_products 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('SYSTEM_ADMIN', 'ADMIN')
  )
);

CREATE POLICY "subscription_plan_products_update" 
ON public.subscription_plan_products 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('SYSTEM_ADMIN', 'ADMIN')
  )
);

CREATE POLICY "subscription_plan_products_delete" 
ON public.subscription_plan_products 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('SYSTEM_ADMIN', 'ADMIN')
  )
);

-- ============================================================
-- 8. HELPER VIEWS FOR PLAN PRICING CALCULATION
-- ============================================================

-- View to calculate total price for each plan based on included products
CREATE OR REPLACE VIEW public.subscription_plans_with_pricing AS
SELECT 
  sp.id,
  sp.name,
  sp.description,
  sp.discount_percentage,
  sp.trial_days,
  sp.features,
  sp.is_active,
  sp.created_by,
  sp.created_at,
  sp.updated_at,
  -- Calculate total base price from included products
  COALESCE(SUM(
    CASE 
      WHEN spp.tier_price > 0 THEN spp.tier_price
      ELSE p.unit_price
    END
  ), 0) AS base_price,
  -- Calculate final price after discount
  COALESCE(SUM(
    CASE 
      WHEN spp.tier_price > 0 THEN spp.tier_price
      ELSE p.unit_price
    END
  ), 0) * (1 - sp.discount_percentage / 100) AS final_price,
  -- Count of included products
  COUNT(spp.id) FILTER (WHERE spp.is_included = true) AS product_count
FROM public.subscription_plans sp
LEFT JOIN public.subscription_plan_products spp ON sp.id = spp.plan_id AND spp.is_included = true
LEFT JOIN public.products p ON spp.product_id = p.id AND p.is_active = true
GROUP BY sp.id, sp.name, sp.description, sp.discount_percentage, sp.trial_days, 
         sp.features, sp.is_active, sp.created_by, sp.created_at, sp.updated_at;

COMMENT ON VIEW public.subscription_plans_with_pricing IS 'Subscription plans with calculated pricing based on included products and discount percentage';

