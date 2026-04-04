"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Search, Loader2, Ban, CheckCircle, Edit, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  getCustomers, 
  createCustomer, 
  updateCustomer, 
  toggleCustomerStatus 
} from "@/lib/actions/customers";
import type { CustomerWithCreator, CreateCustomerInput, UpdateCustomerInput } from "@/lib/types/customer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

const ITEMS_PER_PAGE = 50;

interface CustomersPageClientProps {
  initialCustomers: CustomerWithCreator[];
  initialTotal: number;
}

export default function CustomersPageClient({ initialCustomers, initialTotal }: CustomersPageClientProps) {
  const [customers, setCustomers] = useState<CustomerWithCreator[]>(initialCustomers);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(initialCustomers.length === ITEMS_PER_PAGE);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithCreator | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<CreateCustomerInput>({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    city: "",
    country: "",
    notes: "",
  });

  const { toast } = useToast();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load customers
  const loadCustomers = useCallback(async (search: string, currentOffset: number, append: boolean = false) => {
    setLoading(true);
    try {
      const { customers: data, total: totalCount } = await getCustomers(search, ITEMS_PER_PAGE, currentOffset);
      
      if (append) {
        setCustomers(prev => [...prev, ...data]);
      } else {
        setCustomers(data);
      }
      
      setTotal(totalCount);
      setHasMore(data.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error("Error loading customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Initial load and search change
  useEffect(() => {
    setOffset(0);
    loadCustomers(debouncedSearch, 0, false);
  }, [debouncedSearch, loadCustomers]);

  // Load more (lazy loading)
  const loadMore = () => {
    const newOffset = offset + ITEMS_PER_PAGE;
    setOffset(newOffset);
    loadCustomers(debouncedSearch, newOffset, true);
  };

  // Open create dialog
  const handleCreate = () => {
    setEditingCustomer(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      address: "",
      city: "",
      country: "",
      notes: "",
    });
    setDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (customer: CustomerWithCreator) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
      company: customer.company || "",
      address: customer.address || "",
      city: customer.city || "",
      country: customer.country || "",
      notes: customer.notes || "",
    });
    setDialogOpen(true);
  };

  // Save customer (create or update)
  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      if (editingCustomer) {
        // Update existing customer
        const updateData: UpdateCustomerInput = {};
        if (formData.name !== editingCustomer.name) updateData.name = formData.name;
        if (formData.email !== editingCustomer.email) updateData.email = formData.email;
        if (formData.phone !== editingCustomer.phone) updateData.phone = formData.phone || null;
        if (formData.company !== editingCustomer.company) updateData.company = formData.company || null;
        if (formData.address !== editingCustomer.address) updateData.address = formData.address || null;
        if (formData.city !== editingCustomer.city) updateData.city = formData.city || null;
        if (formData.country !== editingCustomer.country) updateData.country = formData.country || null;
        if (formData.notes !== editingCustomer.notes) updateData.notes = formData.notes || null;

        const result = await updateCustomer(editingCustomer.id, updateData);
        
        if (result.success) {
          toast({
            title: "Success",
            description: "Customer updated successfully",
          });
          setDialogOpen(false);
          // Reload customers
          setOffset(0);
          loadCustomers(debouncedSearch, 0, false);
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update customer",
            variant: "destructive",
          });
        }
      } else {
        // Create new customer - ensure clean data
        const cleanData: CreateCustomerInput = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone?.trim() || undefined,
          company: formData.company?.trim() || undefined,
          address: formData.address?.trim() || undefined,
          city: formData.city?.trim() || undefined,
          country: formData.country?.trim() || undefined,
          notes: formData.notes?.trim() || undefined,
        };
        
        console.log("Creating customer with data:", cleanData);
        const result = await createCustomer(cleanData);
        
        if (result.success) {
          toast({
            title: "Success",
            description: "Customer created successfully",
          });
          setDialogOpen(false);
          // Reload customers
          setOffset(0);
          loadCustomers(debouncedSearch, 0, false);
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create customer",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle customer status
  const handleToggleStatus = async (customer: CustomerWithCreator) => {
    try {
      const result = await toggleCustomerStatus(customer.id);
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Customer ${customer.is_active ? "deactivated" : "activated"} successfully`,
        });
        // Reload customers
        setOffset(0);
        loadCustomers(debouncedSearch, 0, false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update customer status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error toggling customer status:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">
            {total > 0 ? `${total} customer${total !== 1 ? 's' : ''} total` : 'Manage your customer base'}
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Customer
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="mb-6 border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Tip: Paste a customer ID for exact match, or search by name/email
          </p>
        </CardContent>
      </Card>

      {/* Customer List */}
      {loading && customers.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : customers.length === 0 ? (
        <EmptyState 
          icon={Users} 
          title="No customers found" 
          description={searchTerm ? "Try a different search term" : "Add your first customer to get started"} 
          action={<Button onClick={handleCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Customer</Button>} 
        />
      ) : (
        <>
          <Card className="border border-border/50 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {customer.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            {customer.phone && (
                              <div className="text-xs text-muted-foreground">{customer.phone}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{customer.email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {customer.company || <span className="text-muted-foreground/50">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.creation_source === 'api' ? 'outline' : 'secondary'} className="gap-1">
                          {customer.creation_source === 'api' ? '🔌 API' : '👤 User'}
                        </Badge>
                        {customer.creator_name && (
                          <div className="text-xs text-muted-foreground mt-1">by {customer.creator_name}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.is_active ? 'default' : 'secondary'} className="gap-1">
                          {customer.is_active ? (
                            <><CheckCircle className="h-3 w-3" /> Active</>
                          ) : (
                            <><Ban className="h-3 w-3" /> Inactive</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(customer)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(customer)}>
                              {customer.is_active ? (
                                <><Ban className="h-4 w-4 mr-2" /> Deactivate</>
                              ) : (
                                <><CheckCircle className="h-4 w-4 mr-2" /> Activate</>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button 
                variant="outline" 
                onClick={loadMore} 
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Loading...</>
                ) : (
                  <>Load More ({customers.length} of {total})</>
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
            <DialogDescription>
              {editingCustomer ? 'Update customer information' : 'Create a new customer. All users can create customers.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                <Input 
                  id="name"
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="John Doe" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                <Input 
                  id="email"
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                  placeholder="john@example.com" 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone"
                  value={formData.phone} 
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                  placeholder="+1 234 567 8900" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input 
                  id="company"
                  value={formData.company} 
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })} 
                  placeholder="Acme Corp" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address"
                value={formData.address} 
                onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                placeholder="123 Main St" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city"
                  value={formData.city} 
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })} 
                  placeholder="New York" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input 
                  id="country"
                  value={formData.country} 
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })} 
                  placeholder="USA" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes"
                value={formData.notes} 
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                placeholder="Additional notes about this customer..." 
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={submitting} className="gap-2">
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <>{editingCustomer ? 'Update' : 'Create'} Customer</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
