import { createClient } from '@/lib/supabase/server';
import { UserRole, UserProfile } from '@/lib/types/auth';
import { redirect } from 'next/navigation';

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

export async function requireAuth(): Promise<UserProfile> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  if (!user.is_active) {
    redirect('/login?error=account_disabled');
  }
  
  return user;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<UserProfile> {
  const user = await requireAuth();
  
  if (!allowedRoles.includes(user.role)) {
    redirect('/?error=unauthorized');
  }
  
  return user;
}

export function hasRole(user: UserProfile, roles: UserRole[]): boolean {
  return roles.includes(user.role);
}

export function canManageUsers(user: UserProfile): boolean {
  return user.role === 'ADMIN';
}

export function canViewUsers(user: UserProfile): boolean {
  return ['ADMIN', 'MANAGER'].includes(user.role);
}
