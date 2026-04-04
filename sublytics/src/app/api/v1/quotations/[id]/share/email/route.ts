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

    const { email } = await request.json();
    const quotationId = params.id;

    // Fetch quotation details
    const { data: quotation, error: quotationError } = await supabase
      .from("quotations")
      .select(`
        *,
        customer:customers (
          name,
          email
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

    // In a real implementation, integrate with an email service like SendGrid, Resend, etc.
    // For now, we'll simulate the email sending
    console.log("Sending email to:", email);
    console.log("Quotation:", quotation);

    // Update quotation status to 'sent'
    await supabase
      .from("quotations")
      .update({ status: "sent" })
      .eq("id", quotationId);

    // Simulate email content
    const emailContent = `
      Quotation ${quotation.quotation_number}
      
      Customer: ${quotation.customer.name}
      Total: ${quotation.currency} ${quotation.total}
      Valid Until: ${quotation.valid_until}
      
      Items:
      ${quotation.quotation_items.map((item: any) => 
        `- ${item.description}: ${item.quantity} x ${quotation.currency} ${item.unit_price} = ${quotation.currency} ${item.total}`
      ).join('\n')}
      
      Thank you for your business!
    `;

    // TODO: Replace with actual email sending logic
    // Example with Resend:
    // await resend.emails.send({
    //   from: 'noreply@yourcompany.com',
    //   to: email,
    //   subject: `Quotation ${quotation.quotation_number}`,
    //   text: emailContent,
    // });

    return NextResponse.json({
      success: true,
      message: "Email sent successfully (simulated)",
    });

  } catch (error) {
    console.error("Error sharing quotation:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
