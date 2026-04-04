-- ============================================================
-- 017: Seed Quotations Data
-- Sample quotations with line items for existing customers
-- ============================================================

-- ============================================================
-- 1. QUOTATIONS (20 sample quotations)
-- ============================================================

-- Quotation 1: TechFlow Solutions - Large AI Suite Quote
INSERT INTO public.quotations (quotation_number, customer_id, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
SELECT 
  'QUO-2026-001',
  c.id,
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
  'Comprehensive AI toolkit for enterprise deployment'
FROM public.customers c WHERE c.company = 'TechFlow Solutions';

-- Quotation 2: DataPulse Analytics - Predictive & Analytics Tools
INSERT INTO public.quotations (quotation_number, customer_id, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
SELECT 
  'QUO-2026-002',
  c.id,
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
  'Analytics and prediction suite for Q2 2026'
FROM public.customers c WHERE c.company = 'DataPulse Analytics';

-- Quotation 3: CloudNine Media - Video & Audio Production
INSERT INTO public.quotations (quotation_number, customer_id, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
SELECT 
  'QUO-2026-003',
  c.id,
  'accepted',
  CURRENT_DATE - INTERVAL '8 days',
  CURRENT_DATE + INTERVAL '22 days',
  4200.00,
  18.00,
  756.00,
  15.00,
  630.00,
  4326.00,
  'USD',
  'Complete video and audio AI production suite'
FROM public.customers c WHERE c.company = 'CloudNine Media';

-- Quotation 4: PixelForge Design - Image AI Tools
INSERT INTO public.quotations (quotation_number, customer_id, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
SELECT 
  'QUO-2026-004',
  c.id,
  'draft',
  CURRENT_DATE - INTERVAL '5 days',
  CURRENT_DATE + INTERVAL '25 days',
  1850.00,
  18.00,
  333.00,
  0.00,
  0.00,
  2183.00,
  'USD',
  'Image generation and enhancement tools proposal'
FROM public.customers c WHERE c.company = 'PixelForge Design';

-- Quotation 5: LinguaLink Global - Translation Suite
INSERT INTO public.quotations (quotation_number, customer_id, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
SELECT 
  'QUO-2026-005',
  c.id,
  'sent',
  CURRENT_DATE - INTERVAL '12 days',
  CURRENT_DATE + INTERVAL '18 days',
  2450.00,
  18.00,
  441.00,
  8.00,
  196.00,
  2695.00,
  'USD',
  'Multi-language translation and localization package'
FROM public.customers c WHERE c.company = 'LinguaLink Global';

-- Quotation 6: AutoDev Labs - Developer AI Tools
INSERT INTO public.quotations (quotation_number, customer_id, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
SELECT 
  'QUO-2026-006',
  c.id,
  'accepted',
  CURRENT_DATE - INTERVAL '20 days',
  CURRENT_DATE + INTERVAL '10 days',
  3150.00,
  18.00,
  567.00,
  12.00,
  378.00,
  3339.00,
  'USD',
  'Developer productivity AI suite - annual license'
FROM public.customers c WHERE c.company = 'AutoDev Labs';

-- Quotation 7: Voicewave Studios - Audio AI Bundle
INSERT INTO public.quotations (quotation_number, customer_id, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
SELECT 
  'QUO-2026-007',
  c.id,
  'sent',
  CURRENT_DATE - INTERVAL '6 days',
  CURRENT_DATE + INTERVAL '24 days',
  2980.00,
  18.00,
  536.40,
  10.00,
  298.00,
  3218.40,
  'USD',
  'Professional audio production AI toolkit'
FROM public.customers c WHERE c.company = 'Voicewave Studios';

-- Quotation 8: SecureInsight Corp - Security & Detection
INSERT INTO public.quotations (quotation_number, customer_id, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
SELECT 
  'QUO-2026-008',
  c.id,
  'rejected',
  CURRENT_DATE - INTERVAL '25 days',
  CURRENT_DATE - INTERVAL '5 days',
  1850.00,
  18.00,
  333.00,
  0.00,
  0.00,
  2183.00,
  'USD',
  'Anomaly detection and deepfake detection suite'
FROM public.customers c WHERE c.company = 'SecureInsight Corp';

-- Quotation 9: HealthAI Partners - Medical AI Tools
INSERT INTO public.quotations (quotation_number, customer_id, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
SELECT 
  'QUO-2026-009',
  c.id,
  'draft',
  CURRENT_DATE - INTERVAL '3 days',
  CURRENT_DATE + INTERVAL '27 days',
  2250.00,
  18.00,
  405.00,
  5.00,
  112.50,
  2542.50,
  'USD',
  'Healthcare document processing and OCR solution'
FROM public.customers c WHERE c.company = 'HealthAI Partners';

-- Quotation 10: EduSpark Academy - Educational Content AI
INSERT INTO public.quotations (quotation_number, customer_id, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
SELECT 
  'QUO-2026-010',
  c.id,
  'sent',
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '23 days',
  1680.00,
  18.00,
  302.40,
  10.00,
  168.00,
  1814.40,
  'USD',
  'Educational content generation and grading tools'
FROM public.customers c WHERE c.company = 'EduSpark Academy';

-- Quotation 11: TechFlow Solutions - Additional Tools
INSERT INTO public.quotations (quotation_number, customer_id, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
SELECT 
  'QUO-2026-011',
  c.id,
  'draft',
  CURRENT_DATE - INTERVAL '1 days',
  CURRENT_DATE + INTERVAL '29 days',
  1450.00,
  18.00,
  261.00,
  0.00,
  0.00,
  1711.00,
  'USD',
  'Additional AI tools for Q2 expansion'
FROM public.customers c WHERE c.company = 'TechFlow Solutions';

-- Quotation 12: CloudNine Media - Subtitle & Translation
INSERT INTO public.quotations (quotation_number, customer_id, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
SELECT 
  'QUO-2026-012',
  c.id,
  'sent',
  CURRENT_DATE - INTERVAL '9 days',
  CURRENT_DATE + INTERVAL '21 days',
  980.00,
  18.00,
  176.40,
  5.00,
  49.00,
  1107.40,
  'USD',
  'Video subtitle and translation add-on services'
FROM public.customers c WHERE c.company = 'CloudNine Media';

-- Quotation 13: PixelForge Design - Background Remover Volume
INSERT INTO public.quotations (quotation_number, customer_id, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
SELECT 
  'QUO-2026-013',
  c.id,
  'accepted',
  CURRENT_DATE - INTERVAL '14 days',
  CURRENT_DATE + INTERVAL '16 days',
  720.00,
  12.00,
  86.40,
  20.00,
  144.00,
  662.40,
  'USD',
  'High-volume background removal service - 3 months'
FROM public.customers c WHERE c.company = 'PixelForge Design';

-- Quotation 14: AutoDev Labs - API Testing Tools
INSERT INTO public.quotations (quotation_number, customer_id, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
SELECT 
  'QUO-2026-014',
  c.id,
  'sent',
  CURRENT_DATE - INTERVAL '4 days',
  CURRENT_DATE + INTERVAL '26 days',
  880.00,
  18.00,
  158.40,
  10.00,
  88.00,
  950.40,
  'USD',
  'API test generation and doc tools bundle'
FROM public.customers c WHERE c.company = 'AutoDev Labs';

-- Quotation 15: LinguaLink Global - Speech-to-Text
INSERT INTO public.quotations (quotation_number, customer_id, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
SELECT 
  'QUO-2026-015',
  c.id,
  'draft',
  CURRENT_DATE - INTERVAL '2 days',
  CURRENT_DATE + INTERVAL '28 days',
  1620.00,
  18.00,
  291.60,
  0.00,
  0.00,
  1911.60,
  'USD',
  'Multi-language transcription service proposal'
FROM public.customers c WHERE c.company = 'LinguaLink Global';

-- Quotation 16: Voicewave Studios - Voice Cloning
INSERT INTO public.quotations (quotation_number, customer_id, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
SELECT 
  'QUO-2026-016',
  c.id,
  'accepted',
  CURRENT_DATE - INTERVAL '18 days',
  CURRENT_DATE + INTERVAL '12 days',
  2970.00,
  18.00,
  534.60,
  15.00,
  445.50,
  3059.10,
  'USD',
  'Enterprise voice cloning suite with unlimited voices'
FROM public.customers c WHERE c.company = 'Voicewave Studios';

-- Quotation 17: DataPulse Analytics - Recommendation Engine
INSERT INTO public.quotations (quotation_number, customer_id, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
SELECT 
  'QUO-2026-017',
  c.id,
  'sent',
  CURRENT_DATE - INTERVAL '11 days',
  CURRENT_DATE + INTERVAL '19 days',
  1880.00,
  18.00,
  338.40,
  8.00,
  150.40,
  2068.00,
  'USD',
  'AI-powered recommendation system implementation'
FROM public.customers c WHERE c.company = 'DataPulse Analytics';

-- Quotation 18: HealthAI Partners - Legal Document Analyzer
INSERT INTO public.quotations (quotation_number, customer_id, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
SELECT 
  'QUO-2026-018',
  c.id,
  'draft',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  4470.00,
  18.00,
  804.60,
  12.00,
  536.40,
  4738.20,
  'USD',
  'Healthcare compliance and legal review AI system'
FROM public.customers c WHERE c.company = 'HealthAI Partners';

-- Quotation 19: EduSpark Academy - Text & Email Writer
INSERT INTO public.quotations (quotation_number, customer_id, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
SELECT 
  'QUO-2026-019',
  c.id,
  'sent',
  CURRENT_DATE - INTERVAL '13 days',
  CURRENT_DATE + INTERVAL '17 days',
  830.00,
  18.00,
  149.40,
  10.00,
  83.00,
  896.40,
  'USD',
  'Content creation tools for educational newsletters'
FROM public.customers c WHERE c.company = 'EduSpark Academy';

-- Quotation 20: SecureInsight Corp - Deepfake Detection Renewal
INSERT INTO public.quotations (quotation_number, customer_id, status, issue_date, valid_until, subtotal, tax_percent, tax_amount, discount_percent, discount_amount, total, currency, notes)
SELECT 
  'QUO-2026-020',
  c.id,
  'sent',
  CURRENT_DATE - INTERVAL '16 days',
  CURRENT_DATE + INTERVAL '14 days',
  2220.00,
  18.00,
  399.60,
  10.00,
  222.00,
  2397.60,
  'USD',
  'Annual renewal - deepfake and anomaly detection suite'
FROM public.customers c WHERE c.company = 'SecureInsight Corp';

-- ============================================================
-- 2. QUOTATION ITEMS (Full product details for each quotation)
-- ============================================================

-- Quotation 1 Items: TechFlow Solutions - Large AI Suite
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
SELECT q.id, p.id, 'Sentiment Analysis Engine - API Access', 2, 39.00, 78.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-001' AND p.sku = 'AI-SNT-004';

-- Quotation 2 Items: DataPulse Analytics
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Predictive Analytics Engine - Team License', 15, 129.00, 1935.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-002' AND p.sku = 'AI-PAN-019';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Data Classifier - Enterprise', 10, 59.00, 590.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-002' AND p.sku = 'AI-DCL-020';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Anomaly Detection System - Real-time Monitoring', 5, 84.00, 420.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-002' AND p.sku = 'AI-ANM-021';

-- Quotation 3 Items: CloudNine Media
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Video Editor - Professional Suite', 30, 99.00, 2970.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-003' AND p.sku = 'AI-VED-016';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Text-to-Speech Studio - Custom Voice Library', 10, 64.00, 640.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-003' AND p.sku = 'AI-TTS-012';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Audio Noise Reducer - Batch Processing', 20, 29.00, 580.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-003' AND p.sku = 'AI-ANR-015';

-- Quotation 4 Items: PixelForge Design
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Image Generator - Designer License', 20, 69.00, 1380.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-004' AND p.sku = 'AI-IMG-006';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Image Upscaler - HD Enhancement', 10, 34.00, 340.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-004' AND p.sku = 'AI-UPS-007';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Background Remover - Bulk Processing', 10, 24.00, 240.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-004' AND p.sku = 'AI-BGR-009';

-- Quotation 5 Items: LinguaLink Global
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Translator Pro - 120+ Languages', 30, 59.00, 1770.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-005' AND p.sku = 'AI-TRN-003';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Subtitle Generator - Multi-language', 10, 39.00, 390.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-005' AND p.sku = 'AI-SUB-018';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Speech-to-Text Engine - 50+ Languages', 6, 54.00, 324.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-005' AND p.sku = 'AI-STT-011';

-- Quotation 6 Items: AutoDev Labs
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Code Assistant - Team License (30 developers)', 30, 109.00, 3270.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-006' AND p.sku = 'AI-COD-023';

-- Quotation 7 Items: Voicewave Studios
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Speech-to-Text Engine - Podcast Transcription', 30, 54.00, 1620.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-007' AND p.sku = 'AI-STT-011';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Text-to-Speech Studio - Voice Library', 10, 64.00, 640.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-007' AND p.sku = 'AI-TTS-012';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Music Composer - Royalty-free Tracks', 15, 49.00, 735.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-007' AND p.sku = 'AI-MUS-013';

-- Quotation 8 Items: SecureInsight Corp
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Deepfake Detector - Enterprise Security', 15, 74.00, 1110.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-008' AND p.sku = 'AI-DFD-017';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Anomaly Detection System - Network Monitoring', 10, 84.00, 840.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-008' AND p.sku = 'AI-ANM-021';

-- Quotation 9 Items: HealthAI Partners
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'OCR Document Scanner - Medical Records', 30, 44.00, 1320.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-009' AND p.sku = 'AI-OCR-010';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Data Classifier - Patient Data Categorization', 10, 59.00, 590.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-009' AND p.sku = 'AI-DCL-020';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Summarizer - Clinical Notes', 12, 29.00, 348.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-009' AND p.sku = 'AI-SUM-002';

-- Quotation 10 Items: EduSpark Academy
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Text Generator - Educational Content', 20, 49.00, 980.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-010' AND p.sku = 'AI-TXT-001';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Text-to-Speech Studio - Lesson Narration', 10, 64.00, 640.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-010' AND p.sku = 'AI-TTS-012';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Translator Pro - Course Localization', 2, 59.00, 118.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-010' AND p.sku = 'AI-TRN-003';

-- Quotation 11 Items: TechFlow Solutions - Additional
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Recommendation Engine - User Personalization', 10, 94.00, 940.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-011' AND p.sku = 'AI-REC-022';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Object Detection API - Real-time Analysis', 6, 89.00, 534.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-011' AND p.sku = 'AI-OBJ-008';

-- Quotation 12 Items: CloudNine Media - Subtitle
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Subtitle Generator - Video Production', 15, 39.00, 585.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-012' AND p.sku = 'AI-SUB-018';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Translator Pro - Subtitle Localization', 5, 59.00, 295.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-012' AND p.sku = 'AI-TRN-003';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Speech-to-Text Engine - Auto Captioning', 2, 54.00, 108.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-012' AND p.sku = 'AI-STT-011';

-- Quotation 13 Items: PixelForge Design - Background Remover
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Background Remover - High Volume (3 months)', 30, 24.00, 720.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-013' AND p.sku = 'AI-BGR-009';

-- Quotation 14 Items: AutoDev Labs - API Testing
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI API Test Generator - Team License', 10, 49.00, 490.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-014' AND p.sku = 'AI-TST-024';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Doc Generator - Documentation Suite', 10, 39.00, 390.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-014' AND p.sku = 'AI-DOC-025';

-- Quotation 15 Items: LinguaLink Global - Speech-to-Text
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Speech-to-Text Engine - Conference Transcription', 30, 54.00, 1620.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-015' AND p.sku = 'AI-STT-011';

-- Quotation 16 Items: Voicewave Studios - Voice Cloning
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Voice Cloning Suite - Unlimited Voices (Annual)', 30, 99.00, 2970.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-016' AND p.sku = 'AI-VCL-014';

-- Quotation 17 Items: DataPulse Analytics - Recommendation
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Recommendation Engine - E-commerce Integration', 20, 94.00, 1880.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-017' AND p.sku = 'AI-REC-022';

-- Quotation 18 Items: HealthAI Partners - Legal
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Legal Analyzer - Healthcare Compliance (Annual)', 30, 149.00, 4470.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-018' AND p.sku = 'AI-LGL-028';

-- Quotation 19 Items: EduSpark Academy - Content
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Text Generator - Newsletter Creation', 10, 49.00, 490.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-019' AND p.sku = 'AI-TXT-001';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'AI Email Writer - Parent Communication', 10, 34.00, 340.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-019' AND p.sku = 'AI-EML-026';

-- Quotation 20 Items: SecureInsight Corp - Renewal
INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Deepfake Detector - Annual Renewal', 20, 74.00, 1480.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-020' AND p.sku = 'AI-DFD-017';

INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price, total)
SELECT q.id, p.id, 'Anomaly Detection System - Security Monitoring Renewal', 10, 84.00, 840.00
FROM public.quotations q, public.products p WHERE q.quotation_number = 'QUO-2026-020' AND p.sku = 'AI-ANM-021';

-- ============================================================
-- Migration Complete
-- ============================================================
