import { Brain, Workflow, BarChart3, Users, Code, Puzzle } from "lucide-react";

const features = [
  { icon: Brain, title: "AI Content Generation", desc: "Generate high-quality content with advanced AI models in seconds." },
  { icon: Workflow, title: "Automation Workflows", desc: "Build powerful automated pipelines that run 24/7 for your business." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Track performance with real-time analytics and actionable insights." },
  { icon: Users, title: "Team Collaboration", desc: "Work seamlessly with your team with role-based access controls." },
  { icon: Code, title: "API Access", desc: "Full REST & GraphQL API access for custom integrations." },
  { icon: Puzzle, title: "Custom Integrations", desc: "Connect with 200+ tools and platforms effortlessly." },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to <span className="gradient-text">Scale</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Powerful tools designed for modern teams and ambitious businesses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="glass-card p-6 rounded-xl group hover:glow-border transition-all duration-500 cursor-pointer"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
