#!/usr/bin/env bun
import { seedAdminUser, seedCompanyApiKeys } from './seed-admin';

async function runSeed() {
  console.log('🌱 Starting database seeding...\n');
  
  // Seed admin user
  const adminResult = await seedAdminUser();
  if (!adminResult.success) {
    console.error(`\n❌ Admin seeding failed: ${adminResult.message}`);
  }
  
  console.log(''); // Empty line for spacing
  
  // Seed company API keys
  const apiKeysResult = await seedCompanyApiKeys();
  if (!apiKeysResult.success) {
    console.error(`\n❌ API keys seeding failed: ${apiKeysResult.message}`);
  }
  
  console.log('\n✅ Seeding completed successfully!');
  process.exit(0);
}

runSeed().catch((error) => {
  console.error('❌ Unexpected error during seeding:', error);
  process.exit(1);
});
