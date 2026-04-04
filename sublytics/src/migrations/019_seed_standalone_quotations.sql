-- ============================================================
-- 019: Seed Standalone Quotations Data
-- Sample quotations as standalone product packages
-- ============================================================

-- Clean up any existing quotation data first
DELETE FROM public.quotation_items;
DELETE FROM public.quotations;

-- ============================================================
-- 1. QUOTATIONS (Standalone product packages)
-- ============================================================

-- Quotation 1: Enterprise AI Suite Package
INSERT INTO public.quotations (quotation_number, title, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
VALUES (
  'QUO-2026-001',
  'Enterprise AI Suite Package',
  'sent',
  CURRENT_DATE - INTERVAL '15 days',
  CURRENT_DATE + INTERVAL '15 days',
  3450.00,
  18.00,
  621.00,
  10.00,
  345.00,
  3726.00,
  'USD',
  'Comprehensive AI toolkit for enterprise deployment with text generation, chatbot, email writer & sentiment analysis'
);

-- Quotation 2: Q2 2026 Analytics & Prediction Bundle
INSERT INTO public.quotations (quotation_number, title, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
VALUES (
  'QUO-2026-002',
  'Q2 2026 Analytics & Prediction Bundle',
  'sent',
  CURRENT_DATE - INTERVAL '10 days',
  CURRENT_DATE + INTERVAL '20 days',
  2850.00,
  18.00,
  513.00,
  5.00,
  142.50,
  3220.50,
  'USD',
  'Complete analytics and prediction suite for data-driven decision making'
);

-- Quotation 3: Video & Audio Production AI Suite
INSERT INTO public.quotations (quotation_number, title, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
VALUES (
  'QUO-2026-003',
  'Video & Audio Production AI Suite',
  'accepted',
  CURRENT_DATE - INTERVAL '8 days',
  CURRENT_DATE + INTERVAL '22 days',
  3080.00,
  18.00,
  554.40,
  15.00,
  462.00,
  3172.40,
  'USD',
  'Complete video editing, audio enhancement and AI production tools package'
);

-- Quotation 4: Image Generation & Enhancement Starter Pack
INSERT INTO public.quotations (quotation_number, title, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
VALUES (
  'QUO-2026-004',
  'Image Generation & Enhancement Starter Pack',
  'draft',
  CURRENT_DATE - INTERVAL '5 days',
  CURRENT_DATE + INTERVAL '25 days',
  1895.00,
  18.00,
  341.10,
  0.00,
  0.00,
  2236.10,
  'USD',
  'Image generation and enhancement tools for designers and content creators'
);

-- Quotation 5: Multi-Language Translation Suite
INSERT INTO public.quotations (quotation_number, title, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
VALUES (
  'QUO-2026-005',
  'Multi-Language Translation Suite',
  'sent',
  CURRENT_DATE - INTERVAL '12 days',
  CURRENT_DATE + INTERVAL '18 days',
  6290.00,
  18.00,
  1132.20,
  8.00,
  503.20,
  6919.00,
  'USD',
  'Professional translation and localization package for global content'
);

-- Quotation 6: Developer AI Tools Package
INSERT INTO public.quotations (quotation_number, title, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
VALUES (
  'QUO-2026-006',
  'Developer AI Tools Package',
  'accepted',
  CURRENT_DATE - INTERVAL '18 days',
  CURRENT_DATE + INTERVAL '12 days',
  1602.00,
  18.00,
  288.36,
  12.00,
  192.24,
  1698.12,
  'USD',
  'Code generation, debugging, and documentation tools for development teams'
);

-- Quotation 7: Security & Fraud Detection Suite
INSERT INTO public.quotations (quotation_number, title, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
VALUES (
  'QUO-2026-007',
  'Security & Fraud Detection Suite',
  'sent',
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '23 days',
  2320.00,
  18.00,
  417.60,
  5.00,
  116.00,
  2621.60,
  'USD',
  'AI-powered security monitoring and fraud detection for financial services'
);

-- Quotation 8: Marketing Automation Essentials
INSERT INTO public.quotations (quotation_number, title, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
VALUES (
  'QUO-2026-008',
  'Marketing Automation Essentials',
  'draft',
  CURRENT_DATE - INTERVAL '3 days',
  CURRENT_DATE + INTERVAL '27 days',
  2145.00,
  18.00,
  386.10,
  0.00,
  0.00,
  2531.10,
  'USD',
  'Essential marketing automation tools including ad copy, social media & SEO'
);

-- Quotation 9: Healthcare AI Analysis Package
INSERT INTO public.quotations (quotation_number, title, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
VALUES (
  'QUO-2026-009',
  'Healthcare AI Analysis Package',
  'sent',
  CURRENT_DATE - INTERVAL '14 days',
  CURRENT_DATE + INTERVAL '16 days',
  2580.00,
  18.00,
  464.40,
  20.00,
  516.00,
  2528.40,
  'USD',
  'Medical imaging analysis, patient data insights, and diagnostic assistance'
);

-- Quotation 10: E-Commerce Optimization Bundle
INSERT INTO public.quotations (quotation_number, title, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
VALUES (
  'QUO-2026-010',
  'E-Commerce Optimization Bundle',
  'rejected',
  CURRENT_DATE - INTERVAL '25 days',
  CURRENT_DATE - INTERVAL '5 days',
  3750.00,
  18.00,
  675.00,
  0.00,
  0.00,
  4425.00,
  'USD',
  'Product recommendations, dynamic pricing, and customer behavior analysis'
);

-- ============================================================
-- 2. QUOTATION ITEMS (Product details for each quotation)
-- ============================================================

-- Quotation 1 Items: Enterprise AI Suite Package
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Text Generator - Enterprise License', 50, 49.00, 2450.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-001' AND p.sku = 'AI-TXT-001';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Chatbot Builder - 10 Concurrent Bots', 10, 79.00, 790.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-001' AND p.sku = 'AI-CHT-005';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Email Writer - Marketing Team License', 5, 34.00, 170.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-001' AND p.sku = 'AI-EML-026';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Sentiment Analysis Engine - API Access', 2, 20.00, 40.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-001' AND p.sku = 'AI-SNT-004';

-- Quotation 2 Items: Q2 2026 Analytics & Prediction Bundle
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Predictive Analytics Engine - Team License', 15, 129.00, 1935.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-002' AND p.sku = 'AI-PAN-019';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Data Visualization Studio - Annual Subscription', 5, 149.00, 745.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-002' AND p.sku = 'AI-DVS-029';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Business Intelligence Dashboard - Pro Plan', 3, 56.67, 170.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-002' AND p.sku = 'AI-BID-027';

-- Quotation 3 Items: Video & Audio Production AI Suite
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Video Editor - Studio License (3 seats)', 3, 99.00, 297.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-003' AND p.sku = 'AI-VED-016';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Audio Noise Reducer - Professional Pack', 50, 29.00, 1450.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-003' AND p.sku = 'AI-ANR-015';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Voice Cloning Suite - Premium License', 10, 99.00, 990.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-003' AND p.sku = 'AI-VCL-014';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Music Composer - Commercial Use', 7, 49.00, 343.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-003' AND p.sku = 'AI-MUS-013';

-- Quotation 4 Items: Image Generation & Enhancement Starter Pack
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Image Generator - Designer Edition', 25, 69.00, 1725.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-004' AND p.sku = 'AI-IMG-006';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Image Upscaler - Enhancement Pack', 5, 34.00, 170.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-004' AND p.sku = 'AI-UPS-007';

-- Quotation 5 Items: Multi-Language Translation Suite
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Translator Pro - Global License', 100, 59.00, 5900.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-005' AND p.sku = 'AI-TRN-003';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Doc Generator - Enterprise', 10, 39.00, 390.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-005' AND p.sku = 'AI-DOC-025';

-- Quotation 6 Items: Developer AI Tools Package
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Code Assistant - Team License (10 devs)', 10, 109.00, 1090.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-006' AND p.sku = 'AI-COD-023';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI API Test Generator - Annual Subscription', 5, 49.00, 245.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-006' AND p.sku = 'AI-TST-024';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Object Detection API - Pro', 3, 89.00, 267.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-006' AND p.sku = 'AI-OBJ-008';

-- Quotation 7 Items: Security & Fraud Detection Suite
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Deepfake Detector - Financial Services Edition', 20, 74.00, 1480.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-007' AND p.sku = 'AI-DFD-017';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Anomaly Detection System - Enterprise License', 10, 84.00, 840.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-007' AND p.sku = 'AI-ANM-021';

-- Quotation 8 Items: Marketing Automation Essentials
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Subtitle Generator - Marketing Agency Pack', 40, 39.00, 1560.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-008' AND p.sku = 'AI-SUB-018';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Summarizer - Pro Plan', 10, 29.00, 290.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-008' AND p.sku = 'AI-SUM-002';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Data Classifier - Annual License', 5, 59.00, 295.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-008' AND p.sku = 'AI-DCL-020';

-- Quotation 9 Items: Healthcare AI Analysis Package
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Legal Analyzer - Hospital License', 15, 149.00, 2235.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-009' AND p.sku = 'AI-LGL-028';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Resume Screener - Analytics Module', 5, 69.00, 345.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-009' AND p.sku = 'AI-HRS-027';

-- Quotation 10 Items: E-Commerce Optimization Bundle
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Recommendation Engine - E-commerce', 30, 94.00, 2820.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-010' AND p.sku = 'AI-REC-022';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'OCR Document Scanner - Retail License', 15, 44.00, 660.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-010' AND p.sku = 'AI-OCR-010';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Speech-to-Text Engine - Pro Plan', 5, 54.00, 270.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-010' AND p.sku = 'AI-STT-011';

-- ============================================================
-- Migration Complete
-- ============================================================
