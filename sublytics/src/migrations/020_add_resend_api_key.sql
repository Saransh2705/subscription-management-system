-- ============================================================
-- 020: Add Resend API Key to System Settings
-- Store Resend API key in database (use existing company_name and company_email for sender)
-- ============================================================

-- Add resend_api_key column to system_settings
ALTER TABLE public.system_settings
ADD COLUMN IF NOT EXISTS resend_api_key TEXT;

-- Add comment
COMMENT ON COLUMN public.system_settings.resend_api_key IS 'Resend API key for sending emails (use company_email as sender)';
