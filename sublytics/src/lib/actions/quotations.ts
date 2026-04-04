'use server';

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/rbac';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';

// Helper to serialize quotation data for client
function serializeQuotation(quotation: any): any {
  return {
    ...quotation,
    created_at: quotation.created_at?.toISOString?.() || quotation.created_at,
    updated_at: quotation.updated_at?.toISOString?.() || quotation.updated_at,
    issue_date: quotation.issue_date?.toISOString?.() || quotation.issue_date,
    valid_until: quotation.valid_until?.toISOString?.() || quotation.valid_until,
  };
}

export async function getQuotations() {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Auth error in getQuotations:', authError);
    return { data: [], error: 'Not authenticated' };
  }
  
  console.log('Fetching quotations for user:', user.id);
  
  const { data, error } = await supabase
    .from('quotations')
    .select(`
      *,
      quotation_items (
        id,
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
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching quotations:', error);
    return { data: [], error: error.message };
  }
  
  console.log('Quotations fetched:', data?.length || 0);

  return { data: data || [], error: null };
}

export async function getQuotationById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('quotations')
    .select(`
      *,
      quotation_items (
        id,
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
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching quotation:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function createQuotation(input: {
  title: string;
  valid_until: string;
  notes?: string;
  items: Array<{
    product_id?: string;
    description: string;
    quantity: number;
    unit_price: number;
  }>;
}) {
  const user = await requireRole(['SYSTEM_ADMIN', 'ADMIN', 'MANAGER']);
  const supabase = await createClient();

  // Generate quotation number
  const { count } = await supabase
    .from('quotations')
    .select('*', { count: 'exact', head: true });
  
  const quotationNumber = `QUO-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`;

  // Calculate totals
  let subtotal = 0;
  const processedItems = input.items.map(item => {
    const itemTotal = item.quantity * item.unit_price;
    subtotal += itemTotal;
    return {
      ...item,
      total: itemTotal,
    };
  });

  const taxAmount = subtotal * 0.18; // 18% tax
  const discountAmount = 0;
  const total = subtotal + taxAmount - discountAmount;

  // Create quotation
  const { data: quotation, error: quotationError } = await supabase
    .from('quotations')
    .insert({
      quotation_number: quotationNumber,
      title: input.title,
      valid_until: input.valid_until,
      notes: input.notes,
      subtotal,
      tax_percent: 18,
      tax_amount: taxAmount,
      discount_percent: 0,
      discount_amount: discountAmount,
      total,
      currency: 'USD',
      created_by: user.id,
    })
    .select()
    .single();

  if (quotationError) {
    console.error('Error creating quotation:', quotationError);
    return { success: false, error: quotationError.message };
  }

  // Create quotation items
  const itemsToInsert = processedItems.map(item => ({
    quotation_id: quotation.id,
    product_id: item.product_id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: item.total,
  }));

  const { error: itemsError } = await supabase
    .from('quotation_items')
    .insert(itemsToInsert);

  if (itemsError) {
    console.error('Error creating quotation items:', itemsError);
    // Rollback quotation
    await supabase.from('quotations').delete().eq('id', quotation.id);
    return { success: false, error: itemsError.message };
  }

  revalidatePath('/quotations');
  return { success: true, data: serializeQuotation(quotation) };
}

export async function updateQuotation(
  id: string,
  input: {
    title?: string;
    valid_until?: string;
    notes?: string;
    items?: Array<{
      product_id?: string;
      description: string;
      quantity: number;
      unit_price: number;
    }>;
  }
) {
  const user = await requireRole(['SYSTEM_ADMIN', 'ADMIN', 'MANAGER']);
  const supabase = await createClient();

  const updateData: any = {};
  
  if (input.title) updateData.title = input.title;
  if (input.valid_until) updateData.valid_until = input.valid_until;
  if (input.notes !== undefined) updateData.notes = input.notes;

  // If items are provided, recalculate totals
  if (input.items) {
    let subtotal = 0;
    input.items.forEach(item => {
      subtotal += item.quantity * item.unit_price;
    });

    const taxAmount = subtotal * 0.18;
    const total = subtotal + taxAmount;

    updateData.subtotal = subtotal;
    updateData.tax_amount = taxAmount;
    updateData.total = total;

    // Delete old items
    await supabase.from('quotation_items').delete().eq('quotation_id', id);

    // Insert new items
    const itemsToInsert = input.items.map(item => ({
      quotation_id: id,
      product_id: item.product_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.quantity * item.unit_price,
    }));

    const { error: itemsError } = await supabase
      .from('quotation_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Error updating quotation items:', itemsError);
      return { success: false, error: itemsError.message };
    }
  }

  const { error } = await supabase
    .from('quotations')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating quotation:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/quotations');
  return { success: true };
}

export async function deleteQuotation(id: string) {
  const user = await requireRole(['SYSTEM_ADMIN', 'ADMIN', 'MANAGER']);
  const supabase = await createClient();

  const { error } = await supabase
    .from('quotations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting quotation:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/quotations');
  return { success: true };
}

export async function shareQuotationByEmail(quotationId: string, email: string) {
  try {
    const user = await requireRole(['SYSTEM_ADMIN', 'ADMIN', 'MANAGER']);
    const supabase = await createClient();

    // Fetch system settings for sender email and Resend API key
    const { data: settings } = await supabase
      .from("system_settings")
      .select("company_name, company_email, resend_api_key")
      .single();

    if (!settings?.resend_api_key) {
      console.error("❌ Resend API key not configured");
      return { success: false, error: "Email service not configured. Please set Resend API key in Settings." };
    }

    if (!settings?.company_email) {
      console.error("❌ Company email not configured");
      return { success: false, error: "Sender email not configured. Please set company email in Settings." };
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
      return { success: false, error: "Quotation not found" };
    }

    // Prepare email HTML
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
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Quotation</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${quotation.quotation_number}</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <div style="margin-bottom: 30px;">
            <h2 style="margin: 0 0 10px 0; font-size: 16px; color: #6b7280;">From:</h2>
            <p style="margin: 0; font-weight: 600;">${settings.company_name || 'Company'}</p>
            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${settings.company_email || ''}</p>
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
    const resend = new Resend(settings.resend_api_key);
    
    const { error: emailError } = await resend.emails.send({
      from: `${settings.company_name} <${settings.company_email}>`,
      to: email,
      subject: `Quotation ${quotation.quotation_number} from ${settings.company_name}`,
      html: htmlContent,
    });

    if (emailError) {
      console.error("❌ Error sending email:", emailError);
      return { success: false, error: emailError.message || "Failed to send email" };
    }

    console.log("✅ Quotation email sent successfully!");
    
    // Update quotation status to 'sent'
    await supabase
      .from("quotations")
      .update({ status: "sent" })
      .eq("id", quotationId);

    return { success: true };
  } catch (error: any) {
    console.error("Error in shareQuotationByEmail:", error);
    return { success: false, error: error.message || "Failed to send email" };
  }
}

export async function shareQuotationByWhatsApp(quotationId: string, phone: string) {
  try {
    const user = await requireRole(['SYSTEM_ADMIN', 'ADMIN', 'MANAGER']);
    const supabase = await createClient();

    if (!phone) {
      return { success: false, error: "Phone number is required" };
    }

    // Get WhatsApp credentials from env
    if (!process.env.WHATSAPP_API_ENDPOINT) {
      return { success: false, error: "WhatsApp service not configured" };
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
      return { success: false, error: "Quotation not found" };
    }

    // Fetch system settings
    const { data: settings } = await supabase
      .from("system_settings")
      .select("company_name")
      .single();

    // Get WhatsApp token
    const authResponse = await fetch(`${process.env.WHATSAPP_API_ENDPOINT}/v1/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: process.env.WHATSAPP_PHONE_NUMBER,
        phone_secret: process.env.WHATSAPP_PHONE_SECRET,
      }),
    });

    const authData = await authResponse.json();
    if (!authResponse.ok || !authData.success) {
      return { success: false, error: "Failed to authenticate with WhatsApp service" };
    }

    const token = authData.token;

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
    console.log("📱 Sending WhatsApp message to:", phone);
    const messageResponse = await fetch(`${process.env.WHATSAPP_API_ENDPOINT}/v1/message`, {
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

    const messageData = await messageResponse.json();
    if (!messageResponse.ok || !messageData.success) {
      return { success: false, error: "Failed to send WhatsApp message" };
    }

    console.log("✅ WhatsApp message sent successfully!");

    // Update quotation status to 'sent'
    await supabase
      .from("quotations")
      .update({ status: "sent" })
      .eq("id", quotationId);

    return { success: true };
  } catch (error: any) {
    console.error("Error in shareQuotationByWhatsApp:", error);
    return { success: false, error: error.message || "Failed to send WhatsApp message" };
  }
}
