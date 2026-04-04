'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { 
  EmailTemplate, 
  CreateEmailTemplateInput, 
  UpdateEmailTemplateInput 
} from '@/lib/types/email-template';

export async function getEmailTemplates() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching email templates:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as EmailTemplate[] };
  } catch (error) {
    console.error('Error in getEmailTemplates:', error);
    return { success: false, error: 'Failed to fetch email templates' };
  }
}

export async function getEmailTemplateById(id: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching email template:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as EmailTemplate };
  } catch (error) {
    console.error('Error in getEmailTemplateById:', error);
    return { success: false, error: 'Failed to fetch email template' };
  }
}

export async function createEmailTemplate(input: CreateEmailTemplateInput) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        ...input,
        variables: input.variables || [],
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating email template:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/email-templates');
    return { success: true, data: data as EmailTemplate };
  } catch (error) {
    console.error('Error in createEmailTemplate:', error);
    return { success: false, error: 'Failed to create email template' };
  }
}

export async function updateEmailTemplate(id: string, input: UpdateEmailTemplateInput) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('email_templates')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating email template:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/email-templates');
    return { success: true, data: data as EmailTemplate };
  } catch (error) {
    console.error('Error in updateEmailTemplate:', error);
    return { success: false, error: 'Failed to update email template' };
  }
}

export async function deleteEmailTemplate(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting email template:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/email-templates');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteEmailTemplate:', error);
    return { success: false, error: 'Failed to delete email template' };
  }
}

export async function toggleTemplateStatus(id: string, is_active: boolean) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('email_templates')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling template status:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/email-templates');
    return { success: true, data: data as EmailTemplate };
  } catch (error) {
    console.error('Error in toggleTemplateStatus:', error);
    return { success: false, error: 'Failed to toggle template status' };
  }
}
