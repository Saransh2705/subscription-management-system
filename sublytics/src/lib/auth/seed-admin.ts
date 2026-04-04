import { createAdminClient } from '@/lib/supabase/admin';

export async function seedAdminUser() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log('⚠️  Seed admin credentials not found in environment variables');
    return { success: false, message: 'Missing credentials' };
  }

  const supabase = createAdminClient();

  try {
    // Check if admin already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (existingProfile) {
      console.log('✅ Admin user already exists');
      return { success: true, message: 'Admin already exists' };
    }

    // Create admin user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });

    if (authError) {
      console.error('❌ Error creating admin user:', authError);
      return { success: false, message: authError.message };
    }

    // Update user profile to set as admin and no password change required
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        role: 'ADMIN',
        requires_password_change: false,
        is_active: true,
      })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('❌ Error updating admin profile:', updateError);
      return { success: false, message: updateError.message };
    }

    console.log('✅ Admin user created successfully');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    
    return { success: true, message: 'Admin created successfully' };
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return { success: false, message: 'Unexpected error occurred' };
  }
}
