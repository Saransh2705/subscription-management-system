import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateRequest } from '@/lib/v1/auth.helper';

/**
 * @swagger
 * /api/v1/quotations/{id}:
 *   get:
 *     summary: Get a quotation by ID
 *     description: Retrieve a single quotation with all details including line items and optional currency conversion
 *     tags:
 *       - Quotations
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The quotation ID
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           example: EUR
 *         description: Currency code for conversion (3-letter code). Defaults to system currency.
 *     responses:
 *       200:
 *         description: Quotation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Quotation'
 *                 conversion:
 *                   type: object
 *                   properties:
 *                     from_currency:
 *                       type: string
 *                     to_currency:
 *                       type: string
 *                     roe_rate:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const requestedCurrency = searchParams.get('currency')?.toUpperCase();

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 400,
            type: 'BadRequest',
            message: 'Invalid quotation ID format',
          },
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get system currency
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('system_currency_code')
      .single();

    if (settingsError) {
      console.error('Settings fetch error:', settingsError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 500,
            type: 'ServerError',
            message: 'Failed to fetch system settings',
          },
        },
        { status: 500 }
      );
    }

    const systemCurrency = settings.system_currency_code;
    const targetCurrency = requestedCurrency || systemCurrency;

    // Validate currency code format (3 letters)
    if (targetCurrency && !/^[A-Z]{3}$/.test(targetCurrency)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 400,
            type: 'BadRequest',
            message: 'Invalid currency code. Must be a 3-letter code (e.g., USD, EUR, GBP)',
          },
        },
        { status: 400 }
      );
    }

    let roeRate = 1.0;
    let conversionInfo = null;

    // Fetch quotation with customer details and line items
    const { data: quotation, error: fetchError } = await supabase
      .from('quotations')
      .select(`
        *,
        customer:customers!quotations_customer_id_fkey(id, name, email, company),
        items:quotation_items(
          id,
          product_id,
          description,
          quantity,
          unit_price,
          total,
          product:products(name, sku)
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 404,
              type: 'NotFound',
              message: 'Quotation not found',
            },
          },
          { status: 404 }
        );
      }

      console.error('Quotation fetch error:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 500,
            type: 'ServerError',
            message: 'Failed to fetch quotation',
          },
        },
        { status: 500 }
      );
    }

    // Apply currency conversion if needed
    if (targetCurrency !== quotation.currency) {
      const { data: roeData, error: roeError } = await supabase
        .from('currency_roe')
        .select('currency_code, currency_name, roe_rate, is_active')
        .eq('currency_code', targetCurrency)
        .eq('is_active', true)
        .single();

      if (roeError || !roeData) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 404,
              type: 'NotFound',
              message: `Currency '${targetCurrency}' not found or inactive in ROE table`,
            },
          },
          { status: 404 }
        );
      }

      roeRate = parseFloat(roeData.roe_rate.toString());
      conversionInfo = {
        from_currency: quotation.currency,
        to_currency: targetCurrency,
        roe_rate: roeRate,
        currency_name: roeData.currency_name,
      };

      // Convert amounts
      quotation.subtotal = parseFloat(quotation.subtotal) * roeRate;
      quotation.tax_amount = parseFloat(quotation.tax_amount) * roeRate;
      quotation.discount_amount = parseFloat(quotation.discount_amount) * roeRate;
      quotation.total = parseFloat(quotation.total) * roeRate;
      quotation.original_currency = quotation.currency;
      quotation.currency = targetCurrency;
      quotation.items = quotation.items.map((item: any) => ({
        ...item,
        unit_price: parseFloat(item.unit_price) * roeRate,
        total: parseFloat(item.total) * roeRate,
        original_unit_price: parseFloat(item.unit_price),
        original_total: parseFloat(item.total),
      }));
    } else {
      // Parse amounts to numbers
      quotation.subtotal = parseFloat(quotation.subtotal);
      quotation.tax_amount = parseFloat(quotation.tax_amount);
      quotation.discount_amount = parseFloat(quotation.discount_amount);
      quotation.total = parseFloat(quotation.total);
      quotation.items = quotation.items.map((item: any) => ({
        ...item,
        unit_price: parseFloat(item.unit_price),
        total: parseFloat(item.total),
      }));
    }

    const response: any = {
      success: true,
      data: quotation,
    };

    if (conversionInfo) {
      response.conversion = conversionInfo;
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Quotation fetch error:', error);
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
