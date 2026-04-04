"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/rbac";
import { revalidatePath } from "next/cache";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
  product_name?: string;
  product_sku?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  subscription_id: string | null;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_percent: number;
  tax_amount: number;
  discount_percent: number;
  discount_amount: number;
  total: number;
  currency: string;
  notes: string | null;
  paid_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_email?: string;
  items?: InvoiceItem[];
}

/**
 * Get all invoices with customer details and items
 */
export async function getInvoices(search?: string): Promise<Invoice[]> {
  await requireAuth();
  const supabase = await createClient();

  let query = supabase
    .from("invoices")
    .select(`
      *,
      customer:customers!invoices_customer_id_fkey(name, email),
      items:invoice_items(
        id,
        invoice_id,
        product_id,
        description,
        quantity,
        unit_price,
        total,
        created_at,
        product:products(name, sku)
      )
    `)
    .order("issue_date", { ascending: false });

  // Search by invoice number, customer name, or status
  if (search?.trim()) {
    const searchTerm = search.trim().toLowerCase();
    
    // For status search, we need to do client-side filtering
    // For invoice number and customer, we can use database search
    query = query.or(`invoice_number.ilike.%${searchTerm}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching invoices:", error);
    throw new Error("Failed to fetch invoices");
  }

  // Map to Invoice format with customer details
  const invoices: Invoice[] = (data || []).map((invoice: any) => ({
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    customer_id: invoice.customer_id,
    subscription_id: invoice.subscription_id,
    status: invoice.status,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    subtotal: parseFloat(invoice.subtotal),
    tax_percent: parseFloat(invoice.tax_percent),
    tax_amount: parseFloat(invoice.tax_amount),
    discount_percent: parseFloat(invoice.discount_percent),
    discount_amount: parseFloat(invoice.discount_amount),
    total: parseFloat(invoice.total),
    currency: invoice.currency,
    notes: invoice.notes,
    paid_at: invoice.paid_at,
    created_by: invoice.created_by,
    created_at: invoice.created_at,
    updated_at: invoice.updated_at,
    customer_name: invoice.customer?.name || "Unknown",
    customer_email: invoice.customer?.email || "",
    items: (invoice.items || []).map((item: any) => ({
      id: item.id,
      invoice_id: item.invoice_id,
      product_id: item.product_id,
      description: item.description,
      quantity: parseFloat(item.quantity),
      unit_price: parseFloat(item.unit_price),
      total: parseFloat(item.total),
      created_at: item.created_at,
      product_name: item.product?.name,
      product_sku: item.product?.sku,
    })),
  }));

  return invoices;
}

/**
 * Get a single invoice by ID with all details
 */
export async function getInvoice(id: string): Promise<Invoice | null> {
  await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .select(`
      *,
      customer:customers!invoices_customer_id_fkey(name, email),
      items:invoice_items(
        id,
        invoice_id,
        product_id,
        description,
        quantity,
        unit_price,
        total,
        created_at,
        product:products(name, sku)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    invoice_number: data.invoice_number,
    customer_id: data.customer_id,
    subscription_id: data.subscription_id,
    status: data.status,
    issue_date: data.issue_date,
    due_date: data.due_date,
    subtotal: parseFloat(data.subtotal),
    tax_percent: parseFloat(data.tax_percent),
    tax_amount: parseFloat(data.tax_amount),
    discount_percent: parseFloat(data.discount_percent),
    discount_amount: parseFloat(data.discount_amount),
    total: parseFloat(data.total),
    currency: data.currency,
    notes: data.notes,
    paid_at: data.paid_at,
    created_by: data.created_by,
    created_at: data.created_at,
    updated_at: data.updated_at,
    customer_name: data.customer?.name || "Unknown",
    customer_email: data.customer?.email || "",
    items: (data.items || []).map((item: any) => ({
      id: item.id,
      invoice_id: item.invoice_id,
      product_id: item.product_id,
      description: item.description,
      quantity: parseFloat(item.quantity),
      unit_price: parseFloat(item.unit_price),
      total: parseFloat(item.total),
      created_at: item.created_at,
      product_name: item.product?.name,
      product_sku: item.product?.sku,
    })),
  };
}

/**
 * Mark an invoice as paid
 */
export async function markInvoiceAsPaid(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth();
    const supabase = await createClient();

    const { error } = await supabase
      .from("invoices")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error marking invoice as paid:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/invoices");
    return { success: true };
  } catch (error) {
    console.error("Error in markInvoiceAsPaid:", error);
    return { success: false, error: "Failed to update invoice" };
  }
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth();
    const supabase = await createClient();

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    // If marking as paid, set paid_at timestamp
    if (status === "paid") {
      updateData.paid_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("invoices")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Error updating invoice status:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/invoices");
    return { success: true };
  } catch (error) {
    console.error("Error in updateInvoiceStatus:", error);
    return { success: false, error: "Failed to update invoice status" };
  }
}
