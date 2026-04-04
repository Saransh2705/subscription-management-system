-- ============================================================
-- Sublytics - Add SYSTEM_ADMIN Role - STEP 1
-- Migration 003a - Run this FIRST
-- ============================================================

-- Add SYSTEM_ADMIN to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SYSTEM_ADMIN';

-- Update the comment to document the role
COMMENT ON TYPE user_role IS 'User roles: SYSTEM_ADMIN (super admin), ADMIN, MANAGER, STAFF, VIEWER';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'STEP 1 Complete: SYSTEM_ADMIN enum value added';
  RAISE NOTICE 'Now run migration 003b_system_admin_step2.sql';
END $$;
