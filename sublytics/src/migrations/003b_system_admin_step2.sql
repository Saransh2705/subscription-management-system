-- ============================================================
-- Sublytics - Add SYSTEM_ADMIN Role - STEP 2
-- Migration 003b - Run this AFTER 003a
-- ============================================================

-- Function to check if current user is system admin
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'SYSTEM_ADMIN' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing is_admin function to include SYSTEM_ADMIN
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() 
    AND role IN ('ADMIN', 'SYSTEM_ADMIN') 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update is_manager_or_admin to include SYSTEM_ADMIN
CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() 
    AND role IN ('ADMIN', 'MANAGER', 'SYSTEM_ADMIN') 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add policies for SYSTEM_ADMIN (highest priority)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "System admin can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "System admin can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "System admin can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "System admin can delete profiles" ON public.user_profiles;

-- SYSTEM_ADMIN can view all profiles
CREATE POLICY "System admin can view all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (is_system_admin());

-- SYSTEM_ADMIN can update all profiles
CREATE POLICY "System admin can update all profiles"
  ON public.user_profiles
  FOR UPDATE
  USING (is_system_admin());

-- SYSTEM_ADMIN can insert profiles
CREATE POLICY "System admin can insert profiles"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (is_system_admin());

-- SYSTEM_ADMIN can delete profiles
CREATE POLICY "System admin can delete profiles"
  ON public.user_profiles
  FOR DELETE
  USING (is_system_admin());

-- Manually update the first admin user to SYSTEM_ADMIN
-- Replace 'admin@sublytics.com' with your actual admin email
UPDATE public.user_profiles 
SET role = 'SYSTEM_ADMIN' 
WHERE email = 'admin@sublytics.com' 
AND role = 'ADMIN';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'STEP 2 Complete: SYSTEM_ADMIN role fully configured';
  RAISE NOTICE 'Updated admin@sublytics.com to SYSTEM_ADMIN (if exists)';
  RAISE NOTICE 'Remember: SYSTEM_ADMIN role can only be set manually in database';
END $$;
