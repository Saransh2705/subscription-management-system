import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function getCurrentUserCustomerId(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ [Get Customer ID] Not authenticated');
      return null;
    }

    // Get customer_id from staff_users
    const { data, error } = await supabase
      .from('staff_users')
      .select('customer_id, customer_email')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('❌ [Get Customer ID] Query error:', error);
      return null;
    }

    if (!data?.customer_id) {
      console.warn('⚠️ [Get Customer ID] User not synced yet');
      return null;
    }

    return data.customer_id;
  } catch (error: any) {
    console.error('❌ [Get Customer ID] Error:', error.message);
    return null;
  }
}

export async function getCurrentUserWithCustomer() {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { user: null, customer_id: null, customer_email: null };
    }

    const { data } = await supabase
      .from('staff_users')
      .select('customer_id, customer_email, customer_synced_at')
      .eq('id', user.id)
      .single();

    return {
      user,
      customer_id: data?.customer_id || null,
      customer_email: data?.customer_email || null,
      customer_synced_at: data?.customer_synced_at || null,
    };
  } catch (error: any) {
    console.error('❌ [Get User With Customer] Error:', error.message);
    return { user: null, customer_id: null, customer_email: null };
  }
}
