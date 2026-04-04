"use client";

import { useState } from "react";
import { RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";

interface Subscription {
  id: number;
  customer: string;
  plan: string;
  status: "active" | "pending" | "cancelled";
  startDate: string;
}

const initialSubs: Subscription[] = [
  { id: 1, customer: "Acme Corp", plan: "Professional", status: "active", startDate: "2024-01-15" },
  { id: 2, customer: "Globex Inc", plan: "Starter", status: "active", startDate: "2024-02-10" },
  { id: 3, customer: "Initech LLC", plan: "Business", status: "pending", startDate: "2024-03-05" },
  { id: 4, customer: "Umbrella Co", plan: "Professional", status: "cancelled", startDate: "2024-01-20" },
];

export default function Subscriptions() {
  const [subs, setSubs] = useState<Subscription[]>(initialSubs);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer: "", plan: "" });

  const handleSave = () => {
    setSubs([...subs, { id: Date.now(), customer: form.customer, plan: form.plan, status: "pending", startDate: new Date().toISOString().split("T")[0] }]);
    setOpen(false);
    setForm({ customer: "", plan: "" });
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subscriptions</h1>
          <p className="page-subtitle">Track and manage customer subscriptions</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Create Subscription
        </Button>
      </div>

      {subs.length === 0 ? (
        <EmptyState icon={RefreshCw} title="No subscriptions yet" description="Create your first subscription." action={<Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Create Subscription</Button>} />
      ) : (
        <Card className="border border-border/50 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{s.customer}</TableCell>
                    <TableCell>{s.plan}</TableCell>
                    <TableCell><StatusBadge status={s.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{s.startDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Subscription</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={form.customer} onValueChange={(v) => setForm({ ...form, customer: v })}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Acme Corp">Acme Corp</SelectItem>
                  <SelectItem value="Globex Inc">Globex Inc</SelectItem>
                  <SelectItem value="Initech LLC">Initech LLC</SelectItem>
                  <SelectItem value="Wayne Enterprises">Wayne Enterprises</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
                <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starter">Starter</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
