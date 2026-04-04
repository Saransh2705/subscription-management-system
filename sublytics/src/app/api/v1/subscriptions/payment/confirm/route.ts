import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * @swagger
 * /api/v1/subscriptions/payment/confirm:
 *   post:
 *     summary: Confirm payment status
 *     description: Backend endpoint to update subscription payment status
 *     tags:
 *       - Subscriptions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - session_id
 *               - subscription_id
 *               - status
 *             properties:
 *               session_id:
 *                 type: string
 *                 description: Payment session ID
 *               subscription_id:
 *                 type: string
 *                 description: Subscription ID
 *               status:
 *                 type: string
 *                 enum: [completed, failed]
 *                 description: Payment status
 *     responses:
 *       200:
 *         description: Payment status updated
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_id, subscription_id, status } = body;

    if (!session_id || !subscription_id || !status) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update subscription payment status
    const updateData: any = {
      payment_status: status,
    };

    // If payment successful, activate subscription
    if (status === 'completed') {
      updateData.status = 'active';
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("id", subscription_id)
      .eq("payment_session_id", session_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating subscription:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update payment status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        subscription_id: data.id,
        payment_status: data.payment_status,
        subscription_status: data.status,
      },
    });

  } catch (error) {
    console.error("Error confirming payment:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
