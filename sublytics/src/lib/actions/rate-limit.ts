'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/rbac';
import { headers } from 'next/headers';

// Type definitions
export type AttemptType = 'login' | 'password_reset' | 'magic_link';
export type BlockReason = 'too_many_attempts' | 'suspicious_activity' | 'manual_block';

export interface RateLimitAttempt {
  id: string;
  ip_address: string;
  email: string | null;
  user_id: string | null;
  attempt_type: AttemptType;
  success: boolean;
  user_agent: string | null;
  created_at: string;
}

export interface IPBlock {
  id: string;
  ip_address: string;
  reason: BlockReason;
  blocked_until: string | null;
  blocked_by: string | null;
  notes: string | null;
  is_permanent: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get client IP address from request headers
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers();
  
  // Check various headers for the real IP (in order of preference)
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIP = headersList.get('x-real-ip');
  const cfConnectingIP = headersList.get('cf-connecting-ip');
  
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  
  // Fallback to localhost for development
  return '127.0.0.1';
}

/**
 * Get user agent from request headers
 */
export async function getUserAgent(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get('user-agent');
}

/**
 * Check if an IP address is currently blocked
 */
export async function checkIPBlocked(ipAddress: string): Promise<boolean> {
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .rpc('is_ip_blocked', { check_ip: ipAddress });
  
  if (error) {
    console.error('Error checking IP block:', error);
    return false;
  }
  
  return data || false;
}

/**
 * Track a login/auth attempt
 */
export async function trackAttempt(params: {
  email?: string;
  userId?: string;
  attemptType: AttemptType;
  success: boolean;
}): Promise<void> {
  const adminClient = createAdminClient();
  const ipAddress = await getClientIP();
  const userAgent = await getUserAgent();
  
  try {
    const { error } = await adminClient
      .from('rate_limit_attempts')
      .insert({
        ip_address: ipAddress,
        email: params.email || null,
        user_id: params.userId || null,
        attempt_type: params.attemptType,
        success: params.success,
        user_agent: userAgent,
      });
    
    if (error) {
      console.error('Error tracking attempt:', error);
    }
  } catch (error) {
    console.error('Unexpected error tracking attempt:', error);
  }
}

/**
 * Get failed attempts count for IP/email in last N minutes
 */
export async function getFailedAttemptsCount(
  email?: string,
  minutes: number = 15
): Promise<number> {
  const adminClient = createAdminClient();
  const ipAddress = await getClientIP();
  
  try {
    const { data, error } = await adminClient
      .rpc('get_failed_attempts_count', {
        check_ip: ipAddress,
        check_email: email || '',
        minutes_ago: minutes
      });
    
    if (error) {
      console.error('Error getting failed attempts count:', error);
      return 0;
    }
    
    return data || 0;
  } catch (error) {
    console.error('Unexpected error getting failed attempts:', error);
    return 0;
  }
}

/**
 * Get all rate limit attempts (SYSTEM_ADMIN only)
 */
export async function getRateLimitAttempts(params?: {
  limit?: number;
  offset?: number;
  ipAddress?: string;
  email?: string;
}) {
  await requireRole(['SYSTEM_ADMIN']);
  
  const adminClient = createAdminClient();
  const limit = params?.limit || 100;
  const offset = params?.offset || 0;
  
  let query = adminClient
    .from('rate_limit_attempts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (params?.ipAddress) {
    query = query.eq('ip_address', params.ipAddress);
  }
  
  if (params?.email) {
    query = query.eq('email', params.email);
  }
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error('Error fetching rate limit attempts:', error);
    return { error: 'Failed to fetch rate limit attempts' };
  }
  
  return { data: data as RateLimitAttempt[], count };
}

/**
 * Get all IP blocks (SYSTEM_ADMIN only)
 */
export async function getIPBlocks() {
  await requireRole(['SYSTEM_ADMIN']);
  
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('ip_blocks')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching IP blocks:', error);
    return { error: 'Failed to fetch IP blocks' };
  }
  
  return { data: data as IPBlock[] };
}

/**
 * Block an IP address manually (SYSTEM_ADMIN only)
 */
export async function blockIP(params: {
  ipAddress: string;
  reason: BlockReason;
  duration?: number; // in minutes, null for permanent
  notes?: string;
}) {
  const user = await requireRole(['SYSTEM_ADMIN']);
  
  const adminClient = createAdminClient();
  
  const blockedUntil = params.duration 
    ? new Date(Date.now() + params.duration * 60 * 1000).toISOString()
    : null;
  
  const { error } = await adminClient
    .from('ip_blocks')
    .insert({
      ip_address: params.ipAddress,
      reason: params.reason,
      blocked_until: blockedUntil,
      blocked_by: user.id,
      notes: params.notes || null,
      is_permanent: params.duration === undefined,
    });
  
  if (error) {
    console.error('Error blocking IP:', error);
    return { error: 'Failed to block IP address' };
  }
  
  return { success: true, message: 'IP address blocked successfully' };
}

/**
 * Unblock an IP address (SYSTEM_ADMIN only)
 */
export async function unblockIP(ipAddress: string) {
  await requireRole(['SYSTEM_ADMIN']);
  
  const adminClient = createAdminClient();
  
  const { error } = await adminClient
    .from('ip_blocks')
    .delete()
    .eq('ip_address', ipAddress);
  
  if (error) {
    console.error('Error unblocking IP:', error);
    return { error: 'Failed to unblock IP address' };
  }
  
  return { success: true, message: 'IP address unblocked successfully' };
}

/**
 * Get rate limit statistics (SYSTEM_ADMIN only)
 */
export async function getRateLimitStats() {
  await requireRole(['SYSTEM_ADMIN']);
  
  const adminClient = createAdminClient();
  
  try {
    // Get stats for last 24 hours
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: attempts, error: attemptsError } = await adminClient
      .from('rate_limit_attempts')
      .select('success, attempt_type')
      .gte('created_at', last24h);
    
    if (attemptsError) throw attemptsError;
    
    const { data: blocks, error: blocksError } = await adminClient
      .from('ip_blocks')
      .select('id, is_permanent');
    
    if (blocksError) throw blocksError;
    
    const totalAttempts = attempts?.length || 0;
    const failedAttempts = attempts?.filter(a => !a.success).length || 0;
    const successfulAttempts = attempts?.filter(a => a.success).length || 0;
    const activeBlocks = blocks?.length || 0;
    const permanentBlocks = blocks?.filter(b => b.is_permanent).length || 0;
    
    return {
      data: {
        totalAttempts,
        failedAttempts,
        successfulAttempts,
        successRate: totalAttempts > 0 ? (successfulAttempts / totalAttempts * 100).toFixed(1) : '0',
        activeBlocks,
        permanentBlocks,
      }
    };
  } catch (error) {
    console.error('Error getting rate limit stats:', error);
    return { error: 'Failed to fetch statistics' };
  }
}
