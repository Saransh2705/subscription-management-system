"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

const initialTemplates: EmailTemplate[] = [
  {
    id: "invoice",
    name: "Invoice Email",
    subject: "Invoice {{invoice_id}} from Sublytics",
    body: "Hi {{customer_name}},\n\nPlease find your invoice {{invoice_id}} attached.\n\nAmount due: {{amount}}\nDue date: {{due_date}}\n\nThank you for your business!",
  },
  {
    id: "payment",
    name: "Payment Confirmation",
    subject: "Payment Received - {{invoice_id}}",
    body: "Hi {{customer_name}},\n\nWe've received your payment of {{amount}} for invoice {{invoice_id}}.\n\nThank you!",
  },
  {
    id: "reminder",
    name: "Payment Reminder",
    subject: "Reminder: Invoice {{invoice_id}} is due",
    body: "Hi {{customer_name}},\n\nThis is a friendly reminder that invoice {{invoice_id}} for {{amount}} is due on {{due_date}}.\n\nPlease make your payment at your earliest convenience.",
  },
];

const variables = ["{{customer_name}}", "{{invoice_id}}", "{{amount}}", "{{due_date}}"];

export default function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(initialTemplates);
  const [selected, setSelected] = useState<string>("invoice");

  const current = templates.find((t) => t.id === selected)!;

  const updateTemplate = (field: "subject" | "body", value: string) => {
    setTemplates(templates.map((t) => (t.id === selected ? { ...t, [field]: value } : t)));
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Email Templates</h1>
          <p className="page-subtitle">Customize automated email notifications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                selected === t.id
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t.name}
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Card className="border border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>{current.name}</CardTitle>
              <CardDescription>
                Available variables:{" "}
                {variables.map((v) => (
                  <Badge key={v} variant="secondary" className="mr-1 font-mono text-xs">
                    {v}
                  </Badge>
                ))}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={current.subject} onChange={(e) => updateTemplate("subject", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea value={current.body} onChange={(e) => updateTemplate("body", e.target.value)} rows={8} className="font-mono text-sm" />
              </div>
              <Button onClick={() => toast.success("Template saved!")}>Save Template</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
