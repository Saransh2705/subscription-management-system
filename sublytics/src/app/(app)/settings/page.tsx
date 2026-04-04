"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { Copy, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function SettingsPage() {
  const [showSecret, setShowSecret] = useState(false);
  const companyId = "comp_a1b2c3d4e5f6";
  const companySecret = "sk_live_9x8y7z6w5v4u3t2s1r0";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
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
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card className="border border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Company Settings</CardTitle>
              <CardDescription>Update your company information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input defaultValue="Sublytics Inc." />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue="hello@sublytics.io" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Address</Label>
                  <Textarea defaultValue="123 SaaS Street, San Francisco, CA 94107" rows={2} />
                </div>
              </div>
              <Button>Save Changes</Button>
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
                <Input defaultValue="Thank you for your business!" />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea defaultValue="Payment is due within 30 days. Late payments may incur a 1.5% monthly fee." rows={3} />
              </div>
              <Separator />
              <div className="bg-secondary/30 rounded-xl p-6 border border-border/50">
                <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider font-medium">Preview</p>
                <div className="bg-card rounded-lg p-6 shadow-sm border border-border/30 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">Sublytics Inc.</p>
                      <p className="text-xs text-muted-foreground">123 SaaS Street, San Francisco</p>
                    </div>
                    <p className="font-mono text-sm text-muted-foreground">INV-001</p>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span>Pro API Access × 1</span>
                    <span>$99.00</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-sm">
                    <span>Total</span>
                    <span>$108.90</span>
                  </div>
                  <p className="text-xs text-muted-foreground italic pt-2">Thank you for your business!</p>
                </div>
              </div>
              <Button>Save Template</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card className="border border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>Configure email delivery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sender Email</Label>
                <Input defaultValue="invoices@sublytics.io" />
              </div>
              <div className="space-y-2">
                <Label>Email API Key (Resend)</Label>
                <Input type="password" defaultValue="re_xxxxxxxxxxxx" />
              </div>
              <Button>Save Email Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card className="border border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>API Settings</CardTitle>
              <CardDescription>Your API credentials for integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Company ID</Label>
                <div className="flex gap-2">
                  <Input value={companyId} readOnly className="font-mono text-sm bg-secondary/30" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(companyId, "Company ID")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">Company Secret</Label>
                <div className="flex gap-2">
                  <Input
                    type={showSecret ? "text" : "password"}
                    value={companySecret}
                    readOnly
                    className="font-mono text-sm bg-secondary/30"
                  />
                  <Button variant="outline" size="icon" onClick={() => setShowSecret(!showSecret)}>
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(companySecret, "Secret")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button variant="outline" className="gap-2" onClick={() => toast.success("Secret regenerated!")}>
                <RefreshCw className="h-4 w-4" /> Regenerate Secret
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
