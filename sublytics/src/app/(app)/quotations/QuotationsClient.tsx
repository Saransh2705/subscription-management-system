"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, Mail, MessageCircle, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
import {
  createQuotation,
  updateQuotation,
  deleteQuotation,
  shareQuotationByEmail,
  shareQuotationByWhatsApp,
} from "@/lib/actions/quotations";
import { getProducts } from "@/lib/actions/products";
import type { Product } from "@/lib/types/product";

interface QuotationsClientProps {
  initialQuotations: any[];
  customers: any[];
  plans: any[];
}

export default function QuotationsClient({ initialQuotations, customers, plans }: QuotationsClientProps) {
  const [quotations, setQuotations] = useState(initialQuotations);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [shareEmailDialogOpen, setShareEmailDialogOpen] = useState(false);
  const [shareWhatsAppDialogOpen, setShareWhatsAppDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  const [selectedQuotation, setSelectedQuotation] = useState<any | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [planId, setPlanId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ description: "", quantity: 1, unitPrice: 0 }]);
  
  const [shareEmail, setShareEmail] = useState("");
  const [sharePhone, setSharePhone] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const result = await getProducts();
    if (result.data) {
      setProducts(result.data);
    }
  };

  const handleCreate = async () => {
    if (!customerId || !validUntil || items.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await createQuotation({
      customer_id: customerId,
      plan_id: planId,
      valid_until: validUntil,
      notes,
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
    });

    if (result.success) {
      toast({
        title: "Success",
        description: "Quotation created successfully",
      });
      setCreateDialogOpen(false);
      resetForm();
      window.location.reload();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create quotation",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleEdit = async () => {
    if (!selectedQuotation) return;

    setLoading(true);
    const result = await updateQuotation(selectedQuotation.id, {
      valid_until: validUntil,
      notes,
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
    });

    if (result.success) {
      toast({
        title: "Success",
        description: "Quotation updated successfully",
      });
      setEditDialogOpen(false);
      resetForm();
      window.location.reload();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update quotation",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quotation?")) return;

    const result = await deleteQuotation(id);
    if (result.success) {
      toast({
        title: "Success",
        description: "Quotation deleted successfully",
      });
      window.location.reload();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete quotation",
        variant: "destructive",
      });
    }
  };

  const handleShareEmail = async () => {
    if (!selectedQuotation || !shareEmail) {
      toast({
        title: "Validation Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await shareQuotationByEmail(selectedQuotation.id, shareEmail);

    if (result.success) {
      toast({
        title: "Success",
        description: "Quotation sent via email successfully",
      });
      setShareEmailDialogOpen(false);
      setShareEmail("");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to send email",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleShareWhatsApp = async () => {
    if (!selectedQuotation || !sharePhone) {
      toast({
        title: "Validation Error",
        description: "Please enter a WhatsApp number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await shareQuotationByWhatsApp(selectedQuotation.id, sharePhone);

    if (result.success) {
      toast({
        title: "Success",
        description: "Quotation sent via WhatsApp successfully",
      });
      setShareWhatsAppDialogOpen(false);
      setSharePhone("");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to send WhatsApp message",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const openEditDialog = (quotation: any) => {
    setSelectedQuotation(quotation);
    setValidUntil(quotation.valid_until);
    setNotes(quotation.notes || "");
    setItems(quotation.quotation_items.map((item: any) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
    })));
    setEditDialogOpen(true);
  };

  const openShareEmailDialog = (quotation: any) => {
    setSelectedQuotation(quotation);
    setShareEmail(quotation.customer?.email || "");
    setShareEmailDialogOpen(true);
  };

  const openShareWhatsAppDialog = (quotation: any) => {
    setSelectedQuotation(quotation);
    setSharePhone(quotation.customer?.phone || "");
    setShareWhatsAppDialogOpen(true);
  };

  const openViewDialog = (quotation: any) => {
    setSelectedQuotation(quotation);
    setViewDialogOpen(true);
  };

  const resetForm = () => {
    setCustomerId("");
    setPlanId("");
    setValidUntil("");
    setNotes("");
    setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
    setSelectedQuotation(null);
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quotations</h1>
          <p className="page-subtitle">Create and manage quotations for customers</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Create Quotation
        </Button>
      </div>

      {quotations.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No quotations yet"
          description="Create your first quotation to get started"
          action={
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Create Quotation
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Quotations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((quotation) => (
                  <TableRow key={quotation.id}>
                    <TableCell className="font-mono">{quotation.quotation_number}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{quotation.customer?.name}</p>
                        <p className="text-xs text-muted-foreground">{quotation.customer?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{quotation.currency} {quotation.total.toFixed(2)}</TableCell>
                    <TableCell>{new Date(quotation.valid_until).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <StatusBadge status={quotation.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openViewDialog(quotation)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(quotation)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openShareEmailDialog(quotation)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openShareWhatsAppDialog(quotation)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(quotation.id)}
                        >
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

      {/* Create Quotation Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Quotation</DialogTitle>
            <DialogDescription>Create a new quotation for a customer</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valid Until *</Label>
                <Input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Additional notes..."
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Items *</Label>
                <Button size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              {items.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      <span className="font-semibold">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                      {items.length > 1 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              <div className="text-right text-lg font-semibold">
                Total: ${calculateTotal().toFixed(2)}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Creating..." : "Create Quotation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Quotation Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Quotation</DialogTitle>
            <DialogDescription>Update quotation details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Valid Until *</Label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Items *</Label>
                <Button size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              {items.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      <span className="font-semibold">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                      {items.length > 1 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              <div className="text-right text-lg font-semibold">
                Total: ${calculateTotal().toFixed(2)}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading ? "Updating..." : "Update Quotation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share via Email Dialog */}
      <Dialog open={shareEmailDialogOpen} onOpenChange={setShareEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share via Email</DialogTitle>
            <DialogDescription>
              Send quotation {selectedQuotation?.quotation_number} to customer via email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="customer@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleShareEmail} disabled={loading}>
              <Mail className="h-4 w-4 mr-2" />
              {loading ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share via WhatsApp Dialog */}
      <Dialog open={shareWhatsAppDialogOpen} onOpenChange={setShareWhatsAppDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share via WhatsApp</DialogTitle>
            <DialogDescription>
              Send quotation {selectedQuotation?.quotation_number} to customer via WhatsApp
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>WhatsApp Number *</Label>
              <Input
                type="tel"
                value={sharePhone}
                onChange={(e) => setSharePhone(e.target.value)}
                placeholder="+1234567890"
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +1 for US, +91 for India)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareWhatsAppDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleShareWhatsApp} disabled={loading}>
              <MessageCircle className="h-4 w-4 mr-2" />
              {loading ? "Sending..." : "Send WhatsApp"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Quotation Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quotation Details</DialogTitle>
          </DialogHeader>
          {selectedQuotation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Quotation Number</p>
                  <p className="font-mono font-semibold">{selectedQuotation.quotation_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={selectedQuotation.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedQuotation.customer?.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedQuotation.customer?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valid Until</p>
                  <p>{new Date(selectedQuotation.valid_until).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Items</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedQuotation.quotation_items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{selectedQuotation.currency} {item.unit_price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{selectedQuotation.currency} {item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="text-right space-y-1">
                <p className="text-2xl font-bold">
                  Total: {selectedQuotation.currency} {selectedQuotation.total.toFixed(2)}
                </p>
              </div>

              {selectedQuotation.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedQuotation.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
