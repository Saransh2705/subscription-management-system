import { requireRole } from "@/lib/auth/rbac";
import PlansPageClient from "./client";
import { getPlans } from "@/lib/actions/plans";

export const dynamic = 'force-dynamic';

export default async function PlansPage() {
  // Only SYSTEM_ADMIN and ADMIN can manage plans
  await requireRole(['SYSTEM_ADMIN', 'ADMIN']);

  const { plans } = await getPlans();

  return <PlansPageClient initialPlans={plans} />;
}
