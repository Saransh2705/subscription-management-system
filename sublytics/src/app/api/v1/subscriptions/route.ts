import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/v1/auth.helper";

/**
 * @swagger
 * /api/v1/subscriptions:
 *   post:
 *     summary: Create a new subscription
 *     description: Creates a subscription for a customer with a specific plan and generates payment session
 *     tags:
 *       - Subscriptions
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
 *               - plan_id
 *             properties:
 *               customer_id:
 *                 type: string
 *                 format: uuid
 *                 description: Customer UUID
 *               plan_id:
 *                 type: string
 *                 format: uuid
 *                 description: Subscription plan UUID
 *               billing_cycle:
 *                 type: string
 *                 enum: [monthly, quarterly, semi_annual, annual]
 *                 description: Billing cycle for the subscription
 *                 default: monthly
 *               start_immediately:
 *                 type: boolean
 *                 description: Start subscription immediately or after trial
 *                 default: false
 *     responses:
 *       201:
 *         description: Subscription created successfully
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
 *                     subscription_id:
 *                       type: string
 *                     payment_url:
 *                       type: string
 *                     payment_session_id:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 *                     status:
 *                       type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer or plan not found
 *       500:
 *         description: Internal server error
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

    const supabase = createAdminClient();

    const body = await request.json();
    const { customer_id, plan_id, start_immediately = false, billing_cycle = 'monthly' } = body;

    // Validate required fields
    if (!customer_id || !plan_id) {
      return NextResponse.json(
        { success: false, error: "customer_id and plan_id are required" },
        { status: 400 }
      );
    }

    // Validate billing_cycle
    const validCycles = ['monthly', 'quarterly', 'semi_annual', 'annual'];
    if (!validCycles.includes(billing_cycle)) {
      return NextResponse.json(
        { success: false, error: "Invalid billing_cycle. Must be one of: monthly, quarterly, semi_annual, annual" },
        { status: 400 }
      );
    }

    // Verify customer exists
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id, name, email")
      .eq("id", customer_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    // Verify plan exists and get details
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select(`
        id,
        name,
        trial_days,
        discount_percentage,
        is_active
      `)
      .eq("id", plan_id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { success: false, error: "Subscription plan not found" },
        { status: 404 }
      );
    }

    if (!plan.is_active) {
      return NextResponse.json(
        { success: false, error: "Subscription plan is not active" },
        { status: 400 }
      );
    }

    // Get plan products to calculate actual price
    const { data: planProducts } = await supabase
      .from("subscription_plan_products")
      .select("tier_price, is_included")
      .eq("plan_id", plan_id)
      .eq("is_included", true);

    // Calculate total price
    let basePrice = 0;
    for (const pp of planProducts || []) {
      basePrice += pp.tier_price || 0;
    }

    // Apply discount
    const discountPercentage = plan.discount_percentage || 0;
    const finalPrice = basePrice * (1 - discountPercentage / 100);

    // Calculate dates
    const startDate = new Date();
    const trialEndDate = plan.trial_days > 0 && !start_immediately
      ? new Date(startDate.getTime() + plan.trial_days * 24 * 60 * 60 * 1000)
      : null;

    // Get system currency
    const { data: systemSettings } = await supabase
      .from("system_settings")
      .select("system_currency_code")
      .single();
    
    const systemCurrency = systemSettings?.system_currency_code || 'USD';

    // Calculate next billing date based on billing cycle
    const nextBillingDate = new Date(trialEndDate || startDate);
    switch (billing_cycle) {
      case 'monthly':
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
        break;
      case 'semi_annual':
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 6);
        break;
      case 'annual':
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        break;
    }

    // Generate unique payment session ID
    const paymentSessionId = `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Determine initial status
    const initialStatus = plan.trial_days > 0 && !start_immediately ? 'trial' : 'active';

    // Create subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        customer_id,
        plan_id,
        status: initialStatus,
        start_date: startDate.toISOString().split('T')[0],
        trial_end_date: trialEndDate?.toISOString().split('T')[0] || null,
        next_billing_date: nextBillingDate.toISOString().split('T')[0],
        payment_session_id: paymentSessionId,
        payment_status: 'pending',
        payment_amount: finalPrice,
        payment_currency: systemCurrency,
        created_by: null, // API-created subscriptions have null created_by
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error("Error creating subscription:", subscriptionError);
      return NextResponse.json(
        { success: false, error: "Failed to create subscription" },
        { status: 500 }
      );
    }

    // Get system settings for callback URLs
    const { data: settings } = await supabase
      .from("system_settings")
      .select("payment_success_url, payment_failure_url")
      .single();

    const successUrl = settings?.payment_success_url || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`;
    const failureUrl = settings?.payment_failure_url || `${process.env.NEXT_PUBLIC_APP_URL}/payment/failure`;

    // Generate payment URL with embedded callback URLs and subscription details
    const paymentUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/api/v1/subscriptions/payment`);
    paymentUrl.searchParams.set('session_id', paymentSessionId);
    paymentUrl.searchParams.set('subscription_id', subscription.id);
    paymentUrl.searchParams.set('amount', finalPrice.toFixed(2));
    paymentUrl.searchParams.set('currency', systemCurrency);
    paymentUrl.searchParams.set('success_url', successUrl);
    paymentUrl.searchParams.set('failure_url', failureUrl);
    paymentUrl.searchParams.set('customer_email', customer.email);
    paymentUrl.searchParams.set('customer_name', customer.name);
    paymentUrl.searchParams.set('plan_name', plan.name);

    return NextResponse.json({
      success: true,
      data: {
        subscription_id: subscription.id,
        payment_url: paymentUrl.toString(),
        payment_session_id: paymentSessionId,
        amount: finalPrice,
        currency: systemCurrency,
        status: initialStatus,
        trial_days: plan.trial_days,
        next_billing_date: nextBillingDate.toISOString().split('T')[0],
        message: plan.trial_days > 0 && !start_immediately
          ? `Subscription created with ${plan.trial_days}-day trial. Payment will be required after trial.`
          : 'Subscription created. Please complete payment to activate.',
      },
    }, { status: 201 });

  } catch (error) {
    console.error("Error in subscriptions API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/v1/subscriptions:
 *   get:
 *     summary: Get all subscriptions
 *     description: Returns all subscriptions with customer and plan details
 *     tags:
 *       - Subscriptions
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, cancelled, paused, trial]
 *         description: Filter by subscription status
 *     responses:
 *       200:
 *         description: Subscriptions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
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

    const supabase = createAdminClient();

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const status = searchParams.get('status');

    let query = supabase
      .from("subscriptions")
      .select(`
        *,
        customer:customers (
          id,
          name,
          email,
          company
        ),
        plan:subscription_plans (
          id,
          name,
          trial_days,
          discount_percentage
        )
      `)
      .order("created_at", { ascending: false });

    if (customerId) {
      query = query.eq("customer_id", customerId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error("Error fetching subscriptions:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch subscriptions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: subscriptions,
    });

  } catch (error) {
    console.error("Error in subscriptions API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
