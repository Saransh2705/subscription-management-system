'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function checkUserProfileStatus() {
  try {
    console.log('🔍 [Server Action] checkUserProfileStatus called');
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('👤 [Server Action] User from auth:', user?.id, 'Error:', userError);
    
    if (!user) {
      console.log('❌ [Server Action] No user found');
      return { error: 'Not authenticated' };
    }

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();
    console.log('🔑 [Server Action] Using admin client to fetch profile');
    
    const { data: profile, error } = await adminClient
      .from('user_profiles')
      .select('requires_password_change, email_verified')
      .eq('id', user.id)
      .single();

    console.log('📊 [Server Action] Profile data:', profile, 'Error:', error);

    if (error) {
      console.error('❌ [Server Action] Error fetching profile:', error);
      return { error: 'Failed to fetch profile' };
    }

    console.log('✅ [Server Action] Returning profile status:', {
      requiresPasswordChange: profile.requires_password_change,
      emailVerified: profile.email_verified
    });

    return { 
      data: {
        requiresPasswordChange: profile.requires_password_change,
        emailVerified: profile.email_verified
      }
    };
  } catch (error) {
    console.error('❌ [Server Action] Unexpected error:', error);
    return { error: 'An unexpected error occurred' };
  }
}
