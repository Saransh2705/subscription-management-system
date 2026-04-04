-- ============================================================
-- Seed ROE (Rate of Exchange) Data
-- Migration: 015
-- ============================================================

-- Insert or update system settings with default system currency
INSERT INTO public.system_settings (
  id,
  company_name,
  company_email,
  company_phone,
  company_address,
  company_city,
  company_country,
  system_currency_code,
  invoice_footer_text
) VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'Sublytics Inc.',
  'support@sublytics.io',
  '+1-555-0100',
  '123 Business Ave',
  'San Francisco',
  'USA',
  'USD',
  'Thank you for your business!'
)
ON CONFLICT (id) 
DO UPDATE SET
  system_currency_code = EXCLUDED.system_currency_code,
  updated_at = NOW();

-- ============================================================
-- Insert common currency ROE rates
-- Rates are relative to USD (system currency)
-- ============================================================

-- Euro
INSERT INTO public.currency_roe (currency_code, currency_name, roe_rate, is_active, notes)
VALUES ('EUR', 'Euro', 0.92, true, 'European Union currency')
ON CONFLICT (currency_code) 
DO UPDATE SET
  roe_rate = EXCLUDED.roe_rate,
  currency_name = EXCLUDED.currency_name,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- British Pound
INSERT INTO public.currency_roe (currency_code, currency_name, roe_rate, is_active, notes)
VALUES ('GBP', 'British Pound Sterling', 0.79, true, 'United Kingdom currency')
ON CONFLICT (currency_code) 
DO UPDATE SET
  roe_rate = EXCLUDED.roe_rate,
  currency_name = EXCLUDED.currency_name,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Japanese Yen
INSERT INTO public.currency_roe (currency_code, currency_name, roe_rate, is_active, notes)
VALUES ('JPY', 'Japanese Yen', 149.50, true, 'Japan currency')
ON CONFLICT (currency_code) 
DO UPDATE SET
  roe_rate = EXCLUDED.roe_rate,
  currency_name = EXCLUDED.currency_name,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Canadian Dollar
INSERT INTO public.currency_roe (currency_code, currency_name, roe_rate, is_active, notes)
VALUES ('CAD', 'Canadian Dollar', 1.36, true, 'Canada currency')
ON CONFLICT (currency_code) 
DO UPDATE SET
  roe_rate = EXCLUDED.roe_rate,
  currency_name = EXCLUDED.currency_name,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Australian Dollar
INSERT INTO public.currency_roe (currency_code, currency_name, roe_rate, is_active, notes)
VALUES ('AUD', 'Australian Dollar', 1.52, true, 'Australia currency')
ON CONFLICT (currency_code) 
DO UPDATE SET
  roe_rate = EXCLUDED.roe_rate,
  currency_name = EXCLUDED.currency_name,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Swiss Franc
INSERT INTO public.currency_roe (currency_code, currency_name, roe_rate, is_active, notes)
VALUES ('CHF', 'Swiss Franc', 0.88, true, 'Switzerland currency')
ON CONFLICT (currency_code) 
DO UPDATE SET
  roe_rate = EXCLUDED.roe_rate,
  currency_name = EXCLUDED.currency_name,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Chinese Yuan
INSERT INTO public.currency_roe (currency_code, currency_name, roe_rate, is_active, notes)
VALUES ('CNY', 'Chinese Yuan', 7.24, true, 'China currency')
ON CONFLICT (currency_code) 
DO UPDATE SET
  roe_rate = EXCLUDED.roe_rate,
  currency_name = EXCLUDED.currency_name,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Indian Rupee
INSERT INTO public.currency_roe (currency_code, currency_name, roe_rate, is_active, notes)
VALUES ('INR', 'Indian Rupee', 83.12, true, 'India currency')
ON CONFLICT (currency_code) 
DO UPDATE SET
  roe_rate = EXCLUDED.roe_rate,
  currency_name = EXCLUDED.currency_name,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Singapore Dollar
INSERT INTO public.currency_roe (currency_code, currency_name, roe_rate, is_active, notes)
VALUES ('SGD', 'Singapore Dollar', 1.34, true, 'Singapore currency')
ON CONFLICT (currency_code) 
DO UPDATE SET
  roe_rate = EXCLUDED.roe_rate,
  currency_name = EXCLUDED.currency_name,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Hong Kong Dollar
INSERT INTO public.currency_roe (currency_code, currency_name, roe_rate, is_active, notes)
VALUES ('HKD', 'Hong Kong Dollar', 7.82, true, 'Hong Kong currency')
ON CONFLICT (currency_code) 
DO UPDATE SET
  roe_rate = EXCLUDED.roe_rate,
  currency_name = EXCLUDED.currency_name,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Mexican Peso
INSERT INTO public.currency_roe (currency_code, currency_name, roe_rate, is_active, notes)
VALUES ('MXN', 'Mexican Peso', 17.05, true, 'Mexico currency')
ON CONFLICT (currency_code) 
DO UPDATE SET
  roe_rate = EXCLUDED.roe_rate,
  currency_name = EXCLUDED.currency_name,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Brazilian Real
INSERT INTO public.currency_roe (currency_code, currency_name, roe_rate, is_active, notes)
VALUES ('BRL', 'Brazilian Real', 4.97, true, 'Brazil currency')
ON CONFLICT (currency_code) 
DO UPDATE SET
  roe_rate = EXCLUDED.roe_rate,
  currency_name = EXCLUDED.currency_name,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
