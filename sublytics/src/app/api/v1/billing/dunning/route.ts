import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateRequest } from '@/lib/v1/auth.helper';

/**
 * @swagger
 * /api/v1/billing/dunning:
 *   get:
 *     summary: Get dunning attempts
 *     description: Retrieve dunning attempt history (payment failure notifications)
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
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of attempts to return
 *     responses:
 *       200:
 *         description: Dunning attempts retrieved successfully
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
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = createAdminClient();

    let query = supabase
      .from('dunning_attempts')
      .select(`
        *,
        subscription:subscriptions!dunning_attempts_subscription_id_fkey(
          id,
          status,
          plan:subscription_plans(name)
        ),
        customer:customers!dunning_attempts_customer_id_fkey(id, name, email),
        payment_attempt:payment_attempts(id, status, amount, currency, failure_reason)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (subscriptionId) query = query.eq('subscription_id', subscriptionId);
    if (customerId) query = query.eq('customer_id', customerId);

    const { data: dunning, error: fetchError } = await query;

    if (fetchError) {
      console.error('Dunning attempts fetch error:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 500,
            type: 'ServerError',
            message: 'Failed to fetch dunning attempts',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: dunning,
        count: dunning.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get dunning attempts error:', error);
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
