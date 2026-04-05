import Link from "next/link";
import { Check, Star } from "lucide-react";
import { getPlans, type Plan } from "@/lib/get-plans";

async function PricingCards() {
  const plans = await getPlans();

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
          {plans.map((plan, index) => {
            const isHighlighted = index === 1; // Highlight the middle plan
            const finalPrice = plan.pricing.final_price;
            const hasDiscount = plan.pricing.discount_percentage > 0;
            
            return (
              <div
                key={plan.id}
                className={`glass-card p-8 rounded-2xl relative transition-all duration-500 hover:-translate-y-2 ${
                  isHighlighted ? "glow-border scale-105 md:scale-110" : "hover:glow-border"
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 glow-button text-xs py-1.5 px-4 rounded-full">
                    <Star className="w-3 h-3" /> Most Popular
                  </div>
                )}

                {hasDiscount && (
                  <div className="absolute top-4 right-4 bg-primary/20 text-primary text-xs font-bold py-1 px-2 rounded-full">
                    {plan.pricing.discount_percentage}% OFF
                  </div>
                )}

                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-black gradient-text-primary">
                    ₹{finalPrice > 0 ? finalPrice.toFixed(0) : 'Custom'}
                  </span>
                  {finalPrice > 0 && (
                    <span className="text-muted-foreground text-sm">/month</span>
                  )}
                </div>

                {plan.trial_days > 0 && (
                  <div className="mb-4 text-xs text-primary font-medium">
                    🎁 {plan.trial_days} days free trial
                  </div>
                )}

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                  {plan.products.slice(0, 3).map((product) => (
                    <li key={product.sku} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {product.name}
                    </li>
                  ))}
                  {plan.product_count > 3 && (
                    <li className="text-xs text-muted-foreground ml-6">
                      + {plan.product_count - 3} more products
                    </li>
                  )}
                </ul>

                <Link
                  href={finalPrice === 0 ? "/pricing" : `/checkout/${plan.id}`}
                  className={`block text-center py-3 rounded-xl font-semibold transition-all duration-300 ${
                    isHighlighted
                      ? "glow-button"
                      : "glass-card hover:bg-muted/50 text-foreground"
                  }`}
                >
                  {finalPrice === 0 ? 'Contact Sales' : 'Get Started'}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingCards;

// Export type for other components
export type { Plan };
