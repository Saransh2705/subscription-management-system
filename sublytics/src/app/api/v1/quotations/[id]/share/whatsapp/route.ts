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
      .select("company_name")
      .single();

    // Prepare WhatsApp message
    const itemsList = quotation.quotation_items
      .map((item: any) => {
        const productInfo = item.product ? [
          `📦 *${item.product.name}*`,
          item.product.sku ? `   SKU: ${item.product.sku}` : '',
          item.product.description ? `   ${item.product.description}` : '',
          item.description !== item.product.name ? `   ${item.description}` : ''
        ].filter(Boolean).join('\n') : `📦 *${item.description}*`;
        
        return `${productInfo}\n   ${item.quantity} × ${quotation.currency} ${item.unit_price.toFixed(2)} = *${quotation.currency} ${item.total.toFixed(2)}*`;
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

💰 *Subtotal:* ${quotation.currency} ${quotation.subtotal.toFixed(2)}
💵 *Total:* *${quotation.currency} ${quotation.total.toFixed(2)}*

${quotation.notes ? `\n📌 *Note:* ${quotation.notes}\n` : ''}
━━━━━━━━━━━━━━━━━━

Thank you for your business! 🙏

_This quotation is valid until ${new Date(quotation.valid_until).toLocaleDateString()}_
    `.trim();

    // Send WhatsApp message
    try {
      const result = await sendWhatsAppMessage(phone, message, token);

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
      console.error("WhatsApp send error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to send WhatsApp message" },
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
