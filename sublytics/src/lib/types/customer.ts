/**
 * Customer Types
 */

export interface Customer {
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
  created_by: string | null; // NULL = created via API, UUID = created by user
  created_at: string;
  updated_at: string;
}

export interface CustomerWithCreator extends Customer {
  creator_name?: string; // Full name or email of creating user (if created_by exists)
  creation_source: 'api' | 'user'; // Derived: 'api' if created_by is null, 'user' otherwise
}

// Input types
export interface CreateCustomerInput {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  notes?: string | null;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  notes?: string | null;
  is_active?: boolean;
}
