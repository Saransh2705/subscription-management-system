"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const endpoints = [
  {
    method: "POST",
    path: "/api/subscription/create",
    description: "Create a new subscription for a customer",
    request: `{
  "customer_id": "cust_abc123",
  "plan_id": "plan_pro_monthly",
  "start_date": "2024-04-01"
}`,
    response: `{
  "id": "sub_xyz789",
  "status": "active",
  "customer_id": "cust_abc123",
  "plan_id": "plan_pro_monthly",
  "created_at": "2024-04-01T00:00:00Z"
}`,
  },
  {
    method: "GET",
    path: "/api/invoice/:id",
    description: "Retrieve invoice details by ID",
    request: null,
    response: `{
  "id": "inv_001",
  "customer": "Acme Corp",
  "amount": 99.00,
  "tax": 9.90,
  "status": "pending",
  "items": [
    { "name": "Pro API Access", "qty": 1, "price": 99.00 }
  ]
}`,
  },
  {
    method: "POST",
    path: "/api/payment/confirm",
    description: "Confirm a payment for an invoice",
    request: `{
  "invoice_id": "inv_001",
  "payment_method": "card",
  "transaction_id": "txn_abc123"
}`,
    response: `{
  "success": true,
  "invoice_id": "inv_001",
  "status": "paid",
  "paid_at": "2024-04-01T12:00:00Z"
}`,
  },
];

const methodColors: Record<string, string> = {
  GET: "bg-success/10 text-success border-success/20",
  POST: "bg-primary/10 text-primary border-primary/20",
  PUT: "bg-warning/10 text-warning border-warning/20",
  DELETE: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function ApiDocs() {
  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">API Documentation</h1>
          <p className="page-subtitle">Integrate Sublytics into your application</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>The Sublytics API is REST-based and uses JSON for all request and response bodies. All API requests must include your company secret for authentication.</p>
            <p>Base URL: <code className="bg-secondary px-2 py-0.5 rounded text-foreground font-mono text-xs">https://api.sublytics.io/v1</code></p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Include your API key in the Authorization header:</p>
            <pre className="bg-secondary/50 rounded-lg p-4 text-sm font-mono overflow-x-auto border border-border/30">
              <code>Authorization: Bearer &lt;company_secret&gt;</code>
            </pre>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Endpoints</h2>
          {endpoints.map((ep, i) => (
            <Card key={i} className="border border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={`font-mono text-xs ${methodColors[ep.method]}`}>
                    {ep.method}
                  </Badge>
                  <code className="font-mono text-sm">{ep.path}</code>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{ep.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {ep.request && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Request Body</p>
                    <pre className="bg-secondary/50 rounded-lg p-4 text-sm font-mono overflow-x-auto border border-border/30">
                      <code>{ep.request}</code>
                    </pre>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Response</p>
                  <pre className="bg-secondary/50 rounded-lg p-4 text-sm font-mono overflow-x-auto border border-border/30">
                    <code>{ep.response}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
