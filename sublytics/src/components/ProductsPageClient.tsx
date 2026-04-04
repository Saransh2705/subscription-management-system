"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
  Power,
  DollarSign,
  Percent,
  Tag,
  MoreHorizontal,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
} from "@/lib/actions/products";
import {
  getAvailableCurrencies,
  getSystemSettings,
  convertToSystemCurrency,
} from "@/lib/actions/settings";
import type { Product } from "@/lib/types/product";
import type { UserProfile } from "@/lib/types/auth";
import type { AvailableCurrency, SystemSettings } from "@/lib/types/settings";

interface ProductFormData {
  name: string;
  description: string;
  sku: string;
  unit_price: string;
  tax_percent: string;
  currency: string;
}

const initialFormState: ProductFormData = {
  name: "",
  description: "",
  sku: "",
  unit_price: "",
  tax_percent: "0",
  currency: "USD",
};

const SKU_CATEGORIES: Record<string, { label: string; color: string; icon: string }> = {
  TXT: { label: "Text & Language", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: "📝" },
  SUM: { label: "Text & Language", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: "📝" },
  TRN: { label: "Text & Language", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: "📝" },
  SNT: { label: "Text & Language", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: "📝" },
  CHT: { label: "Text & Language", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: "📝" },
  IMG: { label: "Image & Vision", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: "🖼️" },
  UPS: { label: "Image & Vision", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: "🖼️" },
  OBJ: { label: "Image & Vision", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: "🖼️" },
  BGR: { label: "Image & Vision", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: "🖼️" },
  OCR: { label: "Image & Vision", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: "🖼️" },
  STT: { label: "Audio & Speech", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: "🎙️" },
  TTS: { label: "Audio & Speech", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: "🎙️" },
  MUS: { label: "Audio & Speech", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: "🎙️" },
  VCL: { label: "Audio & Speech", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: "🎙️" },
  ANR: { label: "Audio & Speech", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: "🎙️" },
  VED: { label: "Video & Media", color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400", icon: "🎬" },
  DFD: { label: "Video & Media", color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400", icon: "🎬" },
  SUB: { label: "Video & Media", color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400", icon: "🎬" },
  PAN: { label: "Data & Analytics", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: "📊" },
  DCL: { label: "Data & Analytics", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: "📊" },
  ANM: { label: "Data & Analytics", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: "📊" },
  REC: { label: "Data & Analytics", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: "📊" },
  COD: { label: "Code & Dev", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400", icon: "💻" },
  TST: { label: "Code & Dev", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400", icon: "💻" },
  DOC: { label: "Code & Dev", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400", icon: "💻" },
  EML: { label: "Specialized", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: "⚡" },
  HRS: { label: "Specialized", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: "⚡" },
  LGL: { label: "Specialized", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: "⚡" },
};

const CATEGORY_FILTERS = [
  { value: "all", label: "All Categories" },
  { value: "Text & Language", label: "Text & Language" },
  { value: "Image & Vision", label: "Image & Vision" },
  { value: "Audio & Speech", label: "Audio & Speech" },
  { value: "Video & Media", label: "Video & Media" },
  { value: "Data & Analytics", label: "Data & Analytics" },
  { value: "Code & Dev", label: "Code & Dev" },
  { value: "Specialized", label: "Specialized" },
];

function getCategory(sku: string | null) {
  if (!sku) return { label: "Uncategorized", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400", icon: "📦" };
  const parts = sku.split("-");
  if (parts.length >= 2) {
    const cat = SKU_CATEGORIES[parts[1]];
    if (cat) return cat;
  }
  return { label: "Uncategorized", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400", icon: "📦" };
}

function canEditProducts(role: string) {
  return ["SYSTEM_ADMIN", "ADMIN", "MANAGER", "STAFF"].includes(role);
}

interface ProductsPageClientProps {
  userRole: string;
}

export default function ProductsPageClient({ userRole }: ProductsPageClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(initialFormState);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"name" | "price" | "date">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [availableCurrencies, setAvailableCurrencies] = useState<AvailableCurrency[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [convertedPrice, setConvertedPrice] = useState<number | null>(null);
  const { toast } = useToast();

  const hasEditAccess = canEditProducts(userRole);

  useEffect(() => {
    loadProducts();
    loadCurrencies();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const result = await getProducts();
    if (result.success && result.data) {
      setProducts(result.data);
    } else {
      toast({ title: "Error", description: result.error || "Failed to load products", variant: "destructive" });
    }
    setLoading(false);
  };

  const loadCurrencies = async () => {
    try {
      const [currencies, settings] = await Promise.all([
        getAvailableCurrencies(),
        getSystemSettings(),
      ]);
      setAvailableCurrencies(currencies);
      setSystemSettings(settings);
    } catch (error) {
      console.error('Error loading currencies:', error);
    }
  };

  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    // Category
    if (categoryFilter !== "all") {
      list = list.filter((p) => getCategory(p.sku).label === categoryFilter);
    }

    // Status
    if (statusFilter !== "all") {
      list = list.filter((p) => (statusFilter === "active" ? p.is_active : !p.is_active));
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "price") cmp = a.unit_price - b.unit_price;
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [products, search, categoryFilter, statusFilter, sortBy, sortDir]);

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.is_active).length;
    const avgPrice = total > 0 ? products.reduce((sum, p) => sum + p.unit_price, 0) / total : 0;
    const avgTax = total > 0 ? products.reduce((sum, p) => sum + p.tax_percent, 0) / total : 0;
    return { total, active, avgPrice, avgTax };
  }, [products]);

  // Calculate converted price when currency or unit_price changes
  useEffect(() => {
    const calculateConversion = async () => {
      if (!form.unit_price || !form.currency || !systemSettings) {
        setConvertedPrice(null);
        return;
      }

      const price = parseFloat(form.unit_price);
      if (isNaN(price) || price <= 0) {
        setConvertedPrice(null);
        return;
      }

      try {
        if (form.currency === systemSettings.system_currency_code) {
          setConvertedPrice(price);
        } else {
          const converted = await convertToSystemCurrency(price, form.currency);
          setConvertedPrice(converted);
        }
      } catch (error) {
        console.error('Error converting currency:', error);
        setConvertedPrice(null);
      }
    };

    calculateConversion();
  }, [form.unit_price, form.currency, systemSettings]);

  const handleOpen = (product?: Product) => {
    if (product) {
      setEditing(product);
      setForm({
        name: product.name,
        description: product.description || "",
        sku: product.sku || "",
        unit_price: product.unit_price.toString(),
        tax_percent: product.tax_percent.toString(),
        currency: product.currency, // Product currency is already in system currency
      });
    } else {
      setEditing(null);
      setForm({
        ...initialFormState,
        currency: systemSettings?.system_currency_code || 'USD', // Default to system currency
      });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.unit_price) {
      toast({ title: "Validation Error", description: "Name and price are required", variant: "destructive" });
      return;
    }

    if (!systemSettings) {
      toast({ title: "Error", description: "System settings not loaded", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const enteredPrice = parseFloat(form.unit_price);
      
      // Convert price to system currency
      let priceInSystemCurrency = enteredPrice;
      if (form.currency !== systemSettings.system_currency_code) {
        priceInSystemCurrency = await convertToSystemCurrency(enteredPrice, form.currency);
      }

      const productData = {
        name: form.name,
        description: form.description || undefined,
        sku: form.sku || undefined,
        unit_price: priceInSystemCurrency, // Store in system currency
        tax_percent: parseFloat(form.tax_percent) || 0,
        currency: systemSettings.system_currency_code, // Always store system currency
      };

      const result = editing
        ? await updateProduct(editing.id, productData)
        : await createProduct(productData);

      if (result.success) {
        toast({ 
          title: "Success", 
          description: form.currency !== systemSettings.system_currency_code
            ? `Product ${editing ? "updated" : "created"} successfully. Price converted from ${form.currency} ${enteredPrice.toFixed(2)} to ${systemSettings.system_currency_code} ${priceInSystemCurrency.toFixed(2)}`
            : `Product ${editing ? "updated" : "created"} successfully`
        });
        setOpen(false);
        loadProducts();
      } else {
        toast({ title: "Error", description: result.error || "Failed to save product", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "An unexpected error occurred", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = (product: Product) => {
    setDeleteTarget(product);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteProduct(deleteTarget.id);
    if (result.success) {
      toast({ title: "Success", description: "Product deleted successfully" });
      loadProducts();
    } else {
      toast({ title: "Error", description: result.error || "Failed to delete product", variant: "destructive" });
    }
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const handleToggleStatus = async (product: Product) => {
    const result = await toggleProductStatus(product.id, !product.is_active);
    if (result.success) {
      toast({ title: "Success", description: `Product ${product.is_active ? "deactivated" : "activated"} successfully` });
      loadProducts();
    } else {
      toast({ title: "Error", description: result.error || "Failed to update status", variant: "destructive" });
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);

  if (loading) {
    return (
      <div className="page-container animate-fade-in">
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="page-container animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="page-title">AI Products</h1>
            </div>
            <p className="page-subtitle mt-1">
              Manage your AI Studio product catalog &middot; {stats.total} products
            </p>
          </div>
          {hasEditAccess && (
            <Button onClick={() => handleOpen()} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-border/50 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Products</p>
                <p className="text-xl font-semibold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/50 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-500/10">
                <Power className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active</p>
                <p className="text-xl font-semibold">{stats.active}<span className="text-sm text-muted-foreground font-normal ml-1">/ {stats.total}</span></p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/50 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Avg. Price</p>
                <p className="text-xl font-semibold">${stats.avgPrice.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/50 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10">
                <Percent className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Avg. Tax</p>
                <p className="text-xl font-semibold">{stats.avgTax.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name, description, or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_FILTERS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setSortBy("name"); setSortDir("asc"); }}>Name (A-Z)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("name"); setSortDir("desc"); }}>Name (Z-A)</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { setSortBy("price"); setSortDir("asc"); }}>Price (Low-High)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("price"); setSortDir("desc"); }}>Price (High-Low)</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { setSortBy("date"); setSortDir("desc"); }}>Newest First</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("date"); setSortDir("asc"); }}>Oldest First</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex border rounded-md">
                  <Button
                    variant={view === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    className="rounded-r-none h-9 w-9"
                    onClick={() => setView("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={view === "table" ? "secondary" : "ghost"}
                    size="icon"
                    className="rounded-l-none h-9 w-9"
                    onClick={() => setView("table")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            {(search || categoryFilter !== "all" || statusFilter !== "all") && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <span className="text-xs text-muted-foreground">
                  {filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => { setSearch(""); setCategoryFilter("all"); setStatusFilter("all"); }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content */}
        {filteredProducts.length === 0 ? (
          products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No products yet"
              description="Create your first AI product to get started."
              action={
                hasEditAccess ? (
                  <Button onClick={() => handleOpen()} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Product
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No matching products"
              description="Try adjusting your search or filters."
              action={
                <Button
                  variant="outline"
                  onClick={() => { setSearch(""); setCategoryFilter("all"); setStatusFilter("all"); }}
                >
                  Clear Filters
                </Button>
              }
            />
          )
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              const cat = getCategory(product.sku);
              return (
                <Card
                  key={product.id}
                  className={`border border-border/50 shadow-sm hover:shadow-md transition-all group ${
                    !product.is_active ? "opacity-60" : ""
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="text-2xl shrink-0 mt-0.5">{cat.icon}</div>
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">{product.name}</CardTitle>
                          {product.description && (
                            <CardDescription className="mt-1 line-clamp-2 text-xs">
                              {product.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      {hasEditAccess && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpen(product)}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(product)}>
                              {product.is_active ? (
                                <><EyeOff className="h-4 w-4 mr-2" /> Deactivate</>
                              ) : (
                                <><Eye className="h-4 w-4 mr-2" /> Activate</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteConfirm(product)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-medium ${cat.color}`}>
                        {cat.label}
                      </Badge>
                      {product.sku && (
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-mono text-muted-foreground">
                          {product.sku}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0.5 font-medium ${
                          product.is_active
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Price</p>
                        <p className="text-sm font-semibold">{formatPrice(product.unit_price, product.currency)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Tax</p>
                        <p className="text-sm font-semibold">{product.tax_percent}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Final</p>
                        <p className="text-sm font-semibold text-primary">
                          {formatPrice(product.unit_price * (1 + product.tax_percent / 100), product.currency)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border border-border/50 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Tax %</TableHead>
                    <TableHead className="text-right">Final Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    {hasEditAccess && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const cat = getCategory(product.sku);
                    return (
                      <TableRow
                        key={product.id}
                        className={`hover:bg-muted/30 transition-colors ${!product.is_active ? "opacity-60" : ""}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{cat.icon}</span>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              {product.description && (
                                <div className="text-xs text-muted-foreground truncate max-w-[250px]">
                                  {product.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-medium ${cat.color}`}>
                            {cat.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {product.sku || "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(product.unit_price, product.currency)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{product.tax_percent}%</TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatPrice(product.unit_price * (1 + product.tax_percent / 100), product.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-medium ${
                              product.is_active
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {product.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">{formatDate(product.created_at)}</TableCell>
                        {hasEditAccess && (
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpen(product)}>
                                  <Pencil className="h-4 w-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(product)}>
                                  {product.is_active ? (
                                    <><EyeOff className="h-4 w-4 mr-2" /> Deactivate</>
                                  ) : (
                                    <><Eye className="h-4 w-4 mr-2" /> Activate</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDeleteConfirm(product)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Product" : "Add New Product"}</DialogTitle>
              <DialogDescription>
                {editing ? "Update product details below." : "Fill in the details to create a new AI product."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. AI Text Generator"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What does this AI product do?"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="e.g. AI-TXT-001"
                />
                <p className="text-[11px] text-muted-foreground">
                  Use format AI-XXX-NNN for auto-categorization (e.g. AI-IMG-006)
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Base Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={form.unit_price}
                    onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                    placeholder="49.00"
                  />
                </div>
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
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCurrencies.map((curr) => (
                        <SelectItem key={curr.currency_code} value={curr.currency_code}>
                          {curr.currency_code} - {curr.currency_name}
                          {curr.is_system_currency && ' (System)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {systemSettings && (
                    <p className="text-xs text-muted-foreground">
                      Prices stored in {systemSettings.system_currency_code}
                    </p>
                  )}
                </div>
              </div>
              {form.unit_price && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Price ({form.currency})</span>
                    <span>{formatPrice(parseFloat(form.unit_price) || 0, form.currency)}</span>
                  </div>
                  {systemSettings && form.currency !== systemSettings.system_currency_code && convertedPrice !== null && (
                    <>
                      <div className="flex justify-between text-primary">
                        <span className="text-muted-foreground">→ Converted to {systemSettings.system_currency_code}</span>
                        <span className="font-semibold">{formatPrice(convertedPrice, systemSettings.system_currency_code)}</span>
                      </div>
                      <Separator />
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax ({form.tax_percent || 0}%)</span>
                    <span>{formatPrice((parseFloat(form.unit_price) || 0) * (parseFloat(form.tax_percent) || 0) / 100, form.currency)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Final Price ({form.currency})</span>
                    <span className="text-primary">
                      {formatPrice(
                        (parseFloat(form.unit_price) || 0) * (1 + (parseFloat(form.tax_percent) || 0) / 100),
                        form.currency
                      )}
                    </span>
                  </div>
                  {systemSettings && form.currency !== systemSettings.system_currency_code && convertedPrice !== null && (
                    <div className="flex justify-between font-semibold text-primary pt-1">
                      <span>Stored as ({systemSettings.system_currency_code})</span>
                      <span>
                        {formatPrice(
                          convertedPrice * (1 + (parseFloat(form.tax_percent) || 0) / 100),
                          systemSettings.system_currency_code
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}
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
                ) : editing ? (
                  "Update Product"
                ) : (
                  "Create Product"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Product</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
