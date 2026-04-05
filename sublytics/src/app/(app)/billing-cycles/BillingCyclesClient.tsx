"use client";

import { useState } from "react";
import { RefreshCw, AlertCircle, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import type { BillingJob, BillingJobStatus, BillingJobType } from "@/lib/actions/billing";
import { getBillingJobs, getBillingJobStats } from "@/lib/actions/billing";

interface BillingCyclesClientProps {
  initialJobs: BillingJob[];
  initialStats: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  };
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export function BillingCyclesClient({ initialJobs, initialStats, pagination }: BillingCyclesClientProps) {
  const [jobs, setJobs] = useState<BillingJob[]>(initialJobs);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<BillingJobStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<BillingJobType | "all">("all");

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (statusFilter !== "all") filters.status = statusFilter;
      if (typeFilter !== "all") filters.job_type = typeFilter;

      const [jobsResult, statsResult] = await Promise.all([
        getBillingJobs(filters),
        getBillingJobStats(),
      ]);

      if (jobsResult.success && jobsResult.data) {
        setJobs(jobsResult.data);
      }
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (type: "status" | "job_type", value: string) => {
    if (type === "status") {
      setStatusFilter(value as BillingJobStatus | "all");
    } else {
      setTypeFilter(value as BillingJobType | "all");
    }

    setLoading(true);
    try {
      const filters: any = {};
      if (type === "status" && value !== "all") {
        filters.status = value;
      } else if (statusFilter !== "all") {
        filters.status = statusFilter;
      }
      if (type === "job_type" && value !== "all") {
        filters.job_type = value;
      } else if (typeFilter !== "all") {
        filters.job_type = typeFilter;
      }

      const result = await getBillingJobs(filters);
      if (result.success && result.data) {
        setJobs(result.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing Cycles</h1>
          <p className="page-subtitle">Track scheduled billing jobs and payment processing</p>
        </div>
        <Button onClick={handleRefresh} disabled={loading} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Select value={statusFilter} onValueChange={(v) => handleFilterChange("status", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Select value={typeFilter} onValueChange={(v) => handleFilterChange("job_type", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="recurring_charge">Recurring Charge</SelectItem>
              <SelectItem value="trial_end">Trial End</SelectItem>
              <SelectItem value="renewal">Renewal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Jobs Table */}
      {jobs.length === 0 ? (
        <EmptyState
          icon={RefreshCw}
          title="No billing jobs found"
          description={statusFilter !== "all" || typeFilter !== "all" 
            ? "Try adjusting your filters to see more results."
            : "Billing jobs will appear here once subscriptions are active."}
        />
      ) : (
        <Card className="border border-border/50 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Job Type</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Retry</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{job.customer_name}</span>
                          <span className="text-xs text-muted-foreground">{job.customer_email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{job.subscription_reference}</TableCell>
                      <TableCell>{job.plan_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {job.job_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(job.scheduled_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <StatusBadge status={job.status} />
                      </TableCell>
                      <TableCell>
                        <span className={job.retry_count >= job.max_retries ? 'text-red-500 font-medium' : ''}>
                          {job.retry_count}/{job.max_retries}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(job.updated_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {pagination && pagination.has_more && (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Showing {jobs.length} of {pagination.total} jobs
          </p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: BillingJobStatus }) {
  const variants: Record<BillingJobStatus, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
    pending: { variant: "secondary", className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
    processing: { variant: "default", className: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
    completed: { variant: "outline", className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" },
    failed: { variant: "destructive", className: "bg-red-500/10 text-red-700 dark:text-red-400" },
    cancelled: { variant: "outline", className: "bg-gray-500/10 text-gray-700 dark:text-gray-400" },
  };

  const config = variants[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
