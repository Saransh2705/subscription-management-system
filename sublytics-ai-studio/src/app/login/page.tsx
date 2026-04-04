"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "@/components/ui/sonner";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await loginAction(formData);

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    if (result.magicLinkSent) {
      toast.success("Magic link sent to your email");
      setLoading(false);
    }
    // If requirePasswordReset: true, the action redirects to /reset-password
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass-card p-8 rounded-2xl w-full max-w-md glow-border">
        <h1 className="text-2xl font-bold mb-2">Login</h1>
        <p className="text-muted-foreground mb-8">
          Enter your email and password, or use your work email for a magic
          link.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            required
            className="dark-input w-full"
            placeholder="you@company.com"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              className="dark-input w-full pr-12"
              placeholder="Password (optional for magic link)"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.64-1.35 1.53-2.6 2.63-3.7" />
                  <path d="M3 3l18 18" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          <button
            disabled={loading}
            className="glow-button w-full py-3 rounded-xl disabled:opacity-50"
          >
            {loading ? "Processing..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-sm text-muted-foreground flex justify-between">
          <Link
            href="/forgot-password"
            className="hover:text-foreground transition-colors"
          >
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
