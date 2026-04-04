import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateRequest } from '@/lib/v1/auth.helper';

/**
 * @swagger
 * /api/v1/invoices:
 *   get:
 *     summary: Get all invoices
 *     description: Retrieve all invoices with optional currency conversion using ROE
 *     tags:
 *       - Invoices
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           example: EUR
 *         description: Currency code for conversion (3-letter code). Defaults to system currency.
 *     responses:
 *       200:
 *         description: Invoices retrieved successfully
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
 *                     $ref: '#/components/schemas/Invoice'
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

    // Fetch all invoices
    const { data: invoices, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers!invoices_customer_id_fkey(id, name, email),
        items:invoice_items(
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

    if (fetchError) {
      console.error('Invoices fetch error:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 500,
            type: 'ServerError',
            message: 'Failed to fetch invoices',
          },
        },
        { status: 500 }
      );
    }

    // Convert amounts if needed
    const convertedInvoices = invoices.map((invoice: any) => {
      if (roeRate !== 1.0) {
        return {
          ...invoice,
          subtotal: parseFloat(invoice.subtotal) * roeRate,
          tax_amount: parseFloat(invoice.tax_amount) * roeRate,
          discount_amount: parseFloat(invoice.discount_amount) * roeRate,
          total: parseFloat(invoice.total) * roeRate,
          currency: targetCurrency,
          original_currency: invoice.currency,
          original_total: parseFloat(invoice.total),
          items: invoice.items.map((item: any) => ({
            ...item,
            unit_price: parseFloat(item.unit_price) * roeRate,
            total: parseFloat(item.total) * roeRate,
            original_unit_price: parseFloat(item.unit_price),
            original_total: parseFloat(item.total),
          })),
        };
      }
      return {
        ...invoice,
        subtotal: parseFloat(invoice.subtotal),
        tax_amount: parseFloat(invoice.tax_amount),
        discount_amount: parseFloat(invoice.discount_amount),
        total: parseFloat(invoice.total),
        items: invoice.items.map((item: any) => ({
          ...item,
          unit_price: parseFloat(item.unit_price),
          total: parseFloat(item.total),
        })),
      };
    });

    const response: any = {
      success: true,
      data: convertedInvoices,
    };

    if (conversionInfo) {
      response.conversion = conversionInfo;
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Get invoices error:', error);
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
 * /api/v1/invoices:
 *   post:
 *     summary: Create a new invoice
 *     description: Create a new invoice with line items
 *     tags:
 *       - Invoices
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
 *               - due_date
 *               - items
 *             properties:
 *               customer_id:
 *                 type: string
 *                 format: uuid
 *                 description: Customer ID
 *               subscription_id:
 *                 type: string
 *                 format: uuid
 *                 description: Subscription ID (optional)
 *               due_date:
 *                 type: string
 *                 format: date
 *                 description: Invoice due date
 *               issue_date:
 *                 type: string
 *                 format: date
 *                 description: Invoice issue date (defaults to today)
 *               tax_percent:
 *                 type: number
 *                 description: Tax percentage
 *                 default: 0
 *               discount_percent:
 *                 type: number
 *                 description: Discount percentage
 *                 default: 0
 *               currency:
 *                 type: string
 *                 description: Currency code
 *                 default: USD
 *               notes:
 *                 type: string
 *                 description: Invoice notes
 *               items:
 *                 type: array
 *                 description: Invoice line items
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
 *                       description: Product ID (optional)
 *                     description:
 *                       type: string
 *                       description: Item description
 *                     quantity:
 *                       type: number
 *                       description: Item quantity
 *                     unit_price:
 *                       type: number
 *                       description: Unit price
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Invoice'
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
      subscription_id,
      due_date,
      issue_date,
      tax_percent = 0,
      discount_percent = 0,
      currency = 'USD',
      notes,
      items,
    } = body;

    // Validation
    if (!customer_id || !due_date || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 400,
            type: 'BadRequest',
            message: 'customer_id, due_date, and items are required',
          },
        },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.description || item.quantity === undefined || item.unit_price === undefined) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 400,
              type: 'BadRequest',
              message: 'Each item must have description, quantity, and unit_price',
            },
          },
          { status: 400 }
        );
      }
    }

    const supabase = createAdminClient();

    // Verify customer exists
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
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
    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.quantity) * parseFloat(item.unit_price));
    }, 0);

    const discount_amount = (subtotal * parseFloat(discount_percent)) / 100;
    const subtotal_after_discount = subtotal - discount_amount;
    const tax_amount = (subtotal_after_discount * parseFloat(tax_percent)) / 100;
    const total = subtotal_after_discount + tax_amount;

    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    // Create invoice
    const { data: invoice, error: insertError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        customer_id,
        subscription_id: subscription_id || null,
        status: 'draft',
        issue_date: issue_date || new Date().toISOString().split('T')[0],
        due_date,
        subtotal,
        tax_percent: parseFloat(tax_percent),
        tax_amount,
        discount_percent: parseFloat(discount_percent),
        discount_amount,
        total,
        currency,
        notes: notes || null,
        created_by: null, // NULL = created via API
      })
      .select()
      .single();

    if (insertError) {
      console.error('Invoice creation error:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 500,
            type: 'ServerError',
            message: 'Failed to create invoice',
          },
        },
        { status: 500 }
      );
    }

    // Create invoice items
    const invoiceItems = items.map((item: any) => ({
      invoice_id: invoice.id,
      product_id: item.product_id || null,
      description: item.description,
      quantity: parseFloat(item.quantity),
      unit_price: parseFloat(item.unit_price),
      total: parseFloat(item.quantity) * parseFloat(item.unit_price),
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems);

    if (itemsError) {
      console.error('Invoice items creation error:', itemsError);
      // Rollback: delete the invoice
      await supabase.from('invoices').delete().eq('id', invoice.id);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 500,
            type: 'ServerError',
            message: 'Failed to create invoice items',
          },
        },
        { status: 500 }
      );
    }

    // Fetch complete invoice with items
    const { data: completeInvoice } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers!invoices_customer_id_fkey(id, name, email),
        items:invoice_items(
          id,
          product_id,
          description,
          quantity,
          unit_price,
          total,
          product:products(name, sku)
        )
      `)
      .eq('id', invoice.id)
      .single();

    return NextResponse.json(
      {
        success: true,
        data: completeInvoice,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Invoice creation error:', error);
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
