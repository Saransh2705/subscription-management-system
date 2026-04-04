-- ============================================================
-- Product-Plan Pricing Tiers
-- This allows products to have different prices in different subscription plans
-- ============================================================

-- ============================================================
-- SUBSCRIPTION PLAN PRODUCTS (Junction table for tiered pricing)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.subscription_plan_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tier_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  is_included BOOLEAN NOT NULL DEFAULT true,
  quantity_limit INTEGER,
  notes TEXT,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plan_id, product_id)
);

-- ============================================================
-- SUBSCRIPTION PRODUCTS (Tracks which products are in a subscription)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.subscription_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  plan_product_id UUID REFERENCES public.subscription_plan_products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL,
  total_price NUMERIC(12, 2) NOT NULL GENERATED ALWAYS AS (quantity * unit_price) STORED,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_subscription_plan_products_plan_id ON public.subscription_plan_products(plan_id);
CREATE INDEX idx_subscription_plan_products_product_id ON public.subscription_plan_products(product_id);
CREATE INDEX idx_subscription_products_subscription_id ON public.subscription_products(subscription_id);
CREATE INDEX idx_subscription_products_product_id ON public.subscription_products(product_id);
CREATE INDEX idx_subscription_products_is_active ON public.subscription_products(is_active);

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER set_updated_at_subscription_plan_products
  BEFORE UPDATE ON public.subscription_plan_products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_subscription_products
  BEFORE UPDATE ON public.subscription_products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.subscription_plan_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_products ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role has full access to subscription_plan_products"
  ON public.subscription_plan_products
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to subscription_products"
  ON public.subscription_products
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Active users can view
CREATE POLICY "Active users can view subscription_plan_products"
  ON public.subscription_plan_products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Active users can view subscription_products"
  ON public.subscription_products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Managers and admins can manage
CREATE POLICY "Managers and admins can insert subscription_plan_products"
  ON public.subscription_plan_products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('MANAGER', 'ADMIN') AND is_active = true
    )
  );

CREATE POLICY "Managers and admins can update subscription_plan_products"
  ON public.subscription_plan_products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('MANAGER', 'ADMIN') AND is_active = true
    )
  );

CREATE POLICY "Managers and admins can delete subscription_plan_products"
  ON public.subscription_plan_products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('MANAGER', 'ADMIN') AND is_active = true
    )
  );

CREATE POLICY "Managers and admins can insert subscription_products"
  ON public.subscription_products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('MANAGER', 'ADMIN') AND is_active = true
    )
  );

CREATE POLICY "Managers and admins can update subscription_products"
  ON public.subscription_products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('MANAGER', 'ADMIN') AND is_active = true
    )
  );

CREATE POLICY "Managers and admins can delete subscription_products"
  ON public.subscription_products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('MANAGER', 'ADMIN') AND is_active = true
    )
  );

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to calculate total subscription price including products
CREATE OR REPLACE FUNCTION calculate_subscription_total(subscription_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  plan_price NUMERIC;
  products_total NUMERIC;
  discount_percent NUMERIC;
  final_total NUMERIC;
BEGIN
  -- Get plan base price
  SELECT sp.price INTO plan_price
  FROM public.subscriptions s
  JOIN public.subscription_plans sp ON s.plan_id = sp.id
  WHERE s.id = subscription_uuid;

  -- Get total of all active products
  SELECT COALESCE(SUM(total_price), 0) INTO products_total
  FROM public.subscription_products
  WHERE subscription_id = subscription_uuid AND is_active = true;

  -- Get discount
  SELECT s.discount_percent INTO discount_percent
  FROM public.subscriptions s
  WHERE s.id = subscription_uuid;

  -- Calculate final total
  final_total := (plan_price + products_total) * (1 - discount_percent / 100);

  RETURN final_total;
END;
$$ LANGUAGE plpgsql;
