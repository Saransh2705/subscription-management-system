-- ============================================================
-- 018: Update Quotations to be Standalone (No Customer Link)
-- Make quotations independent product listings that can be shared
-- ============================================================

-- Drop existing quotations tables
DROP TABLE IF EXISTS public.quotation_items CASCADE;
DROP TABLE IF EXISTS public.quotations CASCADE;

-- Create updated quotations table (no customer_id)
CREATE TABLE public.quotations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quotation_number text NOT NULL,
  title text NOT NULL,
  status public.quotation_status NOT NULL DEFAULT 'draft'::quotation_status,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date NOT NULL,
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  tax_percent numeric(5, 2) NOT NULL DEFAULT 0,
  tax_amount numeric(12, 2) NOT NULL DEFAULT 0,
  discount_percent numeric(5, 2) NOT NULL DEFAULT 0,
  discount_amount numeric(12, 2) NOT NULL DEFAULT 0,
  total numeric(12, 2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD'::text,
  notes text NULL,
  created_by uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT quotations_pkey PRIMARY KEY (id),
  CONSTRAINT quotations_quotation_number_key UNIQUE (quotation_number),
  CONSTRAINT quotations_created_by_fkey FOREIGN KEY (created_by) REFERENCES user_profiles (id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Create quotation_items table
CREATE TABLE public.quotation_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL,
  product_id uuid NULL,
  description text NOT NULL,
  quantity numeric(10, 2) NOT NULL DEFAULT 1,
  unit_price numeric(12, 2) NOT NULL DEFAULT 0,
  total numeric(12, 2) NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT quotation_items_pkey PRIMARY KEY (id),
  CONSTRAINT quotation_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL,
  CONSTRAINT quotation_items_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES quotations (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quotations_created_by ON public.quotations USING btree (created_by) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON public.quotation_items USING btree (quotation_id) TABLESPACE pg_default;

-- Create updated_at trigger
CREATE TRIGGER set_updated_at_quotations 
  BEFORE UPDATE ON quotations 
  FOR EACH ROW 
  EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- Migration Complete
-- ============================================================
