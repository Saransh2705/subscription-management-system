import { Zap } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border py-12">
    <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-primary" />
        <span className="font-bold gradient-text">Sublytics</span>
      </div>
      <p className="text-muted-foreground text-sm">© 2026 Sublytics. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
