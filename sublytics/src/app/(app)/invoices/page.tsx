"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/EmptyState";

interface Invoice {
  id: string;
  customer: string;
  amount: number;
  tax: number;
  status: "paid" | "pending" | "overdue";
  date: string;
  items: { name: string; qty: number; price: number }[];
}

const initialInvoices: Invoice[] = [
  { id: "INV-001", customer: "Acme Corp", amount: 99, tax: 9.9, status: "paid", date: "2024-03-01", items: [{ name: "Pro API Access", qty: 1, price: 99 }] },
  { id: "INV-002", customer: "Globex Inc", amount: 29, tax: 2.9, status: "pending", date: "2024-03-15", items: [{ name: "Starter API Access", qty: 1, price: 29 }] },
  { id: "INV-003", customer: "Initech LLC", amount: 299, tax: 29.9, status: "overdue", date: "2024-02-28", items: [{ name: "Enterprise Suite", qty: 1, price: 299 }] },
];

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [selected, setSelected] = useState<Invoice | null>(null);

  const markPaid = (id: string) => {
    setInvoices(invoices.map((inv) => inv.id === id ? { ...inv, status: "paid" as const } : inv));
    setSelected(null);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">View and manage customer invoices</p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <EmptyState icon={FileText} title="No invoices yet" description="Invoices will appear here once subscriptions are active." />
      ) : (
        <Card className="border border-border/50 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelected(inv)}>
                    <TableCell className="font-medium font-mono text-sm">{inv.id}</TableCell>
                    <TableCell>{inv.customer}</TableCell>
                    <TableCell>${inv.amount.toFixed(2)}</TableCell>
                    <TableCell><StatusBadge status={inv.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{inv.date}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelected(inv); }}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Invoice {selected?.id}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium">{selected.customer}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span>{selected.date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={selected.status} />
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Items</p>
                {selected.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.name} × {item.qty}</span>
                    <span>${item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>${selected.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span>Total</span>
                <span>${(selected.amount + selected.tax).toFixed(2)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            {selected && selected.status !== "paid" && (
              <Button onClick={() => markPaid(selected.id)}>Mark as Paid</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
