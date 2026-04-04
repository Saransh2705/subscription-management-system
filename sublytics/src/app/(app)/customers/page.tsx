import { requireAuth } from "@/lib/auth/rbac";
import CustomersPageClient from "./client";
import { getCustomers } from "@/lib/actions/customers";

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  // Allow all authenticated roles to access customers
  await requireAuth();

  // Load initial customers on server side
  const { customers, total } = await getCustomers("", 50, 0);

  return <CustomersPageClient initialCustomers={customers} initialTotal={total} />;
}
