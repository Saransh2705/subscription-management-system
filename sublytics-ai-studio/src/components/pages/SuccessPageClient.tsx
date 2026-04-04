import Link from "next/link";
import { CheckCircle, PartyPopper } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { plans } from "@/components/PricingCards";

export default function SuccessPageClient({
  planId,
  invoiceId,
}: {
  planId?: string;
  invoiceId?: string;
}) {
  const plan = plans.find((item) => item.id === planId) || { name: "Pro" };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 min-h-[80vh] flex items-center">
        <div className="container mx-auto px-4 max-w-md text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full" />
            <div className="relative glass-card p-10 rounded-2xl glow-border">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-primary/10 animate-glow-pulse">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>

              <div className="flex items-center justify-center gap-2 mb-4">
                <PartyPopper className="w-5 h-5 text-primary" />
                <h1 className="text-3xl font-bold">Subscription Activated</h1>
              </div>

              <p className="text-muted-foreground mb-8">
                Your <span className="text-primary font-semibold">{plan.name}</span> plan is now active. Welcome aboard!
              </p>

              {invoiceId && (
                <div className="glass-card p-4 rounded-lg mb-8">
                  <p className="text-xs text-muted-foreground mb-1">Invoice ID</p>
                  <p className="font-mono text-sm">{invoiceId}</p>
                </div>
              )}

              <Link href="/" className="glow-button inline-flex items-center gap-2 px-8 py-4 rounded-xl">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
