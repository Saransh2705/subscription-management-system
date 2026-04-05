"use client";

import { useState, useEffect } from "react";
import { Package, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from "@/lib/actions/products";
import type { Product } from "@/lib/types/product";
import type { AvailableCurrency } from "@/lib/types/settings";

interface ProductFormData {
  name: string;
  description: string;
  entered_price: string; // Price in selected currency
  unit_price: string; // Converted price in system currency
  tax_percent: string;
  currency: string;
}

interface ProductsClientProps {
  systemCurrency: string;
  availableCurrencies: AvailableCurrency[];
}

// Currency symbols mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AED: 'د.إ',
  SAR: '﷼',
  SGD: 'S$',
  AUD: 'A$',
  CAD: 'C$',
  JPY: '¥',
  CNY: '¥',
};

export function ProductsClient({ systemCurrency, availableCurrencies }: ProductsClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>({
    name: "",
    description: "",
    entered_price: "",
    unit_price: "",
    tax_percent: "0",
    currency: systemCurrency,
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Build currency lookup map
  const currencyMap = availableCurrencies.reduce((acc, curr) => {
    acc[curr.currency_code] = curr.roe_rate;
    return acc;
  }, {} as Record<string, number>);

  const getCurrencySymbol = (code: string) => CURRENCY_SYMBOLS[code] || code;

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const result = await getProducts();
    if (result.success && result.data) {
      setProducts(result.data);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to load products",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  // Convert price to system currency
  const convertToSystemCurrency = (price: string, fromCurrency: string): string => {
    if (!price || isNaN(parseFloat(price))) return "0";
    const priceNum = parseFloat(price);
    const rate = currencyMap[fromCurrency] || 1;
    return (priceNum * rate).toFixed(2);
  };

  // Update price when currency or entered price changes
  const handlePriceChange = (enteredPrice: string, currency: string) => {
    const convertedPrice = convertToSystemCurrency(enteredPrice, currency);
    setForm({ ...form, entered_price: enteredPrice, unit_price: convertedPrice, currency });
  };

  const handleOpen = (product?: Product) => {
    if (product) {
      setEditing(product);
      const currency = product.currency || systemCurrency;
      const systemPrice = product.unit_price.toString();
      let enteredPrice = systemPrice;
      
      // If currency is not system currency, reverse calculate
      if (currency !== systemCurrency) {
        const rate = currencyMap[currency] || 1;
        enteredPrice = (product.unit_price / rate).toFixed(2);
      }
      
      setForm({
        name: product.name,
        description: product.description || "",
        entered_price: enteredPrice,
        unit_price: systemPrice,
        tax_percent: product.tax_percent.toString(),
        currency: currency,
      });
    } else {
      setEditing(null);
      setForm({
        name: "",
        description: "",
        entered_price: "",
        unit_price: "",
        tax_percent: "0",
        currency: systemCurrency,
      });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.entered_price) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const productData = {
        name: form.name,
        description: form.description || undefined,
        unit_price: parseFloat(form.unit_price), // Converted system currency price
        tax_percent: parseFloat(form.tax_percent) || 0,
        currency: form.currency, // Original currency for reference
      };

      let result;
      if (editing) {
        result = await updateProduct(editing.id, productData);
      } else {
        result = await createProduct(productData);
      }

      if (result.success) {
        toast({
          title: "Success",
          description: `Product ${editing ? 'updated' : 'created'} successfully`,
        });
        setOpen(false);
        loadProducts();
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${editing ? 'update' : 'create'} product`,
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
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    const result = await deleteProduct(id);
    if (result.success) {
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      loadProducts();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="page-container animate-fade-in">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your product catalog with tiered pricing</p>
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
                  <TableHead>SKU</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Tax %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      {product.description && (
                        <div className="text-sm text-muted-foreground">{product.description}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{product.sku || '-'}</TableCell>
                    <TableCell className="font-medium">
                      {getCurrencySymbol(systemCurrency)}{product.unit_price.toFixed(2)}
                      {product.currency !== systemCurrency && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({getCurrencySymbol(product.currency)}{(product.unit_price / (currencyMap[product.currency] || 1)).toFixed(2)} {product.currency})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{product.tax_percent}%</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(product.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-foreground" 
                          onClick={() => handleOpen(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive" 
                          onClick={() => handleDelete(product.id)}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input 
                id="name"
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })}               placeholder="e.g. API Access" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                placeholder="Product description..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select 
                value={form.currency} 
                onValueChange={(value) => handlePriceChange(form.entered_price, value)}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {availableCurrencies.map((curr) => (
                    <SelectItem key={curr.currency_code} value={curr.currency_code}>
                      {getCurrencySymbol(curr.currency_code)} {curr.currency_code} - {curr.currency_name}
                      {!curr.is_system_currency && ` (1 ${curr.currency_code} = ${getCurrencySymbol(systemCurrency)}${curr.roe_rate.toFixed(2)})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select the currency for entering the price
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price in {form.currency} *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {getCurrencySymbol(form.currency)}
                  </span>
                  <Input 
                    id="price"
                    type="number" 
                    step="0.01"
                    value={form.entered_price} 
                    onChange={(e) => handlePriceChange(e.target.value, form.currency)} 
                    placeholder="29.99"
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="converted">System Price ({systemCurrency})</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {getCurrencySymbol(systemCurrency)}
                  </span>
                  <Input 
                    id="converted"
                    type="text" 
                    value={form.unit_price || '0.00'} 
                    disabled
                    className="pl-8 bg-muted"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Auto-converted to {systemCurrency}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax">Tax %</Label>
                <Input 
                  id="tax"
                  type="number" 
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.tax_percent} 
                  onChange={(e) => setForm({ ...form, tax_percent: e.target.value })} 
                  placeholder="18" 
                />
              </div>
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
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
