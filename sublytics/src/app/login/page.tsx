"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { signInWithPassword } from "@/lib/actions/auth";
import { checkUserProfileStatus } from "@/lib/actions/profile";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthBackground, AuthBranding } from "@/components/AuthBackground";
import { Lock, Mail, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [processingMagicLink, setProcessingMagicLink] = useState(false);

  // Handle magic link authentication via auth state change
  useEffect(() => {
    const supabase = createClient();
    
    // Check if there's a hash fragment (magic link)
    const hashFragment = window.location.hash;
    console.log('🔍 Hash fragment detected:', hashFragment ? 'YES' : 'NO');
    console.log('🔍 Full hash:', hashFragment);
    
    if (hashFragment && hashFragment.includes('access_token')) {
      console.log('✅ Magic link detected, setting loading states');
      setProcessingMagicLink(true);
      setLoading(true);
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth event:', event);
      console.log('🔔 Session exists:', !!session);
      console.log('🔔 User ID:', session?.user?.id);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ SIGNED_IN event received');
        try {
          // Use server action with admin client to check profile
          console.log('📞 Calling checkUserProfileStatus...');
          const result = await checkUserProfileStatus();
          console.log('📊 Profile result:', result);
          
          if (result.error) {
            console.error('❌ Error fetching profile:', result.error);
            toast.error('Failed to load user profile.');
            setLoading(false);
            setProcessingMagicLink(false);
            return;
          }
          
          // Clear the hash before redirecting
          if (window.location.hash) {
            console.log('🧹 Clearing hash from URL');
            window.history.replaceState(null, '', window.location.pathname);
          }
          
          const { requiresPasswordChange, emailVerified } = result.data!;
          console.log('👤 Profile status:', { requiresPasswordChange, emailVerified });
          
          if (requiresPasswordChange || !emailVerified) {
            console.log('🔐 Redirecting to /set-password');
            toast.success('Welcome! Please set your password.');
            router.push('/set-password');
          } else {
            console.log('📊 Redirecting to /dashboard');
            toast.success('Login successful!');
            router.push('/dashboard');
          }
          router.refresh();
        } catch (error) {
          console.error('❌ Error processing auth:', error);
          toast.error('An error occurred. Please try again.');
          setLoading(false);
          setProcessingMagicLink(false);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 SIGNED_OUT event received');
        setLoading(false);
        setProcessingMagicLink(false);
      } else if (event === 'INITIAL_SESSION') {
        console.log('🏁 INITIAL_SESSION event received');
        if (session) {
          console.log('⚠️ Session exists on initial load, this might be a returning user');
        }
      } else {
        console.log('ℹ️ Other auth event:', event);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signInWithPassword(email, password);

      if (result.success) {
        toast.success("Login successful!");
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error(result.error || "Login failed");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-background">
      <AuthBackground />

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[400px] relative z-10">
        <AuthBranding />

        {processingMagicLink ? (
          <Card className="border border-border/50 shadow-2xl shadow-black/5 dark:shadow-black/30 backdrop-blur-md bg-card/80 animate-fade-in-up-delay">
            <CardContent className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Authenticating...</h3>
              <p className="text-sm text-muted-foreground">Please wait while we sign you in</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-border/50 shadow-2xl shadow-black/5 dark:shadow-black/30 backdrop-blur-md bg-card/80 animate-fade-in-up-delay">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">Welcome back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="you@company.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="pl-9 h-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
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
              <Button type="submit" className="w-full h-10 font-medium gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {searchParams.get('error') === 'account_disabled' && (
              <p className="text-sm text-destructive text-center bg-destructive/10 rounded-md p-2">
                Your account has been disabled. Please contact support.
              </p>
            )}

            {searchParams.get('error') === 'invalid_link' && (
              <p className="text-sm text-destructive text-center bg-destructive/10 rounded-md p-2">
                Invalid or expired link. Please try again.
              </p>
            )}

            <Separator />

            <p className="text-center text-xs text-muted-foreground">
              Secure access to your subscription management dashboard
            </p>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
