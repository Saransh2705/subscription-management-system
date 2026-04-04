"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/rbac";
import type { SubscriptionPlan, SubscriptionPlanProduct } from "@/lib/types/product";

/**
 * Get all subscription plans with their calculated pricing
 */
export async function getPlans(): Promise<{ plans: any[]; error?: string }> {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN']);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subscription_plans_with_pricing")
    .select("*")
    .order("discount_percentage", { ascending: true });

  if (error) {
    console.error("Error fetching plans:", error);
    return { plans: [], error: "Failed to fetch plans" };
  }

  return { plans: data || [] };
}

/**
 * Get a single plan with its products
 */
export async function getPlanWithProducts(planId: string): Promise<{ plan: any; products: SubscriptionPlanProduct[]; error?: string }> {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN']);
  const supabase = await createClient();

  // Get plan
  const { data: plan, error: planError } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("id", planId)
    .single();

  if (planError || !plan) {
    return { plan: null, products: [], error: "Plan not found" };
  }

  // Get plan products
  const { data: products, error: productsError } = await supabase
    .from("subscription_plan_products")
    .select(`
      *,
      product:products(*)
    `)
    .eq("plan_id", planId)
    .order("created_at", { ascending: true });

  if (productsError) {
    console.error("Error fetching plan products:", productsError);
    return { plan, products: [], error: "Failed to fetch plan products" };
  }

  return { plan, products: products || [] };
}

/**
 * Update plan discount percentage
 */
export async function updatePlanDiscount(planId: string, discountPercentage: number): Promise<{ success: boolean; error?: string }> {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN']);
  const supabase = await createClient();

  if (discountPercentage < 0 || discountPercentage > 100) {
    return { success: false, error: "Discount must be between 0 and 100" };
  }

  const { error } = await supabase
    .from("subscription_plans")
    .update({ discount_percentage: discountPercentage })
    .eq("id", planId);

  if (error) {
    console.error("Error updating plan discount:", error);
    return { success: false, error: "Failed to update plan discount" };
  }

  return { success: true };
}

/**
 * Add a product to a plan
 */
export async function addProductToPlan(input: {
  planId: string;
  productId: string;
  tierPrice?: number;
  isIncluded?: boolean;
  quantityLimit?: number | null;
  notes?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const user = await requireRole(['SYSTEM_ADMIN', 'ADMIN']);
  const supabase = await createClient();

  // Check if already exists
  const { data: existing } = await supabase
    .from("subscription_plan_products")
    .select("id")
    .eq("plan_id", input.planId)
    .eq("product_id", input.productId)
    .single();

  if (existing) {
    return { success: false, error: "Product is already added to this plan" };
  }

  const { error } = await supabase
    .from("subscription_plan_products")
    .insert({
      plan_id: input.planId,
      product_id: input.productId,
      tier_price: input.tierPrice || 0,
      is_included: input.isIncluded ?? true,
      quantity_limit: input.quantityLimit || null,
      notes: input.notes || null,
      created_by: user.id,
    });

  if (error) {
    console.error("Error adding product to plan:", error);
    return { success: false, error: "Failed to add product to plan" };
  }

  return { success: true };
}

/**
 * Update a plan product
 */
export async function updatePlanProduct(id: string, input: {
  tierPrice?: number;
  isIncluded?: boolean;
  quantityLimit?: number | null;
  notes?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN']);
  const supabase = await createClient();

  const updateData: any = {};
  if (input.tierPrice !== undefined) updateData.tier_price = input.tierPrice;
  if (input.isIncluded !== undefined) updateData.is_included = input.isIncluded;
  if (input.quantityLimit !== undefined) updateData.quantity_limit = input.quantityLimit;
  if (input.notes !== undefined) updateData.notes = input.notes;

  const { error } = await supabase
    .from("subscription_plan_products")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("Error updating plan product:", error);
    return { success: false, error: "Failed to update plan product" };
  }

  return { success: true };
}

/**
 * Remove a product from a plan
 */
export async function removeProductFromPlan(id: string): Promise<{ success: boolean; error?: string }> {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN']);
  const supabase = await createClient();

  const { error } = await supabase
    .from("subscription_plan_products")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error removing product from plan:", error);
    return { success: false, error: "Failed to remove product from plan" };
  }

  return { success: true };
}

/**
 * Create a new subscription plan
 */
export async function createPlan(input: {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  billing_cycle: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  trial_days?: number;
  features?: string[];
  discount_percentage?: number;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const user = await requireRole(['SYSTEM_ADMIN', 'ADMIN']);
  const supabase = await createClient();

  // Validate required fields
  if (!input.name || input.price < 0) {
    return { success: false, error: "Name and valid price are required" };
  }

  const { data, error } = await supabase
    .from("subscription_plans")
    .insert({
      name: input.name,
      description: input.description || null,
      price: input.price,
      currency: input.currency || 'USD',
      billing_cycle: input.billing_cycle,
      trial_days: input.trial_days || 0,
      features: input.features || [],
      discount_percentage: input.discount_percentage || 0,
      is_active: true,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating plan:", error);
    return { success: false, error: "Failed to create plan" };
  }

  return { success: true, data };
}

/**
 * Delete a subscription plan
 */
export async function deletePlan(planId: string): Promise<{ success: boolean; error?: string }> {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN']);
  const supabase = await createClient();

  // Check if plan has active subscriptions
  const { data: subscriptions, error: checkError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("plan_id", planId)
    .eq("status", "active")
    .limit(1);

  if (checkError) {
    console.error("Error checking plan subscriptions:", checkError);
    return { success: false, error: "Failed to check plan subscriptions" };
  }

  if (subscriptions && subscriptions.length > 0) {
    return { success: false, error: "Cannot delete plan with active subscriptions. Deactivate it instead." };
  }

  // Delete plan (cascade will delete plan_products)
  const { error } = await supabase
    .from("subscription_plans")
    .delete()
    .eq("id", planId);

  if (error) {
    console.error("Error deleting plan:", error);
    return { success: false, error: "Failed to delete plan" };
  }

  return { success: true };
}

/**
 * Toggle plan active status
 */
export async function togglePlanStatus(planId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN']);
  const supabase = await createClient();

  const { error } = await supabase
    .from("subscription_plans")
    .update({ is_active: isActive })
    .eq("id", planId);

  if (error) {
    console.error("Error toggling plan status:", error);
    return { success: false, error: "Failed to update plan status" };
  }

  return { success: true };
}
