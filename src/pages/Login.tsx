import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Code, Video, ShoppingBag } from "lucide-react";

const DEMO_ACCOUNTS = {
  creator: { email: "creator1@demo.com", password: "demo1234", label: "Creator (Sarah Chen)" },
  brand: { email: "brand1@demo.com", password: "demo1234", label: "Brand (GlowUp Beauty)" },
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [devPassword, setDevPassword] = useState("");
  const [devUnlocked, setDevUnlocked] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate("/feed");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDevLogin = async (role: "creator" | "brand") => {
    const account = DEMO_ACCOUNTS[role];
    setSubmitting(true);
    try {
      await signIn(account.email, account.password);
      navigate("/feed");
    } catch (err: any) {
      toast({ title: "Demo login failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDevUnlock = () => {
    if (devPassword === "123") {
      setDevUnlocked(true);
    } else {
      toast({ title: "Wrong password", variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader className="text-center">
            <Link to="/" className="mb-2 text-xl font-bold text-foreground hover:text-primary transition-colors">GMB.live</Link>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/auth" className="text-primary hover:underline">Register</Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        {/* Dev Tool */}
        <Card className="border-dashed border-muted-foreground/30">
          {!devMode ? (
            <CardContent className="flex justify-center py-3">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1" onClick={() => setDevMode(true)}>
                <Code className="h-3 w-3" /> Dev Access
              </Button>
            </CardContent>
          ) : !devUnlocked ? (
            <CardContent className="space-y-3 pt-4">
              <p className="text-sm font-medium text-muted-foreground text-center">Enter dev password</p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={devPassword}
                  onChange={(e) => setDevPassword(e.target.value)}
                  placeholder="Password"
                  onKeyDown={(e) => e.key === "Enter" && handleDevUnlock()}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleDevUnlock}>Unlock</Button>
              </div>
            </CardContent>
          ) : (
            <CardContent className="space-y-3 pt-4">
              <p className="text-sm font-medium text-center text-muted-foreground">Quick login as…</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => handleDevLogin("creator")}
                  disabled={submitting}
                >
                  <Video className="h-5 w-5 text-primary" />
                  <span className="text-xs">Creator</span>
                  <span className="text-[10px] text-muted-foreground">Sarah Chen</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => handleDevLogin("brand")}
                  disabled={submitting}
                >
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <span className="text-xs">Brand</span>
                  <span className="text-[10px] text-muted-foreground">GlowUp Beauty</span>
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Login;
