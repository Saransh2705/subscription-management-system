import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendMagicLinkEmail } from '@/lib/email/resend';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { message: 'If an account exists, a magic link has been sent.' },
        { status: 200 }
      );
    }

    if (!profile.is_active) {
      return NextResponse.json(
        { error: 'Account is disabled' },
        { status: 403 }
      );
    }

    // Generate magic link using Supabase
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (error) {
      console.error('Error generating magic link:', error);
      return NextResponse.json(
        { error: 'Failed to send magic link' },
        { status: 500 }
      );
    }

    // Send custom email via Resend
    const magicLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm?token_hash=${data}&type=magiclink`;
    
    // Note: Supabase will send its own email, but we'll also send via Resend for customization
    // You may want to disable Supabase's email in the dashboard
    const emailResult = await sendMagicLinkEmail({
      email,
      magicLink,
      type: 'login',
    });

    if (!emailResult.success) {
      console.error('Failed to send magic link email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send magic link email. Please contact support.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Magic link sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in magic-link API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
