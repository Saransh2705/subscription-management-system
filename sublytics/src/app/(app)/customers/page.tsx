import { requireAuth } from "@/lib/auth/rbac";
import CustomersPageClient from "./client";

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  // Allow all authenticated roles to access customers
  await requireAuth();

  return <CustomersPageClient />;
}
