import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * @swagger
 * /api/v1/subscriptions/payment:
 *   get:
 *     summary: Handle payment gateway redirect
 *     description: Payment processing page - redirects to success or failure URL based on payment status
 *     tags:
 *       - Subscriptions
 *     parameters:
 *       - in: query
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment session ID
 *       - in: query
 *         name: subscription_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *       - in: query
 *         name: success_url
 *         required: true
 *         schema:
 *           type: string
 *         description: Success callback URL
 *       - in: query
 *         name: failure_url
 *         required: true
 *         schema:
 *           type: string
 *         description: Failure callback URL
 *     responses:
 *       302:
 *         description: Redirect to payment gateway or callback URL
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  const subscriptionId = searchParams.get('subscription_id');
  const successUrl = searchParams.get('success_url');
  const failureUrl = searchParams.get('failure_url');
  const amount = searchParams.get('amount');
  const currency = searchParams.get('currency');
  const customerName = searchParams.get('customer_name');
  const planName = searchParams.get('plan_name');

  if (!sessionId || !subscriptionId || !successUrl || !failureUrl) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  // Create HTML payment processing page
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Processing</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 500px;
      width: 100%;
      padding: 40px;
      text-align: center;
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 24px;
    }
    .amount {
      font-size: 48px;
      font-weight: bold;
      color: #667eea;
      margin: 20px 0;
    }
    .details {
      background: #f7fafc;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: left;
    }
    .details p {
      margin: 10px 0;
      color: #4a5568;
      display: flex;
      justify-content: space-between;
    }
    .details strong {
      color: #2d3748;
    }
    .buttons {
      display: flex;
      gap: 12px;
      margin-top: 30px;
    }
    button {
      flex: 1;
      padding: 16px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .btn-success {
      background: #48bb78;
      color: white;
    }
    .btn-success:hover {
      background: #38a169;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
    }
    .btn-failure {
      background: #f56565;
      color: white;
    }
    .btn-failure:hover {
      background: #e53e3e;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(245, 101, 101, 0.4);
    }
    .note {
      margin-top: 20px;
      font-size: 14px;
      color: #718096;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Payment Simulation</h1>
    <div class="amount">${currency} ${amount}</div>
    
    <div class="details">
      <p><span>Customer:</span> <strong>${customerName}</strong></p>
      <p><span>Plan:</span> <strong>${planName}</strong></p>
      <p><span>Billing:</span> <strong>Recurring</strong></p>
      <p><span>Session ID:</span> <strong>${sessionId.substring(0, 20)}...</strong></p>
    </div>

    <div class="buttons">
      <button class="btn-success" onclick="processPayment(true)">
        ✓ Simulate Success
      </button>
      <button class="btn-failure" onclick="processPayment(false)">
        ✗ Simulate Failure
      </button>
    </div>

    <p class="note">
      This is a payment simulation page. In production, this would integrate with your payment gateway (Stripe, PayPal, etc.)
    </p>
  </div>

  <script>
    async function processPayment(success) {
      const status = success ? 'completed' : 'failed';
      
      // Update subscription payment status
      try {
        await fetch('/api/v1/subscriptions/payment/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: '${sessionId}',
            subscription_id: '${subscriptionId}',
            status: status,
          }),
        });
      } catch (error) {
        console.error('Error updating payment:', error);
      }

      // Redirect to appropriate callback URL
      const redirectUrl = success 
        ? '${successUrl}?session_id=${sessionId}&subscription_id=${subscriptionId}&status=success'
        : '${failureUrl}?session_id=${sessionId}&subscription_id=${subscriptionId}&status=failed';
      
      window.location.href = redirectUrl;
    }
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
