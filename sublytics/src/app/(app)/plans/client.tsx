"use client";

import { useState } from "react";
import { Layers, Package, Plus, Settings, TrendingDown, DollarSign, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { updatePlanDiscount, getPlanWithProducts, addProductToPlan, updatePlanProduct, removeProductFromPlan, createPlan, deletePlan, togglePlanStatus } from "@/lib/actions/plans";
import { getProducts } from "@/lib/actions/products";
import type { SubscriptionPlanProduct, Product } from "@/lib/types/product";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface PlansPageClientProps {
  initialPlans: any[];
}

export default function PlansPageClient({ initialPlans }: PlansPageClientProps) {
  const [plans, setPlans] = useState(initialPlans);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [planProducts, setPlanProducts] = useState<SubscriptionPlanProduct[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [productsDialogOpen, setProductsDialogOpen] = useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [discountValue, setDiscountValue] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [tierPrice, setTierPrice] = useState("");
  
  // Create plan form state
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanDescription, setNewPlanDescription] = useState("");
  const [newPlanPrice, setNewPlanPrice] = useState("");
  const [newPlanBillingCycle, setNewPlanBillingCycle] = useState<'monthly' | 'quarterly' | 'semi_annual' | 'annual'>('monthly');
  const [newPlanTrialDays, setNewPlanTrialDays] = useState("");

  const { toast } = useToast();

  const handleOpenDiscountDialog = (plan: any) => {
    setSelectedPlan(plan);
    setDiscountValue(plan.discount_percentage.toString());
    setDiscountDialogOpen(true);
  };

  const handleSaveDiscount = async () => {
    if (!selectedPlan) return;

    const discount = parseFloat(discountValue);
    if (isNaN(discount) || discount < 0 || discount > 100) {
      toast({
        title: "Invalid Discount",
        description: "Discount must be between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await updatePlanDiscount(selectedPlan.id, discount);
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Plan discount updated successfully",
      });
      setDiscountDialogOpen(false);
      // Reload plans to show updated pricing
      window.location.reload();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update discount",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleOpenProductsDialog = async (plan: any) => {
    setSelectedPlan(plan);
    setLoading(true);
    
    // Load plan products and all available products
    const [planResult, productsResult] = await Promise.all([
      getPlanWithProducts(plan.id),
      getProducts(),
    ]);

    if (planResult.error) {
      toast({
        title: "Error",
        description: planResult.error,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setPlanProducts(planResult.products);
    setAllProducts(productsResult.data || []);
    setProductsDialogOpen(true);
    setLoading(false);
  };

  const handleAddProduct = async () => {
    if (!selectedPlan || !selectedProductId) {
      toast({
        title: "Validation Error",
        description: " Please select a product",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await addProductToPlan({
      planId: selectedPlan.id,
      productId: selectedProductId,
      tierPrice: tierPrice ? parseFloat(tierPrice) : 0,
      isIncluded: true,
    });

    if (result.success) {
      toast({
        title: "Success",
        description: "Product added to plan",
      });
      setAddProductDialogOpen(false);
      setSelectedProductId("");
      setTierPrice("");
      // Reload plan products
      const planResult = await getPlanWithProducts(selectedPlan.id);
      setPlanProducts(planResult.products);
      window.location.reload(); // Reload to update pricing
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to add product",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleRemoveProduct = async (productId: string) => {
    setLoading(true);
    const result = await removeProductFromPlan(productId);

    if (result.success) {
      toast({
        title: "Success",
        description: "Product removed from plan",
      });
      setPlanProducts(planProducts.filter(p => p.id !== productId));
      window.location.reload(); // Reload to update pricing
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to remove product",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleToggleIncluded = async (productItem: SubscriptionPlanProduct) => {
    const result = await updatePlanProduct(productItem.id, {
      isIncluded: !productItem.is_included,
    });

    if (result.success) {
      setPlanProducts(planProducts.map(p => 
        p.id === productItem.id ? { ...p, is_included: !p.is_included } : p
      ));
      window.location.reload(); // Reload to update pricing
    }
  };

  const getAvailableProducts = () => {
    const usedProductIds = planProducts.map(pp => pp.product_id);
    return allProducts.filter(p => !usedProductIds.includes(p.id) && p.is_active);
  };

  const handleCreatePlan = async () => {
    if (!newPlanName || !newPlanPrice) {
      toast({
        title: "Validation Error",
        description: "Plan name and price are required",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(newPlanPrice);
    if (isNaN(price) || price < 0) {
      toast({
        title: "Validation Error",
        description: "Price must be a valid positive number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await createPlan({
      name: newPlanName,
      description: newPlanDescription || undefined,
      price,
      billing_cycle: newPlanBillingCycle,
      trial_days: newPlanTrialDays ? parseInt(newPlanTrialDays) : 0,
    });

    if (result.success) {
      toast({
        title: "Success",
        description: "Plan created successfully",
      });
      setCreateDialogOpen(false);
      setNewPlanName("");
      setNewPlanDescription("");
      setNewPlanPrice("");
      setNewPlanTrialDays("");
      setNewPlanBillingCycle('monthly');
      window.location.reload();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create plan",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;

    setLoading(true);
    const result = await deletePlan(selectedPlan.id);

    if (result.success) {
      toast({
        title: "Success",
        description: "Plan deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSelectedPlan(null);
      window.location.reload();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete plan",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleTogglePlanStatus = async (plan: any) => {
    const result = await togglePlanStatus(plan.id, !plan.is_active);
    
    if (result.success) {
      toast({
        title: "Success",
        description: `Plan ${plan.is_active ? 'deactivated' : 'activated'} successfully`,
      });
      window.location.reload();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update plan status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subscription Plans</h1>
          <p className="page-subtitle">Manage plans, discounts, and included products</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Create Plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <EmptyState 
          icon={Layers} 
          title="No plans yet" 
          description="Create your first subscription plan to get started"
          action={
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Create Plan
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      {!plan.is_active && (
                        <Badge variant="outline" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1">{plan.description}</CardDescription>
                  </div>
                  {plan.discount_percentage > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <TrendingDown className="h-3 w-3" /> {plan.discount_percentage}% off
                    </Badge>
                  )}
                </div>
                
                {/* Pricing */}
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Base Price</div>
                      <div className="text-lg font-semibold">${plan.base_price?.toFixed(2) || '0.00'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Final Price</div>
                      <div className="text-2xl font-bold text-primary">${plan.final_price?.toFixed(2) || '0.00'}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {plan.product_count || 0} product{plan.product_count !== 1 && 's'} included
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => handleOpenDiscountDialog(plan)}
                  >
                    <TrendingDown className="h-4 w-4" /> 
                    Discount
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => handleOpenProductsDialog(plan)}
                  >
                    <Package className="h-4 w-4" /> 
                    Products
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleTogglePlanStatus(plan)}
                  >
                    {plan.is_active ? 'Deactivate' : 'Activate'}
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2 text-destructive hover:text-destructive"
                    onClick={() => {
                      setSelectedPlan(plan);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> 
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Discount Dialog */}
      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Plan Discount</DialogTitle>
            <DialogDescription>
              Set the discount percentage for {selectedPlan?.name}. This will be applied to all included products.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Discount Percentage (0-100)</Label>
              <Input 
                id="discount"
                type="number" 
                min="0"
                max="100"
                step="0.01"
                value={discountValue} 
                onChange={(e) => setDiscountValue(e.target.value)} 
                placeholder="25" 
              />
              <p className="text-xs text-muted-foreground">
                Final price = Base price × (1 - discount / 100)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscountDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSaveDiscount} disabled={loading}>
              {loading ? "Saving..." : "Save Discount"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Products Dialog */}
      <Dialog open={productsDialogOpen} onOpenChange={setProductsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Plan Products</DialogTitle>
            <DialogDescription>
              Select which products are included in {selectedPlan?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-muted-foreground">
                {planProducts.filter(p => p.is_included).length} product{planProducts.filter(p => p.is_included).length !== 1 && 's'} included
              </div>
              <Button 
                size="sm" 
                className="gap-2"
                onClick={() => setAddProductDialogOpen(true)}
              >
                <Plus className="h-4 w-4" /> Add Product
              </Button>
            </div>

            {planProducts.length === 0 ? (
              <EmptyState 
                icon={Package}
                title="No products added"
                description="Add products to this plan to get started"
                action={
                  <Button onClick={() => setAddProductDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Product
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Included</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Tier Price</TableHead>
                    <TableHead>Final Price</TableHead>
                    <TableHead className ="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planProducts.map((pp: any) => {
                    const product = pp.product;
                    const usedPrice = pp.tier_price > 0 ? pp.tier_price : product?.unit_price || 0;
                    const finalPrice = usedPrice * (1 - (selectedPlan?.discount_percentage || 0) / 100);
                    
                    return (
                      <TableRow key={pp.id}>
                        <TableCell>
                          <Checkbox 
                            checked={pp.is_included}
                            onCheckedChange={() => handleToggleIncluded(pp)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{product?.name || 'Unknown'}</TableCell>
                        <TableCell>${product?.unit_price?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          {pp.tier_price > 0 ? `$${pp.tier_price.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="font-semibold text-primary">
                          ${finalPrice.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveProduct(pp.id)}
                            disabled={loading}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={addProductDialogOpen} onOpenChange={setAddProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product to Plan</DialogTitle>
            <DialogDescription>
              Select a product to add to {selectedPlan?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product..." />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableProducts().map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - ${product.unit_price.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tierPrice">Tier Price Override (optional)</Label>
              <Input 
                id="tierPrice"
                type="number" 
                min="0"
                step="0.01"
                value={tierPrice} 
                onChange={(e) => setTierPrice(e.target.value)} 
                placeholder="Leave empty to use product base price" 
              />
              <p className="text-xs text-muted-foreground">
                Override the product's base price for this specific plan tier
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddProductDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleAddProduct} disabled={loading || !selectedProductId}>
              {loading ? "Adding..." : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Plan Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Plan</DialogTitle>
            <DialogDescription>
              Create a new subscription plan with pricing and billing details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="planName">Plan Name *</Label>
              <Input 
                id="planName"
                value={newPlanName} 
                onChange={(e) => setNewPlanName(e.target.value)} 
                placeholder="e.g., Pro Plan" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="planDescription">Description</Label>
              <Textarea 
                id="planDescription"
                value={newPlanDescription} 
                onChange={(e) => setNewPlanDescription(e.target.value)} 
                placeholder="Brief description of the plan" 
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planPrice">Base Price (USD) *</Label>
                <Input 
                  id="planPrice"
                  type="number" 
                  min="0"
                  step="0.01"
                  value={newPlanPrice} 
                  onChange={(e) => setNewPlanPrice(e.target.value)} 
                  placeholder="99.00" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trialDays">Trial Days</Label>
                <Input 
                  id="trialDays"
                  type="number" 
                  min="0"
                  value={newPlanTrialDays} 
                  onChange={(e) => setNewPlanTrialDays(e.target.value)} 
                  placeholder="0" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingCycle">Billing Cycle *</Label>
              <Select value={newPlanBillingCycle} onValueChange={(value: any) => setNewPlanBillingCycle(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlan} disabled={loading}>
              {loading ? "Creating..." : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{selectedPlan?.name}</strong>. This action cannot be undone.
              <br /><br />
              <span className="text-destructive font-medium">
                Note: Plans with active subscriptions cannot be deleted. Deactivate them instead.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePlan} disabled={loading}>
              {loading ? "Deleting..." : "Delete Plan"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
