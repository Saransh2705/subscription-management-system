'use client';

import { useState } from 'react';
import { Copy, Eye, EyeOff, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { updateSystemSettings } from '@/lib/actions/settings';
import type { SystemSettings } from '@/lib/types/settings';

interface SettingsPageClientProps {
  initialSettings: SystemSettings;
}

export function SettingsPageClient({ initialSettings }: SettingsPageClientProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  
  // Mock API keys (these would come from company_api_keys table)
  const companyId = 'comp_a1b2c3d4e5f6';
  const companySecret = 'sk_live_9x8y7z6w5v4u3t2s1r0';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleSaveCompanySettings = async () => {
    try {
      setSaving(true);
      await updateSystemSettings({
        company_name: settings.company_name,
        company_email: settings.company_email,
        company_phone: settings.company_phone,
        company_address: settings.company_address,
        company_city: settings.company_city,
        company_country: settings.company_country,
        system_currency_code: settings.system_currency_code,
        tax_id: settings.tax_id,
      });
      toast.success('Company settings saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInvoiceSettings = async () => {
    try {
      setSaving(true);
      await updateSystemSettings({
        invoice_footer_text: settings.invoice_footer_text,
        invoice_notes: settings.invoice_notes,
      });
      toast.success('Invoice settings saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="invoice">Invoice Template</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card className="border border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Company Settings</CardTitle>
              <CardDescription>Update your company information and system currency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={settings.company_name}
                    onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={settings.company_email}
                    onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={settings.company_phone || ''}
                    onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tax ID</Label>
                  <Input
                    value={settings.tax_id || ''}
                    onChange={(e) => setSettings({ ...settings, tax_id: e.target.value })}
                    placeholder="e.g., 12-3456789"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Address</Label>
                  <Textarea
                    value={settings.company_address || ''}
                    onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={settings.company_city || ''}
                    onChange={(e) => setSettings({ ...settings, company_city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={settings.company_country || ''}
                    onChange={(e) => setSettings({ ...settings, company_country: e.target.value })}
                    placeholder="e.g., US, GB, IN"
                  />
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-2">
                <Label>System Currency Code</Label>
                <div className="flex gap-2">
                  <Input
                    value={settings.system_currency_code}
                    onChange={(e) => setSettings({ ...settings, system_currency_code: e.target.value.toUpperCase() })}
                    maxLength={3}
                    className="max-w-[200px] font-mono font-semibold text-lg"
                  />
                  <div className="flex-1">
                    <div className="bg-muted/50 rounded-lg p-3 border">
                      <p className="text-sm text-muted-foreground">
                        <strong>Important:</strong> All amounts in the database are stored in this currency. 
                        Use <strong>ROE Management</strong> to define exchange rates for other currencies.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveCompanySettings} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoice">
          <Card className="border border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Invoice Template</CardTitle>
              <CardDescription>Customize how your invoices look</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Footer Text</Label>
                <Input
                  value={settings.invoice_footer_text || ''}
                  onChange={(e) => setSettings({ ...settings, invoice_footer_text: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={settings.invoice_notes || ''}
                  onChange={(e) => setSettings({ ...settings, invoice_notes: e.target.value })}
                  rows={3}
                />
              </div>
              <Separator />
              <div className="bg-secondary/30 rounded-xl p-6 border border-border/50">
                <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider font-medium">
                  Preview
                </p>
                <div className="bg-card rounded-lg p-6 shadow-sm border border-border/30 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">{settings.company_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {settings.company_address}
                        {settings.company_city && `, ${settings.company_city}`}
                      </p>
                    </div>
                    <p className="font-mono text-sm text-muted-foreground">INV-001</p>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span>Pro API Access × 1</span>
                    <span>{settings.system_currency_code} 99.00</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{settings.system_currency_code} 99.00</span>
                  </div>
                  <Separator />
                  <p className="text-xs text-muted-foreground italic">
                    {settings.invoice_footer_text || 'Thank you for your business!'}
                  </p>
                  {settings.invoice_notes && (
                    <p className="text-xs text-muted-foreground">{settings.invoice_notes}</p>
                  )}
                </div>
              </div>
              <Button onClick={handleSaveInvoiceSettings} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card className="border border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage your API credentials for the V1 API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Company ID</Label>
                <div className="flex gap-2">
                  <Input value={companyId} readOnly className="font-mono" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(companyId, 'Company ID')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Company Secret</Label>
                <div className="flex gap-2">
                  <Input
                    type={showSecret ? 'text' : 'password'}
                    value={companySecret}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(companySecret, 'Company Secret')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Keep your secret secure. Do not share it publicly.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
