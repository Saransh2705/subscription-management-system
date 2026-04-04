"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "@/components/ui/sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const payload = await response.json();

    if (!response.ok) {
      toast.error(payload.error || "Unable to send recovery link");
      setLoading(false);
      return;
    }

    toast.success("Recovery magic link sent");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass-card p-8 rounded-2xl w-full max-w-md glow-border-purple">
        <h1 className="text-2xl font-bold mb-2">Forgot Password</h1>
        <p className="text-muted-foreground mb-8">Enter your account email to receive a reset magic link.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            required
            className="dark-input w-full"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button disabled={loading} className="glow-button-secondary w-full py-3 rounded-xl disabled:opacity-50">
            {loading ? "Sending..." : "Send Recovery Link"}
          </button>
        </form>

        <div className="mt-6 text-sm text-muted-foreground">
          <Link href="/login" className="hover:text-foreground transition-colors">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
