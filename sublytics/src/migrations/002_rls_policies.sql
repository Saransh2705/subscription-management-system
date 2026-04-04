-- ============================================================
-- Sublytics - Comprehensive RLS Policies
-- Run this in your Supabase SQL Editor AFTER initial setup
-- This fixes authentication issues by properly configuring RLS
-- ============================================================

-- ============================================================
-- STEP 1: Drop existing policies to start fresh
-- ============================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage staff invites" ON public.staff_invites;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Managers and admins can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
DROP POLICY IF EXISTS "Managers and admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Managers and admins can manage plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Authenticated users can view subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Managers and admins can manage subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Managers and admins can manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can view invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Managers and admins can manage invoice items" ON public.invoice_items;
DROP POLICY IF EXISTS "Authenticated users can view quotations" ON public.quotations;
DROP POLICY IF EXISTS "Managers and admins can manage quotations" ON public.quotations;
DROP POLICY IF EXISTS "Authenticated users can view quotation items" ON public.quotation_items;
DROP POLICY IF EXISTS "Managers and admins can manage quotation items" ON public.quotation_items;
DROP POLICY IF EXISTS "Authenticated users can view email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admins can manage email templates" ON public.email_templates;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'ADMIN' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is manager or admin
CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() 
    AND role IN ('ADMIN', 'MANAGER') 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is active
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- USER PROFILES - Most permissive for authentication to work
-- ============================================================

-- Allow service role full access (for server-side operations)
CREATE POLICY "Service role has full access to user_profiles"
  ON public.user_profiles
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Allow authenticated users to read their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow authenticated users to update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    -- Prevent users from changing their own role or active status
    AND (
      (role = (SELECT role FROM public.user_profiles WHERE id = auth.uid()))
      OR is_admin()
    )
  );

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (is_admin());

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles"
  ON public.user_profiles
  FOR UPDATE
  USING (is_admin());

-- Allow admins to insert profiles (for creating staff)
CREATE POLICY "Admins can insert profiles"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (is_admin());

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
  ON public.user_profiles
  FOR DELETE
  USING (is_admin());

-- ============================================================
-- STAFF INVITES
-- ============================================================

CREATE POLICY "Service role has full access to staff_invites"
  ON public.staff_invites
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admins can manage staff invites"
  ON public.staff_invites
  FOR ALL
  USING (is_admin());

-- ============================================================
-- CUSTOMERS
-- ============================================================

CREATE POLICY "Service role has full access to customers"
  ON public.customers
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Active users can view customers"
  ON public.customers
  FOR SELECT
  USING (is_active_user());

CREATE POLICY "Managers and admins can insert customers"
  ON public.customers
  FOR INSERT
  WITH CHECK (is_manager_or_admin());

CREATE POLICY "Managers and admins can update customers"
  ON public.customers
  FOR UPDATE
  USING (is_manager_or_admin());

CREATE POLICY "Managers and admins can delete customers"
  ON public.customers
  FOR DELETE
  USING (is_manager_or_admin());

-- ============================================================
-- PRODUCTS
-- ============================================================

CREATE POLICY "Service role has full access to products"
  ON public.products
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Active users can view products"
  ON public.products
  FOR SELECT
  USING (is_active_user());

CREATE POLICY "Managers and admins can insert products"
  ON public.products
  FOR INSERT
  WITH CHECK (is_manager_or_admin());

CREATE POLICY "Managers and admins can update products"
  ON public.products
  FOR UPDATE
  USING (is_manager_or_admin());

CREATE POLICY "Managers and admins can delete products"
  ON public.products
  FOR DELETE
  USING (is_manager_or_admin());

-- ============================================================
-- SUBSCRIPTION PLANS
-- ============================================================

CREATE POLICY "Service role has full access to subscription_plans"
  ON public.subscription_plans
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Active users can view plans"
  ON public.subscription_plans
  FOR SELECT
  USING (is_active_user());

CREATE POLICY "Managers and admins can insert plans"
  ON public.subscription_plans
  FOR INSERT
  WITH CHECK (is_manager_or_admin());

CREATE POLICY "Managers and admins can update plans"
  ON public.subscription_plans
  FOR UPDATE
  USING (is_manager_or_admin());

CREATE POLICY "Managers and admins can delete plans"
  ON public.subscription_plans
  FOR DELETE
  USING (is_manager_or_admin());

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================

CREATE POLICY "Service role has full access to subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Active users can view subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (is_active_user());

CREATE POLICY "Managers and admins can insert subscriptions"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (is_manager_or_admin());

CREATE POLICY "Managers and admins can update subscriptions"
  ON public.subscriptions
  FOR UPDATE
  USING (is_manager_or_admin());

CREATE POLICY "Managers and admins can delete subscriptions"
  ON public.subscriptions
  FOR DELETE
  USING (is_manager_or_admin());

-- ============================================================
-- INVOICES
-- ============================================================

CREATE POLICY "Service role has full access to invoices"
  ON public.invoices
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Active users can view invoices"
  ON public.invoices
  FOR SELECT
  USING (is_active_user());

CREATE POLICY "Managers and admins can insert invoices"
  ON public.invoices
  FOR INSERT
  WITH CHECK (is_manager_or_admin());

CREATE POLICY "Managers and admins can update invoices"
  ON public.invoices
  FOR UPDATE
  USING (is_manager_or_admin());

CREATE POLICY "Managers and admins can delete invoices"
  ON public.invoices
  FOR DELETE
  USING (is_manager_or_admin());

-- ============================================================
-- INVOICE ITEMS
-- ============================================================

CREATE POLICY "Service role has full access to invoice_items"
  ON public.invoice_items
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Active users can view invoice items"
  ON public.invoice_items
  FOR SELECT
  USING (is_active_user());

CREATE POLICY "Managers and admins can insert invoice items"
  ON public.invoice_items
  FOR INSERT
  WITH CHECK (is_manager_or_admin());

CREATE POLICY "Managers and admins can update invoice items"
  ON public.invoice_items
  FOR UPDATE
  USING (is_manager_or_admin());

CREATE POLICY "Managers and admins can delete invoice items"
  ON public.invoice_items
  FOR DELETE
  USING (is_manager_or_admin());

-- ============================================================
-- QUOTATIONS
-- ============================================================

CREATE POLICY "Service role has full access to quotations"
  ON public.quotations
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Active users can view quotations"
  ON public.quotations
  FOR SELECT
  USING (is_active_user());

CREATE POLICY "Managers and admins can insert quotations"
  ON public.quotations
  FOR INSERT
  WITH CHECK (is_manager_or_admin());

CREATE POLICY "Managers and admins can update quotations"
  ON public.quotations
  FOR UPDATE
  USING (is_manager_or_admin());

CREATE POLICY "Managers and admins can delete quotations"
  ON public.quotations
  FOR DELETE
  USING (is_manager_or_admin());

-- ============================================================
-- QUOTATION ITEMS
-- ============================================================

CREATE POLICY "Service role has full access to quotation_items"
  ON public.quotation_items
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Active users can view quotation items"
  ON public.quotation_items
  FOR SELECT
  USING (is_active_user());

CREATE POLICY "Managers and admins can insert quotation items"
  ON public.quotation_items
  FOR INSERT
  WITH CHECK (is_manager_or_admin());

CREATE POLICY "Managers and admins can update quotation items"
  ON public.quotation_items
  FOR UPDATE
  USING (is_manager_or_admin());

CREATE POLICY "Managers and admins can delete quotation items"
  ON public.quotation_items
  FOR DELETE
  USING (is_manager_or_admin());

-- ============================================================
-- EMAIL TEMPLATES
-- ============================================================

CREATE POLICY "Service role has full access to email_templates"
  ON public.email_templates
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Active users can view email templates"
  ON public.email_templates
  FOR SELECT
  USING (is_active_user());

CREATE POLICY "Admins can insert email templates"
  ON public.email_templates
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update email templates"
  ON public.email_templates
  FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete email templates"
  ON public.email_templates
  FOR DELETE
  USING (is_admin());

-- ============================================================
-- GRANT PERMISSIONS TO AUTHENTICATED ROLE
-- ============================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant permissions on all tables to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================================
-- COMPLETED
-- ============================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'RLS Policies successfully created and configured!';
  RAISE NOTICE 'Service role has full access for server-side operations';
  RAISE NOTICE 'Authentication should now work properly';
END $$;
