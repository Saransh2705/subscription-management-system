'use server';

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/rbac';
import { revalidatePath } from 'next/cache';

export async function getQuotations() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('quotations')
    .select(`
      *,
      customer:customers (
        id,
        name,
        email,
        company
      ),
      quotation_items (
        id,
        description,
        quantity,
        unit_price,
        total,
        product:products (
          name,
          sku
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching quotations:', error);
    return { data: [], error: error.message };
  }

  return { data: data || [], error: null };
}

export async function getQuotationById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('quotations')
    .select(`
      *,
      customer:customers (
        id,
        name,
        email,
        company,
        phone
      ),
      quotation_items (
        id,
        description,
        quantity,
        unit_price,
        total,
        product:products (
          name,
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
  customer_id: string;
  plan_id?: string;
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
  
  const quotationNumber = `QUO-${String((count || 0) + 1).padStart(6, '0')}`;

  // Calculate totals
  let subtotal = 0;
  const items = input.items.map(item => {
    const total = item.quantity * item.unit_price;
    subtotal += total;
    return {
      ...item,
      total,
    };
  });

  const taxPercent = 0; // Can be configured
  const taxAmount = (subtotal * taxPercent) / 100;
  const discountPercent = 0;
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal + taxAmount - discountAmount;

  // Create quotation
  const { data: quotation, error: quotationError } = await supabase
    .from('quotations')
    .insert({
      quotation_number: quotationNumber,
      customer_id: input.customer_id,
      status: 'draft',
      valid_until: input.valid_until,
      subtotal,
      tax_percent: taxPercent,
      tax_amount: taxAmount,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      total,
      notes: input.notes,
      created_by: user.id,
    })
    .select()
    .single();

  if (quotationError) {
    console.error('Error creating quotation:', quotationError);
    return { success: false, error: 'Failed to create quotation' };
  }

  // Create quotation items
  const quotationItems = items.map(item => ({
    quotation_id: quotation.id,
    product_id: item.product_id || null,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: item.total,
  }));

  const { error: itemsError } = await supabase
    .from('quotation_items')
    .insert(quotationItems);

  if (itemsError) {
    console.error('Error creating quotation items:', itemsError);
    // Rollback quotation
    await supabase.from('quotations').delete().eq('id', quotation.id);
    return { success: false, error: 'Failed to create quotation items' };
  }

  revalidatePath('/quotations');
  return { success: true, data: quotation };
}

export async function updateQuotation(
  id: string,
  input: {
    valid_until?: string;
    notes?: string;
    status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
    items?: Array<{
      id?: string;
      product_id?: string;
      description: string;
      quantity: number;
      unit_price: number;
    }>;
  }
) {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN', 'MANAGER']);
  const supabase = await createClient();

  // If items are provided, update totals
  if (input.items) {
    let subtotal = 0;
    const items = input.items.map(item => {
      const total = item.quantity * item.unit_price;
      subtotal += total;
      return {
        ...item,
        total,
      };
    });

    const taxPercent = 0;
    const taxAmount = (subtotal * taxPercent) / 100;
    const discountPercent = 0;
    const discountAmount = (subtotal * discountPercent) / 100;
    const total = subtotal + taxAmount - discountAmount;

    // Update quotation
    const { error: quotationError } = await supabase
      .from('quotations')
      .update({
        valid_until: input.valid_until,
        notes: input.notes,
        status: input.status,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total,
      })
      .eq('id', id);

    if (quotationError) {
      console.error('Error updating quotation:', quotationError);
      return { success: false, error: 'Failed to update quotation' };
    }

    // Delete existing items
    await supabase.from('quotation_items').delete().eq('quotation_id', id);

    // Insert new items
    const quotationItems = items.map(item => ({
      quotation_id: id,
      product_id: item.product_id || null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
    }));

    const { error: itemsError } = await supabase
      .from('quotation_items')
      .insert(quotationItems);

    if (itemsError) {
      console.error('Error updating quotation items:', itemsError);
      return { success: false, error: 'Failed to update quotation items' };
    }
  } else {
    // Update only quotation metadata
    const { error: quotationError } = await supabase
      .from('quotations')
      .update({
        valid_until: input.valid_until,
        notes: input.notes,
        status: input.status,
      })
      .eq('id', id);

    if (quotationError) {
      console.error('Error updating quotation:', quotationError);
      return { success: false, error: 'Failed to update quotation' };
    }
  }

  revalidatePath('/quotations');
  return { success: true };
}

export async function deleteQuotation(id: string) {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN', 'MANAGER']);
  const supabase = await createClient();

  const { error } = await supabase
    .from('quotations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting quotation:', error);
    return { success: false, error: 'Failed to delete quotation' };
  }

  revalidatePath('/quotations');
  return { success: true };
}

export async function shareQuotationByEmail(quotationId: string, email: string) {
  const user = await requireRole(['SYSTEM_ADMIN', 'ADMIN', 'MANAGER']);
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/v1/quotations/${quotationId}/share/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    return { success: false, error: 'Failed to send email' };
  }

  return { success: true };
}

export async function shareQuotationByWhatsApp(quotationId: string, phone: string) {
  const user = await requireRole(['SYSTEM_ADMIN', 'ADMIN', 'MANAGER']);
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/v1/quotations/${quotationId}/share/whatsapp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone }),
  });

  if (!response.ok) {
    return { success: false, error: 'Failed to send WhatsApp message' };
  }

  return { success: true };
}
