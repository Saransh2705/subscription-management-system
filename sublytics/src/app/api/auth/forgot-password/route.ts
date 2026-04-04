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

    // Generate password reset link
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
    });

    if (error) {
      console.error('Error generating reset link:', error);
      // Don't reveal if user exists or not
      return NextResponse.json(
        { message: 'If an account exists, a reset link has been sent.' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: 'Password reset link sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in forgot-password API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
