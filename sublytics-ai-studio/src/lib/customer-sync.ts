import 'server-only';

interface CreateCustomerParams {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
}

interface CreateCustomerResponse {
  success: boolean;
  data?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
  };
  error?: string;
}

async function getAuthToken(): Promise<string> {
  const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
  const companyId = process.env.DEFAULT_COMPANY_ID || 'company_default';
  const companySecret = process.env.DEFAULT_COMPANY_SECRET;

  if (!companySecret) {
    throw new Error('DEFAULT_COMPANY_SECRET is not configured');
  }

  console.log('🔐 [Customer API] Authenticating...');

  const authResponse = await fetch(`${apiBaseUrl}/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      company_id: companyId,
      company_secret: companySecret,
    }),
    cache: 'no-store',
  });

  if (!authResponse.ok) {
    throw new Error('Failed to authenticate with API');
  }

  const authData = await authResponse.json();

  if (!authData.success || !authData.token) {
    throw new Error('Invalid authentication response');
  }

  console.log('✅ [Customer API] Authenticated');
  return authData.token;
}

export async function createCustomerInMainAPI(
  params: CreateCustomerParams
): Promise<CreateCustomerResponse> {
  try {
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
    
    // Get auth token
    const token = await getAuthToken();

    console.log('👤 [Customer API] Creating customer:', params.email);

    // Create customer
    const response = await fetch(`${apiBaseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('❌ [Customer API] Failed to create customer:', data.error);
      return {
        success: false,
        error: data.error?.message || 'Failed to create customer',
      };
    }

    console.log('✅ [Customer API] Customer created:', data.data.id);

    return {
      success: true,
      data: data.data,
    };
  } catch (error: any) {
    console.error('❌ [Customer API] Error:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to create customer',
    };
  }
}

export async function syncCustomerForUser(userId: string, userEmail: string, userName?: string) {
  try {
    const { createSupabaseServerClient } = await import('@/lib/supabase-server');
    const supabase = await createSupabaseServerClient();

    // Check if customer already exists
    const { data: existingUser } = await supabase
      .from('staff_users')
      .select('customer_id, customer_email, customer_synced_at')
      .eq('id', userId)
      .single();

    // If customer already synced and email matches, skip
    if (existingUser?.customer_id && existingUser?.customer_email === userEmail) {
      console.log('✅ [Customer Sync] Already synced:', existingUser.customer_id);
      return { success: true, customer_id: existingUser.customer_id };
    }

    // Create customer in main API
    const result = await createCustomerInMainAPI({
      name: userName || userEmail.split('@')[0],
      email: userEmail,
      notes: 'Created from AI Studio login',
    });

    if (!result.success || !result.data) {
      console.error('❌ [Customer Sync] Failed to create customer');
      return { success: false, error: result.error };
    }

    // Update staff_users with customer_id
    const { error: updateError } = await supabase
      .from('staff_users')
      .update({
        customer_id: result.data.id,
        customer_email: result.data.email,
        customer_synced_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ [Customer Sync] Failed to update user:', updateError);
      return { success: false, error: 'Failed to update user with customer ID' };
    }

    console.log('✅ [Customer Sync] User linked to customer:', result.data.id);

    return {
      success: true,
      customer_id: result.data.id,
    };
  } catch (error: any) {
    console.error('❌ [Customer Sync] Error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}
