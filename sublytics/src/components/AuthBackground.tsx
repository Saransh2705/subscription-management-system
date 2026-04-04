"use client";

import { Sparkles } from "lucide-react";

function StarDecoration({ className }: { className: string }) {
  return (
    <div className={className}>
      <Sparkles className="w-6 h-6 text-primary/40" />
    </div>
  );
}

export function AuthBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Corner radial fades */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[100px] animate-pulse-slow" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[100px] animate-pulse-slow-delay" />
      <div className="absolute -top-24 -right-24 w-[350px] h-[350px] bg-primary/5 rounded-full blur-[80px] animate-pulse-slow-delay" />
      <div className="absolute -bottom-24 -left-24 w-[350px] h-[350px] bg-primary/5 rounded-full blur-[80px] animate-pulse-slow" />

      {/* Center subtle glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[120px]" />

      {/* 4 decorative stars — uniformly placed: top, right, bottom, left */}
      <StarDecoration className="absolute top-[12%] left-1/2 -translate-x-1/2 animate-star-glow" />
      <StarDecoration className="absolute right-[10%] top-1/2 -translate-y-1/2 animate-star-glow-delay-1" />
      <StarDecoration className="absolute bottom-[12%] left-1/2 -translate-x-1/2 animate-star-glow-delay-2" />
      <StarDecoration className="absolute left-[10%] top-1/2 -translate-y-1/2 animate-star-glow-delay-3" />

      {/* Subtle vignette overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_70%)]" />
    </div>
  );
}

export function AuthBranding() {
  return (
    <div className="text-center mb-8 animate-fade-in-up">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-lg shadow-primary/25 mb-4 ring-4 ring-primary/10">
        <span className="text-primary-foreground font-bold text-2xl">S</span>
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Sublytics</h1>
      <p className="text-muted-foreground text-sm mt-1">Subscription management, simplified</p>
    </div>
  );
}
