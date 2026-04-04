'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/rbac';
import type { UserRole } from '@/lib/types/auth';
import { sendMagicLinkEmail } from '@/lib/email/resend';
import { generateInviteToken } from '@/lib/auth/invite-token';
import { revalidatePath } from 'next/cache';

export async function getUsers() {
  await requireRole(['ADMIN', 'SYSTEM_ADMIN']);
  
  // Use admin client to bypass RLS
  const adminClient = createAdminClient();
  
  // Get only verified users (password set)
  const { data, error } = await adminClient
    .from('user_profiles')
    .select('*')
    .eq('email_verified', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return { error: 'Failed to fetch users' };
  }

  return { data };
}

export async function getPendingInvites() {
  await requireRole(['ADMIN', 'SYSTEM_ADMIN']);
  
  const adminClient = createAdminClient();
  
  // Get users who haven't verified/set password
  const { data, error } = await adminClient
    .from('user_profiles')
    .select('*')
    .eq('email_verified', false)
    .order('invited_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending invites:', error);
    return { error: 'Failed to fetch pending invites' };
  }

  return { data };
}

export async function inviteUser(email: string, fullName: string, role: UserRole) {
  const currentUser = await requireRole(['ADMIN', 'SYSTEM_ADMIN']);

  try {
    const adminClient = createAdminClient();

    // Check if user already exists using admin client
    const { data: existingUser } = await adminClient
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    // If user exists and email is verified, they're already active
    if (existingUser && existingUser.email_verified) {
      return { error: 'User already exists and is active' };
    }

    let userId: string;
    let isResend = false;

    if (existingUser && !existingUser.email_verified) {
      // User exists but hasn't verified - allow resending
      userId = existingUser.id;
      isResend = true;
    } else {
      // Create new user with Supabase Auth Admin API
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        email_confirm: false, // Will confirm via magic link
      });

      if (authError) {
        console.error('Error creating user:', authError);
        return { error: 'Failed to create user' };
      }

      userId = authData.user.id;
    }

    // Update user profile with role and invite tracking
    const { error: profileError } = await adminClient
      .from('user_profiles')
      .update({
        full_name: fullName,
        role,
        requires_password_change: true,
        email_verified: false,
        is_active: true,
        invited_at: existingUser?.invited_at || new Date().toISOString(),
        invited_by: currentUser.id,
        last_invite_sent_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating user profile:', profileError);
      return { error: 'Failed to update user profile' };
    }

    // Generate simple invite token
    const inviteToken = await generateInviteToken(email, userId);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const inviteUrl = `${siteUrl}/set-password?token=${inviteToken}`;
    
    console.log('✉️ Generated invite URL:', inviteUrl);

    // Send invite email with our simple URL
    await sendMagicLinkEmail({
      email,
      magicLink: inviteUrl,
      type: 'invite',
    });

    revalidatePath('/staff');
    return { 
      success: true,
      message: isResend ? 'Invitation resent successfully' : 'User invited successfully' 
    };
  } catch (error) {
    console.error('Error in inviteUser:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
  await requireRole(['ADMIN', 'SYSTEM_ADMIN']);

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
  await requireRole(['ADMIN', 'SYSTEM_ADMIN']);

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

export async function resendInvite(userId: string) {
  const currentUser = await requireRole(['ADMIN', 'SYSTEM_ADMIN']);

  try {
    const adminClient = createAdminClient();

    // Get user details
    const { data: user, error: getUserError } = await adminClient
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (getUserError || !user) {
      return { error: 'User not found' };
    }

    if (user.email_verified) {
      return { error: 'User has already verified their email' };
    }

    // Generate simple invite token
    const inviteToken = await generateInviteToken(user.email, userId);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const inviteUrl = `${siteUrl}/set-password?token=${inviteToken}`;
    
    console.log('✉️ Generated resend invite URL:', inviteUrl);

    // Update last invite sent timestamp
    await adminClient
      .from('user_profiles')
      .update({
        last_invite_sent_at: new Date().toISOString(),
      })
      .eq('id', userId);

    // Send invite email with our simple URL
    await sendMagicLinkEmail({
      email: user.email,
      magicLink: inviteUrl,
      type: 'invite',
    });

    revalidatePath('/staff');
    return {
      success: true,
      message: 'Invitation resent successfully'
    };
  } catch (error) {
    console.error('Error resending invite:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function cancelInvite(userId: string) {
  await requireRole(['ADMIN', 'SYSTEM_ADMIN']);

  try {
    const adminClient = createAdminClient();

    // Get user details
    const { data: user } = await adminClient
      .from('user_profiles')
      .select('email_verified')
      .eq('id', userId)
      .single();

    if (user?.email_verified) {
      return { error: 'Cannot cancel invite for verified user' };
    }

    // Delete user from auth and profile will cascade delete
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return { error: 'Failed to cancel invitation' };
    }

    revalidatePath('/staff');
    return {
      success: true,
      message: 'Invitation cancelled successfully'
    };
  } catch (error) {
    console.error('Error cancelling invite:', error);
    return { error: 'An unexpected error occurred' };
  }
}
