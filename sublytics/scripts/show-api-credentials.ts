#!/usr/bin/env bun
import { createAdminClient } from '@/lib/supabase/admin';

async function showCredentials() {
  const supabase = createAdminClient();

  console.log('🔑 Fetching Company API Credentials...\n');

  const { data: apiKeys, error } = await supabase
    .from('company_api_keys')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error fetching API keys:', error);
    process.exit(1);
  }

  if (!apiKeys || apiKeys.length === 0) {
    console.log('⚠️  No API keys found in the database.');
    console.log('Run `bun run seed` to create default credentials.');
    process.exit(0);
  }

  console.log(`Found ${apiKeys.length} API key(s):\n`);

  apiKeys.forEach((key, index) => {
    console.log(`${index + 1}. Company ID: ${key.company_id}`);
    console.log(`   Company Secret: ${key.company_secret}`);
    console.log(`   Status: ${key.is_active ? '✅ Active' : '❌ Inactive'}`);
    console.log(`   Created: ${new Date(key.created_at).toLocaleString()}`);
    console.log('');
  });

  console.log('📝 Use these credentials in your V1 API requests:');
  console.log('   POST /api/v1/auth');
  console.log('   Body: { "company_id": "...", "company_secret": "..." }');
}

showCredentials().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
