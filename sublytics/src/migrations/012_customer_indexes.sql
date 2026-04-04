-- ============================================================
-- CUSTOMER INDEXES FOR SEARCH AND PERFORMANCE
-- ============================================================
-- Migration: 012
-- Description: Add indexes for customer search by name and improve query performance
-- Date: 2024-04-04

-- Add index on name for alphabetical ordering and search
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);

-- Add index on is_active for filtering active customers
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON public.customers(is_active);

-- Add index on created_by for filtering by creation source
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON public.customers(created_by);

-- Add composite index for common query patterns (active customers ordered by name)
CREATE INDEX IF NOT EXISTS idx_customers_active_name ON public.customers(is_active, name);

-- Note: idx_customers_email already exists in migration 001
