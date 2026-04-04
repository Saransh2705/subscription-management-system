-- ============================================================
-- 016: Add Payment Callback URLs to System Settings
-- Adds payment gateway configuration and callback URLs
-- ============================================================

-- Add payment callback columns to system_settings
ALTER TABLE public.system_settings
ADD COLUMN IF NOT EXISTS payment_success_url TEXT,
ADD COLUMN IF NOT EXISTS payment_failure_url TEXT,
ADD COLUMN IF NOT EXISTS payment_gateway_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_gateway_name TEXT,
ADD COLUMN IF NOT EXISTS payment_gateway_api_key TEXT,
ADD COLUMN IF NOT EXISTS payment_gateway_secret_key TEXT;

-- Update existing record with default values (if needed)
UPDATE public.system_settings
SET 
  payment_success_url = COALESCE(payment_success_url, 'http://localhost:3000/payment/success'),
  payment_failure_url = COALESCE(payment_failure_url, 'http://localhost:3000/payment/failure'),
  payment_gateway_enabled = COALESCE(payment_gateway_enabled, false)
WHERE id = '00000000-0000-0000-0000-000000000001'::UUID;

-- Add payment_session_id to subscriptions table to track payment
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS payment_session_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS payment_currency TEXT DEFAULT 'USD';

-- Create index for payment lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_session 
  ON public.subscriptions(payment_session_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_status 
  ON public.subscriptions(payment_status);

COMMENT ON COLUMN public.system_settings.payment_success_url IS 'URL to redirect users after successful payment';
COMMENT ON COLUMN public.system_settings.payment_failure_url IS 'URL to redirect users after failed payment';
COMMENT ON COLUMN public.system_settings.payment_gateway_enabled IS 'Whether payment gateway is enabled';
COMMENT ON COLUMN public.subscriptions.payment_session_id IS 'External payment gateway session ID';
COMMENT ON COLUMN public.subscriptions.payment_status IS 'Payment status: pending, completed, failed';
