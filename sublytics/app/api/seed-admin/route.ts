import { seedAdminUser } from '@/lib/auth/seed-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  const result = await seedAdminUser();
  
  if (result.success) {
    return NextResponse.json({ 
      message: result.message,
      admin_email: process.env.SEED_ADMIN_EMAIL 
    }, { status: 200 });
  }

  return NextResponse.json({ 
    error: result.message 
  }, { status: 500 });
}
