-- ============================================================
-- 011: System Settings & Currency ROE Management
-- Adds company settings and rate of exchange management
-- ============================================================

-- ============================================================
-- 1. SYSTEM SETTINGS TABLE
--    Stores global company/system configuration
-- ============================================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  company_email TEXT NOT NULL,
  company_phone TEXT,
  company_address TEXT,
  company_city TEXT,
  company_country TEXT,
  company_logo_url TEXT,
  system_currency_code TEXT NOT NULL DEFAULT 'USD',
  invoice_footer_text TEXT,
  invoice_notes TEXT,
  tax_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_settings_row CHECK (id = '00000000-0000-0000-0000-000000000001'::UUID)
);

-- Ensure only one row exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_system_settings_single_row 
  ON public.system_settings(id);

-- ============================================================
-- 2. CURRENCY ROE (RATE OF EXCHANGE) TABLE
--    Maps foreign currencies to system currency
-- ============================================================

CREATE TABLE IF NOT EXISTS public.currency_roe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_code TEXT NOT NULL UNIQUE,
  currency_name TEXT NOT NULL,
  roe_rate NUMERIC(18, 6) NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_currency_code CHECK (LENGTH(currency_code) = 3),
  CONSTRAINT positive_roe_rate CHECK (roe_rate > 0)
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_currency_roe_is_active 
  ON public.currency_roe(is_active);
  
CREATE INDEX IF NOT EXISTS idx_currency_roe_currency_code 
  ON public.currency_roe(currency_code);

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

CREATE TRIGGER set_updated_at_system_settings
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_currency_roe
  BEFORE UPDATE ON public.currency_roe
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currency_roe ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role has full access to system_settings"
  ON public.system_settings FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to currency_roe"
  ON public.currency_roe FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- All authenticated users can view settings
CREATE POLICY "Authenticated users can view system_settings"
  ON public.system_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Authenticated users can view currency_roe"
  ON public.currency_roe FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Only admins can modify settings
CREATE POLICY "Admins can manage system_settings"
  ON public.system_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
        AND role IN ('SYSTEM_ADMIN', 'ADMIN') 
        AND is_active = true
    )
  );

CREATE POLICY "Admins can manage currency_roe"
  ON public.currency_roe FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
        AND role IN ('SYSTEM_ADMIN', 'ADMIN') 
        AND is_active = true
    )
  );

-- ============================================================
-- 6. SEED DATA
-- ============================================================

-- Insert default system settings
INSERT INTO public.system_settings (
  id,
  company_name,
  company_email,
  company_phone,
  company_address,
  company_city,
  company_country,
  system_currency_code,
  invoice_footer_text,
  invoice_notes
) VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'Sublytics AI Studio',
  'hello@sublytics.io',
  '+1-415-555-0100',
  '123 SaaS Street',
  'San Francisco',
  'US',
  'USD',
  'Thank you for your business!',
  'Payment is due within 30 days. Late payments may incur a 1.5% monthly fee.'
) ON CONFLICT (id) DO NOTHING;

-- Insert common currencies with ROE rates (1 foreign currency = X USD)
INSERT INTO public.currency_roe (currency_code, currency_name, roe_rate, is_active, notes) VALUES
('EUR', 'Euro', 1.08, true, 'European Union currency'),
('GBP', 'British Pound', 1.27, true, 'United Kingdom currency'),
('JPY', 'Japanese Yen', 0.0067, true, 'Japan currency'),
('INR', 'Indian Rupee', 0.012, true, 'India currency'),
('CAD', 'Canadian Dollar', 0.74, true, 'Canada currency'),
('AUD', 'Australian Dollar', 0.66, true, 'Australia currency'),
('CHF', 'Swiss Franc', 1.14, true, 'Switzerland currency'),
('CNY', 'Chinese Yuan', 0.14, true, 'China currency'),
('SGD', 'Singapore Dollar', 0.75, true, 'Singapore currency'),
('AED', 'UAE Dirham', 0.27, true, 'United Arab Emirates currency')
ON CONFLICT (currency_code) DO NOTHING;

-- ============================================================
-- 7. HELPER VIEW: Available Currencies for Selection
-- ============================================================

CREATE OR REPLACE VIEW public.available_currencies AS
SELECT 
  system_currency_code AS currency_code,
  'System Currency' AS currency_name,
  1.0 AS roe_rate,
  true AS is_system_currency
FROM public.system_settings
UNION ALL
SELECT 
  currency_code,
  currency_name,
  roe_rate,
  false AS is_system_currency
FROM public.currency_roe
WHERE is_active = true
ORDER BY is_system_currency DESC, currency_code ASC;

-- ============================================================
-- 8. HELPER FUNCTION: Convert to System Currency
-- ============================================================

CREATE OR REPLACE FUNCTION public.convert_to_system_currency(
  amount NUMERIC,
  from_currency TEXT
) RETURNS NUMERIC AS $$
DECLARE
  system_currency TEXT;
  roe NUMERIC;
  converted_amount NUMERIC;
BEGIN
  -- Get system currency
  SELECT system_currency_code INTO system_currency
  FROM public.system_settings
  LIMIT 1;
  
  -- If already in system currency, no conversion needed
  IF from_currency = system_currency THEN
    RETURN amount;
  END IF;
  
  -- Get ROE rate
  SELECT roe_rate INTO roe
  FROM public.currency_roe
  WHERE currency_code = from_currency AND is_active = true;
  
  IF roe IS NULL THEN
    RAISE EXCEPTION 'Currency % not found or inactive', from_currency;
  END IF;
  
  -- Convert: amount * roe_rate = amount in system currency
  converted_amount := amount * roe;
  
  RETURN converted_amount;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 9. HELPER FUNCTION: Convert from System Currency
-- ============================================================

CREATE OR REPLACE FUNCTION public.convert_from_system_currency(
  amount NUMERIC,
  to_currency TEXT
) RETURNS NUMERIC AS $$
DECLARE
  system_currency TEXT;
  roe NUMERIC;
  converted_amount NUMERIC;
BEGIN
  -- Get system currency
  SELECT system_currency_code INTO system_currency
  FROM public.system_settings
  LIMIT 1;
  
  -- If already in system currency, no conversion needed
  IF to_currency = system_currency THEN
    RETURN amount;
  END IF;
  
  -- Get ROE rate
  SELECT roe_rate INTO roe
  FROM public.currency_roe
  WHERE currency_code = to_currency AND is_active = true;
  
  IF roe IS NULL THEN
    RAISE EXCEPTION 'Currency % not found or inactive', to_currency;
  END IF;
  
  -- Convert: amount / roe_rate = amount in target currency
  converted_amount := amount / roe;
  
  RETURN converted_amount;
END;
$$ LANGUAGE plpgsql STABLE;
