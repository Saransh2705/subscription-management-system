"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { plans } from "@/components/PricingCards";

export default function PaymentPageClient({ invoiceId, planId }: { invoiceId: string; planId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const plan = plans.find((item) => item.id === planId) || { name: "Pro", price: "₹499" };

  const handlePayment = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const params = new URLSearchParams({ planId: planId || "pro", invoiceId });
    router.push(`/success?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-md">
          <div className="glass-card p-8 rounded-2xl glow-border-purple text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 glow-button-secondary">
              <Shield className="w-7 h-7" />
            </div>

            <h1 className="text-2xl font-bold mb-2">Confirm Payment</h1>
            <p className="text-muted-foreground text-sm mb-8">
              {plan.name} Plan - <span className="gradient-text-primary font-bold">{plan.price}</span>
            </p>

            <div className="glass-card p-4 rounded-lg mb-8">
              <p className="text-xs text-muted-foreground mb-1">Invoice</p>
              <p className="font-mono text-sm">{invoiceId}</p>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className="glow-button w-full py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-spin w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
              ) : (
                "Confirm Payment"
              )}
            </button>

            <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" /> Secured by Sublytics
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
