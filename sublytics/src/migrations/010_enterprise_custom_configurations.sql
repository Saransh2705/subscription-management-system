-- ============================================================
-- 010: Enterprise Custom Product Configurations
-- Allows Enterprise plan subscribers to manually select products
-- with custom discounts and a unique configuration ID
-- ============================================================

-- ============================================================
-- 1. ENTERPRISE CONFIGURATIONS TABLE
--    Stores unique configuration per enterprise subscription
-- ============================================================

CREATE TABLE IF NOT EXISTS public.enterprise_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  configuration_code TEXT NOT NULL UNIQUE DEFAULT ('ENT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 12))),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  min_products_required INTEGER NOT NULL DEFAULT 5,
  base_discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 25.00,
  monthly_payment_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  billing_day INTEGER NOT NULL DEFAULT 1 CHECK (billing_day >= 1 AND billing_day <= 28),
  notes TEXT,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  UNIQUE(subscription_id)
);

-- ============================================================
-- 2. ENTERPRISE CONFIGURATION PRODUCTS
--    Junction table for selected products in enterprise config
-- ============================================================

CREATE TABLE IF NOT EXISTS public.enterprise_configuration_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES public.enterprise_configurations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  base_unit_price NUMERIC(12, 2) NOT NULL,
  discount_type public.discount_type NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  final_unit_price NUMERIC(12, 2) NOT NULL,
  total_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(config_id, product_id)
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX idx_enterprise_configurations_subscription_id 
  ON public.enterprise_configurations(subscription_id);
CREATE INDEX idx_enterprise_configurations_status 
  ON public.enterprise_configurations(status);
CREATE INDEX idx_enterprise_configurations_code 
  ON public.enterprise_configurations(configuration_code);
CREATE INDEX idx_enterprise_config_products_config_id 
  ON public.enterprise_configuration_products(config_id);
CREATE INDEX idx_enterprise_config_products_product_id 
  ON public.enterprise_configuration_products(product_id);

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

CREATE TRIGGER set_updated_at_enterprise_configurations
  BEFORE UPDATE ON public.enterprise_configurations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_enterprise_config_products
  BEFORE UPDATE ON public.enterprise_configuration_products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 5. FUNCTION: Auto-compute enterprise product pricing
-- ============================================================

CREATE OR REPLACE FUNCTION public.compute_enterprise_product_pricing()
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
    discounted_price := NEW.base_unit_price * (1 - NEW.discount_value / 100);
  ELSE
    discounted_price := GREATEST(NEW.base_unit_price - NEW.discount_value, 0);
  END IF;

  -- Set final unit price
  NEW.final_unit_price := discounted_price;

  -- Set total price = quantity * final_unit_price * (1 + tax)
  NEW.total_price := NEW.quantity * discounted_price * (1 + COALESCE(product_tax, 0) / 100);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_enterprise_product_pricing ON public.enterprise_configuration_products;

CREATE TRIGGER trg_compute_enterprise_product_pricing
  BEFORE INSERT OR UPDATE ON public.enterprise_configuration_products
  FOR EACH ROW EXECUTE FUNCTION public.compute_enterprise_product_pricing();

-- ============================================================
-- 6. FUNCTION: Calculate total monthly payment for enterprise config
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_enterprise_monthly_payment(config_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  products_total NUMERIC;
  config_base_discount NUMERIC;
  subscription_discount_type public.discount_type;
  subscription_discount_value NUMERIC;
  gross_total NUMERIC;
  final_total NUMERIC;
BEGIN
  -- Get sum of all products in configuration
  SELECT COALESCE(SUM(total_price), 0) INTO products_total
  FROM public.enterprise_configuration_products
  WHERE config_id = config_uuid;

  -- Get configuration base discount
  SELECT base_discount_percent INTO config_base_discount
  FROM public.enterprise_configurations
  WHERE id = config_uuid;

  -- Apply configuration-level discount to products total
  gross_total := products_total * (1 - COALESCE(config_base_discount, 0) / 100);

  -- Get subscription-level discount (if any)
  SELECT s.subscription_discount_type, s.subscription_discount_value
  INTO subscription_discount_type, subscription_discount_value
  FROM public.enterprise_configurations ec
  JOIN public.subscriptions s ON ec.subscription_id = s.id
  WHERE ec.id = config_uuid;

  -- Apply subscription-level discount
  IF subscription_discount_type = 'percentage' THEN
    final_total := gross_total * (1 - COALESCE(subscription_discount_value, 0) / 100);
  ELSE
    final_total := GREATEST(gross_total - COALESCE(subscription_discount_value, 0), 0);
  END IF;

  RETURN final_total;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. FUNCTION: Auto-update monthly payment amount when products change
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_enterprise_monthly_payment()
RETURNS TRIGGER AS $$
DECLARE
  config_uuid UUID;
  new_monthly_amount NUMERIC;
BEGIN
  -- Get the config_id (works for both INSERT/UPDATE/DELETE)
  IF TG_OP = 'DELETE' THEN
    config_uuid := OLD.config_id;
  ELSE
    config_uuid := NEW.config_id;
  END IF;

  -- Calculate new monthly payment
  new_monthly_amount := calculate_enterprise_monthly_payment(config_uuid);

  -- Update the configuration
  UPDATE public.enterprise_configurations
  SET monthly_payment_amount = new_monthly_amount
  WHERE id = config_uuid;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_enterprise_monthly_payment ON public.enterprise_configuration_products;

CREATE TRIGGER trg_update_enterprise_monthly_payment
  AFTER INSERT OR UPDATE OR DELETE ON public.enterprise_configuration_products
  FOR EACH ROW EXECUTE FUNCTION public.update_enterprise_monthly_payment();

-- ============================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.enterprise_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_configuration_products ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role has full access to enterprise_configurations"
  ON public.enterprise_configurations FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to enterprise_configuration_products"
  ON public.enterprise_configuration_products FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Active users can view
CREATE POLICY "Active users can view enterprise_configurations"
  ON public.enterprise_configurations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Active users can view enterprise_configuration_products"
  ON public.enterprise_configuration_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Managers and admins can manage
CREATE POLICY "Managers and admins can manage enterprise_configurations"
  ON public.enterprise_configurations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('MANAGER', 'ADMIN', 'SYSTEM_ADMIN') AND is_active = true
    )
  );

CREATE POLICY "Managers and admins can manage enterprise_configuration_products"
  ON public.enterprise_configuration_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role IN ('MANAGER', 'ADMIN', 'SYSTEM_ADMIN') AND is_active = true
    )
  );

-- ============================================================
-- 9. VIEW: Enterprise configurations with details
-- ============================================================

CREATE OR REPLACE VIEW public.enterprise_configurations_detailed AS
SELECT
  ec.id,
  ec.subscription_id,
  ec.configuration_code,
  ec.status,
  ec.min_products_required,
  ec.base_discount_percent,
  ec.monthly_payment_amount,
  ec.billing_day,
  ec.notes,
  ec.created_by,
  ec.created_at,
  ec.updated_at,
  ec.activated_at,
  -- Subscription info
  s.customer_id,
  s.plan_id,
  s.status AS subscription_status,
  -- Customer info
  c.name AS customer_name,
  c.email AS customer_email,
  c.company AS customer_company,
  -- Plan info
  sp.name AS plan_name,
  -- Product counts
  (SELECT COUNT(*) FROM public.enterprise_configuration_products WHERE config_id = ec.id) AS total_products_selected,
  -- Totals
  (SELECT SUM(total_price) FROM public.enterprise_configuration_products WHERE config_id = ec.id) AS products_subtotal
FROM public.enterprise_configurations ec
JOIN public.subscriptions s ON ec.subscription_id = s.id
JOIN public.customers c ON s.customer_id = c.id
JOIN public.subscription_plans sp ON s.plan_id = sp.id;

-- =====================================================
-- 10. SEED DATA: Enterprise Configurations
-- =====================================================
-- Note: Enterprise plans use custom configurations instead of fixed product bundles

-- TechFlow Solutions - Active Enterprise Configuration (8 products)
INSERT INTO public.enterprise_configurations (
  subscription_id,
  configuration_code,
  status,
  min_products_required,
  base_discount_percent,
  billing_day,
  activated_at
)
SELECT 
  s.id,
  'ENT-TF' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 10, '0'),
  'active',
  5,
  25.00,
  15,
  NOW() - INTERVAL '30 days'
FROM public.subscriptions s
JOIN public.customers c ON s.customer_id = c.id
WHERE c.email = 'billing@techflow.io';

-- TechFlow Configuration Products (8 products across categories)
-- AI Code Assistant
INSERT INTO public.enterprise_configuration_products (config_id, product_id, quantity, base_unit_price, discount_type, discount_value)
SELECT ec.id, p.id, 15, p.unit_price, 'percentage', 10.00
FROM public.enterprise_configurations ec
JOIN public.subscriptions s ON ec.subscription_id = s.id
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'billing@techflow.io' AND p.sku = 'AI-COD-023';

-- Automated Testing Suite
INSERT INTO public.enterprise_configuration_products (config_id, product_id, quantity, base_unit_price, discount_type, discount_value)
SELECT ec.id, p.id, 15, p.unit_price, 'percentage', 10.00
FROM public.enterprise_configurations ec
JOIN public.subscriptions s ON ec.subscription_id = s.id
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'billing@techflow.io' AND p.sku = 'AI-TST-024';

-- Predictive Analytics
INSERT INTO public.enterprise_configuration_products (config_id, product_id, quantity, base_unit_price, discount_type, discount_value)
SELECT ec.id, p.id, 10, p.unit_price, 'percentage', 8.00
FROM public.enterprise_configurations ec
JOIN public.subscriptions s ON ec.subscription_id = s.id
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'billing@techflow.io' AND p.sku = 'AI-PAN-019';

-- Smart Documentation
INSERT INTO public.enterprise_configuration_products (config_id, product_id, quantity, base_unit_price, discount_type, discount_value)
SELECT ec.id, p.id, 20, p.unit_price, 'value', 5.00
FROM public.enterprise_configurations ec
JOIN public.subscriptions s ON ec.subscription_id = s.id
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'billing@techflow.io' AND p.sku = 'AI-DOC-025';

-- AI Chatbot Platform
INSERT INTO public.enterprise_configuration_products (config_id, product_id, quantity, base_unit_price, discount_type, discount_value)
SELECT ec.id, p.id, 5, p.unit_price, 'percentage', 12.00
FROM public.enterprise_configurations ec
JOIN public.subscriptions s ON ec.subscription_id = s.id
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'billing@techflow.io' AND p.sku = 'AI-CHT-005';

-- Sentiment Analyzer
INSERT INTO public.enterprise_configuration_products (config_id, product_id, quantity, base_unit_price, discount_type, discount_value)
SELECT ec.id, p.id, 8, p.unit_price, 'percentage', 5.00
FROM public.enterprise_configurations ec
JOIN public.subscriptions s ON ec.subscription_id = s.id
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'billing@techflow.io' AND p.sku = 'AI-SNT-004';

-- Speech to Text
INSERT INTO public.enterprise_configuration_products (config_id, product_id, quantity, base_unit_price, discount_type, discount_value)
SELECT ec.id, p.id, 12, p.unit_price, 'value', 8.00
FROM public.enterprise_configurations ec
JOIN public.subscriptions s ON ec.subscription_id = s.id
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'billing@techflow.io' AND p.sku = 'AI-STT-011';

-- Email Composer AI
INSERT INTO public.enterprise_configuration_products (config_id, product_id, quantity, base_unit_price, discount_type, discount_value)
SELECT ec.id, p.id, 25, p.unit_price, 'percentage', 15.00
FROM public.enterprise_configurations ec
JOIN public.subscriptions s ON ec.subscription_id = s.id
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'billing@techflow.io' AND p.sku = 'AI-EML-026';

-- SecureInsight Corp - Draft Enterprise Configuration (6 products)
INSERT INTO public.enterprise_configurations (
  subscription_id,
  configuration_code,
  status,
  min_products_required,
  base_discount_percent,
  billing_day
)
SELECT 
  s.id,
  'ENT-SI' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 10, '0'),
  'draft',
  5,
  25.00,
  1
FROM public.subscriptions s
JOIN public.customers c ON s.customer_id = c.id
WHERE c.email = 'procurement@secureinsight.net';

-- SecureInsight Configuration Products (6 products - security focused)
-- Anomaly Detection
INSERT INTO public.enterprise_configuration_products (config_id, product_id, quantity, base_unit_price, discount_type, discount_value)
SELECT ec.id, p.id, 10, p.unit_price, 'percentage', 20.00
FROM public.enterprise_configurations ec
JOIN public.subscriptions s ON ec.subscription_id = s.id
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'procurement@secureinsight.net' AND p.sku = 'AI-ANM-021';

-- Deepfake Detector
INSERT INTO public.enterprise_configuration_products (config_id, product_id, quantity, base_unit_price, discount_type, discount_value)
SELECT ec.id, p.id, 8, p.unit_price, 'percentage', 18.00
FROM public.enterprise_configurations ec
JOIN public.subscriptions s ON ec.subscription_id = s.id
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'procurement@secureinsight.net' AND p.sku = 'AI-DFD-017';

-- Smart Recommendations (for user behavior analysis)
INSERT INTO public.enterprise_configuration_products (config_id, product_id, quantity, base_unit_price, discount_type, discount_value)
SELECT ec.id, p.id, 5, p.unit_price, 'percentage', 10.00
FROM public.enterprise_configurations ec
JOIN public.subscriptions s ON ec.subscription_id = s.id
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'procurement@secureinsight.net' AND p.sku = 'AI-REC-022';

-- OCR Engine (document verification)
INSERT INTO public.enterprise_configuration_products (config_id, product_id, quantity, base_unit_price, discount_type, discount_value)
SELECT ec.id, p.id, 15, p.unit_price, 'value', 5.00
FROM public.enterprise_configurations ec
JOIN public.subscriptions s ON ec.subscription_id = s.id
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'procurement@secureinsight.net' AND p.sku = 'AI-OCR-010';

-- Data Classification (sensitive data handling)
INSERT INTO public.enterprise_configuration_products (config_id, product_id, quantity, base_unit_price, discount_type, discount_value)
SELECT ec.id, p.id, 12, p.unit_price, 'percentage', 12.00
FROM public.enterprise_configurations ec
JOIN public.subscriptions s ON ec.subscription_id = s.id
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'procurement@secureinsight.net' AND p.sku = 'AI-DCL-020';

-- Legal Document Analyzer (compliance)
INSERT INTO public.enterprise_configuration_products (config_id, product_id, quantity, base_unit_price, discount_type, discount_value)
SELECT ec.id, p.id, 6, p.unit_price, 'percentage', 15.00
FROM public.enterprise_configurations ec
JOIN public.subscriptions s ON ec.subscription_id = s.id
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'procurement@secureinsight.net' AND p.sku = 'AI-LGL-028';
