"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { Package, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/EmptyState";

interface Product {
  id: number;
  name: string;
  price: number;
  createdAt: string;
}

const initialProducts: Product[] = [
  { id: 1, name: "Starter API Access", price: 29, createdAt: "2024-01-15" },
  { id: 2, name: "Pro API Access", price: 99, createdAt: "2024-01-20" },
  { id: 3, name: "Enterprise Suite", price: 299, createdAt: "2024-02-01" },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", price: "" });

  const handleOpen = (product?: Product) => {
    if (product) {
      setEditing(product);
      setForm({ name: product.name, price: product.price.toString() });
    } else {
      setEditing(null);
      setForm({ name: "", price: "" });
    }
    setOpen(true);
  };

  const handleSave = () => {
    if (editing) {
      setProducts(products.map((p) => (p.id === editing.id ? { ...p, name: form.name, price: Number(form.price) } : p)));
    } else {
      setProducts([...products, { id: Date.now(), name: form.name, price: Number(form.price), createdAt: new Date().toISOString().split("T")[0] }]);
    }
    setOpen(false);
  };

  const handleDelete = (id: number) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your product catalog</p>
        </div>
        <Button onClick={() => handleOpen()} className="gap-2">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState 
          icon={Package} 
          title="No products yet" 
          description="Create your first product to get started." 
          action={<Button onClick={() => handleOpen()} className="gap-2"><Plus className="h-4 w-4" /> Add Product</Button>} 
        />
      ) : (
        <Card className="border border-border/50 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>${product.price}/mo</TableCell>
                    <TableCell className="text-muted-foreground">{product.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleOpen(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. API Access" />
            </div>
            <div className="space-y-2">
              <Label>Price (USD/mo)</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="29" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
