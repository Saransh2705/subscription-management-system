import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-primary/20 blur-[100px] animate-blob" />
        <div className="absolute top-20 right-0 w-96 h-96 rounded-full bg-secondary/20 blur-[120px] animate-blob" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-accent/15 blur-[100px] animate-blob" style={{ animationDelay: "4s" }} />
      </div>

      <div className="container relative z-10 mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-8 animate-fade-up">
          <span className="w-2 h-2 rounded-full bg-primary animate-glow-pulse" />
          <span className="text-sm text-muted-foreground">Powered by Sublytics API</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          Create AI Content.
          <br />
          <span className="gradient-text">Automate Everything.</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          Sublytics-powered subscription platform for modern businesses. 
          Generate content, automate workflows, and scale infinitely.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <Link href="/dashboard" className="glow-button text-base flex items-center gap-2 px-8 py-4 rounded-xl">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#pricing" className="glass-card px-8 py-4 rounded-xl text-foreground font-semibold flex items-center gap-2 hover:bg-muted/50 transition-all duration-300">
            <Play className="w-4 h-4" /> View Pricing
          </a>
        </div>

        {/* Floating UI mockup */}
        <div className="mt-20 animate-fade-up" style={{ animationDelay: "0.5s" }}>
          <div className="glass-card max-w-4xl mx-auto p-1 rounded-2xl glow-border">
            <div className="bg-card rounded-xl p-6 md:p-8">
              <div className="grid grid-cols-3 gap-4">
                {["AI Generated", "Workflows Active", "Revenue"].map((label, i) => (
                  <div key={label} className="glass-card p-4 rounded-lg text-center">
                    <p className="text-2xl md:text-3xl font-bold gradient-text-primary">
                      {["12.4K", "847", "₹2.4L"][i]}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
