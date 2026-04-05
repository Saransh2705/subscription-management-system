-- ============================================================
-- 021: Recurring Billing System
-- Implements automated billing with job tracking and retry logic
-- ============================================================

-- Enable pg_cron extension (requires superuser privileges)
-- Run this separately if needed: CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- RECURRING BILLING JOBS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.recurring_billing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL DEFAULT 'recurring_charge', -- 'recurring_charge', 'trial_end', 'renewal'
  scheduled_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_retry_at TIMESTAMPTZ,
  error_message TEXT,
  execution_log JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add comments
COMMENT ON TABLE public.recurring_billing_jobs IS 'Tracks scheduled billing jobs for subscriptions';
COMMENT ON COLUMN public.recurring_billing_jobs.job_type IS 'Type of billing job (recurring_charge, trial_end, renewal)';
COMMENT ON COLUMN public.recurring_billing_jobs.status IS 'Job execution status (pending, processing, completed, failed, cancelled)';
COMMENT ON COLUMN public.recurring_billing_jobs.retry_count IS 'Number of retry attempts made';
COMMENT ON COLUMN public.recurring_billing_jobs.execution_log IS 'JSON array of execution attempts and results';
COMMENT ON COLUMN public.recurring_billing_jobs.metadata IS 'Additional job metadata (payment details, etc.)';

-- Create indexes
CREATE INDEX idx_recurring_jobs_subscription ON public.recurring_billing_jobs(subscription_id);
CREATE INDEX idx_recurring_jobs_customer ON public.recurring_billing_jobs(customer_id);
CREATE INDEX idx_recurring_jobs_scheduled ON public.recurring_billing_jobs(scheduled_date, status);
CREATE INDEX idx_recurring_jobs_status ON public.recurring_billing_jobs(status);
CREATE INDEX idx_recurring_jobs_processing ON public.recurring_billing_jobs(status, scheduled_date) 
  WHERE status IN ('pending', 'failed');

-- ============================================================
-- PAYMENT ATTEMPTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  billing_job_id UUID REFERENCES public.recurring_billing_jobs(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT, -- 'card', 'bank_transfer', 'wallet', etc.
  payment_gateway TEXT, -- 'stripe', 'razorpay', 'simulation', etc.
  payment_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'succeeded', 'failed', 'cancelled'
  failure_reason TEXT,
  gateway_response JSONB,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add comments
COMMENT ON TABLE public.payment_attempts IS 'Tracks all payment attempt history for auditing and retry logic';
COMMENT ON COLUMN public.payment_attempts.status IS 'Payment attempt status (pending, processing, succeeded, failed, cancelled)';
COMMENT ON COLUMN public.payment_attempts.gateway_response IS 'Raw response from payment gateway';

-- Create indexes
CREATE INDEX idx_payment_attempts_subscription ON public.payment_attempts(subscription_id);
CREATE INDEX idx_payment_attempts_customer ON public.payment_attempts(customer_id);
CREATE INDEX idx_payment_attempts_job ON public.payment_attempts(billing_job_id);
CREATE INDEX idx_payment_attempts_invoice ON public.payment_attempts(invoice_id);
CREATE INDEX idx_payment_attempts_status ON public.payment_attempts(status);
CREATE INDEX idx_payment_attempts_session ON public.payment_attempts(payment_session_id);

-- ============================================================
-- DUNNING MANAGEMENT TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.dunning_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  payment_attempt_id UUID REFERENCES public.payment_attempts(id) ON DELETE SET NULL,
  dunning_stage INTEGER NOT NULL DEFAULT 1, -- 1 = first reminder, 2 = warning, 3 = final notice
  notification_type TEXT NOT NULL, -- 'email', 'sms', 'whatsapp'
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  next_retry_date DATE,
  grace_period_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.dunning_attempts IS 'Manages payment failure notifications and grace periods';
COMMENT ON COLUMN public.dunning_attempts.dunning_stage IS 'Stage of dunning process (1=reminder, 2=warning, 3=final)';

-- Create indexes
CREATE INDEX idx_dunning_subscription ON public.dunning_attempts(subscription_id);
CREATE INDEX idx_dunning_customer ON public.dunning_attempts(customer_id);
CREATE INDEX idx_dunning_retry_date ON public.dunning_attempts(next_retry_date);

-- ============================================================
-- STORED PROCEDURES FOR BILLING AUTOMATION
-- ============================================================

-- Function to process pending billing jobs
CREATE OR REPLACE FUNCTION process_billing_jobs()
RETURNS TABLE(
  jobs_processed INTEGER,
  jobs_succeeded INTEGER,
  jobs_failed INTEGER
) AS $$
DECLARE
  v_jobs_processed INTEGER := 0;
  v_jobs_succeeded INTEGER := 0;
  v_jobs_failed INTEGER := 0;
  job_record RECORD;
  subscription_record RECORD;
  invoice_record RECORD;
  payment_session_id TEXT;
  v_invoice_id UUID;
  v_payment_attempt_id UUID;
BEGIN
  -- Process jobs that are due today or overdue
  FOR job_record IN
    SELECT j.*, s.customer_id, s.plan_id, s.status as sub_status, s.quantity, s.discount_percent
    FROM recurring_billing_jobs j
    JOIN subscriptions s ON j.subscription_id = s.id
    WHERE j.status IN ('pending', 'failed')
      AND j.scheduled_date <= CURRENT_DATE
      AND j.retry_count < j.max_retries
      AND s.status = 'active'
    ORDER BY j.scheduled_date ASC, j.created_at ASC
    LIMIT 100
  LOOP
    -- Mark job as processing
    UPDATE recurring_billing_jobs
    SET status = 'processing', updated_at = NOW()
    WHERE id = job_record.id;

    v_jobs_processed := v_jobs_processed + 1;

    BEGIN
      -- Get subscription details with plan pricing
      SELECT s.*, sp.name as plan_name, sp.price as plan_price, sp.currency
      INTO subscription_record
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.id = job_record.subscription_id;

      -- Calculate billing amount
      DECLARE
        v_amount NUMERIC(12, 2);
        v_currency TEXT;
      BEGIN
        v_amount := subscription_record.plan_price * subscription_record.quantity;
        
        -- Apply discount if any
        IF subscription_record.discount_percent > 0 THEN
          v_amount := v_amount * (1 - subscription_record.discount_percent / 100);
        END IF;

        v_currency := subscription_record.currency;

        -- Generate payment session ID
        payment_session_id := 'ps_' || encode(gen_random_bytes(16), 'hex');

        -- Create invoice for this billing cycle
        INSERT INTO invoices (
          invoice_number,
          customer_id,
          subscription_id,
          status,
          issue_date,
          due_date,
          subtotal,
          tax_percent,
          tax_amount,
          discount_percent,
          discount_amount,
          total,
          currency,
          notes
        ) VALUES (
          'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((random() * 9999)::INTEGER::TEXT, 4, '0'),
          job_record.customer_id,
          job_record.subscription_id,
          'pending_payment',
          CURRENT_DATE,
          CURRENT_DATE + INTERVAL '7 days',
          v_amount,
          0,
          0,
          subscription_record.discount_percent,
          v_amount * subscription_record.discount_percent / 100,
          v_amount,
          v_currency,
          'Subscription renewal - ' || subscription_record.plan_name
        ) RETURNING id INTO v_invoice_id;

        -- Create payment attempt record
        INSERT INTO payment_attempts (
          subscription_id,
          customer_id,
          billing_job_id,
          invoice_id,
          amount,
          currency,
          payment_gateway,
          payment_session_id,
          status
        ) VALUES (
          job_record.subscription_id,
          job_record.customer_id,
          job_record.id,
          v_invoice_id,
          v_amount,
          v_currency,
          'simulation', -- Change to 'stripe' or 'razorpay' when integrated
          payment_session_id,
          'pending'
        ) RETURNING id INTO v_payment_attempt_id;

        -- Update subscription with payment details
        UPDATE subscriptions
        SET 
          payment_session_id = payment_session_id,
          payment_status = 'pending',
          payment_amount = v_amount,
          payment_currency = v_currency,
          updated_at = NOW()
        WHERE id = job_record.subscription_id;

        -- Log execution
        UPDATE recurring_billing_jobs
        SET 
          execution_log = execution_log || jsonb_build_object(
            'timestamp', NOW(),
            'action', 'payment_initiated',
            'invoice_id', v_invoice_id,
            'payment_attempt_id', v_payment_attempt_id,
            'amount', v_amount,
            'currency', v_currency,
            'session_id', payment_session_id
          ),
          metadata = jsonb_build_object(
            'invoice_id', v_invoice_id,
            'payment_attempt_id', v_payment_attempt_id,
            'amount', v_amount,
            'session_id', payment_session_id
          ),
          updated_at = NOW()
        WHERE id = job_record.id;
        
        -- For simulation mode, auto-complete (80% success rate)
        IF random() < 0.8 THEN
          -- Simulate successful payment
          UPDATE payment_attempts
          SET 
            status = 'succeeded',
            completed_at = NOW(),
            gateway_response = jsonb_build_object('status', 'success', 'simulated', true)
          WHERE id = v_payment_attempt_id;

          UPDATE invoices
          SET status = 'paid', paid_at = NOW()
          WHERE id = v_invoice_id;

          UPDATE subscriptions
          SET 
            payment_status = 'completed',
            next_billing_date = CURRENT_DATE + INTERVAL '1 month',
            updated_at = NOW()
          WHERE id = job_record.subscription_id;

          -- Mark job as completed
          UPDATE recurring_billing_jobs
          SET 
            status = 'completed',
            completed_at = NOW(),
            execution_log = execution_log || jsonb_build_object(
              'timestamp', NOW(),
              'action', 'payment_succeeded',
              'message', 'Payment processed successfully (simulated)'
            ),
            updated_at = NOW()
          WHERE id = job_record.id;

          -- Schedule next billing job
          INSERT INTO recurring_billing_jobs (
            subscription_id,
            customer_id,
            job_type,
            scheduled_date,
            status
          ) VALUES (
            job_record.subscription_id,
            job_record.customer_id,
            'recurring_charge',
            CURRENT_DATE + INTERVAL '1 month',
            'pending'
          );

          v_jobs_succeeded := v_jobs_succeeded + 1;
        ELSE
          -- Simulate payment failure
          UPDATE payment_attempts
          SET 
            status = 'failed',
            failure_reason = 'Insufficient funds (simulated)',
            completed_at = NOW(),
            gateway_response = jsonb_build_object('status', 'failed', 'error', 'insufficient_funds', 'simulated', true)
          WHERE id = v_payment_attempt_id;

          UPDATE invoices
          SET status = 'payment_failed'
          WHERE id = v_invoice_id;

          UPDATE subscriptions
          SET payment_status = 'failed'
          WHERE id = job_record.subscription_id;

          -- Update job for retry
          UPDATE recurring_billing_jobs
          SET 
            status = 'failed',
            retry_count = retry_count + 1,
            last_retry_at = NOW(),
            error_message = 'Payment failed: Insufficient funds (simulated)',
            execution_log = execution_log || jsonb_build_object(
              'timestamp', NOW(),
              'action', 'payment_failed',
              'message', 'Payment failed - will retry',
              'attempt', job_record.retry_count + 1
            ),
            updated_at = NOW()
          WHERE id = job_record.id;

          -- Create dunning attempt
          INSERT INTO dunning_attempts (
            subscription_id,
            customer_id,
            payment_attempt_id,
            dunning_stage,
            notification_type,
            next_retry_date,
            grace_period_end
          ) VALUES (
            job_record.subscription_id,
            job_record.customer_id,
            v_payment_attempt_id,
            LEAST(job_record.retry_count + 1, 3),
            'email',
            CURRENT_DATE + INTERVAL '3 days',
            CURRENT_DATE + INTERVAL '14 days'
          );

          v_jobs_failed := v_jobs_failed + 1;

          -- If max retries reached, suspend subscription
          IF job_record.retry_count + 1 >= job_record.max_retries THEN
            UPDATE subscriptions
            SET 
              status = 'suspended',
              end_date = CURRENT_DATE,
              updated_at = NOW()
            WHERE id = job_record.subscription_id;

            UPDATE recurring_billing_jobs
            SET 
              status = 'cancelled',
              error_message = 'Max retries reached - subscription suspended',
              updated_at = NOW()
            WHERE id = job_record.id;
          END IF;
        END IF;
      END;

    EXCEPTION WHEN OTHERS THEN
      -- Handle any errors
      UPDATE recurring_billing_jobs
      SET 
        status = 'failed',
        retry_count = retry_count + 1,
        last_retry_at = NOW(),
        error_message = SQLERRM,
        execution_log = execution_log || jsonb_build_object(
          'timestamp', NOW(),
          'action', 'error',
          'message', SQLERRM
        ),
        updated_at = NOW()
      WHERE id = job_record.id;

      v_jobs_failed := v_jobs_failed + 1;
    END;
  END LOOP;

  RETURN QUERY SELECT v_jobs_processed, v_jobs_succeeded, v_jobs_failed;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION process_billing_jobs IS 'Processes pending billing jobs, creates invoices, and handles payment simulation';

-- ============================================================
-- AUTOMATIC SUBSCRIPTION LIFECYCLE MANAGEMENT
-- ============================================================

-- Function to auto-cancel expired trials
CREATE OR REPLACE FUNCTION auto_cancel_expired_trials()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  UPDATE subscriptions
  SET 
    status = 'cancelled',
    end_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE 
    status = 'trial'
    AND trial_end_date < CURRENT_DATE
    AND trial_end_date IS NOT NULL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to create billing jobs for upcoming renewals
CREATE OR REPLACE FUNCTION schedule_upcoming_billing_jobs()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  subscription_record RECORD;
BEGIN
  -- Create jobs for subscriptions with next_billing_date in next 7 days
  FOR subscription_record IN
    SELECT id, customer_id, next_billing_date
    FROM subscriptions
    WHERE 
      status = 'active'
      AND next_billing_date IS NOT NULL
      AND next_billing_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      AND NOT EXISTS (
        SELECT 1 FROM recurring_billing_jobs
        WHERE subscription_id = subscriptions.id
          AND scheduled_date = subscriptions.next_billing_date
          AND status IN ('pending', 'processing')
      )
  LOOP
    INSERT INTO recurring_billing_jobs (
      subscription_id,
      customer_id,
      job_type,
      scheduled_date,
      status
    ) VALUES (
      subscription_record.id,
      subscription_record.customer_id,
      'recurring_charge',
      subscription_record.next_billing_date,
      'pending'
    );
    
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION schedule_upcoming_billing_jobs IS 'Creates billing jobs for subscriptions with upcoming renewal dates';

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER set_updated_at_recurring_billing_jobs
  BEFORE UPDATE ON public.recurring_billing_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.recurring_billing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dunning_attempts ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role has full access to recurring_billing_jobs"
  ON public.recurring_billing_jobs
  FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role has full access to payment_attempts"
  ON public.payment_attempts
  FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role has full access to dunning_attempts"
  ON public.dunning_attempts
  FOR ALL
  TO service_role
  USING (true);

-- ============================================================
-- CRON JOBS (requires pg_cron extension - run manually if needed)
-- ============================================================

-- Note: These require superuser privileges and pg_cron extension
-- Run these commands separately in your Supabase SQL editor or use 021_cron_setup.sql:

-- Process billing jobs every 6 hours
-- SELECT cron.schedule(
--   'process-billing-jobs',
--   '0 */6 * * *',
--   $$SELECT process_billing_jobs();$$
-- );

-- Auto-cancel expired trials daily at 1 AM
-- SELECT cron.schedule(
--   'cancel-expired-trials',
--   '0 1 * * *',
--   $$SELECT auto_cancel_expired_trials();$$
-- );

-- Schedule upcoming billing jobs daily at 2 AM
-- SELECT cron.schedule(
--   'schedule-billing-jobs',
--   '0 2 * * *',
--   $$SELECT schedule_upcoming_billing_jobs();$$
-- );

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION process_billing_jobs() TO service_role;
GRANT EXECUTE ON FUNCTION auto_cancel_expired_trials() TO service_role;
GRANT EXECUTE ON FUNCTION schedule_upcoming_billing_jobs() TO service_role;
