import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/v1/auth.helper";

/**
 * @swagger
 * /api/v1/plans:
 *   get:
 *     summary: Get all subscription plans with metadata
 *     description: Returns all subscription plans with products, features, pricing, and discount information
 *     tags:
 *       - Plans
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription plans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       billing_cycle:
 *                         type: string
 *                       trial_days:
 *                         type: integer
 *                       currency:
 *                         type: string
 *                       is_active:
 *                         type: boolean
 *                       features:
 *                         type: array
 *                         items:
 *                           type: string
 *                       pricing:
 *                         type: object
 *                         properties:
 *                           base_price:
 *                             type: number
 *                           discount_percentage:
 *                             type: number
 *                           final_price:
 *                             type: number
 *                       products:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                             description:
 *                               type: string
 *                             is_included:
 *                               type: boolean
 *                       product_count:
 *                         type: integer
 *                       created_at:
 *                         type: string
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

    // Fetch all plans with their discount percentage
    const { data: plans, error: plansError } = await supabase
      .from("subscription_plans")
      .select(`
        id,
        name,
        description,
        trial_days,
        features,
        discount_percentage,
        is_active,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false});

    if (plansError) {
      console.error("Error fetching plans:", plansError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch plans" },
        { status: 500 }
      );
    }

    // For each plan, fetch its products
    const plansWithMetadata = await Promise.all(
      (plans || []).map(async (plan) => {
        // Fetch plan products with product details
        const { data: planProducts } = await supabase
          .from("subscription_plan_products")
          .select(`
            id,
            tier_price,
            is_included,
            products!inner (
              name,
              description,
              sku
            )
          `)
          .eq("plan_id", plan.id);

        // Calculate base price (sum of all included products)
        let basePrice = 0;
        const includedProducts = (planProducts || []).filter(pp => pp.is_included);
        
        for (const pp of includedProducts) {
          // Use tier_price if set, otherwise use product's base price
          const price = pp.tier_price > 0 ? pp.tier_price : 0;
          basePrice += price;
        }

        // Calculate final price with discount
        const discountPercentage = plan.discount_percentage || 0;
        const finalPrice = basePrice * (1 - discountPercentage / 100);

        // Format products array (without prices as requested)
        const products = includedProducts.map(pp => {
          const product = pp.products as any;
          return {
            name: product?.name || 'Unknown',
            description: product?.description || '',
            sku: product?.sku || '',
            is_included: pp.is_included,
          };
        });

        return {
          id: plan.id,
          name: plan.name,
          description: plan.description || '',
          trial_days: plan.trial_days,
          is_active: plan.is_active,
          features: plan.features || [],
          pricing: {
            base_price: parseFloat(basePrice.toFixed(2)),
            discount_percentage: discountPercentage,
            final_price: parseFloat(finalPrice.toFixed(2)),
          },
          products: products,
          product_count: products.length,
          created_at: plan.created_at,
          updated_at: plan.updated_at,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: plansWithMetadata,
    });

  } catch (error) {
    console.error("Error in plans API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
