"use client";

import { useState } from "react";
import { FileCheck, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";

interface Quotation {
  id: number;
  customer: string;
  amount: number;
  status: "draft" | "sent" | "expired" | "converted";
  validUntil: string;
}

const initialQuotations: Quotation[] = [
  { id: 1, customer: "Wayne Enterprises", amount: 4999, status: "sent", validUntil: "2024-04-30" },
  { id: 2, customer: "Stark Industries", amount: 9999, status: "draft", validUntil: "2024-05-15" },
];

export default function Quotations() {
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer: "", amount: "", validUntil: "" });

  const handleSave = () => {
    setQuotations([...quotations, { id: Date.now(), customer: form.customer, amount: Number(form.amount), status: "draft", validUntil: form.validUntil }]);
    setOpen(false);
    setForm({ customer: "", amount: "", validUntil: "" });
  };

  const convertToSubscription = (id: number) => {
    setQuotations(quotations.map((q) => q.id === id ? { ...q, status: "converted" as const } : q));
    toast.success("Quotation converted to subscription!");
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quotations</h1>
          <p className="page-subtitle">Enterprise quotation management</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Create Quotation
        </Button>
      </div>

      {quotations.length === 0 ? (
        <EmptyState icon={FileCheck} title="No quotations yet" description="Create a quotation for enterprise customers." action={<Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Create Quotation</Button>} />
      ) : (
        <Card className="border border-border/50 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((q) => (
                  <TableRow key={q.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{q.customer}</TableCell>
                    <TableCell>${q.amount.toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={q.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{q.validUntil}</TableCell>
                    <TableCell className="text-right">
                      {q.status !== "converted" && (
                        <Button variant="ghost" size="sm" className="gap-1.5 text-primary" onClick={() => convertToSubscription(q.id)}>
                          Convert <ArrowRight className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Quotation</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={form.customer} onValueChange={(v) => setForm({ ...form, customer: v })}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Wayne Enterprises">Wayne Enterprises</SelectItem>
                  <SelectItem value="Stark Industries">Stark Industries</SelectItem>
                  <SelectItem value="Acme Corp">Acme Corp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="4999" />
            </div>
            <div className="space-y-2">
              <Label>Valid Until</Label>
              <Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
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
