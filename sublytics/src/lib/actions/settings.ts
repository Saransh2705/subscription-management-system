'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import type {
  SystemSettings,
  CurrencyROE,
  AvailableCurrency,
  UpdateSystemSettingsInput,
  CreateCurrencyROEInput,
  UpdateCurrencyROEInput,
} from '@/lib/types/settings';

// ============================================================
// SYSTEM SETTINGS
// ============================================================

/**
 * Get system settings
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  await requireAuth();
  
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .single();
  
  if (error) {
    console.error('Error fetching system settings:', error);
    throw new Error('Failed to fetch system settings');
  }
  
  return data as SystemSettings;
}

/**
 * Update system settings (Admin only)
 */
export async function updateSystemSettings(
  input: UpdateSystemSettingsInput
): Promise<SystemSettings> {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN']);
  
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('system_settings')
    .update(input)
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .select()
    .single();
  
  if (error) {
    console.error('Error updating system settings:', error);
    throw new Error('Failed to update system settings');
  }
  
  return data as SystemSettings;
}

// ============================================================
// CURRENCY ROE MANAGEMENT
// ============================================================

/**
 * Get all currency ROE records
 */
export async function getAllCurrencyROE(
  activeOnly: boolean = false
): Promise<CurrencyROE[]> {
  await requireAuth();
  
  const supabase = createAdminClient();
  
  let query = supabase
    .from('currency_roe')
    .select('*')
    .order('currency_code', { ascending: true });
  
  if (activeOnly) {
    query = query.eq('is_active', true);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching currency ROE:', error);
    throw new Error('Failed to fetch currency ROE');
  }
  
  return data as CurrencyROE[];
}

/**
 * Get a single currency ROE by currency code
 */
export async function getCurrencyROE(currencyCode: string): Promise<CurrencyROE> {
  await requireAuth();
  
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('currency_roe')
    .select('*')
    .eq('currency_code', currencyCode)
    .single();
  
  if (error) {
    console.error('Error fetching currency ROE:', error);
    throw new Error('Currency not found');
  }
  
  return data as CurrencyROE;
}

/**
 * Get available currencies (system currency + active ROE currencies)
 */
export async function getAvailableCurrencies(): Promise<AvailableCurrency[]> {
  await requireAuth();
  
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('available_currencies')
    .select('*');
  
  if (error) {
    console.error('Error fetching available currencies:', error);
    throw new Error('Failed to fetch available currencies');
  }
  
  return data as AvailableCurrency[];
}

/**
 * Create a new currency ROE (Admin only)
 */
export async function createCurrencyROE(
  input: CreateCurrencyROEInput
): Promise<CurrencyROE> {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN']);
  
  const supabase = createAdminClient();
  
  // Validate currency code format (3 uppercase letters)
  if (!/^[A-Z]{3}$/.test(input.currency_code)) {
    throw new Error('Currency code must be 3 uppercase letters');
  }
  
  // Check if currency already exists
  const { data: existing } = await supabase
    .from('currency_roe')
    .select('id')
    .eq('currency_code', input.currency_code)
    .maybeSingle();
  
  if (existing) {
    throw new Error('Currency already exists');
  }
  
  const { data, error } = await supabase
    .from('currency_roe')
    .insert({
      currency_code: input.currency_code,
      currency_name: input.currency_name,
      roe_rate: input.roe_rate,
      is_active: input.is_active ?? true,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating currency ROE:', error);
    throw new Error('Failed to create currency ROE');
  }
  
  return data as CurrencyROE;
}

/**
 * Update currency ROE (Admin only)
 */
export async function updateCurrencyROE(
  currencyCode: string,
  input: UpdateCurrencyROEInput
): Promise<CurrencyROE> {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN']);
  
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('currency_roe')
    .update(input)
    .eq('currency_code', currencyCode)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating currency ROE:', error);
    throw new Error('Failed to update currency ROE');
  }
  
  return data as CurrencyROE;
}

/**
 * Delete currency ROE (Admin only)
 */
export async function deleteCurrencyROE(currencyCode: string): Promise<void> {
  await requireRole(['SYSTEM_ADMIN', 'ADMIN']);
  
  const supabase = createAdminClient();
  
  const { error } = await supabase
    .from('currency_roe')
    .delete()
    .eq('currency_code', currencyCode);
  
  if (error) {
    console.error('Error deleting currency ROE:', error);
    throw new Error('Failed to delete currency ROE');
  }
}

/**
 * Convert amount to system currency
 */
export async function convertToSystemCurrency(
  amount: number,
  fromCurrency: string
): Promise<number> {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase.rpc('convert_to_system_currency', {
    amount,
    from_currency: fromCurrency,
  });
  
  if (error) {
    console.error('Error converting to system currency:', error);
    throw new Error('Failed to convert currency');
  }
  
  return data as number;
}

/**
 * Convert amount from system currency
 */
export async function convertFromSystemCurrency(
  amount: number,
  toCurrency: string
): Promise<number> {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase.rpc('convert_from_system_currency', {
    amount,
    to_currency: toCurrency,
  });
  
  if (error) {
    console.error('Error converting from system currency:', error);
    throw new Error('Failed to convert currency');
  }
  
  return data as number;
}
