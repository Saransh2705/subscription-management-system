import Link from "next/link";
import { Check, Star } from "lucide-react";

export const plans = [
  {
    id: "basic",
    name: "Basic",
    price: "₹199",
    period: "/month",
    desc: "Perfect for getting started",
    features: ["Limited AI generation", "5 projects", "Email support", "Basic analytics", "Community access"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹499",
    period: "/month",
    desc: "Best for growing teams",
    features: ["Unlimited AI generation", "Automation workflows", "Analytics dashboard", "Priority support", "50 projects", "Team collaboration"],
    cta: "Get Started",
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For large-scale operations",
    features: ["Custom workflows", "Full API access", "Dedicated support", "Custom integrations", "Unlimited everything", "SLA guarantee"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const PricingCards = () => {
  return (
    <section id="pricing" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-muted-foreground text-lg">Choose the plan that fits your needs. Cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`glass-card p-8 rounded-2xl relative transition-all duration-500 hover:-translate-y-2 ${
                plan.highlighted ? "glow-border scale-105 md:scale-110" : "hover:glow-border"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 glow-button text-xs py-1.5 px-4 rounded-full">
                  <Star className="w-3 h-3" /> Most Popular
                </div>
              )}

              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-muted-foreground text-sm mb-6">{plan.desc}</p>

              <div className="mb-6">
                <span className="text-4xl font-black gradient-text-primary">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.id === "enterprise" ? "/pricing" : "/dashboard"}
                className={`block text-center py-3 rounded-xl font-semibold transition-all duration-300 ${
                  plan.highlighted
                    ? "glow-button"
                    : "glass-card hover:bg-muted/50 text-foreground"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingCards;
