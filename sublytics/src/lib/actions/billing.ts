'use server';

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/rbac';

export type BillingJobType = 'recurring_charge' | 'trial_end' | 'renewal';
export type BillingJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface BillingJob {
  id: string;
  subscription_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  subscription_reference: string;
  plan_name: string;
  job_type: BillingJobType;
  scheduled_date: string;
  status: BillingJobStatus;
  retry_count: number;
  max_retries: number;
  last_retry_at: string | null;
  error_message: string | null;
  execution_log: any[];
  metadata: any;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface BillingJobsResponse {
  success: boolean;
  data?: BillingJob[];
  error?: string;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

function serializeBillingJob(job: any): BillingJob {
  return {
    id: job.id,
    subscription_id: job.subscription_id,
    customer_id: job.customer_id,
    customer_name: job.customer_name,
    customer_email: job.customer_email,
    subscription_reference: job.subscription_reference,
    plan_name: job.plan_name,
    job_type: job.job_type,
    scheduled_date: job.scheduled_date,
    status: job.status,
    retry_count: job.retry_count,
    max_retries: job.max_retries,
    last_retry_at: job.last_retry_at,
    error_message: job.error_message,
    execution_log: job.execution_log || [],
    metadata: job.metadata || {},
    created_at: job.created_at instanceof Date ? job.created_at.toISOString() : job.created_at,
    updated_at: job.updated_at instanceof Date ? job.updated_at.toISOString() : job.updated_at,
    completed_at: job.completed_at ? (job.completed_at instanceof Date ? job.completed_at.toISOString() : job.completed_at) : null,
  };
}

export async function getBillingJobs(params?: {
  status?: BillingJobStatus;
  job_type?: BillingJobType;
  limit?: number;
  offset?: number;
}): Promise<BillingJobsResponse> {
  try {
    await requireRole(['SYSTEM_ADMIN', 'ADMIN', 'MANAGER', 'STAFF']);
    const supabase = await createClient();

    const limit = Math.min(params?.limit || 50, 100);
    const offset = params?.offset || 0;

    let query = supabase
      .from('recurring_billing_jobs')
      .select(`
        id,
        subscription_id,
        customer_id,
        job_type,
        scheduled_date,
        status,
        retry_count,
        max_retries,
        last_retry_at,
        error_message,
        execution_log,
        metadata,
        created_at,
        updated_at,
        completed_at,
        subscriptions!inner (
          reference_number,
          subscription_plans!inner (
            name
          )
        ),
        customers!inner (
          name,
          email
        )
      `, { count: 'exact' })
      .order('scheduled_date', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (params?.status) {
      query = query.eq('status', params.status);
    }
    if (params?.job_type) {
      query = query.eq('job_type', params.job_type);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform the data to flatten the nested structure
    const jobs = data?.map((job: any) => ({
      ...job,
      customer_name: job.customers?.name || 'Unknown',
      customer_email: job.customers?.email || '',
      subscription_reference: job.subscriptions?.reference_number || '',
      plan_name: job.subscriptions?.subscription_plans?.name || 'Unknown',
    })) || [];

    return {
      success: true,
      data: jobs.map(serializeBillingJob),
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit,
      },
    };
  } catch (error: any) {
    console.error('Error fetching billing jobs:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch billing jobs',
    };
  }
}

export async function getBillingJobStats(): Promise<{
  success: boolean;
  data?: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  };
  error?: string;
}> {
  try {
    await requireRole(['SYSTEM_ADMIN', 'ADMIN', 'MANAGER', 'STAFF']);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('recurring_billing_jobs')
      .select('status');

    if (error) throw error;

    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: data?.length || 0,
    };

    data?.forEach((job: any) => {
      if (job.status === 'pending') stats.pending++;
      else if (job.status === 'processing') stats.processing++;
      else if (job.status === 'completed') stats.completed++;
      else if (job.status === 'failed') stats.failed++;
    });

    return {
      success: true,
      data: stats,
    };
  } catch (error: any) {
    console.error('Error fetching billing job stats:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch billing job statistics',
    };
  }
}
