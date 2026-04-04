-- ============================================================
-- 009: AI Studio Sample Products, Plans, Customers, Subscriptions
-- Seed data with 25+ AI products, taxes, discounts, and full data
-- ============================================================

-- ============================================================
-- 1. PRODUCTS (25 AI Studio products)
-- ============================================================

INSERT INTO public.products (name, description, sku, unit_price, tax_percent, currency, is_active) VALUES
-- Text & Language AI
('AI Text Generator',           'Generate marketing copy, blog posts, and creative content with advanced LLMs',              'AI-TXT-001',  49.00,  18.00, 'USD', true),
('AI Summarizer',               'Summarize long documents, articles, and reports into concise key points',                    'AI-SUM-002',  29.00,  18.00, 'USD', true),
('AI Translator Pro',           'Real-time translation across 120+ languages with context-aware accuracy',                   'AI-TRN-003',  59.00,  18.00, 'USD', true),
('Sentiment Analysis Engine',   'Analyze customer feedback, reviews, and social media for sentiment insights',               'AI-SNT-004',  39.00,  12.00, 'USD', true),
('AI Chatbot Builder',          'Build and deploy intelligent conversational chatbots with zero code',                        'AI-CHT-005',  79.00,  18.00, 'USD', true),

-- Image & Vision AI
('AI Image Generator',          'Create stunning images from text prompts using state-of-the-art diffusion models',          'AI-IMG-006',  69.00,  18.00, 'USD', true),
('AI Image Upscaler',           'Enhance and upscale low-resolution images up to 8x with AI super-resolution',              'AI-UPS-007',  34.00,  12.00, 'USD', true),
('Object Detection API',        'Detect and classify objects in images and video streams in real-time',                       'AI-OBJ-008',  89.00,  18.00, 'USD', true),
('AI Background Remover',       'Remove and replace image backgrounds instantly with pixel-perfect precision',               'AI-BGR-009',  24.00,  12.00, 'USD', true),
('OCR Document Scanner',        'Extract text from scanned documents, receipts, and handwritten notes',                      'AI-OCR-010',  44.00,  18.00, 'USD', true),

-- Audio & Speech AI
('Speech-to-Text Engine',       'Convert audio and video to accurate text transcripts in 50+ languages',                     'AI-STT-011',  54.00,  18.00, 'USD', true),
('Text-to-Speech Studio',       'Generate natural-sounding voiceovers with 200+ AI voices and custom cloning',              'AI-TTS-012',  64.00,  18.00, 'USD', true),
('AI Music Composer',           'Compose royalty-free background music and sound effects with AI',                            'AI-MUS-013',  49.00,  15.00, 'USD', true),
('Voice Cloning Suite',         'Clone any voice from a 30-second sample for personalized audio content',                    'AI-VCL-014',  99.00,  18.00, 'USD', true),
('Audio Noise Reducer',         'Remove background noise from audio recordings with AI-powered enhancement',                 'AI-ANR-015',  29.00,  12.00, 'USD', true),

-- Video & Media AI
('AI Video Editor',             'Automated video editing with scene detection, cuts, and transitions',                        'AI-VED-016',  99.00,  18.00, 'USD', true),
('Deepfake Detector',           'Detect manipulated and AI-generated video content with 99.2% accuracy',                     'AI-DFD-017',  74.00,  18.00, 'USD', true),
('AI Subtitle Generator',      'Auto-generate and translate subtitles for video content in real-time',                       'AI-SUB-018',  39.00,  15.00, 'USD', true),

-- Data & Analytics AI
('Predictive Analytics Engine', 'Forecast trends, demand, and customer behavior with machine learning models',              'AI-PAN-019', 129.00,  18.00, 'USD', true),
('AI Data Classifier',          'Automatically categorize and tag unstructured data at scale',                                'AI-DCL-020',  59.00,  12.00, 'USD', true),
('Anomaly Detection System',    'Detect fraud, outliers, and unusual patterns in real-time data streams',                     'AI-ANM-021',  84.00,  18.00, 'USD', true),
('AI Recommendation Engine',    'Personalize product and content recommendations for each user',                             'AI-REC-022',  94.00,  18.00, 'USD', true),

-- Code & Developer AI
('AI Code Assistant',           'Intelligent code completion, review, and refactoring for 30+ languages',                    'AI-COD-023', 109.00,  18.00, 'USD', true),
('AI API Test Generator',       'Auto-generate comprehensive API test suites from OpenAPI specs',                             'AI-TST-024',  49.00,  12.00, 'USD', true),
('AI Doc Generator',            'Generate API docs, README files, and technical documentation from code',                    'AI-DOC-025',  39.00,  12.00, 'USD', true),

-- Specialized AI
('AI Email Writer',             'Draft professional emails, follow-ups, and cold outreach with AI',                           'AI-EML-026',  34.00,  18.00, 'USD', true),
('AI Resume Screener',          'Screen and rank job applications using customizable AI scoring criteria',                    'AI-HRS-027',  69.00,  15.00, 'USD', true),
('AI Legal Analyzer',           'Review contracts and legal documents for risks, clauses, and compliance',                   'AI-LGL-028', 149.00,  18.00, 'USD', true);

-- ============================================================
-- 2. SUBSCRIPTION PLANS (4 tiers)
-- ============================================================

INSERT INTO public.subscription_plans (name, description, price, currency, billing_cycle, trial_days, features, is_active) VALUES
(
  'Starter',
  'Perfect for individuals and small projects getting started with AI',
  29.00, 'USD', 'monthly', 14,
  '["5 AI tools included", "1,000 API calls/month", "Email support", "Basic analytics"]'::jsonb,
  true
),
(
  'Professional',
  'For growing teams that need more power and flexibility',
  99.00, 'USD', 'monthly', 7,
  '["15 AI tools included", "25,000 API calls/month", "Priority support", "Advanced analytics", "Custom webhooks"]'::jsonb,
  true
),
(
  'Business',
  'For organizations requiring enterprise-grade AI capabilities',
  249.00, 'USD', 'monthly', 7,
  '["All AI tools included", "100,000 API calls/month", "24/7 support", "Full analytics suite", "Custom model fine-tuning", "SSO & RBAC"]'::jsonb,
  true
),
(
  'Enterprise',
  'Unlimited access with dedicated support and custom SLAs',
  599.00, 'USD', 'annual', 30,
  '["Unlimited AI tools", "Unlimited API calls", "Dedicated account manager", "Custom SLA", "On-premise deployment", "Model training"]'::jsonb,
  true
);

-- ============================================================
-- 3. CUSTOMERS (10 sample companies)
-- ============================================================

INSERT INTO public.customers (name, email, phone, company, address, city, country, notes, is_active) VALUES
('TechFlow Solutions',    'billing@techflow.io',      '+1-415-555-0101', 'TechFlow Solutions',    '100 Market St, Suite 400',  'San Francisco', 'US', 'Enterprise client since 2024', true),
('DataPulse Analytics',   'accounts@datapulse.com',   '+1-212-555-0102', 'DataPulse Analytics',   '350 5th Ave, Floor 12',     'New York',      'US', 'Using predictive analytics heavily', true),
('CloudNine Media',       'finance@cloudnine.co',     '+44-20-7946-0103','CloudNine Media',       '10 Downing Business Park',  'London',        'GB', 'Video and audio AI suite', true),
('PixelForge Design',     'hello@pixelforge.design',  '+1-310-555-0104', 'PixelForge Design',     '8530 Wilshire Blvd',        'Los Angeles',   'US', 'Image generation primary use case', true),
('LinguaLink Global',     'admin@lingualink.io',      '+49-30-5550-0105','LinguaLink Global',     'Friedrichstraße 123',       'Berlin',        'DE', 'Translation services company', true),
('AutoDev Labs',          'ops@autodevlabs.com',      '+1-206-555-0106', 'AutoDev Labs',          '400 Broad St',              'Seattle',       'US', 'AI code assistant power user', true),
('Voicewave Studios',     'billing@voicewave.fm',     '+1-323-555-0107', 'Voicewave Studios',     '6922 Hollywood Blvd',       'Los Angeles',   'US', 'Podcast and media production', true),
('SecureInsight Corp',    'procurement@secureinsight.net', '+1-571-555-0108', 'SecureInsight Corp', '1800 Pentagon City',       'Arlington',     'US', 'Anomaly detection and deepfake detection', true),
('HealthAI Partners',     'it@healthai.org',          '+1-617-555-0109', 'HealthAI Partners',     '75 Francis St',             'Boston',        'US', 'Medical document processing', true),
('EduSpark Academy',      'tech@eduspark.edu',        '+61-2-5550-0110', 'EduSpark Academy',      '100 University Ave',        'Sydney',        'AU', 'Educational content generation', true);

-- ============================================================
-- 4. PLAN-PRODUCT PRICING (tiered pricing per plan)
-- Use subqueries to get IDs dynamically
-- ============================================================

-- Starter plan products (5 tools at discounted tier prices)
INSERT INTO public.subscription_plan_products (plan_id, product_id, tier_price, is_included, quantity_limit, notes)
SELECT sp.id, p.id, 19.00, true, 500, 'Starter tier - limited calls'
FROM public.subscription_plans sp, public.products p WHERE sp.name = 'Starter' AND p.sku = 'AI-TXT-001';

INSERT INTO public.subscription_plan_products (plan_id, product_id, tier_price, is_included, quantity_limit, notes)
SELECT sp.id, p.id, 12.00, true, 500, 'Starter tier'
FROM public.subscription_plans sp, public.products p WHERE sp.name = 'Starter' AND p.sku = 'AI-SUM-002';

INSERT INTO public.subscription_plan_products (plan_id, product_id, tier_price, is_included, quantity_limit, notes)
SELECT sp.id, p.id, 25.00, true, 300, 'Starter tier - basic translation'
FROM public.subscription_plans sp, public.products p WHERE sp.name = 'Starter' AND p.sku = 'AI-TRN-003';

INSERT INTO public.subscription_plan_products (plan_id, product_id, tier_price, is_included, quantity_limit, notes)
SELECT sp.id, p.id, 35.00, true, 200, 'Starter tier - limited generations'
FROM public.subscription_plans sp, public.products p WHERE sp.name = 'Starter' AND p.sku = 'AI-IMG-006';

INSERT INTO public.subscription_plan_products (plan_id, product_id, tier_price, is_included, quantity_limit, notes)
SELECT sp.id, p.id, 10.00, true, 300, 'Starter tier'
FROM public.subscription_plans sp, public.products p WHERE sp.name = 'Starter' AND p.sku = 'AI-BGR-009';

-- Professional plan products (15 tools with better pricing)
INSERT INTO public.subscription_plan_products (plan_id, product_id, tier_price, is_included, quantity_limit, notes)
SELECT sp.id, p.id, 29.00, true, 5000, 'Pro tier'
FROM public.subscription_plans sp, public.products p WHERE sp.name = 'Professional' AND p.sku = 'AI-TXT-001';

INSERT INTO public.subscription_plan_products (plan_id, product_id, tier_price, is_included, quantity_limit, notes)
SELECT sp.id, p.id, 15.00, true, 5000, 'Pro tier'
FROM public.subscription_plans sp, public.products p WHERE sp.name = 'Professional' AND p.sku = 'AI-SUM-002';

INSERT INTO public.subscription_plan_products (plan_id, product_id, tier_price, is_included, quantity_limit, notes)
SELECT sp.id, p.id, 35.00, true, 3000, 'Pro tier'
FROM public.subscription_plans sp, public.products p WHERE sp.name = 'Professional' AND p.sku = 'AI-TRN-003';

INSERT INTO public.subscription_plan_products (plan_id, product_id, tier_price, is_included, quantity_limit, notes)
SELECT sp.id, p.id, 20.00, true, 5000, 'Pro tier'
FROM public.subscription_plans sp, public.products p WHERE sp.name = 'Professional' AND p.sku = 'AI-SNT-004';

INSERT INTO public.subscription_plan_products (plan_id, product_id, tier_price, is_included, quantity_limit, notes)
SELECT sp.id, p.id, 45.00, true, 3000, 'Pro tier'
FROM public.subscription_plans sp, public.products p WHERE sp.name = 'Professional' AND p.sku = 'AI-CHT-005';

INSERT INTO public.subscription_plan_products (plan_id, product_id, tier_price, is_included, quantity_limit, notes)
SELECT sp.id, p.id, 40.00, true, 2000, 'Pro tier'
FROM public.subscription_plans sp, public.products p WHERE sp.name = 'Professional' AND p.sku = 'AI-IMG-006';

INSERT INTO public.subscription_plan_products (plan_id, product_id, tier_price, is_included, quantity_limit, notes)
SELECT sp.id, p.id, 18.00, true, 3000, 'Pro tier'
FROM public.subscription_plans sp, public.products p WHERE sp.name = 'Professional' AND p.sku = 'AI-UPS-007';

INSERT INTO public.subscription_plan_products (plan_id, product_id, tier_price, is_included, quantity_limit, notes)
SELECT sp.id, p.id, 50.00, true, 2000, 'Pro tier'
FROM public.subscription_plans sp, public.products p WHERE sp.name = 'Professional' AND p.sku = 'AI-OBJ-008';

INSERT INTO public.subscription_plan_products (plan_id, product_id, tier_price, is_included, quantity_limit, notes)
SELECT sp.id, p.id, 12.00, true, 3000, 'Pro tier'
FROM public.subscription_plans sp, public.products p WHERE sp.name = 'Professional' AND p.sku = 'AI-BGR-009';

INSERT INTO public.subscription_plan_products (plan_id, product_id, tier_price, is_included, quantity_limit, notes)
SELECT sp.id, p.id, 25.00, true, 3000, 'Pro tier'
FROM public.subscription_plans sp, public.products p WHERE sp.name = 'Professional' AND p.sku = 'AI-OCR-010';

INSERT INTO public.subscription_plan_products (plan_id, product_id, tier_price, is_included, quantity_limit, notes)
SELECT sp.id, p.id, 30.00, true, 5000, 'Pro tier'
FROM public.subscription_plans sp, public.products p WHERE sp.name = 'Professional' AND p.sku = 'AI-STT-011';

INSERT INTO public.subscription_plan_products (plan_id, product_id, tier_price, is_included, quantity_limit, notes)
SELECT sp.id, p.id, 35.00, true, 5000, 'Pro tier'
FROM public.subscription_plans sp, public.products p WHERE sp.name = 'Professional' AND p.sku = 'AI-TTS-012';

INSERT INTO public.subscription_plan_products (plan_id, product_id, tier_price, is_included, quantity_limit, notes)
SELECT sp.id, p.id, 15.00, true, 2000, 'Pro tier'
FROM public.subscription_plans sp, public.products p WHERE sp.name = 'Professional' AND p.sku = 'AI-ANR-015';

INSERT INTO public.subscription_plan_products (plan_id, product_id, tier_price, is_included, quantity_limit, notes)
SELECT sp.id, p.id, 60.00, true, 2000, 'Pro tier'
FROM public.subscription_plans sp, public.products p WHERE sp.name = 'Professional' AND p.sku = 'AI-COD-023';

INSERT INTO public.subscription_plan_products (plan_id, product_id, tier_price, is_included, quantity_limit, notes)
SELECT sp.id, p.id, 25.00, true, 2000, 'Pro tier'
FROM public.subscription_plans sp, public.products p WHERE sp.name = 'Professional' AND p.sku = 'AI-DOC-025';

-- Business plan products (all 28 tools with best pricing)
INSERT INTO public.subscription_plan_products (plan_id, product_id, tier_price, is_included, notes)
SELECT sp.id, p.id,
  CASE p.sku
    WHEN 'AI-TXT-001' THEN 20.00
    WHEN 'AI-SUM-002' THEN 10.00
    WHEN 'AI-TRN-003' THEN 25.00
    WHEN 'AI-SNT-004' THEN 15.00
    WHEN 'AI-CHT-005' THEN 35.00
    WHEN 'AI-IMG-006' THEN 30.00
    WHEN 'AI-UPS-007' THEN 12.00
    WHEN 'AI-OBJ-008' THEN 40.00
    WHEN 'AI-BGR-009' THEN 8.00
    WHEN 'AI-OCR-010' THEN 18.00
    WHEN 'AI-STT-011' THEN 22.00
    WHEN 'AI-TTS-012' THEN 28.00
    WHEN 'AI-MUS-013' THEN 20.00
    WHEN 'AI-VCL-014' THEN 45.00
    WHEN 'AI-ANR-015' THEN 10.00
    WHEN 'AI-VED-016' THEN 50.00
    WHEN 'AI-DFD-017' THEN 35.00
    WHEN 'AI-SUB-018' THEN 18.00
    WHEN 'AI-PAN-019' THEN 65.00
    WHEN 'AI-DCL-020' THEN 25.00
    WHEN 'AI-ANM-021' THEN 40.00
    WHEN 'AI-REC-022' THEN 45.00
    WHEN 'AI-COD-023' THEN 50.00
    WHEN 'AI-TST-024' THEN 22.00
    WHEN 'AI-DOC-025' THEN 18.00
    WHEN 'AI-EML-026' THEN 15.00
    WHEN 'AI-HRS-027' THEN 30.00
    WHEN 'AI-LGL-028' THEN 70.00
  END,
  true,
  'Business tier - high limits'
FROM public.subscription_plans sp
CROSS JOIN public.products p
WHERE sp.name = 'Business'
  AND p.sku IN ('AI-TXT-001','AI-SUM-002','AI-TRN-003','AI-SNT-004','AI-CHT-005','AI-IMG-006','AI-UPS-007','AI-OBJ-008','AI-BGR-009','AI-OCR-010','AI-STT-011','AI-TTS-012','AI-MUS-013','AI-VCL-014','AI-ANR-015','AI-VED-016','AI-DFD-017','AI-SUB-018','AI-PAN-019','AI-DCL-020','AI-ANM-021','AI-REC-022','AI-COD-023','AI-TST-024','AI-DOC-025','AI-EML-026','AI-HRS-027','AI-LGL-028');

-- ============================================================
-- 5. SUBSCRIPTIONS (link customers to plans)
-- ============================================================

INSERT INTO public.subscriptions (customer_id, plan_id, status, start_date, next_billing_date, quantity, subscription_discount_type, subscription_discount_value, notes)
SELECT c.id, sp.id, 'active', '2025-01-15', '2025-07-15', 1, 'percentage', 10.00, 'Annual contract - 10% loyalty discount'
FROM public.customers c, public.subscription_plans sp WHERE c.email = 'billing@techflow.io' AND sp.name = 'Enterprise';

INSERT INTO public.subscriptions (customer_id, plan_id, status, start_date, next_billing_date, quantity, subscription_discount_type, subscription_discount_value, notes)
SELECT c.id, sp.id, 'active', '2025-02-01', '2025-08-01', 1, 'value', 20.00, 'Referral bonus discount'
FROM public.customers c, public.subscription_plans sp WHERE c.email = 'accounts@datapulse.com' AND sp.name = 'Business';

INSERT INTO public.subscriptions (customer_id, plan_id, status, start_date, next_billing_date, quantity, subscription_discount_type, subscription_discount_value, notes)
SELECT c.id, sp.id, 'active', '2025-03-10', '2025-09-10', 1, 'percentage', 5.00, 'Early adopter discount'
FROM public.customers c, public.subscription_plans sp WHERE c.email = 'finance@cloudnine.co' AND sp.name = 'Professional';

INSERT INTO public.subscriptions (customer_id, plan_id, status, start_date, next_billing_date, quantity, subscription_discount_type, subscription_discount_value)
SELECT c.id, sp.id, 'active', '2025-04-01', '2025-10-01', 1, 'percentage', 0
FROM public.customers c, public.subscription_plans sp WHERE c.email = 'hello@pixelforge.design' AND sp.name = 'Professional';

INSERT INTO public.subscriptions (customer_id, plan_id, status, start_date, next_billing_date, quantity, subscription_discount_type, subscription_discount_value, notes)
SELECT c.id, sp.id, 'active', '2025-02-20', '2025-08-20', 1, 'percentage', 15.00, 'Partner program discount'
FROM public.customers c, public.subscription_plans sp WHERE c.email = 'admin@lingualink.io' AND sp.name = 'Business';

INSERT INTO public.subscriptions (customer_id, plan_id, status, start_date, next_billing_date, quantity, subscription_discount_type, subscription_discount_value)
SELECT c.id, sp.id, 'active', '2025-05-01', '2025-11-01', 1, 'value', 15.00
FROM public.customers c, public.subscription_plans sp WHERE c.email = 'ops@autodevlabs.com' AND sp.name = 'Professional';

INSERT INTO public.subscriptions (customer_id, plan_id, status, start_date, next_billing_date, quantity, subscription_discount_type, subscription_discount_value)
SELECT c.id, sp.id, 'trial', '2025-06-01', '2025-07-01', 1, 'percentage', 0
FROM public.customers c, public.subscription_plans sp WHERE c.email = 'billing@voicewave.fm' AND sp.name = 'Starter';

INSERT INTO public.subscriptions (customer_id, plan_id, status, start_date, next_billing_date, quantity, subscription_discount_type, subscription_discount_value, notes)
SELECT c.id, sp.id, 'active', '2025-01-05', '2025-07-05', 1, 'percentage', 12.00, 'Government contract discount'
FROM public.customers c, public.subscription_plans sp WHERE c.email = 'procurement@secureinsight.net' AND sp.name = 'Enterprise';

INSERT INTO public.subscriptions (customer_id, plan_id, status, start_date, next_billing_date, quantity, subscription_discount_type, subscription_discount_value)
SELECT c.id, sp.id, 'active', '2025-04-15', '2025-10-15', 1, 'value', 30.00
FROM public.customers c, public.subscription_plans sp WHERE c.email = 'it@healthai.org' AND sp.name = 'Business';

INSERT INTO public.subscriptions (customer_id, plan_id, status, start_date, next_billing_date, quantity, subscription_discount_type, subscription_discount_value, notes)
SELECT c.id, sp.id, 'paused', '2025-03-01', '2025-09-01', 1, 'percentage', 25.00, 'Education discount - paused for summer'
FROM public.customers c, public.subscription_plans sp WHERE c.email = 'tech@eduspark.edu' AND sp.name = 'Starter';

-- ============================================================
-- 6. SUBSCRIPTION PRODUCTS (add products to subscriptions with discounts)
-- ============================================================

-- TechFlow (Enterprise) - uses 8 products with various discounts
INSERT INTO public.subscription_products (subscription_id, product_id, quantity, unit_price, discount_type, discount_value, is_active)
SELECT s.id, p.id, 10, 109.00, 'percentage', 20.00, true
FROM public.subscriptions s
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'billing@techflow.io' AND p.sku = 'AI-COD-023';

INSERT INTO public.subscription_products (subscription_id, product_id, quantity, unit_price, discount_type, discount_value, is_active)
SELECT s.id, p.id, 5, 129.00, 'percentage', 15.00, true
FROM public.subscriptions s
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'billing@techflow.io' AND p.sku = 'AI-PAN-019';

INSERT INTO public.subscription_products (subscription_id, product_id, quantity, unit_price, discount_type, discount_value, is_active)
SELECT s.id, p.id, 3, 84.00, 'value', 10.00, true
FROM public.subscriptions s
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'billing@techflow.io' AND p.sku = 'AI-ANM-021';

-- DataPulse (Business) - analytics focused
INSERT INTO public.subscription_products (subscription_id, product_id, quantity, unit_price, discount_type, discount_value, is_active)
SELECT s.id, p.id, 8, 129.00, 'percentage', 10.00, true
FROM public.subscriptions s
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'accounts@datapulse.com' AND p.sku = 'AI-PAN-019';

INSERT INTO public.subscription_products (subscription_id, product_id, quantity, unit_price, discount_type, discount_value, is_active)
SELECT s.id, p.id, 5, 94.00, 'percentage', 8.00, true
FROM public.subscriptions s
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'accounts@datapulse.com' AND p.sku = 'AI-REC-022';

INSERT INTO public.subscription_products (subscription_id, product_id, quantity, unit_price, discount_type, discount_value, is_active)
SELECT s.id, p.id, 3, 59.00, 'value', 5.00, true
FROM public.subscriptions s
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'accounts@datapulse.com' AND p.sku = 'AI-DCL-020';

-- CloudNine Media (Professional) - media production
INSERT INTO public.subscription_products (subscription_id, product_id, quantity, unit_price, discount_type, discount_value, is_active)
SELECT s.id, p.id, 2, 99.00, 'percentage', 5.00, true
FROM public.subscriptions s
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'finance@cloudnine.co' AND p.sku = 'AI-VED-016';

INSERT INTO public.subscription_products (subscription_id, product_id, quantity, unit_price, discount_type, discount_value, is_active)
SELECT s.id, p.id, 3, 64.00, 'percentage', 10.00, true
FROM public.subscriptions s
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'finance@cloudnine.co' AND p.sku = 'AI-TTS-012';

INSERT INTO public.subscription_products (subscription_id, product_id, quantity, unit_price, discount_type, discount_value, is_active)
SELECT s.id, p.id, 5, 39.00, 'value', 4.00, true
FROM public.subscriptions s
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'finance@cloudnine.co' AND p.sku = 'AI-SUB-018';

-- AutoDev Labs (Professional) - developer tools
INSERT INTO public.subscription_products (subscription_id, product_id, quantity, unit_price, discount_type, discount_value, is_active)
SELECT s.id, p.id, 15, 109.00, 'percentage', 12.00, true
FROM public.subscriptions s
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'ops@autodevlabs.com' AND p.sku = 'AI-COD-023';

INSERT INTO public.subscription_products (subscription_id, product_id, quantity, unit_price, discount_type, discount_value, is_active)
SELECT s.id, p.id, 10, 49.00, 'value', 7.00, true
FROM public.subscriptions s
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'ops@autodevlabs.com' AND p.sku = 'AI-TST-024';

INSERT INTO public.subscription_products (subscription_id, product_id, quantity, unit_price, discount_type, discount_value, is_active)
SELECT s.id, p.id, 10, 39.00, 'percentage', 10.00, true
FROM public.subscriptions s
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'ops@autodevlabs.com' AND p.sku = 'AI-DOC-025';

-- SecureInsight (Enterprise) - security focused
INSERT INTO public.subscription_products (subscription_id, product_id, quantity, unit_price, discount_type, discount_value, is_active)
SELECT s.id, p.id, 5, 84.00, 'percentage', 18.00, true
FROM public.subscriptions s
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'procurement@secureinsight.net' AND p.sku = 'AI-ANM-021';

INSERT INTO public.subscription_products (subscription_id, product_id, quantity, unit_price, discount_type, discount_value, is_active)
SELECT s.id, p.id, 3, 74.00, 'percentage', 15.00, true
FROM public.subscriptions s
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'procurement@secureinsight.net' AND p.sku = 'AI-DFD-017';

-- HealthAI Partners (Business) - document processing
INSERT INTO public.subscription_products (subscription_id, product_id, quantity, unit_price, discount_type, discount_value, is_active)
SELECT s.id, p.id, 10, 44.00, 'value', 6.00, true
FROM public.subscriptions s
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'it@healthai.org' AND p.sku = 'AI-OCR-010';

INSERT INTO public.subscription_products (subscription_id, product_id, quantity, unit_price, discount_type, discount_value, is_active)
SELECT s.id, p.id, 4, 149.00, 'percentage', 10.00, true
FROM public.subscriptions s
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'it@healthai.org' AND p.sku = 'AI-LGL-028';

INSERT INTO public.subscription_products (subscription_id, product_id, quantity, unit_price, discount_type, discount_value, is_active)
SELECT s.id, p.id, 5, 49.00, 'percentage', 5.00, true
FROM public.subscriptions s
JOIN public.customers c ON s.customer_id = c.id
CROSS JOIN public.products p
WHERE c.email = 'it@healthai.org' AND p.sku = 'AI-SUM-002';
