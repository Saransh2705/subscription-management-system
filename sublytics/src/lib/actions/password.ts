'use server';

import { createClient } from '@/lib/supabase/server';

export async function sendPasswordResetEmail(email: string) {
  try {
    if (!email) {
      return { error: 'Email is required' };
    }

    const supabase = await createClient();

    // Generate password reset link
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
    });

    if (error) {
      console.error('Error generating reset link:', error);
      // Don't reveal if user exists or not
      return { 
        success: true,
        message: 'If an account exists, a reset link has been sent.' 
      };
    }

    return { 
      success: true,
      message: 'Password reset link sent successfully' 
    };
  } catch (error) {
    console.error('Error in sendPasswordResetEmail:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function updatePassword(password: string) {
  try {
    if (!password) {
      return { error: 'Password is required' };
    }

    if (password.length < 8) {
      return { error: 'Password must be at least 8 characters' };
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      console.error('Error updating password:', updateError);
      return { error: 'Failed to update password' };
    }

    // Mark password change as complete and email as verified
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ 
        requires_password_change: false,
        email_verified: true 
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    return { 
      success: true,
      message: 'Password updated successfully' 
    };
  } catch (error) {
    console.error('Error in updatePassword:', error);
    return { error: 'An unexpected error occurred' };
  }
}
