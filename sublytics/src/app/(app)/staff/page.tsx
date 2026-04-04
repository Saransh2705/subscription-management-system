import { Suspense } from "react";
import { Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUsers, getPendingInvites } from "@/lib/actions/staff";
import { StaffTableClient, StaffTableSkeleton, PendingInvitesTable } from "@/components/StaffTable";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { requireRole } from "@/lib/auth/rbac";

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

async function PendingInvitesContent() {
  const result = await getPendingInvites();

  if (result.error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{result.error}</p>
      </div>
    );
  }

  return <PendingInvitesTable initialInvites={result.data || []} />;
}

export default async function StaffPage() {
  await requireRole(['SYSTEM_ADMIN']);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="page-subtitle">Manage team members and their roles</p>
        </div>
      </div>

      {/* Active Staff Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Active Staff</h2>
        </div>
        <Suspense fallback={<StaffTableSkeleton />}>
          <StaffContent />
        </Suspense>
      </div>

      <Separator className="my-8" />

      {/* Pending Invitations Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Pending Invitations</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Users who have been invited but haven't completed their account setup yet
        </p>
        <Suspense fallback={<StaffTableSkeleton />}>
          <PendingInvitesContent />
        </Suspense>
      </div>
    </div>
  );
}
