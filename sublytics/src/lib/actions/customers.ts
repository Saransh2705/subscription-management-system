"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/rbac";
import type { Customer, CustomerWithCreator, CreateCustomerInput, UpdateCustomerInput } from "@/lib/types/customer";

// Helper to serialize customer data for client
function serializeCustomer(customer: any): Customer {
  return {
    ...customer,
    created_at: customer.created_at?.toISOString?.() || customer.created_at,
    updated_at: customer.updated_at?.toISOString?.() || customer.updated_at,
  };
}

/**
 * Get all customers with optional search and pagination
 * Supports search by: ID, name, email
 * Results are ordered alphabetically by name
 */
export async function getCustomers(
  search?: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ customers: CustomerWithCreator[]; total: number }> {
  const user = await requireAuth();
  const supabase = await createClient();

  let query = supabase
    .from("customers")
    .select(`
      *,
      creator:user_profiles!customers_created_by_fkey(full_name, email)
    `, { count: 'exact' });

  // Search by ID, name, or email
  if (search?.trim()) {
    const searchTerm = search.trim();
    
    // Check if search looks like a UUID (for ID search)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (uuidRegex.test(searchTerm)) {
      // Exact match on ID
      query = query.eq('id', searchTerm);
    } else {
      // Search by name or email (case-insensitive)
      query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }
  }

  // Order alphabetically by name
  query = query.order('name', { ascending: true });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching customers:", error);
    throw new Error("Failed to fetch customers");
  }

  // Map to CustomerWithCreator format
  const customers: CustomerWithCreator[] = (data || []).map((customer: any) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    company: customer.company,
    address: customer.address,
    city: customer.city,
    country: customer.country,
    notes: customer.notes,
    is_active: customer.is_active,
    created_by: customer.created_by,
    created_at: customer.created_at,
    updated_at: customer.updated_at,
    creator_name: customer.creator?.[0]?.full_name || customer.creator?.[0]?.email,
    creation_source: customer.created_by ? 'user' : 'api',
  }));

  return { customers, total: count || 0 };
}

/**
 * Get a single customer by ID
 */
export async function getCustomer(id: string): Promise<CustomerWithCreator | null> {
  await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select(`
      *,
      creator:user_profiles!customers_created_by_fkey(full_name, email)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    company: data.company,
    address: data.address,
    city: data.city,
    country: data.country,
    notes: data.notes,
    is_active: data.is_active,
    created_by: data.created_by,
    created_at: data.created_at,
    updated_at: data.updated_at,
    creator_name: data.creator?.[0]?.full_name || data.creator?.[0]?.email,
    creation_source: data.created_by ? 'user' : 'api',
  };
}

/**
 * Create a new customer
 * Sets created_by to current user (not API)
 */
export async function createCustomer(input: CreateCustomerInput): Promise<{ success: boolean; customer?: Customer; error?: string }> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Validate required fields
    if (!input.name?.trim()) {
      return { success: false, error: "Customer name is required" };
    }
    if (!input.email?.trim()) {
      return { success: false, error: "Customer email is required" };
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("email", input.email.trim())
      .single();

    if (existing) {
      return { success: false, error: "A customer with this email already exists" };
    }

    const { data, error } = await supabase
      .from("customers")
      .insert({
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone?.trim() || null,
        company: input.company?.trim() || null,
        address: input.address?.trim() || null,
        city: input.city?.trim() || null,
        country: input.country?.trim() || null,
        notes: input.notes?.trim() || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating customer:", error);
      return { success: false, error: error.message || "Failed to create customer" };
    }

    console.log("Customer created successfully:", data?.id);
    return { success: true, customer: serializeCustomer(data) };
  } catch (error: any) {
    console.error("Unexpected error in createCustomer:", error);
    return { success: false, error: error?.message || "An unexpected error occurred" };
  }
}

/**
 * Update an existing customer
 */
export async function updateCustomer(id: string, input: UpdateCustomerInput): Promise<{ success: boolean; customer?: Customer; error?: string }> {
  await requireAuth();
  const supabase = await createClient();

  // If email is being updated, check uniqueness
  if (input.email) {
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("email", input.email.trim())
      .neq("id", id)
      .single();

    if (existing) {
      return { success: false, error: "A customer with this email already exists" };
    }
  }

  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name.trim();
  if (input.email !== undefined) updateData.email = input.email.trim().toLowerCase();
  if (input.phone !== undefined) updateData.phone = input.phone?.trim() || null;
  if (input.company !== undefined) updateData.company = input.company?.trim() || null;
  if (input.address !== undefined) updateData.address = input.address?.trim() || null;
  if (input.city !== undefined) updateData.city = input.city?.trim() || null;
  if (input.country !== undefined) updateData.country = input.country?.trim() || null;
  if (input.notes !== undefined) updateData.notes = input.notes?.trim() || null;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  const { data, error } = await supabase
    .from("customers")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating customer:", error);
    return { success: false, error: "Failed to update customer" };
  }

  return { success: true, customer: serializeCustomer(data) };
}

/**
 * Delete a customer (soft delete by setting is_active = false)
 */
export async function deleteCustomer(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAuth();
  const supabase = await createClient();

  // Check if customer has active subscriptions
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("customer_id", id)
    .eq("status", "active")
    .limit(1);

  if (subscriptions && subscriptions.length > 0) {
    return { success: false, error: "Cannot delete customer with active subscriptions" };
  }

  // Soft delete
  const { error } = await supabase
    .from("customers")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("Error deleting customer:", error);
    return { success: false, error: "Failed to delete customer" };
  }

  return { success: true };
}

/**
 * Toggle customer active status
 */
export async function toggleCustomerStatus(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAuth();
  const supabase = await createClient();

  // Get current status
  const { data: customer } = await supabase
    .from("customers")
    .select("is_active")
    .eq("id", id)
    .single();

  if (!customer) {
    return { success: false, error: "Customer not found" };
  }

  // Toggle status
  const { error } = await supabase
    .from("customers")
    .update({ is_active: !customer.is_active })
    .eq("id", id);

  if (error) {
    console.error("Error toggling customer status:", error);
    return { success: false, error: "Failed to update customer status" };
  }

  return { success: true };
}
