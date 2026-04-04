export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'VIEWER';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  requires_password_change: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffInvite {
  id: string;
  email: string;
  role: UserRole;
  invited_by: string;
  invited_at: string;
  accepted_at?: string;
  token: string;
}
