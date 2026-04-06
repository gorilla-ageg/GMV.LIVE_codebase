import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, Sparkles, Shield, Zap } from "lucide-react";

const Auth = () => {
  const { user, role, onboardingCompleted, loading, signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<string>(searchParams.get("tab") === "login" ? "login" : "signup");

  useEffect(() => {
    if (loading || !user) return;
    if (!onboardingCompleted) {
      navigate("/onboarding/role", { replace: true });
    } else if (role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, onboardingCompleted, role, navigate]);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast({ title: "Name required", description: "Please enter your name.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await signUp(email.trim(), password, displayName.trim());
      toast({ title: "Check your email", description: "We sent you a verification link. Please confirm your email to continue." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Sign-up failed", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast({ title: "Missing fields", description: "Please enter your email and password.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Login failed", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src="/images/gmv-logo-mark.svg" alt="GMV.live" className="h-10 w-10" />
            <span className="text-2xl font-bold text-foreground">
              GMV<span className="font-normal text-muted-foreground">.live</span>
            </span>
          </Link>

          {/* Hero text */}
          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl font-bold leading-tight text-foreground">
              Where live commerce
              <span className="text-primary"> happens.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              The marketplace connecting brands with top live-shopping creators.
              Negotiate deals, sign contracts, and track performance — all in one place.
            </p>

            {/* Feature pills */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <span>Match with verified creators in minutes</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                  <Shield className="h-4 w-4 text-accent" />
                </div>
                <span>Secure escrow payments & e-signed contracts</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                </div>
                <span>Real-time stream analytics & GMV tracking</span>
              </div>
            </div>
          </div>

          {/* Social proof */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Trusted by creators at</p>
            <div className="flex items-center gap-4 opacity-50">
              {["cal", "ucla", "lsu", "miami"].map((school) => (
                <img key={school} src={`/images/logos/${school}.png`} alt={school} className="h-8 w-auto grayscale" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <Link to="/" className="mb-10 flex items-center gap-2 lg:hidden">
          <img src="/images/gmv-logo-mark.svg" alt="GMV.live" className="h-9 w-9" />
          <span className="text-2xl font-bold text-foreground">
            GMV<span className="font-normal text-muted-foreground">.live</span>
          </span>
        </Link>

        <div className="w-full max-w-sm space-y-8">
          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">
              {tab === "signup" ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {tab === "signup"
                ? "Start connecting with live-shopping creators"
                : "Sign in to your GMV.live account"}
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2 h-11">
              <TabsTrigger value="signup" className="text-sm">Sign Up</TabsTrigger>
              <TabsTrigger value="login" className="text-sm">Log In</TabsTrigger>
            </TabsList>

            <TabsContent value="signup">
              <form onSubmit={handleEmailSignUp} className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</Label>
                  <Input
                    id="signup-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your full name"
                    required
                    className="h-12 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 text-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="h-12 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 text-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
                    className="h-12 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 text-base"
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full h-12 text-base font-semibold gap-2">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Get Started</span><ArrowRight className="h-4 w-4" /></>}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="login">
              <form onSubmit={handleEmailSignIn} className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="h-12 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 text-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                    className="h-12 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 text-base"
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full h-12 text-base font-semibold gap-2">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Sign In</span><ArrowRight className="h-4 w-4" /></>}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link to="/coming-soon" className="text-primary hover:underline">Terms</Link>
            {" "}and{" "}
            <Link to="/coming-soon" className="text-primary hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
