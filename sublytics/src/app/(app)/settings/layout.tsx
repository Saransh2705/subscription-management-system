import { requireRole } from "@/lib/auth/rbac";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(['SYSTEM_ADMIN']);
  return <>{children}</>;
}
