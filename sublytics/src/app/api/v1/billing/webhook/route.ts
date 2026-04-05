import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * @swagger
 * /api/v1/billing/webhook:
 *   post:
 *     summary: Payment gateway webhook handler
 *     description: Receives payment status updates from payment gateways (Stripe, Razorpay, etc.)
 *     tags:
 *       - Billing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_session_id
 *               - status
 *             properties:
 *               payment_session_id:
 *                 type: string
 *                 description: Payment session ID from your system
 *               status:
 *                 type: string
 *                 enum: [succeeded, failed, cancelled, processing]
 *                 description: Payment status
 *               gateway:
 *                 type: string
 *                 example: stripe
 *                 description: Payment gateway name
 *               gateway_payment_id:
 *                 type: string
 *                 description: Payment ID from the gateway
 *               failure_reason:
 *                 type: string
 *                 description: Reason for payment failure (if applicable)
 *               gateway_response:
 *                 type: object
 *                 description: Full gateway response payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook payload
 *       404:
 *         description: Payment session not found
 *       500:
 *         description: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add webhook signature verification for production
    // For Stripe: stripe.webhooks.constructEvent(body, signature, secret)
    // For Razorpay: razorpay.webhooks.validateWebhookSignature(body, signature, secret)

    const body = await request.json();
    const {
      payment_session_id,
      status,
      gateway = 'unknown',
      gateway_payment_id,
      failure_reason,
      gateway_response,
    } = body;

    // Validation
    if (!payment_session_id || !status) {
      return NextResponse.json(
        {
          success: false,
          error: 'payment_session_id and status are required',
        },
        { status: 400 }
      );
    }

    const validStatuses = ['succeeded', 'failed', 'cancelled', 'processing'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    console.log('🔔 Payment webhook received:');
    console.log(`   Session: ${payment_session_id}`);
    console.log(`   Status: ${status}`);
    console.log(`   Gateway: ${gateway}`);

    // Find the payment attempt by session ID
    const { data: paymentAttempt, error: attemptError } = await supabase
      .from('payment_attempts')
      .select(`
        *,
        subscription:subscriptions!payment_attempts_subscription_id_fkey(id, customer_id),
        billing_job:recurring_billing_jobs(id)
      `)
      .eq('payment_session_id', payment_session_id)
      .single();

    if (attemptError || !paymentAttempt) {
      console.error('❌ Payment session not found:', payment_session_id);
      return NextResponse.json(
        {
          success: false,
          error: 'Payment session not found',
        },
        { status: 404 }
      );
    }

    // Update payment attempt
    const { error: updateError } = await supabase
      .from('payment_attempts')
      .update({
        status,
        failure_reason: status === 'failed' ? failure_reason : null,
        gateway_response: gateway_response || null,
        completed_at: status !== 'processing' ? new Date().toISOString() : null,
      })
      .eq('id', paymentAttempt.id);

    if (updateError) {
      console.error('❌ Failed to update payment attempt:', updateError);
      throw updateError;
    }

    // Handle based on status
    if (status === 'succeeded') {
      console.log('✅ Payment succeeded - updating records...');

      // Update invoice status
      if (paymentAttempt.invoice_id) {
        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
          })
          .eq('id', paymentAttempt.invoice_id);
      }

      // Update subscription
      await supabase
        .from('subscriptions')
        .update({
          payment_status: 'completed',
          next_billing_date: new Date(
            new Date().setMonth(new Date().getMonth() + 1)
          )
            .toISOString()
            .split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentAttempt.subscription_id);

      // Mark billing job as completed
      if (paymentAttempt.billing_job_id) {
        await supabase
          .from('recurring_billing_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            execution_log: supabase.rpc('jsonb_append', {
              target: 'execution_log',
              data: {
                timestamp: new Date().toISOString(),
                action: 'payment_succeeded_webhook',
                gateway,
                gateway_payment_id,
              },
            }),
            updated_at: new Date().toISOString(),
          })
          .eq('id', paymentAttempt.billing_job_id);

        // Schedule next billing job
        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

        await supabase.from('recurring_billing_jobs').insert({
          subscription_id: paymentAttempt.subscription_id,
          customer_id: paymentAttempt.customer_id,
          job_type: 'recurring_charge',
          scheduled_date: nextBillingDate.toISOString().split('T')[0],
          status: 'pending',
        });
      }

      console.log('✅ Payment success webhook processed');
    } else if (status === 'failed') {
      console.log('❌ Payment failed - initiating retry/dunning...');

      // Update invoice status
      if (paymentAttempt.invoice_id) {
        await supabase
          .from('invoices')
          .update({ status: 'payment_failed' })
          .eq('id', paymentAttempt.invoice_id);
      }

      // Update subscription
      await supabase
        .from('subscriptions')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentAttempt.subscription_id);

      // Update billing job for retry
      if (paymentAttempt.billing_job_id) {
        const { data: job } = await supabase
          .from('recurring_billing_jobs')
          .select('retry_count, max_retries')
          .eq('id', paymentAttempt.billing_job_id)
          .single();

        if (job && job.retry_count < job.max_retries) {
          // Schedule retry
          await supabase
            .from('recurring_billing_jobs')
            .update({
              status: 'failed',
              retry_count: job.retry_count + 1,
              last_retry_at: new Date().toISOString(),
              error_message: failure_reason || 'Payment failed via webhook',
              execution_log: supabase.rpc('jsonb_append', {
                target: 'execution_log',
                data: {
                  timestamp: new Date().toISOString(),
                  action: 'payment_failed_webhook',
                  gateway,
                  failure_reason,
                  attempt: job.retry_count + 1,
                },
              }),
              updated_at: new Date().toISOString(),
            })
            .eq('id', paymentAttempt.billing_job_id);

          // Create dunning attempt
          await supabase.from('dunning_attempts').insert({
            subscription_id: paymentAttempt.subscription_id,
            customer_id: paymentAttempt.customer_id,
            payment_attempt_id: paymentAttempt.id,
            dunning_stage: Math.min(job.retry_count + 1, 3),
            notification_type: 'email',
            next_retry_date: new Date(
              new Date().setDate(new Date().getDate() + 3)
            )
              .toISOString()
              .split('T')[0],
            grace_period_end: new Date(
              new Date().setDate(new Date().getDate() + 14)
            )
              .toISOString()
              .split('T')[0],
          });

          console.log(`🔄 Retry scheduled (${job.retry_count + 1}/${job.max_retries})`);
        } else {
          // Max retries reached - suspend subscription
          await supabase
            .from('subscriptions')
            .update({
              status: 'suspended',
              end_date: new Date().toISOString().split('T')[0],
              updated_at: new Date().toISOString(),
            })
            .eq('id', paymentAttempt.subscription_id);

          await supabase
            .from('recurring_billing_jobs')
            .update({
              status: 'cancelled',
              error_message: 'Max retries reached - subscription suspended',
              updated_at: new Date().toISOString(),
            })
            .eq('id', paymentAttempt.billing_job_id);

          console.log('⚠️ Max retries reached - subscription suspended');
        }
      }

      console.log('✅ Payment failure webhook processed');
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Webhook processed successfully',
        payment_status: status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process webhook',
      },
      { status: 500 }
    );
  }
}
