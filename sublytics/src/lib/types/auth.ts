export type UserRole = 'SYSTEM_ADMIN' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'VIEWER';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  requires_password_change: boolean;
  email_verified: boolean;
  avatar_url: string | null;
  invited_at: string | null;
  invited_by: string | null;
  last_invite_sent_at: string | null;
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
