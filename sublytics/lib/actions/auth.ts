'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { sendMagicLinkEmail } from '@/lib/email/resend';

export async function sendMagicLink(email: string) {
  try {
    if (!email) {
      return { error: 'Email is required' };
    }

    const supabase = await createClient();

    // Check if user exists and is active
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (!profile) {
      // Don't reveal that user doesn't exist
      return { 
        success: true,
        message: 'If an account exists, a magic link has been sent.' 
      };
    }

    if (!profile.is_active) {
      return { error: 'Account is disabled' };
    }

    // Generate magic link using Supabase
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (error) {
      console.error('Error generating magic link:', error);
      return { error: 'Failed to send magic link' };
    }

    return { 
      success: true,
      message: 'Magic link sent successfully' 
    };
  } catch (error) {
    console.error('Error in sendMagicLink:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
