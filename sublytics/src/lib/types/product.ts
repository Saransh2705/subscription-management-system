export type DiscountType = 'percentage' | 'value';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  unit_price: number;
  tax_percent: number;
  currency: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  discount_percentage: number; // 0-100, discount applied to products
  trial_days: number;
  features: any[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlanProduct {
  id: string;
  plan_id: string;
  product_id: string;
  tier_price: number;
  is_included: boolean;
  quantity_limit: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  product?: Product;
  plan?: SubscriptionPlan;
}

export interface ProductWithTiers extends Product {
  tiers?: SubscriptionPlanProduct[];
}

export interface SubscriptionProduct {
  id: string;
  subscription_id: string;
  product_id: string;
  plan_product_id: string | null;
  quantity: number;
  unit_price: number;
  discount_type: DiscountType;
  discount_value: number;
  total_price: number;
  added_at: string;
  removed_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  product?: Product;
}

// View type: subscription_products_detailed
export interface SubscriptionProductDetailed extends SubscriptionProduct {
  discounted_unit_price: number;
  discount_amount: number;
  subtotal_after_discount: number;
  tax_percent: number;
  tax_amount: number;
  total_price_with_tax: number;
  product_name: string;
  product_sku: string | null;
}

export interface Subscription {
  id: string;
  customer_id: string;
  plan_id: string;
  status: 'active' | 'inactive' | 'cancelled' | 'paused' | 'trial';
  start_date: string;
  end_date: string | null;
  trial_end_date: string | null;
  next_billing_date: string | null;
  quantity: number;
  discount_percent: number;
  subscription_discount_type: DiscountType;
  subscription_discount_value: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  plan?: SubscriptionPlan;
  products?: SubscriptionProduct[];
}

// View type: subscriptions_with_totals
export interface SubscriptionWithTotals extends Subscription {
  plan_price: number;
  plan_name: string;
  products_total: number;
  gross_total: number;
  subscription_discount_amount: number;
  final_amount: number;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  sku?: string;
  unit_price: number;
  tax_percent?: number;
  currency?: string;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  is_active?: boolean;
}

export interface CreatePlanProductInput {
  plan_id: string;
  product_id: string;
  tier_price: number;
  is_included?: boolean;
  quantity_limit?: number;
  notes?: string;
}

export interface UpdatePlanProductInput extends Partial<CreatePlanProductInput> {}
