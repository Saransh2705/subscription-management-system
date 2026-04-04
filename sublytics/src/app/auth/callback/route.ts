import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔗 [Auth Callback] Request received');
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/';

  console.log('🔗 [Auth Callback] Params:', { token_hash: !!token_hash, type, next });

  if (token_hash && type) {
    const supabase = await createClient();

    console.log('🔗 [Auth Callback] Verifying OTP...');
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (!error) {
      console.log('✅ [Auth Callback] OTP verified successfully');
      
      // Check if user requires password change using admin client
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 [Auth Callback] User ID:', user?.id);
      
      if (user) {
        // Use admin client to bypass RLS
        const adminClient = createAdminClient();
        const { data: profile, error: profileError } = await adminClient
          .from('user_profiles')
          .select('requires_password_change, email_verified')
          .eq('id', user.id)
          .single();

        console.log('📊 [Auth Callback] Profile:', profile, 'Error:', profileError);

        if (profile && (profile.requires_password_change || !profile.email_verified)) {
          console.log('🔐 [Auth Callback] Redirecting to /set-password');
          return NextResponse.redirect(new URL('/set-password', request.url));
        }
      }

      console.log('📊 [Auth Callback] Redirecting to:', next);
      return NextResponse.redirect(new URL(next, request.url));
    } else {
      console.error('❌ [Auth Callback] OTP verification failed:', error);
    }
  }

  // Return the user to an error page with some instructions
  console.log('⚠️ [Auth Callback] Invalid request, redirecting to login with error');
  return NextResponse.redirect(new URL('/login?error=invalid_link', request.url));
}
