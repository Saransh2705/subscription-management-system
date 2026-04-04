"use client";

import { useState } from "react";
import { FileText, Plus, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/EmptyState";
import { markInvoiceAsPaid, type Invoice } from "@/lib/actions/invoices";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface InvoicesClientProps {
  initialInvoices: Invoice[];
}

export default function InvoicesClient({ initialInvoices }: InvoicesClientProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const downloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      toast.success("Generating PDF...");
      
      const response = await fetch(`/api/v1/invoices/${invoiceId}/pdf`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF");
    }
  };

  const markPaid = async (id: string) => {
    setIsUpdating(true);
    try {
      const result = await markInvoiceAsPaid(id);
      if (result.success) {
        toast.success("Invoice marked as paid");
        setSelected(null);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update invoice");
      }
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
      toast.error("Failed to update invoice");
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter invoices based on search query
  const filteredInvoices = initialInvoices.filter((inv) => 
    inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (inv.customer_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">View and manage customer invoices</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice number, customer, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <EmptyState 
          icon={FileText} 
          title={searchQuery ? "No invoices found" : "No invoices yet"} 
          description={searchQuery ? "Try adjusting your search terms" : "Invoices will appear here once subscriptions are active."} 
        />
      ) : (
        <Card className="border border-border/50 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelected(inv)}>
                    <TableCell className="font-medium font-mono text-sm">{inv.invoice_number}</TableCell>
                    <TableCell>{inv.customer_name}</TableCell>
                    <TableCell className="font-medium">{inv.currency} {inv.total.toFixed(2)}</TableCell>
                    <TableCell><StatusBadge status={inv.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(inv.issue_date)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(inv.due_date)}</TableCell>
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

      {/* View Invoice Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice {selected?.invoice_number}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{selected.customer_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Issue Date</span>
                  <span>{formatDate(selected.issue_date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Due Date</span>
                  <span>{formatDate(selected.due_date)}</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Line Items</p>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selected.items || []).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.description}</div>
                              {item.product_sku && (
                                <div className="text-xs text-muted-foreground">SKU: {item.product_sku}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{selected.currency} {item.unit_price.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">{selected.currency} {item.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{selected.currency} {selected.subtotal.toFixed(2)}</span>
                </div>
                {selected.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({selected.discount_percent}%)</span>
                    <span>-{selected.currency} {selected.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({selected.tax_percent}%)</span>
                  <span>{selected.currency} {selected.tax_amount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-semibold text-lg">
                  <span>Total</span>
                  <span>{selected.currency} {selected.total.toFixed(2)}</span>
                </div>
                {selected.paid_at && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Paid on</span>
                    <span>{formatDate(selected.paid_at)}</span>
                  </div>
                )}
              </div>

              {selected.notes && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Notes</p>
                    <p className="text-sm text-muted-foreground">{selected.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            {selected && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => downloadPDF(selected.id, selected.invoice_number)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                {selected.status !== "paid" && (
                  <Button 
                    onClick={() => markPaid(selected.id)} 
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Updating..." : "Mark as Paid"}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
