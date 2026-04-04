import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { 
  getRateLimitAttempts, 
  getIPBlocks, 
  getRateLimitStats 
} from '@/lib/actions/rate-limit';
import { requireRole } from '@/lib/auth/rbac';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

async function RateLimitStats() {
  const result = await getRateLimitStats();
  
  if (result.error || !result.data) {
    return <div className="text-destructive">Failed to load statistics</div>;
  }
  
  const { totalAttempts, failedAttempts, successfulAttempts, successRate, activeBlocks, permanentBlocks } = result.data;
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Attempts (24h)</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAttempts}</div>
          <p className="text-xs text-muted-foreground">
            {successfulAttempts} successful, {failedAttempts} failed
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{successRate}%</div>
          <p className="text-xs text-muted-foreground">
            Last 24 hours
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Blocks</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeBlocks}</div>
          <p className="text-xs text-muted-foreground">
            {permanentBlocks} permanent
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{failedAttempts}</div>
          <p className="text-xs text-muted-foreground">
            Potential threats detected
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

async function RecentAttempts() {
  const result = await getRateLimitAttempts({ limit: 50 });
  
  if (result.error || !result.data) {
    return <div className="text-destructive">Failed to load attempts</div>;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Authentication Attempts</CardTitle>
        <CardDescription>Last 50 login attempts across all users</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((attempt) => (
                <TableRow key={attempt.id}>
                  <TableCell className="text-sm">
                    {new Date(attempt.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {attempt.ip_address}
                  </TableCell>
                  <TableCell className="text-sm">
                    {attempt.email || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {attempt.attempt_type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {attempt.success ? (
                      <Badge className="bg-green-600">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Success
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Failed
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

async function BlockedIPs() {
  const result = await getIPBlocks();
  
  if (result.error || !result.data) {
    return <div className="text-destructive">Failed to load blocked IPs</div>;
  }
  
  const now = new Date();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Blocked IP Addresses</CardTitle>
        <CardDescription>Automatically and manually blocked IPs</CardDescription>
      </CardHeader>
      <CardContent>
        {result.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No IP addresses are currently blocked</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP Address</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Blocked Until</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((block) => {
                const isActive = block.is_permanent || 
                  (block.blocked_until && new Date(block.blocked_until) > now);
                
                return (
                  <TableRow key={block.id}>
                    <TableCell className="font-mono text-sm">
                      {block.ip_address}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {block.reason.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isActive ? (
                        <Badge variant="destructive">
                          {block.is_permanent ? 'Permanent' : 'Active'}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Expired</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {block.is_permanent 
                        ? 'Permanent' 
                        : block.blocked_until 
                          ? new Date(block.blocked_until).toLocaleString()
                          : '-'
                      }
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {block.notes || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function RateLimitPage() {
  // Only SYSTEM_ADMIN can access this page
  await requireRole(['SYSTEM_ADMIN']);
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Security</h1>
          <p className="page-subtitle">Rate limiting, authentication monitoring, and IP management</p>
        </div>
      </div>
      
      <Suspense fallback={<LoadingSkeleton />}>
        <div className="space-y-6">
          <RateLimitStats />
          <RecentAttempts />
          <BlockedIPs />
        </div>
      </Suspense>
      
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Rate Limiting Configuration</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Maximum failed attempts: <strong>5 in 15 minutes</strong></li>
          <li>• Auto-block duration: <strong>60 minutes</strong></li>
          <li>• Attempt history retention: <strong>30 days</strong></li>
          <li>• Tracks: IP address, email, user agent, and timestamps</li>
        </ul>
      </div>
    </div>
  );
}
