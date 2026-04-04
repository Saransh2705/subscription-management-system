/**
 * Enterprise Configuration Types
 * 
 * Types for custom product configurations available to Enterprise plan customers.
 * Enterprise customers can manually select products and receive custom pricing with base discounts.
 */

export type EnterpriseConfigurationStatus = 'draft' | 'active' | 'archived';

export interface EnterpriseConfiguration {
  id: string;
  subscription_id: string;
  configuration_code: string;
  status: EnterpriseConfigurationStatus;
  min_products_required: number;
  base_discount_percent: number;
  monthly_payment_amount: number | null;
  billing_day: number;
  activated_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnterpriseConfigurationProduct {
  id: string;
  configuration_id: string;
  product_id: string;
  quantity: number;
  base_unit_price: number;
  tax_percent: number;
  discount_type: 'percentage' | 'value' | null;
  discount_value: number | null;
  final_unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface EnterpriseConfigurationDetailed extends EnterpriseConfiguration {
  customer_name: string;
  customer_email: string;
  plan_name: string;
  plan_interval: 'monthly' | 'yearly';
  product_count: number;
}

export interface EnterpriseConfigurationWithProducts extends EnterpriseConfiguration {
  products: Array<EnterpriseConfigurationProduct & {
    product_name: string;
    product_sku: string;
    product_description: string | null;
  }>;
}

// Input types for creating/updating configurations
export interface CreateEnterpriseConfigInput {
  subscription_id: string;
  base_discount_percent?: number; // defaults to 25%
  min_products_required?: number; // defaults to 5
  billing_day?: number; // defaults to 1
}

export interface UpdateEnterpriseConfigInput {
  base_discount_percent?: number;
  billing_day?: number;
  status?: EnterpriseConfigurationStatus;
}

export interface AddProductToConfigInput {
  product_id: string;
  quantity: number;
  discount_type?: 'percentage' | 'value' | null;
  discount_value?: number | null;
}

// View model for UI display
export interface EnterpriseConfigSummary {
  configuration_code: string;
  status: EnterpriseConfigurationStatus;
  customer_name: string;
  product_count: number;
  monthly_payment_amount: number | null;
  activated_at: string | null;
  meets_minimum: boolean; // product_count >= min_products_required
}
