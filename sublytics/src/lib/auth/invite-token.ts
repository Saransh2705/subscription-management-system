'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long'
);

/**
 * Generate a secure invitation token
 */
export async function generateInviteToken(email: string, userId: string): Promise<string> {
  const token = await new SignJWT({ email, userId, type: 'invite' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d') // Token expires in 7 days
    .setIssuedAt()
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode invitation token
 */
export async function verifyInviteToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    if (payload.type !== 'invite') {
      return { error: 'Invalid token type' };
    }

    return {
      data: {
        email: payload.email as string,
        userId: payload.userId as string,
      }
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return { error: 'Invalid or expired token' };
  }
}

/**
 * Verify invitation token and get user profile
 */
export async function validateInviteAndGetUser(token: string) {
  try {
    const verification = await verifyInviteToken(token);
    
    if (verification.error) {
      return { error: verification.error };
    }

    const { userId } = verification.data!;
    
    // Get user profile using admin client
    const adminClient = createAdminClient();
    const { data: profile, error } = await adminClient
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return { error: 'User not found' };
    }

    if (profile.email_verified) {
      return { error: 'User already verified' };
    }

    return { data: profile };
  } catch (error) {
    console.error('Error validating invite:', error);
    return { error: 'An unexpected error occurred' };
  }
}
