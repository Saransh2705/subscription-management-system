export interface Plan {
  id: string;
  name: string;
  description: string;
  trial_days: number;
  is_active: boolean;
  features: string[];
  pricing: {
    base_price: number;
    discount_percentage: number;
    final_price: number;
  };
  products: Array<{
    name: string;
    description: string;
    sku: string;
    is_included: boolean;
  }>;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export async function getPlans(): Promise<Plan[]> {
  try {
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
    const companyId = process.env.DEFAULT_COMPANY_ID || 'company_default';
    const companySecret = process.env.DEFAULT_COMPANY_SECRET;

    if (!companySecret) {
      throw new Error('DEFAULT_COMPANY_SECRET is not configured');
    }

    console.log('🔐 [Server] Authenticating with V1 API...');
    
    // Step 1: Authenticate
    const authResponse = await fetch(`${apiBaseUrl}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_id: companyId,
        company_secret: companySecret,
      }),
      cache: 'no-store', // Always fetch fresh token
    });

    if (!authResponse.ok) {
      throw new Error('Failed to authenticate with API');
    }

    const authData = await authResponse.json();

    if (!authData.success || !authData.token) {
      throw new Error('Invalid authentication response');
    }

    console.log('✅ [Server] Authenticated successfully');
    console.log('📊 [Server] Fetching subscription plans...');

    // Step 2: Fetch plans with the token
    const plansResponse = await fetch(`${apiBaseUrl}/plans`, {
      headers: {
        'Authorization': `Bearer ${authData.token}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 43200 }, // Revalidate every 12 hours (43200 seconds)
    });

    if (!plansResponse.ok) {
      throw new Error('Failed to fetch plans');
    }

    const plansData = await plansResponse.json();

    if (!plansData.success || !plansData.data) {
      throw new Error('Invalid plans response');
    }

    console.log('✅ [Server] Fetched', plansData.data.length, 'plans from API');

    // Filter only active plans
    const activePlans = plansData.data.filter((plan: Plan) => plan.is_active);
    
    return activePlans;
  } catch (err: any) {
    console.error('❌ [Server] Error fetching plans:', err.message);
    throw err;
  }
}
