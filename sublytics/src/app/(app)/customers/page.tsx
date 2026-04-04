"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/EmptyState";

interface Customer {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

const initialCustomers: Customer[] = [
  { id: 1, name: "Acme Corp", email: "billing@acme.com", createdAt: "2024-01-15" },
  { id: 2, name: "Globex Inc", email: "finance@globex.com", createdAt: "2024-02-10" },
  { id: 3, name: "Initech LLC", email: "admin@initech.com", createdAt: "2024-03-05" },
  { id: 4, name: "Wayne Enterprises", email: "ap@wayne.com", createdAt: "2024-03-20" },
];

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });

  const handleSave = () => {
    setCustomers([...customers, { id: Date.now(), ...form, createdAt: new Date().toISOString().split("T")[0] }]);
    setOpen(false);
    setForm({ name: "", email: "" });
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage your customer base</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Customer
        </Button>
      </div>

      {customers.length === 0 ? (
        <EmptyState icon={Users} title="No customers yet" description="Add your first customer to get started." action={<Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Customer</Button>} />
      ) : (
        <Card className="border border-border/50 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">{c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.email}</TableCell>
                    <TableCell className="text-muted-foreground">{c.createdAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Corp" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="billing@acme.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
