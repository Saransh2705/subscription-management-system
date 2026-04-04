import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateAuthToken } from '@/lib/v1/auth.helper';

/**
 * @swagger
 * /api/v1/auth:
 *   post:
 *     summary: Authenticate and get access token
 *     description: Exchange company credentials for a JWT access token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_id
 *               - company_secret
 *             properties:
 *               company_id:
 *                 type: string
 *                 description: Your company ID
 *               company_secret:
 *                 type: string
 *                 description: Your company secret key
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT access token
 *                 expires_in:
 *                   type: string
 *                   example: '30m'
 *                 token_type:
 *                   type: string
 *                   example: 'Bearer'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: API key is inactive
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company_id, company_secret } = body;

    if (!company_id || !company_secret) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 400,
            type: 'BadRequest',
            message: 'company_id and company_secret are required',
          },
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: apiKey, error: apiKeyError } = await supabase
      .from('company_api_keys')
      .select('id, company_id, company_secret, is_active')
      .eq('company_id', company_id)
      .single();

    if (apiKeyError || !apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 401,
            type: 'Unauthorized',
            message: 'Invalid company_id or company_secret',
          },
        },
        { status: 401 }
      );
    }

    if (!apiKey.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 403,
            type: 'Forbidden',
            message: 'API key is inactive',
          },
        },
        { status: 403 }
      );
    }

    if (apiKey.company_secret !== company_secret) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 401,
            type: 'Unauthorized',
            message: 'Invalid company_id or company_secret',
          },
        },
        { status: 401 }
      );
    }

    const token = await generateAuthToken({
      company_id: apiKey.company_id,
    });

    return NextResponse.json(
      {
        success: true,
        token,
        expires_in: '30m',
        token_type: 'Bearer',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 500,
          type: 'ServerError',
          message: 'An unexpected error occurred during authentication',
        },
      },
      { status: 500 }
    );
  }
}
