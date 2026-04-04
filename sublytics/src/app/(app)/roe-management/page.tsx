import { requireRole } from '@/lib/auth/rbac';
import { ROEManagementClient } from './client';

export const dynamic = 'force-dynamic';

export default async function ROEManagementPage() {
  await requireRole(['SYSTEM_ADMIN']);
  
  return <ROEManagementClient />;
}
