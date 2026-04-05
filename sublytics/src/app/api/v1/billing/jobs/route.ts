import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateRequest } from '@/lib/v1/auth.helper';

/**
 * @swagger
 * /api/v1/billing/jobs:
 *   get:
 *     summary: Get billing jobs
 *     description: Retrieve billing jobs with optional filters
 *     tags:
 *       - Billing
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subscription_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by subscription ID
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by customer ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled]
 *         description: Filter by job status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of jobs to return
 *     responses:
 *       200:
 *         description: Billing jobs retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);

    if (auth.error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 401,
            type: 'Unauthorized',
            message: auth.error,
          },
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscription_id');
    const customerId = searchParams.get('customer_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = createAdminClient();

    let query = supabase
      .from('recurring_billing_jobs')
      .select(`
        *,
        subscription:subscriptions!recurring_billing_jobs_subscription_id_fkey(
          id,
          status,
          next_billing_date,
          plan:subscription_plans(name, price, currency)
        ),
        customer:customers!recurring_billing_jobs_customer_id_fkey(id, name, email)
      `)
      .order('scheduled_date', { ascending: false })
      .limit(limit);

    if (subscriptionId) query = query.eq('subscription_id', subscriptionId);
    if (customerId) query = query.eq('customer_id', customerId);
    if (status) query = query.eq('status', status);

    const { data: jobs, error: fetchError } = await query;

    if (fetchError) {
      console.error('Billing jobs fetch error:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 500,
            type: 'ServerError',
            message: 'Failed to fetch billing jobs',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: jobs,
        count: jobs.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get billing jobs error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 500,
          type: 'ServerError',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/v1/billing/jobs:
 *   post:
 *     summary: Create a billing job
 *     description: Schedule a new billing job for a subscription
 *     tags:
 *       - Billing
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscription_id
 *               - scheduled_date
 *             properties:
 *               subscription_id:
 *                 type: string
 *                 format: uuid
 *                 description: Subscription UUID
 *               scheduled_date:
 *                 type: string
 *                 format: date
 *                 description: Date to process billing (YYYY-MM-DD)
 *               job_type:
 *                 type: string
 *                 enum: [recurring_charge, trial_end, renewal]
 *                 default: recurring_charge
 *                 description: Type of billing job
 *               max_retries:
 *                 type: integer
 *                 default: 3
 *                 description: Maximum retry attempts
 *     responses:
 *       201:
 *         description: Billing job created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Subscription not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);

    if (auth.error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 401,
            type: 'Unauthorized',
            message: auth.error,
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      subscription_id,
      scheduled_date,
      job_type = 'recurring_charge',
      max_retries = 3,
    } = body;

    // Validation
    if (!subscription_id || !scheduled_date) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 400,
            type: 'BadRequest',
            message: 'subscription_id and scheduled_date are required',
          },
        },
        { status: 400 }
      );
    }

    // Validate job_type
    const validJobTypes = ['recurring_charge', 'trial_end', 'renewal'];
    if (!validJobTypes.includes(job_type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 400,
            type: 'BadRequest',
            message: 'Invalid job_type. Must be one of: recurring_charge, trial_end, renewal',
          },
        },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(scheduled_date)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 400,
            type: 'BadRequest',
            message: 'Invalid date format. Use YYYY-MM-DD',
          },
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify subscription exists and is active
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, customer_id, status')
      .eq('id', subscription_id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 404,
            type: 'NotFound',
            message: 'Subscription not found',
          },
        },
        { status: 404 }
      );
    }

    if (subscription.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 400,
            type: 'BadRequest',
            message: `Cannot create billing job for ${subscription.status} subscription`,
          },
        },
        { status: 400 }
      );
    }

    // Check for duplicate jobs
    const { data: existingJob } = await supabase
      .from('recurring_billing_jobs')
      .select('id')
      .eq('subscription_id', subscription_id)
      .eq('scheduled_date', scheduled_date)
      .in('status', ['pending', 'processing'])
      .single();

    if (existingJob) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 400,
            type: 'BadRequest',
            message: 'A billing job already exists for this subscription and date',
          },
        },
        { status: 400 }
      );
    }

    // Create billing job
    const { data: job, error: jobError } = await supabase
      .from('recurring_billing_jobs')
      .insert({
        subscription_id,
        customer_id: subscription.customer_id,
        job_type,
        scheduled_date,
        status: 'pending',
        max_retries,
      })
      .select(`
        *,
        subscription:subscriptions!recurring_billing_jobs_subscription_id_fkey(
          id,
          status,
          plan:subscription_plans(name, price, currency)
        ),
        customer:customers!recurring_billing_jobs_customer_id_fkey(id, name, email)
      `)
      .single();

    if (jobError) {
      console.error('Job creation error:', jobError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 500,
            type: 'ServerError',
            message: 'Failed to create billing job',
          },
        },
        { status: 500 }
      );
    }

    console.log('✅ Billing job created:', job.id, 'for', scheduled_date);

    return NextResponse.json(
      {
        success: true,
        data: job,
        message: 'Billing job scheduled successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create billing job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 500,
          type: 'ServerError',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
