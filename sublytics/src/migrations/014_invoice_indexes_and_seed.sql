-- ============================================================
-- Invoice Indexes and Seed Data
-- Migration: 014
-- ============================================================

-- ============================================================
-- INDEXES for Invoice Performance
-- ============================================================

-- Index on invoice_number for quick lookups
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);

-- Index on customer_id for filtering invoices by customer
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);

-- Index on subscription_id for linking invoices to subscriptions
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON public.invoices(subscription_id);

-- Index on status for filtering by invoice status
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

-- Index on issue_date for sorting and filtering by date
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON public.invoices(issue_date DESC);

-- Index on due_date for sorting and filtering by date
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date DESC);

-- Composite index for customer + status queries
CREATE INDEX IF NOT EXISTS idx_invoices_customer_status ON public.invoices(customer_id, status);

-- Full-text search index on notes
CREATE INDEX IF NOT EXISTS idx_invoices_notes_search ON public.invoices USING gin(to_tsvector('english', COALESCE(notes, '')));

-- Index on invoice_items for quick invoice lookups
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- Index on product_id for filtering items by product
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON public.invoice_items(product_id);

-- ============================================================
-- SEED DATA for Invoices
-- ============================================================

-- Invoice 1: TechFlow Solutions - Paid
INSERT INTO public.invoices (
  invoice_number, customer_id, subscription_id, status, 
  issue_date, due_date, subtotal, tax_percent, tax_amount, 
  discount_percent, discount_amount, total, currency, 
  notes, paid_at, created_by
)
SELECT 
  'INV-2026-001',
  c.id,
  s.id,
  'paid'::invoice_status,
  '2026-03-01'::date,
  '2026-03-31'::date,
  299.00,
  10.00,
  29.90,
  0.00,
  0.00,
  328.90,
  'USD',
  'Monthly subscription - Professional Plan',
  '2026-03-15 10:30:00'::timestamptz,
  NULL
FROM public.customers c
JOIN public.subscriptions s ON s.customer_id = c.id
WHERE c.email = 'billing@techflow.io'
LIMIT 1;

-- Invoice 2: DataPulse Analytics - Paid
INSERT INTO public.invoices (
  invoice_number, customer_id, subscription_id, status, 
  issue_date, due_date, subtotal, tax_percent, tax_amount, 
  discount_percent, discount_amount, total, currency, 
  notes, paid_at, created_by
)
SELECT 
  'INV-2026-002',
  c.id,
  s.id,
  'paid'::invoice_status,
  '2026-03-01'::date,
  '2026-03-31'::date,
  599.00,
  10.00,
  59.90,
  5.00,
  29.95,
  628.95,
  'USD',
  'Monthly subscription - Business Plan with 5% discount',
  '2026-03-10 14:22:00'::timestamptz,
  NULL
FROM public.customers c
JOIN public.subscriptions s ON s.customer_id = c.id
WHERE c.email = 'accounts@datapulse.com'
LIMIT 1;

-- Invoice 3: CloudNine Media - Sent (pending payment)
INSERT INTO public.invoices (
  invoice_number, customer_id, subscription_id, status, 
  issue_date, due_date, subtotal, tax_percent, tax_amount, 
  discount_percent, discount_amount, total, currency, 
  notes, created_by
)
SELECT 
  'INV-2026-003',
  c.id,
  s.id,
  'sent'::invoice_status,
  '2026-04-01'::date,
  '2026-04-30'::date,
  599.00,
  20.00,
  119.80,
  0.00,
  0.00,
  718.80,
  'GBP',
  'Monthly subscription - Business Plan (UK VAT)',
  NULL
FROM public.customers c
JOIN public.subscriptions s ON s.customer_id = c.id
WHERE c.email = 'finance@cloudnine.co'
LIMIT 1;

-- Invoice 4: PixelForge Design - Overdue
INSERT INTO public.invoices (
  invoice_number, customer_id, subscription_id, status, 
  issue_date, due_date, subtotal, tax_percent, tax_amount, 
  discount_percent, discount_amount, total, currency, 
  notes, created_by
)
SELECT 
  'INV-2026-004',
  c.id,
  s.id,
  'overdue'::invoice_status,
  '2026-02-01'::date,
  '2026-03-03'::date,
  299.00,
  10.00,
  29.90,
  0.00,
  0.00,
  328.90,
  'USD',
  'Payment reminder sent on 2026-03-10',
  NULL
FROM public.customers c
JOIN public.subscriptions s ON s.customer_id = c.id
WHERE c.email = 'hello@pixelforge.design'
LIMIT 1;

-- Invoice 5: AutoDev Labs - Draft
INSERT INTO public.invoices (
  invoice_number, customer_id, subscription_id, status, 
  issue_date, due_date, subtotal, tax_percent, tax_amount, 
  discount_percent, discount_amount, total, currency, 
  notes, created_by
)
SELECT 
  'INV-2026-005',
  c.id,
  s.id,
  'draft'::invoice_status,
  '2026-04-01'::date,
  '2026-05-01'::date,
  299.00,
  10.00,
  29.90,
  10.00,
  29.90,
  299.00,
  'USD',
  'Draft - awaiting approval',
  NULL
FROM public.customers c
JOIN public.subscriptions s ON s.customer_id = c.id
WHERE c.email = 'ops@autodevlabs.com'
LIMIT 1;

-- Invoice 6: HealthAI Partners - Cancelled
INSERT INTO public.invoices (
  invoice_number, customer_id, subscription_id, status, 
  issue_date, due_date, subtotal, tax_percent, tax_amount, 
  discount_percent, discount_amount, total, currency, 
  notes, created_by
)
SELECT 
  'INV-2026-006',
  c.id,
  s.id,
  'cancelled'::invoice_status,
  '2026-03-15'::date,
  '2026-04-14'::date,
  599.00,
  10.00,
  59.90,
  0.00,
  0.00,
  658.90,
  'USD',
  'Cancelled due to subscription downgrade',
  NULL
FROM public.customers c
JOIN public.subscriptions s ON s.customer_id = c.id
WHERE c.email = 'it@healthai.org'
LIMIT 1;

-- ============================================================
-- INVOICE ITEMS (Line Items for Invoices)
-- ============================================================

-- Items for Invoice 1 (TechFlow Solutions - Professional Plan)
INSERT INTO public.invoice_items (invoice_id, product_id, description, quantity, unit_price, total)
SELECT 
  i.id,
  p.id,
  'AI Text Generator - Professional Tier',
  1,
  29.00,
  29.00
FROM public.invoices i
CROSS JOIN public.products p
WHERE i.invoice_number = 'INV-2026-001' AND p.sku = 'AI-TXT-001'
LIMIT 1;

INSERT INTO public.invoice_items (invoice_id, product_id, description, quantity, unit_price, total)
SELECT 
  i.id,
  p.id,
  'AI Chatbot - Professional Tier',
  1,
  45.00,
  45.00
FROM public.invoices i
CROSS JOIN public.products p
WHERE i.invoice_number = 'INV-2026-001' AND p.sku = 'AI-CHT-005'
LIMIT 1;

INSERT INTO public.invoice_items (invoice_id, product_id, description, quantity, unit_price, total)
SELECT 
  i.id,
  p.id,
  'AI Image Generator - Professional Tier',
  1,
  40.00,
  40.00
FROM public.invoices i
CROSS JOIN public.products p
WHERE i.invoice_number = 'INV-2026-001' AND p.sku = 'AI-IMG-006'
LIMIT 1;

-- Items for Invoice 2 (DataPulse Analytics - Business Plan)
INSERT INTO public.invoice_items (invoice_id, product_id, description, quantity, unit_price, total)
SELECT 
  i.id,
  p.id,
  'AI Predictive Analytics - Business Tier',
  1,
  95.00,
  95.00
FROM public.invoices i
CROSS JOIN public.products p
WHERE i.invoice_number = 'INV-2026-002' AND p.sku = 'AI-PRD-013'
LIMIT 1;

INSERT INTO public.invoice_items (invoice_id, product_id, description, quantity, unit_price, total)
SELECT 
  i.id,
  p.id,
  'AI Data Insights - Business Tier',
  1,
  85.00,
  85.00
FROM public.invoices i
CROSS JOIN public.products p
WHERE i.invoice_number = 'INV-2026-002' AND p.sku = 'AI-DST-014'
LIMIT 1;

-- Items for Invoice 3 (CloudNine Media - Video/Audio)
INSERT INTO public.invoice_items (invoice_id, product_id, description, quantity, unit_price, total)
SELECT 
  i.id,
  p.id,
  'AI Video Editor - Business Tier',
  1,
  110.00,
  110.00
FROM public.invoices i
CROSS JOIN public.products p
WHERE i.invoice_number = 'INV-2026-003' AND p.sku = 'AI-VED-016'
LIMIT 1;

INSERT INTO public.invoice_items (invoice_id, product_id, description, quantity, unit_price, total)
SELECT 
  i.id,
  p.id,
  'AI Audio Enhancer - Business Tier',
  1,
  90.00,
  90.00
FROM public.invoices i
CROSS JOIN public.products p
WHERE i.invoice_number = 'INV-2026-003' AND p.sku = 'AI-AUD-017'
LIMIT 1;

-- Items for Invoice 4 (PixelForge - Image tools)
INSERT INTO public.invoice_items (invoice_id, product_id, description, quantity, unit_price, total)
SELECT 
  i.id,
  p.id,
  'AI Image Generator - Professional Tier',
  1,
  40.00,
  40.00
FROM public.invoices i
CROSS JOIN public.products p
WHERE i.invoice_number = 'INV-2026-004' AND p.sku = 'AI-IMG-006'
LIMIT 1;

INSERT INTO public.invoice_items (invoice_id, product_id, description, quantity, unit_price, total)
SELECT 
  i.id,
  p.id,
  'AI Image Upscaler - Professional Tier',
  1,
  18.00,
  18.00
FROM public.invoices i
CROSS JOIN public.products p
WHERE i.invoice_number = 'INV-2026-004' AND p.sku = 'AI-UPS-007'
LIMIT 1;
