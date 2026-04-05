import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateRequest } from '@/lib/v1/auth.helper';

/**
 * @swagger
 * /api/v1/billing/process:
 *   post:
 *     summary: Manually process billing jobs
 *     description: Trigger billing job processing manually (useful for testing or immediate processing)
 *     tags:
 *       - Billing
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               job_id:
 *                 type: string
 *                 format: uuid
 *                 description: Process a specific job (optional). If not provided, processes all pending jobs.
 *               force:
 *                 type: boolean
 *                 default: false
 *                 description: Force process even if not due yet
 *     responses:
 *       200:
 *         description: Billing jobs processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobs_processed:
 *                       type: integer
 *                     jobs_succeeded:
 *                       type: integer
 *                     jobs_failed:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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

    const body = await request.json().catch(() => ({}));
    const { job_id, force = false } = body;

    const supabase = createAdminClient();

    console.log('🔄 Processing billing jobs...');

    // Call the PostgreSQL function to process jobs
    const { data, error } = await supabase.rpc('process_billing_jobs');

    if (error) {
      console.error('❌ Billing processing error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 500,
            type: 'ServerError',
            message: 'Failed to process billing jobs',
            details: error.message,
          },
        },
        { status: 500 }
      );
    }

    const result = data && data.length > 0 ? data[0] : { jobs_processed: 0, jobs_succeeded: 0, jobs_failed: 0 };

    console.log('✅ Billing processing complete:');
    console.log(`   Processed: ${result.jobs_processed}`);
    console.log(`   Succeeded: ${result.jobs_succeeded}`);
    console.log(`   Failed: ${result.jobs_failed}`);

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: `Processed ${result.jobs_processed} billing jobs`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Process billing jobs error:', error);
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
