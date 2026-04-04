"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { toast } from "sonner";
import { sendPasswordResetEmail } from "@/lib/actions/password";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Mail, ArrowLeft, CheckCircle2, Loader2, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await sendPasswordResetEmail(email);

      if (result.success) {
        toast.success("Password reset link sent! Check your email.");
        setSent(true);
      } else {
        toast.error(result.error || "Failed to send reset link");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 p-4 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="w-full max-w-[400px] relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-lg shadow-primary/25 mb-4">
              <span className="text-primary-foreground font-bold text-2xl">S</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Sublytics</h1>
            <p className="text-muted-foreground text-sm mt-1">Subscription management, simplified</p>
          </div>

          <Card className="border border-border/50 shadow-xl shadow-black/5 dark:shadow-black/20 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-2 inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-xl">Check your email</CardTitle>
              <CardDescription className="mt-1">
                We&apos;ve sent a password reset link to <span className="font-medium text-foreground">{email}</span>. Click the link to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/login">
                <Button className="w-full h-10 font-medium gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground text-center">
                Didn&apos;t receive an email? Check your spam folder or{" "}
                <button 
                  onClick={() => setSent(false)} 
                  className="text-primary hover:underline"
                >
                  try again
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-[400px] relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-lg shadow-primary/25 mb-4">
            <span className="text-primary-foreground font-bold text-2xl">S</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Sublytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Subscription management, simplified</p>
        </div>

        <Card className="border border-border/50 shadow-xl shadow-black/5 dark:shadow-black/20 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-2 inline-flex items-center justify-center w-11 h-11 rounded-full bg-primary/10">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xl">Forgot password?</CardTitle>
            <CardDescription>No worries, we&apos;ll send you a reset link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-sm font-medium">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="reset-email"
                    type="email" 
                    placeholder="you@company.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 h-10"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-10 font-medium gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
            <div className="text-center">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
              </div>
              <Button type="submit" className="w-full font-medium" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              <div className="text-center">
                <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" />
                  Back to login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
