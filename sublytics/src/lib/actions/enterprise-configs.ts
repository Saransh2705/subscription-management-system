'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import type {
  EnterpriseConfiguration,
  EnterpriseConfigurationDetailed,
  EnterpriseConfigurationWithProducts,
  CreateEnterpriseConfigInput,
  UpdateEnterpriseConfigInput,
  AddProductToConfigInput,
  EnterpriseConfigSummary,
} from '@/lib/types/enterprise';

/**
 * Get all enterprise configurations with optional filtering
 */
export async function getEnterpriseConfigs(
  status?: 'draft' | 'active' | 'archived'
) {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN', 'MANAGER']);
  
  const supabase = createAdminClient();
  
  let query = supabase
    .from('enterprise_configurations_detailed')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching enterprise configs:', error);
    throw new Error('Failed to fetch enterprise configurations');
  }
  
  return data as EnterpriseConfigurationDetailed[];
}

/**
 * Get a single enterprise configuration by ID
 */
export async function getEnterpriseConfig(configId: string) {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN', 'MANAGER']);
  
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('enterprise_configurations')
    .select('*')
    .eq('id', configId)
    .single();
  
  if (error) {
    console.error('Error fetching enterprise config:', error);
    throw new Error('Failed to fetch enterprise configuration');
  }
  
  return data as EnterpriseConfiguration;
}

/**
 * Get enterprise configuration by unique configuration code
 */
export async function getEnterpriseConfigByCode(configCode: string) {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN', 'MANAGER']);
  
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('enterprise_configurations')
    .select('*')
    .eq('configuration_code', configCode)
    .single();
  
  if (error) {
    console.error('Error fetching enterprise config by code:', error);
    throw new Error('Configuration not found');
  }
  
  return data as EnterpriseConfiguration;
}

/**
 * Get enterprise configuration with all its products
 */
export async function getEnterpriseConfigWithProducts(configId: string) {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN', 'MANAGER']);
  
  const supabase = createAdminClient();
  
  // Get configuration
  const { data: config, error: configError } = await supabase
    .from('enterprise_configurations')
    .select('*')
    .eq('id', configId)
    .single();
  
  if (configError) {
    console.error('Error fetching enterprise config:', configError);
    throw new Error('Failed to fetch enterprise configuration');
  }
  
  // Get products
  const { data: products, error: productsError } = await supabase
    .from('enterprise_configuration_products')
    .select(`
      *,
      product:products (
        name,
        sku,
        description
      )
    `)
    .eq('configuration_id', configId)
    .order('created_at', { ascending: true });
  
  if (productsError) {
    console.error('Error fetching config products:', productsError);
    throw new Error('Failed to fetch configuration products');
  }
  
  // Transform products to match type
  const transformedProducts = products.map((p) => ({
    ...p,
    product_name: p.product.name,
    product_sku: p.product.sku,
    product_description: p.product.description,
  }));
  
  return {
    ...config,
    products: transformedProducts,
  } as EnterpriseConfigurationWithProducts;
}

/**
 * Create a new enterprise configuration
 */
export async function createEnterpriseConfig(input: CreateEnterpriseConfigInput) {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN']);
  
  const supabase = createAdminClient();
  
  // Verify the subscription exists and is an Enterprise plan
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select(`
      id,
      plan:subscription_plans!inner(
        name
      )
    `)
    .eq('id', input.subscription_id)
    .single();
  
  if (subError || !subscription) {
    throw new Error('Subscription not found');
  }
  
  // Supabase returns joined data as arrays
  const plan = subscription.plan as any;
  const planName = Array.isArray(plan) ? plan[0]?.name : plan?.name;
  
  if (planName !== 'Enterprise') {
    throw new Error('Only Enterprise plan subscriptions can have custom configurations');
  }
  
  // Generate unique configuration code
  const randomSuffix = Math.floor(Math.random() * 10000000000)
    .toString()
    .padStart(10, '0');
  const configCode = `ENT-${randomSuffix}`;
  
  const { data, error } = await supabase
    .from('enterprise_configurations')
    .insert({
      subscription_id: input.subscription_id,
      configuration_code: configCode,
      status: 'draft',
      min_products_required: input.min_products_required ?? 5,
      base_discount_percent: input.base_discount_percent ?? 25.0,
      billing_day: input.billing_day ?? 1,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating enterprise config:', error);
    throw new Error('Failed to create enterprise configuration');
  }
  
  return data as EnterpriseConfiguration;
}

/**
 * Update an enterprise configuration
 */
export async function updateEnterpriseConfig(
  configId: string,
  input: UpdateEnterpriseConfigInput
) {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN']);
  
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('enterprise_configurations')
    .update(input)
    .eq('id', configId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating enterprise config:', error);
    throw new Error('Failed to update enterprise configuration');
  }
  
  return data as EnterpriseConfiguration;
}

/**
 * Add a product to an enterprise configuration
 */
export async function addProductToConfig(
  configId: string,
  input: AddProductToConfigInput
) {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN']);
  
  const supabase = createAdminClient();
  
  // Verify config exists and is not archived
  const { data: config, error: configError } = await supabase
    .from('enterprise_configurations')
    .select('status')
    .eq('id', configId)
    .single();
  
  if (configError || !config) {
    throw new Error('Configuration not found');
  }
  
  if (config.status === 'archived') {
    throw new Error('Cannot modify archived configurations');
  }
  
  // Check if product already exists in this config
  const { data: existing } = await supabase
    .from('enterprise_configuration_products')
    .select('id')
    .eq('configuration_id', configId)
    .eq('product_id', input.product_id)
    .maybeSingle();
  
  if (existing) {
    throw new Error('Product already exists in this configuration');
  }
  
  const { data, error } = await supabase
    .from('enterprise_configuration_products')
    .insert({
      configuration_id: configId,
      product_id: input.product_id,
      quantity: input.quantity,
      discount_type: input.discount_type ?? null,
      discount_value: input.discount_value ?? null,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding product to config:', error);
    throw new Error('Failed to add product to configuration');
  }
  
  return data;
}

/**
 * Update a product in an enterprise configuration
 */
export async function updateConfigProduct(
  configProductId: string,
  quantity: number,
  discountType?: 'percentage' | 'value' | null,
  discountValue?: number | null
) {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN']);
  
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('enterprise_configuration_products')
    .update({
      quantity,
      discount_type: discountType ?? null,
      discount_value: discountValue ?? null,
    })
    .eq('id', configProductId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating config product:', error);
    throw new Error('Failed to update product');
  }
  
  return data;
}

/**
 * Remove a product from an enterprise configuration
 */
export async function removeProductFromConfig(
  configId: string,
  productId: string
) {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN']);
  
  const supabase = createAdminClient();
  
  // Verify config is not archived
  const { data: config, error: configError } = await supabase
    .from('enterprise_configurations')
    .select('status')
    .eq('id', configId)
    .single();
  
  if (configError || !config) {
    throw new Error('Configuration not found');
  }
  
  if (config.status === 'archived') {
    throw new Error('Cannot modify archived configurations');
  }
  
  const { error } = await supabase
    .from('enterprise_configuration_products')
    .delete()
    .eq('configuration_id', configId)
    .eq('product_id', productId);
  
  if (error) {
    console.error('Error removing product from config:', error);
    throw new Error('Failed to remove product');
  }
  
  return { success: true };
}

/**
 * Activate an enterprise configuration
 * Validates minimum products requirement before activation
 */
export async function activateEnterpriseConfig(configId: string) {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN']);
  
  const supabase = createAdminClient();
  
  // Get configuration with product count
  const { data: config, error: configError } = await supabase
    .from('enterprise_configurations_detailed')
    .select('*')
    .eq('id', configId)
    .single();
  
  if (configError || !config) {
    throw new Error('Configuration not found');
  }
  
  if (config.status === 'active') {
    throw new Error('Configuration is already active');
  }
  
  if (config.status === 'archived') {
    throw new Error('Cannot activate archived configuration');
  }
  
  // Validate minimum products requirement
  if (config.product_count < config.min_products_required) {
    throw new Error(
      `Configuration requires at least ${config.min_products_required} products. Currently has ${config.product_count}.`
    );
  }
  
  const { data, error } = await supabase
    .from('enterprise_configurations')
    .update({
      status: 'active',
      activated_at: new Date().toISOString(),
    })
    .eq('id', configId)
    .select()
    .single();
  
  if (error) {
    console.error('Error activating enterprise config:', error);
    throw new Error('Failed to activate configuration');
  }
  
  return data as EnterpriseConfiguration;
}

/**
 * Archive an enterprise configuration
 */
export async function archiveEnterpriseConfig(configId: string) {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN']);
  
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('enterprise_configurations')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
    })
    .eq('id', configId)
    .select()
    .single();
  
  if (error) {
    console.error('Error archiving enterprise config:', error);
    throw new Error('Failed to archive configuration');
  }
  
  return data as EnterpriseConfiguration;
}

/**
 * Calculate the total monthly payment for a configuration
 * Uses the RPC function defined in the database
 */
export async function calculateConfigTotal(configId: string): Promise<number> {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN', 'MANAGER']);
  
  const supabase = createAdminClient();
  
  const { data, error } = await supabase.rpc('calculate_enterprise_monthly_payment', {
    config_uuid: configId,
  });
  
  if (error) {
    console.error('Error calculating config total:', error);
    throw new Error('Failed to calculate configuration total');
  }
  
  return data as number;
}

/**
 * Get summary of all enterprise configurations
 */
export async function getEnterpriseConfigSummaries(): Promise<EnterpriseConfigSummary[]> {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN', 'MANAGER']);
  
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('enterprise_configurations_detailed')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching config summaries:', error);
    throw new Error('Failed to fetch configuration summaries');
  }
  
  return data.map((config) => ({
    configuration_code: config.configuration_code,
    status: config.status,
    customer_name: config.customer_name,
    product_count: config.product_count,
    monthly_payment_amount: config.monthly_payment_amount,
    activated_at: config.activated_at,
    meets_minimum: config.product_count >= config.min_products_required,
  })) as EnterpriseConfigSummary[];
}
