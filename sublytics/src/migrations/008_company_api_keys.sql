-- ============================================================
-- Company API Keys for V1 API Authentication
-- ============================================================

CREATE TABLE IF NOT EXISTS public.company_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL UNIQUE,
  company_secret TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_api_keys_company_id
  ON public.company_api_keys USING btree (company_id);

CREATE TRIGGER set_updated_at_company_api_keys
  BEFORE UPDATE ON public.company_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
