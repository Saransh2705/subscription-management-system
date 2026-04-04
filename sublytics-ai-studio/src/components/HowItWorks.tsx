import { Pencil, Cog, Rocket } from "lucide-react";

const steps = [
  { icon: Pencil, title: "Create Content", desc: "Use AI to generate stunning content in seconds." },
  { icon: Cog, title: "Automate Workflows", desc: "Set up automation rules and let them work for you." },
  { icon: Rocket, title: "Scale Your Business", desc: "Watch your productivity and revenue skyrocket." },
];

const HowItWorks = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-muted-foreground text-lg">Three simple steps to transform your workflow.</p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          {steps.map((step, i) => (
            <div key={step.title} className="flex items-center gap-8">
              <div className="glass-card p-8 rounded-2xl text-center max-w-xs group hover:glow-border-purple transition-all duration-500">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 glow-button-secondary">
                  <step.icon className="w-7 h-7" />
                </div>
                <div className="text-sm font-medium text-primary mb-2">Step {i + 1}</div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </div>
              {i < 2 && (
                <div className="hidden md:block text-muted-foreground/30 text-4xl font-light">→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
