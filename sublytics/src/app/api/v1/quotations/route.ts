import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateRequest } from '@/lib/v1/auth.helper';

/**
 * @swagger
 * /api/v1/quotations:
 *   get:
 *     summary: Get all quotations
 *     description: Retrieve all quotations with optional currency conversion using ROE
 *     tags:
 *       - Quotations
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           example: EUR
 *         description: Currency code for conversion (3-letter code). Defaults to system currency.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, sent, accepted, rejected, expired]
 *         description: Filter by quotation status
 *     responses:
 *       200:
 *         description: Quotations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Quotation'
 *                 conversion:
 *                   type: object
 *                   properties:
 *                     from_currency:
 *                       type: string
 *                     to_currency:
 *                       type: string
 *                     roe_rate:
 *                       type: number
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Currency not found in ROE table
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
    const requestedCurrency = searchParams.get('currency')?.toUpperCase();
    const statusFilter = searchParams.get('status');

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

    // If requesting a different currency, fetch ROE rate
    if (targetCurrency !== systemCurrency) {
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
        from_currency: systemCurrency,
        to_currency: targetCurrency,
        roe_rate: roeRate,
        currency_name: roeData.currency_name,
      };
    }

    // Build query
    let query = supabase
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
      .order('issue_date', { ascending: false });

    // Apply status filter if provided
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data: quotations, error: fetchError } = await query;

    if (fetchError) {
      console.error('Quotations fetch error:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 500,
            type: 'ServerError',
            message: 'Failed to fetch quotations',
          },
        },
        { status: 500 }
      );
    }

    // Convert amounts if needed
    const convertedQuotations = quotations.map((quotation: any) => {
      if (roeRate !== 1.0) {
        return {
          ...quotation,
          subtotal: parseFloat(quotation.subtotal) * roeRate,
          tax_amount: parseFloat(quotation.tax_amount) * roeRate,
          discount_amount: parseFloat(quotation.discount_amount) * roeRate,
          total: parseFloat(quotation.total) * roeRate,
          currency: targetCurrency,
          original_currency: quotation.currency,
          original_total: parseFloat(quotation.total),
          items: quotation.items.map((item: any) => ({
            ...item,
            unit_price: parseFloat(item.unit_price) * roeRate,
            total: parseFloat(item.total) * roeRate,
            original_unit_price: parseFloat(item.unit_price),
            original_total: parseFloat(item.total),
          })),
        };
      }
      return {
        ...quotation,
        subtotal: parseFloat(quotation.subtotal),
        tax_amount: parseFloat(quotation.tax_amount),
        discount_amount: parseFloat(quotation.discount_amount),
        total: parseFloat(quotation.total),
        items: quotation.items.map((item: any) => ({
          ...item,
          unit_price: parseFloat(item.unit_price),
          total: parseFloat(item.total),
        })),
      };
    });

    const response: any = {
      success: true,
      data: convertedQuotations,
    };

    if (conversionInfo) {
      response.conversion = conversionInfo;
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Get quotations error:', error);
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
 * /api/v1/quotations:
 *   post:
 *     summary: Create a new quotation
 *     description: Create a new quotation with optional currency specification
 *     tags:
 *       - Quotations
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - valid_until
 *               - items
 *             properties:
 *               customer_id:
 *                 type: string
 *                 format: uuid
 *                 description: Customer UUID
 *               valid_until:
 *                 type: string
 *                 format: date
 *                 description: Quotation validity date (YYYY-MM-DD)
 *               currency:
 *                 type: string
 *                 example: USD
 *                 description: Currency code (3-letter). Defaults to system currency.
 *               issue_date:
 *                 type: string
 *                 format: date
 *                 description: Issue date (defaults to today)
 *               tax_percent:
 *                 type: number
 *                 example: 18
 *                 description: Tax percentage
 *               discount_percent:
 *                 type: number
 *                 example: 10
 *                 description: Discount percentage
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *               items:
 *                 type: array
 *                 description: Quotation line items
 *                 items:
 *                   type: object
 *                   required:
 *                     - description
 *                     - quantity
 *                     - unit_price
 *                   properties:
 *                     product_id:
 *                       type: string
 *                       format: uuid
 *                       description: Product UUID (optional)
 *                     description:
 *                       type: string
 *                       description: Item description
 *                     quantity:
 *                       type: number
 *                       example: 5
 *                     unit_price:
 *                       type: number
 *                       example: 100.00
 *     responses:
 *       201:
 *         description: Quotation created successfully
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
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
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

    const body = await request.json();
    const {
      customer_id,
      valid_until,
      currency,
      issue_date,
      tax_percent = 0,
      discount_percent = 0,
      notes,
      items,
    } = body;

    // Validation
    if (!customer_id || !valid_until || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 400,
            type: 'BadRequest',
            message: 'Missing required fields: customer_id, valid_until, items (non-empty array)',
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
    const quotationCurrency = currency || systemCurrency;

    // Validate currency
    if (quotationCurrency && !/^[A-Z]{3}$/.test(quotationCurrency)) {
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

    // Verify customer exists
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name, email')
      .eq('id', customer_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 404,
            type: 'NotFound',
            message: 'Customer not found',
          },
        },
        { status: 404 }
      );
    }

    // Calculate totals
    let subtotal = 0;
    const validatedItems = items.map((item: any) => {
      const quantity = parseFloat(item.quantity);
      const unitPrice = parseFloat(item.unit_price);
      const itemTotal = quantity * unitPrice;
      subtotal += itemTotal;

      return {
        product_id: item.product_id || null,
        description: item.description,
        quantity,
        unit_price: unitPrice,
        total: itemTotal,
      };
    });

    const taxAmount = (subtotal * parseFloat(tax_percent.toString())) / 100;
    const discountAmount = (subtotal * parseFloat(discount_percent.toString())) / 100;
    const total = subtotal + taxAmount - discountAmount;

    // Generate quotation number
    const { data: lastQuotation } = await supabase
      .from('quotations')
      .select('quotation_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let quotationNumber = 'QUO-0001';
    if (lastQuotation?.quotation_number) {
      const lastNumber = parseInt(lastQuotation.quotation_number.split('-')[1] || '0');
      quotationNumber = `QUO-${String(lastNumber + 1).padStart(4, '0')}`;
    }

    // Create quotation
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .insert({
        quotation_number: quotationNumber,
        customer_id,
        status: 'draft',
        issue_date: issue_date || new Date().toISOString().split('T')[0],
        valid_until,
        subtotal,
        tax_percent: parseFloat(tax_percent.toString()),
        tax_amount: taxAmount,
        discount_percent: parseFloat(discount_percent.toString()),
        discount_amount: discountAmount,
        total,
        currency: quotationCurrency,
        notes,
        created_by: null, // NULL = created via API
      })
      .select()
      .single();

    if (quotationError) {
      console.error('Quotation creation error:', quotationError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 500,
            type: 'ServerError',
            message: 'Failed to create quotation',
          },
        },
        { status: 500 }
      );
    }

    // Create quotation items
    const itemsToInsert = validatedItems.map((item: any) => ({
      ...item,
      quotation_id: quotation.id,
    }));

    const { error: itemsError } = await supabase
      .from('quotation_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Quotation items creation error:', itemsError);
      // Rollback: delete the quotation
      await supabase.from('quotations').delete().eq('id', quotation.id);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 500,
            type: 'ServerError',
            message: 'Failed to create quotation items',
          },
        },
        { status: 500 }
      );
    }

    // Fetch complete quotation with items
    const { data: completeQuotation } = await supabase
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
      .eq('id', quotation.id)
      .single();

    console.log('✅ Quotation created:', quotationNumber, 'Currency:', quotationCurrency);

    return NextResponse.json(
      {
        success: true,
        data: completeQuotation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create quotation error:', error);
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
