import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    // Fetch quotation details
    const { data: quotation, error: quotationError } = await supabase
      .from("quotations")
      .select(`
        *,
        customer:customers (
          name,
          phone
        ),
        quotation_items (
          description,
          quantity,
          unit_price,
          total
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

    // Update quotation status to 'sent'
    await supabase
      .from("quotations")
      .update({ status: "sent" })
      .eq("id", quotationId);

    // Prepare WhatsApp message
    const message = `
🧾 *Quotation ${quotation.quotation_number}*

📝 Customer: ${quotation.customer.name}
💰 Total: ${quotation.currency} ${quotation.total}
📅 Valid Until: ${new Date(quotation.valid_until).toLocaleDateString()}

📦 *Items:*
${quotation.quotation_items.map((item: any) => 
  `• ${item.description}\n  ${item.quantity} × ${quotation.currency} ${item.unit_price} = ${quotation.currency} ${item.total}`
).join('\n\n')}

${quotation.notes ? `\n📌 *Notes:* ${quotation.notes}` : ''}

Thank you for your business! 🙏
    `.trim();

    // WhatsApp Business API URL (for production)
    // You would integrate with WhatsApp Business API or Twilio WhatsApp
    // For now, we'll create a WhatsApp Web link
    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    console.log("WhatsApp URL:", whatsappUrl);
    console.log("Phone:", phone);
    console.log("Message:", message);

    // TODO: In production, use WhatsApp Business API or Twilio
    // Example with Twilio:
    // await twilioClient.messages.create({
    //   from: 'whatsapp:+14155238886',
    //   to: `whatsapp:${phone}`,
    //   body: message,
    // });

    return NextResponse.json({
      success: true,
      message: "WhatsApp message prepared (simulated)",
      whatsappUrl, // Can be used to open WhatsApp Web
    });

  } catch (error) {
    console.error("Error sharing quotation via WhatsApp:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
