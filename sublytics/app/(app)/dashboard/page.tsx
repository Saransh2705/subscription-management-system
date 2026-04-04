import { DollarSign, Users, FileText, TrendingUp, ArrowUpRight } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const stats = [
  { title: "Total Revenue", value: "$48,290", change: "+12.5% from last month", changeType: "positive" as const, icon: DollarSign },
  { title: "Active Subscriptions", value: "2,420", change: "+8.2% from last month", changeType: "positive" as const, icon: Users },
  { title: "Pending Invoices", value: "18", change: "3 overdue", changeType: "negative" as const, icon: FileText },
  { title: "Monthly Growth", value: "+15.3%", change: "+2.1% vs last month", changeType: "positive" as const, icon: TrendingUp },
];

const recentActivity = [
  { id: 1, event: "Subscription created", customer: "Acme Corp", date: "2 min ago", status: "active" as const },
  { id: 2, event: "Payment received", customer: "Globex Inc", date: "15 min ago", status: "paid" as const },
  { id: 3, event: "Invoice sent", customer: "Initech LLC", date: "1 hour ago", status: "sent" as const },
  { id: 4, event: "Subscription cancelled", customer: "Umbrella Co", date: "3 hours ago", status: "cancelled" as const },
  { id: 5, event: "New customer signed up", customer: "Wayne Enterprises", date: "5 hours ago", status: "active" as const },
];

export default function DashboardPage() {
  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here&apos;s your business overview.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <Card className="border border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <a href="#" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{item.event}</TableCell>
                  <TableCell className="text-muted-foreground">{item.customer}</TableCell>
                  <TableCell><StatusBadge status={item.status} /></TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">{item.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
