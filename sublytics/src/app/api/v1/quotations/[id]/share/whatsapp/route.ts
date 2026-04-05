import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// WhatsApp API authentication
async function getWhatsAppToken() {
  const response = await fetch(`${process.env.WHATSAPP_API_ENDPOINT}/v1/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone_number: process.env.WHATSAPP_PHONE_NUMBER,
      phone_secret: process.env.WHATSAPP_PHONE_SECRET,
    }),
  });

  const data = await response.json();
  
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to authenticate with WhatsApp API');
  }

  return data.token;
}

// Validate WhatsApp number
async function validateWhatsAppNumber(phone: string, token: string) {
  const response = await fetch(`${process.env.WHATSAPP_API_ENDPOINT}/v1/validate-number`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone_number: phone,
    }),
  });

  const data = await response.json();
  return data;
}

// Send WhatsApp message
async function sendWhatsAppMessage(phone: string, message: string, token: string) {
  const response = await fetch(`${process.env.WHATSAPP_API_ENDPOINT}/v1/message`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone_number: phone,
      message: message,
    }),
  });

  const data = await response.json();
  
  if (!response.ok || !data.success) {
    throw new Error('Failed to send WhatsApp message');
  }

  return data;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { phone } = await request.json();
    const quotationId = params.id;
    const { searchParams } = new URL(request.url);
    const requestedCurrency = searchParams.get('currency')?.toUpperCase();

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Get WhatsApp API token
    let token: string;
    try {
      token = await getWhatsAppToken();
    } catch (error: any) {
      console.error("WhatsApp auth error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to authenticate with WhatsApp service" },
        { status: 500 }
      );
    }

    // Validate WhatsApp number
    try {
      const validation = await validateWhatsAppNumber(phone, token);
      if (!validation.isWhatsAppNumber) {
        return NextResponse.json(
          { success: false, error: "This number is not registered on WhatsApp" },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error("WhatsApp validation error:", error);
      // Continue anyway if validation fails
    }

    // Fetch quotation details
    const { data: quotation, error: quotationError } = await supabase
      .from("quotations")
      .select(`
        *,
        quotation_items (
          description,
          quantity,
          unit_price,
          total,
          product:products (
            name,
            description,
            sku
          )
        )
      `)
      .eq("id", quotationId)
      .single();

    if (quotationError || !quotation) {
      return NextResponse.json(
        { success: false, error: "Quotation not found" },
        { status: 404 }
      );
    }

    // Fetch system settings
    const { data: settings } = await supabase
      .from("system_settings")
      .select("company_name, system_currency_code")
      .single();

    // Currency conversion logic
    const systemCurrency = settings?.system_currency_code || 'USD';
    const targetCurrency = requestedCurrency || systemCurrency;
    const originalCurrency = quotation.currency;
    let roeRate = 1.0;
    let displayCurrency = originalCurrency;

    // Apply currency conversion if requested currency differs from original
    if (targetCurrency !== originalCurrency) {
      const { data: roeData, error: roeError } = await supabase
        .from('currency_roe')
        .select('roe_rate')
        .eq('currency_code', targetCurrency)
        .eq('is_active', true)
        .single();

      if (roeData && !roeError) {
        roeRate = parseFloat(roeData.roe_rate.toString());
        displayCurrency = targetCurrency;

        // Convert all amounts
        quotation.subtotal = parseFloat(quotation.subtotal) * roeRate;
        quotation.tax_amount = parseFloat(quotation.tax_amount) * roeRate;
        quotation.discount_amount = parseFloat(quotation.discount_amount) * roeRate;
        quotation.total = parseFloat(quotation.total) * roeRate;
        quotation.quotation_items = quotation.quotation_items.map((item: any) => ({
          ...item,
          unit_price: parseFloat(item.unit_price) * roeRate,
          total: parseFloat(item.total) * roeRate,
        }));
      }
    }

    // Prepare WhatsApp message
    const itemsList = quotation.quotation_items
      .map((item: any) => {
        const productInfo = item.product ? [
          `📦 *${item.product.name}*`,
          item.product.sku ? `   SKU: ${item.product.sku}` : '',
          item.product.description ? `   ${item.product.description}` : '',
          item.description !== item.product.name ? `   ${item.description}` : ''
        ].filter(Boolean).join('\n') : `📦 *${item.description}*`;
        
        return `${productInfo}\n   ${item.quantity} × ${displayCurrency} ${item.unit_price.toFixed(2)} = *${displayCurrency} ${item.total.toFixed(2)}*`;
      })
      .join('\n\n');

    const message = `
🧾 *Quotation ${quotation.quotation_number}*

*${quotation.title}*

*From:* ${settings?.company_name || 'Company'}

📅 *Issue Date:* ${new Date(quotation.issue_date).toLocaleDateString()}
📅 *Valid Until:* ${new Date(quotation.valid_until).toLocaleDateString()}

━━━━━━━━━━━━━━━━━━
📦 *Items:*

${itemsList}

━━━━━━━━━━━━━━━━━━

💰 *Subtotal:* ${displayCurrency} ${quotation.subtotal.toFixed(2)}
💵 *Total:* *${displayCurrency} ${quotation.total.toFixed(2)}*
${displayCurrency !== originalCurrency ? `\n_Converted from ${originalCurrency} at rate ${roeRate.toFixed(4)}_` : ''}

${quotation.notes ? `\n📌 *Note:* ${quotation.notes}\n` : ''}
━━━━━━━━━━━━━━━━━━

Thank you for your business! 🙏

_This quotation is valid until ${new Date(quotation.valid_until).toLocaleDateString()}_
    `.trim();

    // Send WhatsApp message
    try {
      console.log("📱 Sending WhatsApp message to:", phone);
      console.log("   Quotation:", quotation.quotation_number);
      console.log("   Total items:", quotation.quotation_items.length);
      
      const result = await sendWhatsAppMessage(phone, message, token);

      console.log("✅ WhatsApp message sent successfully!");
      console.log("   Message ID:", result.messageId);

      // Update quotation status to 'sent'
      await supabase
        .from("quotations")
        .update({ status: "sent" })
        .eq("id", quotationId);

      return NextResponse.json({
        success: true,
        message: "Quotation sent via WhatsApp successfully",
        messageId: result.messageId,
      });
    } catch (error: any) {
      console.error("❌ WhatsApp send error:", error?.message || error);
      console.error("   Phone:", phone);
      console.error("   Stack:", error?.stack);
      return NextResponse.json(
        { success: false, error: error?.message || "Failed to send WhatsApp message" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error sharing quotation via WhatsApp:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
