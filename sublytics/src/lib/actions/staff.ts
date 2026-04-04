'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/rbac';
import type { UserRole } from '@/lib/types/auth';
import { sendMagicLinkEmail } from '@/lib/email/resend';
import { revalidatePath } from 'next/cache';

export async function getUsers() {
  await requireRole(['ADMIN']);
  
  // Use admin client to bypass RLS
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
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
    const adminClient = createAdminClient();

    // Check if user already exists using admin client
    const { data: existingUser } = await adminClient
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

    // Update user profile with role using admin client
    const { error: profileError } = await adminClient
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

    revalidatePath('/staff');
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

  const adminClient = createAdminClient();

  // Prevent changing status of SYSTEM_ADMIN
  const { data: user } = await adminClient
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (user?.role === 'SYSTEM_ADMIN') {
    return { error: 'Cannot modify SYSTEM_ADMIN user' };
  }

  const { error } = await adminClient
    .from('user_profiles')
    .update({ is_active: isActive })
    .eq('id', userId);

  if (error) {
    console.error('Error toggling user status:', error);
    return { error: 'Failed to update user status' };
  }

  revalidatePath('/staff');
  return { 
    success: true,
    message: `User ${isActive ? 'enabled' : 'disabled'} successfully` 
  };
}

export async function updateUserRole(userId: string, role: UserRole) {
  await requireRole(['ADMIN']);

  const adminClient = createAdminClient();

  // Prevent changing role of SYSTEM_ADMIN
  const { data: user } = await adminClient
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (user?.role === 'SYSTEM_ADMIN') {
    return { error: 'Cannot change role of SYSTEM_ADMIN user' };
  }

  // Prevent promoting to SYSTEM_ADMIN
  if (role === 'SYSTEM_ADMIN') {
    return { error: 'SYSTEM_ADMIN role can only be set manually in database' };
  }

  const { error } = await adminClient
    .from('user_profiles')
    .update({ role })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user role:', error);
    return { error: 'Failed to update user role' };
  }

  revalidatePath('/staff');
  return { 
    success: true,
    message: 'User role updated successfully' 
  };
}
