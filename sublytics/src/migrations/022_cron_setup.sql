-- ============================================================
-- QUICK START: Recurring Billing Cron Setup
-- ⚠️ IMPORTANT: Run migration 021_recurring_billing_system.sql FIRST
-- This file sets up cron jobs that depend on functions from that migration
-- ============================================================

-- Step 1: Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Grant permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Step 3: Schedule billing job processor (every 6 hours)
SELECT cron.schedule(
  'process-billing-jobs',           -- Job name
  '0 */6 * * *',                    -- Cron expression: every 6 hours
  $$SELECT process_billing_jobs();$$ -- SQL command
);

-- Step 4: Schedule expired trial cancellation (daily at 1 AM)
SELECT cron.schedule(
  'cancel-expired-trials',
  '0 1 * * *',                      -- Daily at 1 AM
  $$SELECT auto_cancel_expired_trials();$$
);

-- Step 5: Schedule upcoming billing job creation (daily at 2 AM)
SELECT cron.schedule(
  'schedule-billing-jobs',
  '0 2 * * *',                      -- Daily at 2 AM
  $$SELECT schedule_upcoming_billing_jobs();$$
);

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check if cron jobs are scheduled
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname IN ('process-billing-jobs', 'cancel-expired-trials', 'schedule-billing-jobs');

-- View recent cron execution history
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;

-- ============================================================
-- MANAGEMENT COMMANDS
-- ============================================================

-- Unschedule a job (if needed)
-- SELECT cron.unschedule('process-billing-jobs');
-- SELECT cron.unschedule('cancel-expired-trials');
-- SELECT cron.unschedule('schedule-billing-jobs');

-- Update job schedule
-- SELECT cron.alter_job(
--   job_id := (SELECT jobid FROM cron.job WHERE jobname = 'process-billing-jobs'),
--   schedule := '0 */3 * * *'  -- Change to every 3 hours
-- );

-- ============================================================
-- MANUAL TESTING
-- ============================================================

-- Manually run billing processor
SELECT * FROM process_billing_jobs();

-- Manually cancel expired trials
SELECT * FROM auto_cancel_expired_trials();

-- Manually schedule upcoming jobs
SELECT * FROM schedule_upcoming_billing_jobs();

-- ============================================================
-- CRON EXPRESSION REFERENCE
-- ============================================================
-- Format: minute hour day month day_of_week
--
-- Examples:
-- '0 * * * *'       - Every hour
-- '0 */6 * * *'     - Every 6 hours
-- '0 0 * * *'       - Daily at midnight
-- '0 1 * * *'       - Daily at 1 AM
-- '0 2 * * *'       - Daily at 2 AM
-- '0 0 * * 0'       - Weekly on Sunday at midnight
-- '0 0 1 * *'       - Monthly on the 1st at midnight
-- '*/15 * * * *'    - Every 15 minutes
-- '0 9,17 * * *'    - Daily at 9 AM and 5 PM

-- ============================================================
-- NOTES
-- ============================================================
-- 1. pg_cron runs in UTC timezone by default
-- 2. Jobs run as the database owner (usually postgres)
-- 3. Failed jobs are logged in cron.job_run_details
-- 4. You can monitor job health via the verification queries
-- 5. For Supabase cloud, cron may require additional setup via support
