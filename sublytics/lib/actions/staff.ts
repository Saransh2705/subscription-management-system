'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/rbac';
import type { UserRole } from '@/lib/types/auth';
import { sendMagicLinkEmail } from '@/lib/email/resend';
import { randomBytes } from 'crypto';

export async function getUsers() {
  await requireRole(['ADMIN']);
  
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return { error: 'Failed to fetch users' };
  }

  return { data };
}

export async function inviteUser(email: string, role: UserRole) {
  await requireRole(['ADMIN']);

  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return { error: 'User already exists' };
    }

    // Create user with Supabase Auth Admin API
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: false, // Will confirm via magic link
    });

    if (authError) {
      console.error('Error creating user:', authError);
      return { error: 'Failed to create user' };
    }

    // Update user profile with role
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        role,
        requires_password_change: true,
        is_active: true,
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Error updating user profile:', profileError);
      return { error: 'Failed to update user profile' };
    }

    // Generate magic link for first login
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkError) {
      console.error('Error generating magic link:', linkError);
      return { error: 'User created but failed to send invite email' };
    }

    // Send invite email
    await sendMagicLinkEmail({
      email,
      magicLink: linkData.properties.action_link,
      type: 'invite',
    });

    return { 
      success: true,
      message: 'User invited successfully' 
    };
  } catch (error) {
    console.error('Error in inviteUser:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
  await requireRole(['ADMIN']);

  const supabase = await createClient();

  const { error } = await supabase
    .from('user_profiles')
    .update({ is_active: isActive })
    .eq('id', userId);

  if (error) {
    console.error('Error toggling user status:', error);
    return { error: 'Failed to update user status' };
  }

  return { 
    success: true,
    message: `User ${isActive ? 'enabled' : 'disabled'} successfully` 
  };
}

export async function updateUserRole(userId: string, role: UserRole) {
  await requireRole(['ADMIN']);

  const supabase = await createClient();

  const { error } = await supabase
    .from('user_profiles')
    .update({ role })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user role:', error);
    return { error: 'Failed to update user role' };
  }

  return { 
    success: true,
    message: 'User role updated successfully' 
  };
}
