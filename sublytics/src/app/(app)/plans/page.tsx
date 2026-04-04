"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { Layers, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";

interface Plan {
  id: number;
  name: string;
  type: "Standard" | "Enterprise";
  billingCycle: "Monthly" | "Yearly";
  price: number;
}

const initialPlans: Plan[] = [
  { id: 1, name: "Starter", type: "Standard", billingCycle: "Monthly", price: 29 },
  { id: 2, name: "Professional", type: "Standard", billingCycle: "Monthly", price: 99 },
  { id: 3, name: "Business", type: "Enterprise", billingCycle: "Yearly", price: 999 },
];

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ 
    name: "", 
    type: "Standard" as Plan["type"], 
    billingCycle: "Monthly" as Plan["billingCycle"], 
    price: "" 
  });

  const handleSave = () => {
    setPlans([...plans, { id: Date.now(), ...form, price: Number(form.price) }]);
    setOpen(false);
    setForm({ name: "", type: "Standard", billingCycle: "Monthly", price: "" });
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Plans</h1>
          <p className="page-subtitle">Configure subscription plans</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Create Plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <EmptyState 
          icon={Layers} 
          title="No plans yet" 
          description="Create your first subscription plan." 
          action={<Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Create Plan</Button>} 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription className="mt-1">{plan.billingCycle} billing</CardDescription>
                  </div>
                  <Badge variant={plan.type === "Enterprise" ? "default" : "secondary"}>
                    {plan.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground text-sm">/{plan.billingCycle === "Monthly" ? "mo" : "yr"}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-destructive gap-1.5" 
                    onClick={() => setPlans(plans.filter(p => p.id !== plan.id))}
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Plan Name</Label>
              <Input 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                placeholder="e.g. Professional" 
              />
            </div>
            <div className="space-y-2">
              <Label>Plan Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Plan["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Billing Cycle</Label>
              <Select value={form.billingCycle} onValueChange={(v) => setForm({ ...form, billingCycle: v as Plan["billingCycle"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Price (USD)</Label>
              <Input 
                type="number" 
                value={form.price} 
                onChange={(e) => setForm({ ...form, price: e.target.value })} 
                placeholder="99" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Create Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
