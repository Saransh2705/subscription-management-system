'use server';

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/rbac';
import { revalidatePath } from 'next/cache';

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
  return { success: true, data: quotation };
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
