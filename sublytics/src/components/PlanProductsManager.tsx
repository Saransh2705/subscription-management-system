"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  getProducts, 
  getPlanProducts, 
  createPlanProduct,
  deletePlanProduct,
  updatePlanProduct
} from "@/lib/actions/products";
import type { Product, SubscriptionPlanProduct } from "@/lib/types/product";

interface PlanProductsManagerProps {
  planId: string;
  planName: string;
}

interface ProductFormData {
  product_id: string;
  tier_price: string;
  is_included: boolean;
  quantity_limit: string;
  notes: string;
}

const initialFormState: ProductFormData = {
  product_id: "",
  tier_price: "",
  is_included: true,
  quantity_limit: "",
  notes: "",
};

export function PlanProductsManager({ planId, planName }: PlanProductsManagerProps) {
  const [planProducts, setPlanProducts] = useState<SubscriptionPlanProduct[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductFormData>(initialFormState);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [planId]);

  const loadData = async () => {
    setLoading(true);
    
    // Load plan products
    const planProductsResult = await getPlanProducts(planId);
    if (planProductsResult.success && planProductsResult.data) {
      setPlanProducts(planProductsResult.data);
    }

    // Load all products
    const productsResult = await getProducts();
    if (productsResult.success && productsResult.data) {
      setAvailableProducts(productsResult.data);
    }

    setLoading(false);
  };

  const handleOpen = () => {
    setForm(initialFormState);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.product_id || !form.tier_price) {
      toast({
        title: "Validation Error",
        description: "Please select a product and enter a tier price",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const data = {
        plan_id: planId,
        product_id: form.product_id,
        tier_price: parseFloat(form.tier_price),
        is_included: form.is_included,
        quantity_limit: form.quantity_limit ? parseInt(form.quantity_limit) : undefined,
        notes: form.notes || undefined,
      };

      const result = await createPlanProduct(data);

      if (result.success) {
        toast({
          title: "Success",
          description: "Product added to plan successfully",
        });
        setOpen(false);
        loadData();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add product to plan",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this product from the plan?")) {
      return;
    }

    const result = await deletePlanProduct(id);
    if (result.success) {
      toast({
        title: "Success",
        description: "Product removed from plan",
      });
      loadData();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to remove product",
        variant: "destructive",
      });
    }
  };

  // Filter out products already added to this plan
  const addedProductIds = planProducts.map(pp => pp.product_id);
  const productsToAdd = availableProducts.filter(p => !addedProductIds.includes(p.id));

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Products in {planName}</CardTitle>
            <CardDescription>
              Manage products and their tier-specific pricing for this subscription plan
            </CardDescription>
          </div>
          <Button onClick={handleOpen} className="gap-2" disabled={productsToAdd.length === 0}>
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {planProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products added</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add products to this plan with custom tier pricing
            </p>
            {productsToAdd.length > 0 && (
              <Button onClick={handleOpen} className="gap-2">
                <Plus className="h-4 w-4" /> Add Your First Product
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Tier Price</TableHead>
                <TableHead>Included</TableHead>
                <TableHead>Limit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planProducts.map((planProduct) => (
                <TableRow key={planProduct.id}>
                  <TableCell>
                    <div className="font-medium">{planProduct.product?.name}</div>
                    {planProduct.product?.description && (
                      <div className="text-sm text-muted-foreground">{planProduct.product.description}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    ${planProduct.product?.unit_price.toFixed(2)}
                  </TableCell>
                  <TableCell className="font-medium text-green-600 dark:text-green-400">
                    ${planProduct.tier_price.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      planProduct.is_included 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {planProduct.is_included ? 'Yes' : 'No'}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {planProduct.quantity_limit || 'Unlimited'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive" 
                      onClick={() => handleDelete(planProduct.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Product to Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product *</Label>
              <Select value={form.product_id} onValueChange={(value) => setForm({ ...form, product_id: value })}>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {productsToAdd.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} (Base: ${product.unit_price})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier_price">Tier Price *</Label>
              <Input 
                id="tier_price"
                type="number" 
                step="0.01"
                value={form.tier_price} 
                onChange={(e) => setForm({ ...form, tier_price: e.target.value })} 
                placeholder="Enter price for this tier" 
              />
              <p className="text-xs text-muted-foreground">
                The price for this product specifically in the {planName} plan
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is_included" 
                checked={form.is_included}
                onCheckedChange={(checked) => setForm({ ...form, is_included: checked as boolean })}
              />
              <Label htmlFor="is_included" className="text-sm font-normal">
                Included in base plan price
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity_limit">Quantity Limit (optional)</Label>
              <Input 
                id="quantity_limit"
                type="number" 
                value={form.quantity_limit} 
                onChange={(e) => setForm({ ...form, quantity_limit: e.target.value })} 
                placeholder="Leave blank for unlimited" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input 
                id="notes"
                value={form.notes} 
                onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                placeholder="Any special notes..." 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Product'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
