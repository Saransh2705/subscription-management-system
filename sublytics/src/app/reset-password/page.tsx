"use client";

import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { updatePassword } from "@/lib/actions/password";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthBackground, AuthBranding } from "@/components/AuthBackground";
import { Eye, EyeOff, Lock, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const required = searchParams.get('required') === 'true';
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordChecks = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "Contains a number", valid: /\d/.test(password) },
    { label: "Contains uppercase", valid: /[A-Z]/.test(password) },
    { label: "Passwords match", valid: password.length > 0 && password === confirmPassword },
  ];

  const allValid = passwordChecks.every(c => c.valid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const result = await updatePassword(password);

      if (result.success) {
        toast.success("Password updated successfully!");
        router.push("/dashboard");
      } else {
        toast.error(result.error || "Failed to reset password");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-border/50 shadow-2xl shadow-black/5 dark:shadow-black/30 backdrop-blur-md bg-card/80 animate-fade-in-up-delay">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-2 inline-flex items-center justify-center w-11 h-11 rounded-full bg-primary/10">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-xl">
          {required ? "Set your password" : "Reset password"}
        </CardTitle>
        <CardDescription>
          {required 
            ? "Create a secure password for your account" 
            : "Choose a new secure password below"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="pl-9 pr-10 h-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="pl-9 pr-10 h-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Password strength checks */}
          {password.length > 0 && (
            <div className="space-y-1.5 p-3 rounded-lg bg-muted/50 border border-border/50">
              {passwordChecks.map((check, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${
                    check.valid 
                      ? 'text-green-500 dark:text-green-400' 
                      : 'text-muted-foreground/40'
                  }`} />
                  <span className={check.valid 
                    ? 'text-foreground' 
                    : 'text-muted-foreground'
                  }>
                    {check.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Button type="submit" className="w-full h-10 font-medium gap-2" disabled={loading || !allValid}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-background">
      <AuthBackground />
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[400px] relative z-10">
        <AuthBranding />
        <Suspense fallback={
          <Card className="border border-border/50 shadow-2xl shadow-black/5 dark:shadow-black/30 backdrop-blur-md bg-card/80">
            <CardContent className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            </CardContent>
          </Card>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
