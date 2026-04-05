import { Suspense } from "react";
import { getBillingJobs, getBillingJobStats } from "@/lib/actions/billing";
import { BillingCyclesClient } from "./BillingCyclesClient";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = 'force-dynamic';

export default async function BillingCyclesPage() {
  const [jobsResult, statsResult] = await Promise.all([
    getBillingJobs({ limit: 50 }),
    getBillingJobStats(),
  ]);

  return (
    <Suspense fallback={<BillingCyclesSkeleton />}>
      <BillingCyclesClient
        initialJobs={jobsResult.data || []}
        initialStats={statsResult.data || { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 }}
        pagination={jobsResult.pagination}
      />
    </Suspense>
  );
}

function BillingCyclesSkeleton() {
  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
