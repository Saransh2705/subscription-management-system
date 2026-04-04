'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  getAllCurrencyROE,
  getSystemSettings,
  createCurrencyROE,
  updateCurrencyROE,
  deleteCurrencyROE,
} from '@/lib/actions/settings';
import type { CurrencyROE, SystemSettings } from '@/lib/types/settings';
import { Badge } from '@/components/ui/badge';

export function ROEManagementClient() {
  const [currencies, setCurrencies] = useState<CurrencyROE[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<CurrencyROE | null>(null);
  const [formData, setFormData] = useState({
    currency_code: '',
    currency_name: '',
    roe_rate: '',
    is_active: true,
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [currenciesData, settingsData] = await Promise.all([
        getAllCurrencyROE(false),
        getSystemSettings(),
      ]);
      setCurrencies(currenciesData);
      setSystemSettings(settingsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load currency data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (currency?: CurrencyROE) => {
    if (currency) {
      setEditingCurrency(currency);
      setFormData({
        currency_code: currency.currency_code,
        currency_name: currency.currency_name,
        roe_rate: currency.roe_rate.toString(),
        is_active: currency.is_active,
        notes: currency.notes || '',
      });
    } else {
      setEditingCurrency(null);
      setFormData({
        currency_code: '',
        currency_name: '',
        roe_rate: '',
        is_active: true,
        notes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCurrency(null);
    setFormData({
      currency_code: '',
      currency_name: '',
      roe_rate: '',
      is_active: true,
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const roeRate = parseFloat(formData.roe_rate);
    if (isNaN(roeRate) || roeRate <= 0) {
      toast.error('ROE rate must be a positive number');
      return;
    }

    try {
      if (editingCurrency) {
        await updateCurrencyROE(editingCurrency.currency_code, {
          currency_name: formData.currency_name,
          roe_rate: roeRate,
          is_active: formData.is_active,
          notes: formData.notes || null,
        });
        toast.success('Currency updated successfully');
      } else {
        await createCurrencyROE({
          currency_code: formData.currency_code.toUpperCase(),
          currency_name: formData.currency_name,
          roe_rate: roeRate,
          is_active: formData.is_active,
          notes: formData.notes || null,
        });
        toast.success('Currency created successfully');
      }
      handleCloseDialog();
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save currency');
    }
  };

  const handleDelete = async (currencyCode: string, currencyName: string) => {
    if (!confirm(`Are you sure you want to delete ${currencyName} (${currencyCode})?`)) {
      return;
    }

    try {
      await deleteCurrencyROE(currencyCode);
      toast.success('Currency deleted successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete currency');
    }
  };

  if (loading) {
    return (
      <div className="page-container animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">ROE Management</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">ROE Management</h1>
          <p className="page-subtitle">Manage currency exchange rates</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Currency
        </Button>
      </div>

      {systemSettings && (
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <CardTitle>System Currency</CardTitle>
            </div>
            <CardDescription>
              All amounts are stored in the database in this currency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Badge variant="default" className="text-base px-4 py-2">
                {systemSettings.system_currency_code}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Foreign currency prices will be converted to {systemSettings.system_currency_code} using the ROE rates below
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Exchange Rates</CardTitle>
          <CardDescription>
            Define the conversion rate from each foreign currency to {systemSettings?.system_currency_code || 'USD'}
            <br />
            <span className="text-xs">Formula: 1 Foreign Currency = ROE Rate × {systemSettings?.system_currency_code || 'USD'}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currencies.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">No currency exchange rates defined yet</p>
              <Button onClick={() => handleOpenDialog()} className="mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add First Currency
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Currency Code</TableHead>
                  <TableHead>Currency Name</TableHead>
                  <TableHead className="text-right">ROE Rate</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currencies.map((currency) => (
                  <TableRow key={currency.id}>
                    <TableCell className="font-mono font-semibold">
                      {currency.currency_code}
                    </TableCell>
                    <TableCell>{currency.currency_name}</TableCell>
                    <TableCell className="text-right font-mono">
                      {currency.roe_rate.toFixed(6)}
                    </TableCell>
                    <TableCell className="text-center">
                      {currency.is_active ? (
                        <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {currency.notes || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(currency)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(currency.currency_code, currency.currency_name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingCurrency ? 'Edit Currency' : 'Add Currency'}</DialogTitle>
              <DialogDescription>
                {editingCurrency
                  ? 'Update the exchange rate and details'
                  : 'Add a new currency with its exchange rate'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="currency_code">
                  Currency Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="currency_code"
                  placeholder="e.g., EUR, GBP, JPY"
                  value={formData.currency_code}
                  onChange={(e) => setFormData({ ...formData, currency_code: e.target.value.toUpperCase() })}
                  disabled={!!editingCurrency}
                  maxLength={3}
                  required
                />
                <p className="text-xs text-muted-foreground">3-letter ISO currency code</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="currency_name">
                  Currency Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="currency_name"
                  placeholder="e.g., Euro, British Pound, Japanese Yen"
                  value={formData.currency_name}
                  onChange={(e) => setFormData({ ...formData, currency_name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="roe_rate">
                  ROE Rate <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="roe_rate"
                  type="number"
                  step="0.000001"
                  placeholder="e.g., 1.08 (1 EUR = 1.08 USD)"
                  value={formData.roe_rate}
                  onChange={(e) => setFormData({ ...formData, roe_rate: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  1 {formData.currency_code || 'FOREIGN'} = {formData.roe_rate || 'X'} {systemSettings?.system_currency_code || 'USD'}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional information about this currency"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Active Status
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable this currency for product pricing
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCurrency ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
