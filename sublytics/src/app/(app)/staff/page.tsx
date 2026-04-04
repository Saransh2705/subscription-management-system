import { Suspense } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUsers } from "@/lib/actions/staff";
import { StaffTableClient, StaffTableSkeleton } from "@/components/StaffTable";
import { redirect } from "next/navigation";

async function StaffContent() {
  const result = await getUsers();

  if (result.error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{result.error}</p>
      </div>
    );
  }

  return <StaffTableClient initialUsers={result.data || []} />;
}

export default async function StaffPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="page-subtitle">Manage team members and their roles</p>
        </div>
      </div>

      <Suspense fallback={<StaffTableSkeleton />}>
        <StaffContent />
      </Suspense>
    </div>
  );
}
