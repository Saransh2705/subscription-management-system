'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import type { 
  Product, 
  ProductWithTiers,
  CreateProductInput, 
  UpdateProductInput,
  CreatePlanProductInput,
  UpdatePlanProductInput,
  SubscriptionPlanProduct,
  SubscriptionProductDetailed,
  SubscriptionWithTotals
} from '@/lib/types/product';

// Cache tags for granular revalidation
const PRODUCTS_TAG = 'products';
const PRODUCTS_WITH_TIERS_TAG = 'products-with-tiers';
const PLAN_PRODUCTS_TAG = 'plan-products';

export const getProducts = unstable_cache(
  async () => {
    try {
      const supabase = await createClient();
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as Product[] };
    } catch (error) {
      console.error('Error in getProducts:', error);
      return { success: false, error: 'Failed to fetch products' };
    }
  },
  ['products-list'],
  {
    tags: [PRODUCTS_TAG],
    revalidate: 3600, // Revalidate every hour OR when tag is invalidated
  }
);

export async function getProductById(id: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Product };
  } catch (error) {
    console.error('Error in getProductById:', error);
    return { success: false, error: 'Failed to fetch product' };
  }
}

export const getProductsWithTiers = unstable_cache(
  async () => {
    try {
      const supabase = await createClient();
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          tiers:subscription_plan_products(
            *,
            plan:subscription_plans(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products with tiers:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ProductWithTiers[] };
    } catch (error) {
      console.error('Error in getProductsWithTiers:', error);
      return { success: false, error: 'Failed to fetch products with tiers' };
    }
  },
  ['products-with-tiers-list'],
  {
    tags: [PRODUCTS_WITH_TIERS_TAG, PRODUCTS_TAG, PLAN_PRODUCTS_TAG],
    revalidate: 3600,
  }
);

export async function createProduct(input: CreateProductInput) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        ...input,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return { success: false, error: error.message };
    }

    revalidateTag(PRODUCTS_TAG);
    revalidateTag(PRODUCTS_WITH_TIERS_TAG);
    revalidatePath('/products');
    return { success: true, data: data as Product };
  } catch (error) {
    console.error('Error in createProduct:', error);
    return { success: false, error: 'Failed to create product' };
  }
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('products')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return { success: false, error: error.message };
    }

    revalidateTag(PRODUCTS_TAG);
    revalidateTag(PRODUCTS_WITH_TIERS_TAG);
    revalidatePath('/products');
    return { success: true, data: data as Product };
  } catch (error) {
    console.error('Error in updateProduct:', error);
    return { success: false, error: 'Failed to update product' };
  }
}

export async function deleteProduct(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return { success: false, error: error.message };
    }

    revalidateTag(PRODUCTS_TAG);
    revalidateTag(PRODUCTS_WITH_TIERS_TAG);
    revalidatePath('/products');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    return { success: false, error: 'Failed to delete product' };
  }
}

export async function toggleProductStatus(id: string, isActive: boolean) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('products')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling product status:', error);
      return { success: false, error: error.message };
    }

    revalidateTag(PRODUCTS_TAG);
    revalidateTag(PRODUCTS_WITH_TIERS_TAG);
    revalidatePath('/products');
    return { success: true, data: data as Product };
  } catch (error) {
    console.error('Error in toggleProductStatus:', error);
    return { success: false, error: 'Failed to toggle product status' };
  }
}

// ============================================================
// Plan Product Pricing Management
// ============================================================

export async function getPlanProducts(planId: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('subscription_plan_products')
      .select(`
        *,
        product:products(*),
        plan:subscription_plans(*)
      `)
      .eq('plan_id', planId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching plan products:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as SubscriptionPlanProduct[] };
  } catch (error) {
    console.error('Error in getPlanProducts:', error);
    return { success: false, error: 'Failed to fetch plan products' };
  }
}

export async function getProductPlans(productId: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('subscription_plan_products')
      .select(`
        *,
        product:products(*),
        plan:subscription_plans(*)
      `)
      .eq('product_id', productId)
      .order('tier_price', { ascending: true });

    if (error) {
      console.error('Error fetching product plans:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as SubscriptionPlanProduct[] };
  } catch (error) {
    console.error('Error in getProductPlans:', error);
    return { success: false, error: 'Failed to fetch product plans' };
  }
}

export async function createPlanProduct(input: CreatePlanProductInput) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('subscription_plan_products')
      .insert({
        ...input,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating plan product:', error);
      return { success: false, error: error.message };
    }

    revalidateTag(PRODUCTS_WITH_TIERS_TAG);
    revalidateTag(PLAN_PRODUCTS_TAG);
    revalidatePath('/products');
    revalidatePath('/plans');
    return { success: true, data: data as SubscriptionPlanProduct };
  } catch (error) {
    console.error('Error in createPlanProduct:', error);
    return { success: false, error: 'Failed to create plan product' };
  }
}

export async function updatePlanProduct(id: string, input: UpdatePlanProductInput) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('subscription_plan_products')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating plan product:', error);
      return { success: false, error: error.message };
    }

    revalidateTag(PRODUCTS_WITH_TIERS_TAG);
    revalidateTag(PLAN_PRODUCTS_TAG);
    revalidatePath('/products');
    revalidatePath('/plans');
    return { success: true, data: data as SubscriptionPlanProduct };
  } catch (error) {
    console.error('Error in updatePlanProduct:', error);
    return { success: false, error: 'Failed to update plan product' };
  }
}

export async function deletePlanProduct(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('subscription_plan_products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting plan product:', error);
      return { success: false, error: error.message };
    }

    revalidateTag(PRODUCTS_WITH_TIERS_TAG);
    revalidateTag(PLAN_PRODUCTS_TAG);
    revalidatePath('/products');
    revalidatePath('/plans');
    return { success: true };
  } catch (error) {
    console.error('Error in deletePlanProduct:', error);
    return { success: false, error: 'Failed to delete plan product' };
  }
}

// ============================================================
// Subscription Price Calculation
// ============================================================

export async function calculateSubscriptionTotal(subscriptionId: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .rpc('calculate_subscription_total', { subscription_uuid: subscriptionId });

    if (error) {
      console.error('Error calculating subscription total:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as number };
  } catch (error) {
    console.error('Error in calculateSubscriptionTotal:', error);
    return { success: false, error: 'Failed to calculate subscription total' };
  }
}

// ============================================================
// View Queries: Detailed Products & Subscription Totals
// ============================================================

export async function getSubscriptionProductsDetailed(subscriptionId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('subscription_products_detailed')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching detailed subscription products:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as SubscriptionProductDetailed[] };
  } catch (error) {
    console.error('Error in getSubscriptionProductsDetailed:', error);
    return { success: false, error: 'Failed to fetch detailed subscription products' };
  }
}

export async function getSubscriptionsWithTotals() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('subscriptions_with_totals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions with totals:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as SubscriptionWithTotals[] };
  } catch (error) {
    console.error('Error in getSubscriptionsWithTotals:', error);
    return { success: false, error: 'Failed to fetch subscriptions with totals' };
  }
}

export async function getSubscriptionWithTotals(subscriptionId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('subscriptions_with_totals')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (error) {
      console.error('Error fetching subscription with totals:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as SubscriptionWithTotals };
  } catch (error) {
    console.error('Error in getSubscriptionWithTotals:', error);
    return { success: false, error: 'Failed to fetch subscription with totals' };
  }
}
