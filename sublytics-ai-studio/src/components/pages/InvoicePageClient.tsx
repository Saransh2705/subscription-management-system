"use client";

import { useRouter } from "next/navigation";
import { CreditCard, FileText } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { plans } from "@/components/PricingCards";

export default function InvoicePageClient({
  invoiceId,
  planId,
  customerName,
}: {
  invoiceId: string;
  planId?: string;
  customerName?: string;
}) {
  const router = useRouter();
  const plan = plans.find((item) => item.id === planId) || { name: "Pro", price: "₹499", period: "/month", features: [] };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="glass-card p-8 md:p-10 rounded-2xl glow-border">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center glow-button-secondary p-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Invoice</h1>
                <p className="text-sm text-muted-foreground">{invoiceId}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Customer</p>
                  <p className="font-medium">{customerName || "Customer"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Plan</p>
                  <p className="font-medium">{plan.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Date</p>
                  <p className="font-medium">{new Date().toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                    Pending
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-muted-foreground text-sm">{plan.name} Plan ({plan.period ? "Monthly" : "Custom"})</span>
                  <span className="font-medium">{plan.price}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-muted-foreground text-sm">Tax</span>
                  <span className="font-medium">₹0</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between items-center">
                  <span className="font-bold text-lg">Total</span>
                  <span className="text-2xl font-black gradient-text-primary">{plan.price}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push(`/payment/${invoiceId}?planId=${planId || "pro"}`)}
              className="glow-button w-full mt-8 flex items-center justify-center gap-2 py-4 rounded-xl"
            >
              <CreditCard className="w-4 h-4" /> Pay Now
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
