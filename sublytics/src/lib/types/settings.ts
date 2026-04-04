/**
 * System Settings and Currency ROE Types
 */

export interface SystemSettings {
  id: string;
  company_name: string;
  company_email: string;
  company_phone: string | null;
  company_address: string | null;
  company_city: string | null;
  company_country: string | null;
  company_logo_url: string | null;
  system_currency_code: string;
  invoice_footer_text: string | null;
  invoice_notes: string | null;
  tax_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CurrencyROE {
  id: string;
  currency_code: string;
  currency_name: string;
  roe_rate: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvailableCurrency {
  currency_code: string;
  currency_name: string;
  roe_rate: number;
  is_system_currency: boolean;
}

// Input types for updates
export interface UpdateSystemSettingsInput {
  company_name?: string;
  company_email?: string;
  company_phone?: string | null;
  company_address?: string | null;
  company_city?: string | null;
  company_country?: string | null;
  company_logo_url?: string | null;
  system_currency_code?: string;
  invoice_footer_text?: string | null;
  invoice_notes?: string | null;
  tax_id?: string | null;
}

export interface CreateCurrencyROEInput {
  currency_code: string;
  currency_name: string;
  roe_rate: number;
  is_active?: boolean;
  notes?: string | null;
}

export interface UpdateCurrencyROEInput {
  currency_name?: string;
  roe_rate?: number;
  is_active?: boolean;
  notes?: string | null;
}
