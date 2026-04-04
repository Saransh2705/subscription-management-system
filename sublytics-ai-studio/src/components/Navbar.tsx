import Link from "next/link";
import { Zap } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center glow-button p-0">
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-xl font-bold gradient-text">Sublytics</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Home</Link>
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Pricing</Link>
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Features</a>
        </div>
        <Link href="/dashboard" className="glow-button text-sm py-2 px-4 rounded-lg">
          Get Started
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
