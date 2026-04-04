"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { plans } from "@/components/PricingCards";

export default function CheckoutPageClient({ planId }: { planId: string }) {
  const router = useRouter();
  const plan = plans.find((item) => item.id === planId) || plans[0];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!name || !email) return;
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 800));
    await new Promise((resolve) => setTimeout(resolve, 600));

    const invoiceId = `INV-${Date.now().toString(36).toUpperCase()}`;
    const query = new URLSearchParams({
      planId: plan.id,
      customerName: name,
      customerEmail: email,
    });

    router.push(`/invoice/${invoiceId}?${query.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center">
            Complete Your <span className="gradient-text">Subscription</span>
          </h1>
          <p className="text-muted-foreground text-center mb-12">You&apos;re subscribing to the {plan.name} plan.</p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass-card p-8 rounded-2xl glow-border">
              <h2 className="text-xl font-bold mb-1">{plan.name} Plan</h2>
              <div className="mb-6">
                <span className="text-4xl font-black gradient-text-primary">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" /> {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-8 rounded-2xl">
              <h2 className="text-xl font-bold mb-6">Your Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Full Name</label>
                  <input
                    className="dark-input w-full"
                    placeholder="John Doe"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Email Address</label>
                  <input
                    type="email"
                    className="dark-input w-full"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              <button
                onClick={handleSubscribe}
                disabled={loading || !name || !email}
                className="glow-button w-full mt-8 flex items-center justify-center gap-2 py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="animate-spin w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
                ) : (
                  <>
                    Subscribe & Continue <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
