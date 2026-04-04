import { requireRole } from '@/lib/auth/rbac';
import { SettingsPageClient } from './client';
import { getSystemSettings } from '@/lib/actions/settings';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await requireRole(['SYSTEM_ADMIN']);
  const settings = await getSystemSettings();
  
  return <SettingsPageClient initialSettings={settings} />;
}
