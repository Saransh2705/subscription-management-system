-- ============================================================
-- 002: Add Customer Integration Fields
-- Links staff users to customers in the main Sublytics API
-- ============================================================

-- Add customer integration fields to staff_users
ALTER TABLE public.staff_users
ADD COLUMN IF NOT EXISTS customer_id UUID,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_synced_at TIMESTAMPTZ;

-- Add comments
COMMENT ON COLUMN public.staff_users.customer_id IS 'Customer ID from main Sublytics API';
COMMENT ON COLUMN public.staff_users.customer_email IS 'Email used to create the customer';
COMMENT ON COLUMN public.staff_users.customer_synced_at IS 'Last time customer was synced with main API';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_staff_users_customer_id 
  ON public.staff_users(customer_id);
