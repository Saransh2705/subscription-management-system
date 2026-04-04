#!/usr/bin/env bun
import { seedAdminUser } from './seed-admin';

async function runSeed() {
  console.log('🌱 Starting admin user seeding...\n');
  
  const result = await seedAdminUser();
  
  if (!result.success) {
    console.error(`\n❌ Seeding failed: ${result.message}`);
    process.exit(1);
  }
  
  console.log('\n✅ Seeding completed successfully!');
  process.exit(0);
}

runSeed().catch((error) => {
  console.error('❌ Unexpected error during seeding:', error);
  process.exit(1);
});
