-- ============================================================
-- 023: Seed Billing Cycles Data
-- Creates sample recurring billing jobs for testing
-- ============================================================

-- ============================================================
-- STEP 1: Insert sample subscriptions (if they don't exist)
-- ============================================================

-- Get or create sample customers and plans first
DO $$
DECLARE
  v_customer1_id UUID;
  v_customer2_id UUID;
  v_customer3_id UUID;
  v_customer4_id UUID;
  v_customer5_id UUID;
  v_plan_starter_id UUID;
  v_plan_pro_id UUID;
  v_plan_business_id UUID;
  v_plan_enterprise_id UUID;
  v_sub1_id UUID;
  v_sub2_id UUID;
  v_sub3_id UUID;
  v_sub4_id UUID;
  v_sub5_id UUID;
  v_sub6_id UUID;
  v_sub7_id UUID;
  v_sub8_id UUID;
BEGIN
  -- Get existing customers or use first 5
  SELECT id INTO v_customer1_id FROM public.customers ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO v_customer2_id FROM public.customers ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO v_customer3_id FROM public.customers ORDER BY created_at LIMIT 1 OFFSET 2;
  SELECT id INTO v_customer4_id FROM public.customers ORDER BY created_at LIMIT 1 OFFSET 3;
  SELECT id INTO v_customer5_id FROM public.customers ORDER BY created_at LIMIT 1 OFFSET 4;

  -- Get existing plans
  SELECT id INTO v_plan_starter_id FROM public.subscription_plans WHERE name = 'Starter' LIMIT 1;
  SELECT id INTO v_plan_pro_id FROM public.subscription_plans WHERE name = 'Professional' LIMIT 1;
  SELECT id INTO v_plan_business_id FROM public.subscription_plans WHERE name = 'Business' LIMIT 1;
  SELECT id INTO v_plan_enterprise_id FROM public.subscription_plans WHERE name = 'Enterprise' LIMIT 1;

  -- If no plans found, get any plans
  IF v_plan_starter_id IS NULL THEN
    SELECT id INTO v_plan_starter_id FROM public.subscription_plans ORDER BY created_at LIMIT 1 OFFSET 0;
  END IF;
  IF v_plan_pro_id IS NULL THEN
    SELECT id INTO v_plan_pro_id FROM public.subscription_plans ORDER BY created_at LIMIT 1 OFFSET 1;
  END IF;
  IF v_plan_business_id IS NULL THEN
    SELECT id INTO v_plan_business_id FROM public.subscription_plans ORDER BY created_at LIMIT 1 OFFSET 2;
  END IF;
  IF v_plan_enterprise_id IS NULL THEN
    SELECT id INTO v_plan_enterprise_id FROM public.subscription_plans ORDER BY created_at LIMIT 1 OFFSET 3;
  END IF;

  -- Only proceed if we have customers and plans
  IF v_customer1_id IS NOT NULL AND v_plan_starter_id IS NOT NULL THEN
    
    -- Insert subscriptions for billing cycles
    INSERT INTO public.subscriptions (customer_id, plan_id, status, start_date, next_billing_date, trial_end_date)
    VALUES 
      (v_customer1_id, v_plan_pro_id, 'active', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '5 days', NULL),
      (v_customer2_id, v_plan_business_id, 'active', CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE + INTERVAL '15 days', NULL),
      (v_customer3_id, v_plan_starter_id, 'trial', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days', CURRENT_DATE + INTERVAL '4 days'),
      (v_customer4_id, v_plan_enterprise_id, 'active', CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '275 days', NULL),
      (v_customer5_id, v_plan_pro_id, 'active', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '15 days', NULL)
    ON CONFLICT DO NOTHING;

    -- Get subscription IDs
    SELECT id INTO v_sub1_id FROM public.subscriptions WHERE customer_id = v_customer1_id AND plan_id = v_plan_pro_id ORDER BY created_at DESC LIMIT 1;
    SELECT id INTO v_sub2_id FROM public.subscriptions WHERE customer_id = v_customer2_id AND plan_id = v_plan_business_id ORDER BY created_at DESC LIMIT 1;
    SELECT id INTO v_sub3_id FROM public.subscriptions WHERE customer_id = v_customer3_id AND plan_id = v_plan_starter_id ORDER BY created_at DESC LIMIT 1;
    SELECT id INTO v_sub4_id FROM public.subscriptions WHERE customer_id = v_customer4_id AND plan_id = v_plan_enterprise_id ORDER BY created_at DESC LIMIT 1;
    SELECT id INTO v_sub5_id FROM public.subscriptions WHERE customer_id = v_customer5_id AND plan_id = v_plan_pro_id ORDER BY created_at DESC LIMIT 1;

    -- Create additional subscriptions if we have more customers
    IF (SELECT COUNT(*) FROM public.customers) >= 8 THEN
      SELECT id INTO v_customer1_id FROM public.customers ORDER BY created_at LIMIT 1 OFFSET 5;
      SELECT id INTO v_customer2_id FROM public.customers ORDER BY created_at LIMIT 1 OFFSET 6;
      SELECT id INTO v_customer3_id FROM public.customers ORDER BY created_at LIMIT 1 OFFSET 7;

      INSERT INTO public.subscriptions (customer_id, plan_id, status, start_date, next_billing_date, trial_end_date)
      VALUES 
        (v_customer1_id, v_plan_starter_id, 'active', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, NULL),
        (v_customer2_id, v_plan_business_id, 'inactive', CURRENT_DATE - INTERVAL '40 days', CURRENT_DATE - INTERVAL '5 days', NULL),
        (v_customer3_id, v_plan_pro_id, 'trial', CURRENT_DATE - INTERVAL '12 days', CURRENT_DATE + INTERVAL '18 days', CURRENT_DATE + INTERVAL '2 days')
      ON CONFLICT DO NOTHING;

      SELECT id INTO v_sub6_id FROM public.subscriptions WHERE customer_id = v_customer1_id AND plan_id = v_plan_starter_id ORDER BY created_at DESC LIMIT 1;
      SELECT id INTO v_sub7_id FROM public.subscriptions WHERE customer_id = v_customer2_id AND plan_id = v_plan_business_id AND status = 'inactive' ORDER BY created_at DESC LIMIT 1;
      SELECT id INTO v_sub8_id FROM public.subscriptions WHERE customer_id = v_customer3_id AND plan_id = v_plan_pro_id AND status = 'trial' ORDER BY created_at DESC LIMIT 1;
    END IF;

    -- ============================================================
    -- STEP 2: Insert recurring billing jobs
    -- ============================================================

    -- Pending jobs (upcoming billing)
    IF v_sub1_id IS NOT NULL THEN
      INSERT INTO public.recurring_billing_jobs (
        subscription_id, customer_id, job_type, scheduled_date, status, retry_count, max_retries, metadata
      ) VALUES (
        v_sub1_id, v_customer1_id, 'recurring_charge', CURRENT_DATE + INTERVAL '5 days', 'pending', 0, 3,
        '{"amount": 99.00, "currency": "USD", "billing_cycle": "monthly"}'::jsonb
      );
    END IF;

    IF v_sub2_id IS NOT NULL THEN
      INSERT INTO public.recurring_billing_jobs (
        subscription_id, customer_id, job_type, scheduled_date, status, retry_count, max_retries, metadata
      ) VALUES (
        v_sub2_id, v_customer2_id, 'recurring_charge', CURRENT_DATE + INTERVAL '15 days', 'pending', 0, 3,
        '{"amount": 249.00, "currency": "USD", "billing_cycle": "monthly"}'::jsonb
      );
    END IF;

    IF v_sub3_id IS NOT NULL THEN
      INSERT INTO public.recurring_billing_jobs (
        subscription_id, customer_id, job_type, scheduled_date, status, retry_count, max_retries, metadata
      ) VALUES (
        v_sub3_id, v_customer3_id, 'trial_end', CURRENT_DATE + INTERVAL '4 days', 'pending', 0, 3,
        '{"amount": 29.00, "currency": "USD", "trial_to_paid": true}'::jsonb
      );
    END IF;

    IF v_sub4_id IS NOT NULL THEN
      INSERT INTO public.recurring_billing_jobs (
        subscription_id, customer_id, job_type, scheduled_date, status, retry_count, max_retries, metadata
      ) VALUES (
        v_sub4_id, v_customer4_id, 'renewal', CURRENT_DATE + INTERVAL '275 days', 'pending', 0, 3,
        '{"amount": 599.00, "currency": "USD", "billing_cycle": "annual"}'::jsonb
      );
    END IF;

    IF v_sub5_id IS NOT NULL THEN
      INSERT INTO public.recurring_billing_jobs (
        subscription_id, customer_id, job_type, scheduled_date, status, retry_count, max_retries, metadata
      ) VALUES (
        v_sub5_id, v_customer5_id, 'recurring_charge', CURRENT_DATE + INTERVAL '15 days', 'pending', 0, 3,
        '{"amount": 99.00, "currency": "USD", "billing_cycle": "monthly"}'::jsonb
      );
    END IF;

    -- Processing jobs (currently running)
    IF v_sub6_id IS NOT NULL THEN
      INSERT INTO public.recurring_billing_jobs (
        subscription_id, customer_id, job_type, scheduled_date, status, retry_count, max_retries, metadata, updated_at
      ) VALUES (
        v_sub6_id, (SELECT customer_id FROM public.subscriptions WHERE id = v_sub6_id), 
        'recurring_charge', CURRENT_DATE, 'processing', 0, 3,
        '{"amount": 29.00, "currency": "USD", "billing_cycle": "monthly", "payment_gateway": "stripe"}'::jsonb,
        NOW() - INTERVAL '2 minutes'
      );
    END IF;

    -- Completed jobs (successful billing)
    IF v_sub1_id IS NOT NULL THEN
      INSERT INTO public.recurring_billing_jobs (
        subscription_id, customer_id, job_type, scheduled_date, status, retry_count, max_retries, metadata, completed_at
      ) VALUES 
        (
          v_sub1_id, v_customer1_id, 'recurring_charge', CURRENT_DATE - INTERVAL '30 days', 'completed', 0, 3,
          '{"amount": 99.00, "currency": "USD", "billing_cycle": "monthly", "invoice_id": "INV-2024-001"}'::jsonb,
          NOW() - INTERVAL '30 days'
        ),
        (
          v_sub1_id, v_customer1_id, 'recurring_charge', CURRENT_DATE - INTERVAL '60 days', 'completed', 0, 3,
          '{"amount": 99.00, "currency": "USD", "billing_cycle": "monthly", "invoice_id": "INV-2024-002"}'::jsonb,
          NOW() - INTERVAL '60 days'
        );
    END IF;

    IF v_sub2_id IS NOT NULL THEN
      INSERT INTO public.recurring_billing_jobs (
        subscription_id, customer_id, job_type, scheduled_date, status, retry_count, max_retries, metadata, completed_at
      ) VALUES (
        v_sub2_id, v_customer2_id, 'recurring_charge', CURRENT_DATE - INTERVAL '15 days', 'completed', 0, 3,
        '{"amount": 249.00, "currency": "USD", "billing_cycle": "monthly", "invoice_id": "INV-2024-003"}'::jsonb,
        NOW() - INTERVAL '15 days'
      );
    END IF;

    IF v_sub4_id IS NOT NULL THEN
      INSERT INTO public.recurring_billing_jobs (
        subscription_id, customer_id, job_type, scheduled_date, status, retry_count, max_retries, metadata, completed_at
      ) VALUES (
        v_sub4_id, v_customer4_id, 'recurring_charge', CURRENT_DATE - INTERVAL '365 days', 'completed', 0, 3,
        '{"amount": 599.00, "currency": "USD", "billing_cycle": "annual", "invoice_id": "INV-2023-999"}'::jsonb,
        NOW() - INTERVAL '365 days'
      );
    END IF;

    -- Failed jobs (payment failed)
    IF v_sub7_id IS NOT NULL THEN
      INSERT INTO public.recurring_billing_jobs (
        subscription_id, customer_id, job_type, scheduled_date, status, retry_count, max_retries, 
        last_retry_at, error_message, metadata, execution_log
      ) VALUES (
        v_sub7_id, (SELECT customer_id FROM public.subscriptions WHERE id = v_sub7_id),
        'recurring_charge', CURRENT_DATE - INTERVAL '5 days', 'failed', 2, 3,
        NOW() - INTERVAL '1 day',
        'Payment declined: Insufficient funds',
        '{"amount": 249.00, "currency": "USD", "billing_cycle": "monthly"}'::jsonb,
        '[
          {"attempt": 1, "timestamp": "2024-03-30T10:00:00Z", "status": "failed", "error": "Payment declined"},
          {"attempt": 2, "timestamp": "2024-03-31T10:00:00Z", "status": "failed", "error": "Payment declined: Insufficient funds"}
        ]'::jsonb
      );
    END IF;

    IF v_sub5_id IS NOT NULL THEN
      INSERT INTO public.recurring_billing_jobs (
        subscription_id, customer_id, job_type, scheduled_date, status, retry_count, max_retries, 
        last_retry_at, error_message, metadata, execution_log
      ) VALUES (
        v_sub5_id, v_customer5_id,
        'recurring_charge', CURRENT_DATE - INTERVAL '2 days', 'failed', 1, 3,
        NOW() - INTERVAL '12 hours',
        'Payment gateway timeout',
        '{"amount": 99.00, "currency": "USD", "billing_cycle": "monthly"}'::jsonb,
        '[
          {"attempt": 1, "timestamp": "2024-04-03T14:30:00Z", "status": "failed", "error": "Gateway timeout after 30s"}
        ]'::jsonb
      );
    END IF;

    -- Cancelled jobs
    IF v_sub8_id IS NOT NULL THEN
      INSERT INTO public.recurring_billing_jobs (
        subscription_id, customer_id, job_type, scheduled_date, status, retry_count, max_retries, metadata
      ) VALUES (
        v_sub8_id, (SELECT customer_id FROM public.subscriptions WHERE id = v_sub8_id),
        'trial_end', CURRENT_DATE - INTERVAL '1 day', 'cancelled', 0, 3,
        '{"amount": 99.00, "currency": "USD", "reason": "Customer downgraded before trial ended"}'::jsonb
      );
    END IF;

    -- Additional completed jobs for statistics
    IF v_sub3_id IS NOT NULL THEN
      INSERT INTO public.recurring_billing_jobs (
        subscription_id, customer_id, job_type, scheduled_date, status, retry_count, max_retries, metadata, completed_at
      ) VALUES (
        v_sub3_id, v_customer3_id, 'recurring_charge', CURRENT_DATE - INTERVAL '45 days', 'completed', 0, 3,
        '{"amount": 29.00, "currency": "USD", "billing_cycle": "monthly", "invoice_id": "INV-2024-004"}'::jsonb,
        NOW() - INTERVAL '45 days'
      );
    END IF;

    RAISE NOTICE 'Billing cycles seed data inserted successfully';
  ELSE
    RAISE NOTICE 'Skipping billing cycles seed: No customers or plans found. Please run migrations 001 and 009 first.';
  END IF;
END $$;

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Check insertion results
DO $$
DECLARE
  v_total_jobs INTEGER;
  v_pending INTEGER;
  v_processing INTEGER;
  v_completed INTEGER;
  v_failed INTEGER;
  v_cancelled INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_jobs FROM public.recurring_billing_jobs;
  SELECT COUNT(*) INTO v_pending FROM public.recurring_billing_jobs WHERE status = 'pending';
  SELECT COUNT(*) INTO v_processing FROM public.recurring_billing_jobs WHERE status = 'processing';
  SELECT COUNT(*) INTO v_completed FROM public.recurring_billing_jobs WHERE status = 'completed';
  SELECT COUNT(*) INTO v_failed FROM public.recurring_billing_jobs WHERE status = 'failed';
  SELECT COUNT(*) INTO v_cancelled FROM public.recurring_billing_jobs WHERE status = 'cancelled';

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Billing Cycles Seed Summary:';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Total Jobs: %', v_total_jobs;
  RAISE NOTICE 'Pending: %', v_pending;
  RAISE NOTICE 'Processing: %', v_processing;
  RAISE NOTICE 'Completed: %', v_completed;
  RAISE NOTICE 'Failed: %', v_failed;
  RAISE NOTICE 'Cancelled: %', v_cancelled;
  RAISE NOTICE '==============================================';
END $$;
