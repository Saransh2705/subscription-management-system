# Recurring Billing System

## Overview

Automated recurring billing system with job scheduling, payment retry logic, dunning management, and subscription lifecycle automation using Supabase pg_cron.

---

## Architecture

### **Components**

1. **Database Tables** (Migration 021)
   - `recurring_billing_jobs` - Scheduled billing tasks
   - `payment_attempts` - Payment transaction history
   - `dunning_attempts` - Payment failure notifications

2. **Stored Procedures**
   - `process_billing_jobs()` - Main billing processor
   - `auto_cancel_expired_trials()` - Trial management
   - `schedule_upcoming_billing_jobs()` - Auto-scheduling

3. **API Endpoints**
   - `POST /api/v1/billing/jobs` - Create billing job
   - `GET /api/v1/billing/jobs` - List billing jobs
   - `POST /api/v1/billing/process` - Manual trigger
   - `POST /api/v1/billing/webhook` - Payment gateway callbacks
   - `GET /api/v1/billing/payment-attempts` - Payment history
   - `GET /api/v1/billing/dunning` - Dunning attempts

4. **Cron Jobs** (Supabase pg_cron)
   - Every 6 hours: Process billing jobs
   - Daily 1 AM: Cancel expired trials
   - Daily 2 AM: Schedule upcoming jobs

---

## Setup Instructions

### **1. Run Migration**

```sql
-- Execute migration 021
-- File: src/migrations/021_recurring_billing_system.sql
```

### **2. Enable pg_cron Extension (Supabase Dashboard)**

Go to Supabase SQL Editor and run:

```sql
-- Enable pg_cron (requires superuser)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
```

### **3. Schedule Cron Jobs**

Run these in Supabase SQL Editor:

```sql
-- Process billing jobs every 6 hours
SELECT cron.schedule(
  'process-billing-jobs',
  '0 */6 * * *',
  $$SELECT process_billing_jobs();$$
);

-- Cancel expired trials daily at 1 AM
SELECT cron.schedule(
  'cancel-expired-trials',
  '0 1 * * *',
  $$SELECT auto_cancel_expired_trials();$$
);

-- Schedule upcoming jobs daily at 2 AM
SELECT cron.schedule(
  'schedule-billing-jobs',
  '0 2 * * *',
  $$SELECT schedule_upcoming_billing_jobs();$$
);
```

### **4. Verify Cron Jobs**

```sql
-- List all scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

## API Usage

### **Create Billing Job**

```bash
POST /api/v1/billing/jobs
Authorization: Bearer <token>

{
  "subscription_id": "uuid",
  "scheduled_date": "2026-05-01",
  "job_type": "recurring_charge",
  "max_retries": 3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "job-uuid",
    "subscription_id": "sub-uuid",
    "customer_id": "cust-uuid",
    "scheduled_date": "2026-05-01",
    "status": "pending",
    "retry_count": 0
  }
}
```

### **List Billing Jobs**

```bash
GET /api/v1/billing/jobs?status=pending&limit=50
Authorization: Bearer <token>
```

### **Manually Process Jobs**

```bash
POST /api/v1/billing/process
Authorization: Bearer <token>

{}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs_processed": 10,
    "jobs_succeeded": 8,
    "jobs_failed": 2
  }
}
```

### **Payment Gateway Webhook**

```bash
POST /api/v1/billing/webhook

{
  "payment_session_id": "ps_abc123",
  "status": "succeeded",
  "gateway": "stripe",
  "gateway_payment_id": "pi_xyz789"
}
```

For Stripe/Razorpay integration, add signature verification in webhook handler.

### **View Payment Attempts**

```bash
GET /api/v1/billing/payment-attempts?subscription_id=uuid
Authorization: Bearer <token>
```

### **View Dunning Attempts**

```bash
GET /api/v1/billing/dunning?customer_id=uuid
Authorization: Bearer <token>
```

---

## How It Works

### **Billing Flow**

```
1. Subscription Created → next_billing_date set
2. Cron schedules billing job 7 days before due date
3. On due date, cron processes job:
   - Creates invoice
   - Creates payment attempt
   - Initiates payment (simulation or real gateway)
4. Payment result:
   SUCCESS → Mark complete, schedule next job
   FAILURE → Retry logic + dunning notifications
5. Max retries → Suspend subscription
```

### **Job States**

- **pending** - Scheduled, waiting for execution
- **processing** - Currently being processed
- **completed** - Successfully processed
- **failed** - Failed but can retry
- **cancelled** - Cancelled (max retries or manual)

### **Payment Retry Logic**

```
Attempt 1: Immediate
Attempt 2: +3 days (Reminder email)
Attempt 3: +6 days (Warning email)
Attempt 4: +9 days (Final notice)
Max retries → Subscription suspended
```

### **Dunning Stages**

1. **Stage 1** - Friendly reminder
2. **Stage 2** - Payment warning
3. **Stage 3** - Final notice (14-day grace period)

---

## Payment Gateway Integration

### **Current State: Simulation Mode**

The system currently simulates payments with 80% success rate for testing.

### **Integrate Stripe**

1. Install Stripe SDK:
```bash
npm install stripe
```

2. Update `process_billing_jobs()` function:
```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Replace simulation with:
const paymentIntent = await stripe.paymentIntents.create({
  amount: amount * 100, // cents
  currency: currency.toLowerCase(),
  customer: stripeCustomerId,
  metadata: { subscription_id }
});
```

3. Configure webhook endpoint:
```bash
stripe listen --forward-to localhost:3000/api/v1/billing/webhook
```

### **Integrate Razorpay**

1. Install Razorpay SDK:
```bash
npm install razorpay
```

2. Update billing processor:
```typescript
import Razorpay from 'razorpay';
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const order = await razorpay.orders.create({
  amount: amount * 100, // paise
  currency,
  receipt: `sub_${subscription_id}`
});
```

---

## Monitoring

### **Check Job Status**

```sql
-- Pending jobs
SELECT COUNT(*) FROM recurring_billing_jobs WHERE status = 'pending';

-- Failed jobs needing attention
SELECT * FROM recurring_billing_jobs 
WHERE status = 'failed' AND retry_count >= max_retries;

-- Payment success rate
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM payment_attempts
GROUP BY status;
```

### **Cron Job Health**

```sql
-- Recent cron executions
SELECT 
  jobid,
  jobname,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

---

## Testing

### **1. Create Test Subscription**

```bash
POST /api/v1/subscriptions
{
  "customer_id": "uuid",
  "plan_id": "uuid",
  "start_immediately": true
}
```

### **2. Schedule Test Job**

```bash
POST /api/v1/billing/jobs
{
  "subscription_id": "sub-uuid",
  "scheduled_date": "2026-04-05", // Today
  "job_type": "recurring_charge"
}
```

### **3. Manually Process**

```bash
POST /api/v1/billing/process
```

### **4. Check Results**

```bash
GET /api/v1/billing/payment-attempts?subscription_id=uuid
GET /api/v1/billing/jobs?subscription_id=uuid
```

---

## Database Schema

### **recurring_billing_jobs**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| subscription_id | UUID | Subscription reference |
| customer_id | UUID | Customer reference |
| job_type | TEXT | recurring_charge, trial_end, renewal |
| scheduled_date | DATE | When to process |
| status | TEXT | pending, processing, completed, failed, cancelled |
| retry_count | INTEGER | Current retry attempt |
| max_retries | INTEGER | Max attempts (default 3) |
| execution_log | JSONB | Execution history |
| metadata | JSONB | Additional data |

### **payment_attempts**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| subscription_id | UUID | Subscription reference |
| billing_job_id | UUID | Job reference |
| invoice_id | UUID | Invoice reference |
| amount | NUMERIC | Payment amount |
| currency | TEXT | Currency code |
| payment_gateway | TEXT | stripe, razorpay, simulation |
| status | TEXT | pending, succeeded, failed |
| gateway_response | JSONB | Raw gateway response |

### **dunning_attempts**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| subscription_id | UUID | Subscription reference |
| payment_attempt_id | UUID | Payment reference |
| dunning_stage | INTEGER | 1=reminder, 2=warning, 3=final |
| notification_type | TEXT | email, sms, whatsapp |
| next_retry_date | DATE | Next retry attempt |
| grace_period_end | DATE | Suspension date |

---

## Troubleshooting

### **Jobs Not Processing**

1. Check pg_cron is enabled:
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

2. Verify cron jobs are scheduled:
```sql
SELECT * FROM cron.job;
```

3. Check for errors:
```sql
SELECT * FROM cron.job_run_details WHERE status = 'failed';
```

### **Manual Trigger Not Working**

```sql
-- Call function directly
SELECT * FROM process_billing_jobs();
```

### **Jobs Stuck in Processing**

```sql
-- Reset stuck jobs (older than 1 hour)
UPDATE recurring_billing_jobs
SET status = 'pending'
WHERE status = 'processing'
  AND updated_at < NOW() - INTERVAL '1 hour';
```

---

## Production Checklist

- [ ] Enable pg_cron extension
- [ ] Schedule all 3 cron jobs
- [ ] Configure payment gateway (Stripe/Razorpay)
- [ ] Add webhook signature verification
- [ ] Set up monitoring alerts
- [ ] Configure email/SMS for dunning notifications
- [ ] Test payment retry flow
- [ ] Verify subscription lifecycle automation
- [ ] Set up error logging (Sentry, etc.)
- [ ] Review and adjust retry limits

---

## Future Enhancements

- [ ] Support multiple payment methods per customer
- [ ] Proration for mid-cycle upgrades/downgrades
- [ ] Invoice PDF generation
- [ ] Email notifications for dunning stages
- [ ] SMS/WhatsApp payment reminders
- [ ] Analytics dashboard for billing metrics
- [ ] Failed payment recovery campaigns
- [ ] Subscription pause/resume functionality
