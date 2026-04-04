import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

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

    const { email } = await request.json();
    const quotationId = params.id;

    // Fetch system settings for sender email and Resend API key
    const { data: settings } = await supabase
      .from("system_settings")
      .select("company_name, company_email, resend_api_key")
      .single();

    if (!settings?.resend_api_key) {
      console.error("❌ Resend API key not configured in system settings");
      return NextResponse.json(
        { success: false, error: "Email service not configured. Please set Resend API key in Settings." },
        { status: 500 }
      );
    }

    if (!settings?.company_email) {
      console.error("❌ Company email not configured in system settings");
      return NextResponse.json(
        { success: false, error: "Sender email not configured. Please set company email in Settings." },
        { status: 500 }
      );
    }

    const resend = new Resend(settings.resend_api_key);

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

    // Prepare email content
    const itemsHtml = quotation.quotation_items.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${item.product?.name || item.description}</strong>
          ${item.product?.sku ? `<br><small style="color: #6b7280;">SKU: ${item.product.sku}</small>` : ''}
          ${item.product?.description ? `<br><small style="color: #6b7280;">${item.product.description}</small>` : ''}
          ${item.description !== item.product?.name && item.product ? `<br><small style="color: #374151;">${item.description}</small>` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${quotation.currency} ${item.unit_price.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${quotation.currency} ${item.total.toFixed(2)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Quotation</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${quotation.quotation_number}</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <div style="margin-bottom: 30px;">
            <h2 style="margin: 0 0 10px 0; font-size: 16px; color: #6b7280;">From:</h2>
            <p style="margin: 0; font-weight: 600;">${settings?.company_name || 'Company'}</p>
            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${settings?.company_email || ''}</p>
          </div>

          <div style="margin-bottom: 30px;">
            <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #111827;">${quotation.title}</h2>
          </div>

          <div style="margin-bottom: 20px; display: flex; justify-content: space-between;">
            <div>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Issue Date</p>
              <p style="margin: 5px 0 0 0; font-weight: 600;">${new Date(quotation.issue_date).toLocaleDateString()}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Valid Until</p>
              <p style="margin: 5px 0 0 0; font-weight: 600;">${new Date(quotation.valid_until).toLocaleDateString()}</p>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin: 30px 0;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600;">Description</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb; font-weight: 600;">Qty</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; font-weight: 600;">Price</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; font-weight: 600;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="text-align: right; padding: 20px; background: #f9fafb; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Subtotal: ${quotation.currency} ${quotation.subtotal.toFixed(2)}</p>
            <p style="margin: 10px 0; font-size: 24px; font-weight: 700; color: #667eea;">Total: ${quotation.currency} ${quotation.total.toFixed(2)}</p>
          </div>

          ${quotation.notes ? `
            <div style="margin-top: 30px; padding: 20px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>Note:</strong> ${quotation.notes}</p>
            </div>
          ` : ''}

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">Thank you for your business!</p>
            <p style="margin: 10px 0 0 0;">This quotation is valid until ${new Date(quotation.valid_until).toLocaleDateString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using Resend
    console.log("📧 Sending quotation email to:", email);
    console.log("   From:", `${settings.company_name} <${settings.company_email}>`);
    console.log("   Quotation:", quotation.quotation_number);
    console.log("   Total items:", quotation.quotation_items.length);
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `${settings.company_name} <${settings.company_email}>`,
      to: email,
      subject: `Quotation ${quotation.quotation_number} from ${settings.company_name}`,
      html: htmlContent,
    });

    if (emailError) {
      console.error("❌ Error sending quotation email:", emailError);
      console.error("   Details:", JSON.stringify(emailError, null, 2));
      return NextResponse.json(
        { success: false, error: emailError.message || "Failed to send email" },
        { status: 500 }
      );
    }

    console.log("✅ Quotation email sent successfully!");
    console.log("   Email ID:", emailData?.id);

    // Update quotation status to 'sent'
    await supabase
      .from("quotations")
      .update({ status: "sent" })
      .eq("id", quotationId);

    return NextResponse.json({
      success: true,
      message: "Quotation sent via email successfully",
      emailId: emailData?.id,
    });

  } catch (error) {
    console.error("Error sharing quotation:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

