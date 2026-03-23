import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Code, Video, ShoppingBag, ArrowRight, CheckCircle2 } from "lucide-react";

const DEMO_ACCOUNTS = {
  creator: { email: "creator1@demo.com", password: "demo1234", label: "Creator (Sarah Chen)" },
  brand: { email: "brand1@demo.com", password: "demo1234", label: "Brand (GlowUp Beauty)" },
};

const Waitlist = () => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"creator" | "brand" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [devPassword, setDevPassword] = useState("");
  const [devUnlocked, setDevUnlocked] = useState(false);
  const [devSubmitting, setDevSubmitting] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      toast({ title: "Please select if you're a brand or creator", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("waitlist").insert({ email: email.trim().toLowerCase(), role });
      if (error) {
        if (error.code === "23505") {
          toast({ title: "You're already on the list!", description: "We'll be in touch soon." });
          setSubmitted(true);
        } else {
          throw error;
        }
      } else {
        setSubmitted(true);
      }
    } catch (err: any) {
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDevLogin = async (devRole: "creator" | "brand") => {
    const account = DEMO_ACCOUNTS[devRole];
    setDevSubmitting(true);
    try {
      await signIn(account.email, account.password);
      navigate("/feed");
    } catch (err: any) {
      toast({ title: "Demo login failed", description: err.message, variant: "destructive" });
    } finally {
      setDevSubmitting(false);
    }
  };

  const handleDevUnlock = () => {
    if (devPassword === "123") {
      setDevUnlocked(true);
    } else {
      toast({ title: "Wrong password", variant: "destructive" });
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md text-center border-border bg-card">
          <CardHeader>
            <Link to="/" className="mb-2 text-xl font-bold text-foreground hover:text-primary transition-colors">
              🤩 gmv.live
            </Link>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">You're on the list! 🎉</CardTitle>
            <CardDescription>
              We'll notify you at <span className="font-medium text-foreground">{email}</span> as soon as we launch.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="outline" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4">
        <Card className="border-border bg-card">
          <CardHeader className="text-center">
            <Link to="/" className="mb-2 text-xl font-bold text-foreground hover:text-primary transition-colors">
              🤩 gmv.live
            </Link>
            <CardTitle className="text-2xl">Join the Waitlist</CardTitle>
            <CardDescription>
              Be the first to know when we launch. Choose your path below — we'll notify you and you can start using the platform.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <Label>I am a…</Label>
                <p className="text-xs text-muted-foreground">Choose what happens next:</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("creator")}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-left transition-all ${
                      role === "creator"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <Video className={`h-6 w-6 shrink-0 ${role === "creator" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${role === "creator" ? "text-primary" : "text-foreground"}`}>
                      Creator / Host
                    </span>
                    <span className="text-xs text-muted-foreground text-center leading-snug">
                      Join the waitlist → get discovered by brands and receive live stream opportunities.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("brand")}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-left transition-all ${
                      role === "brand"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <ShoppingBag className={`h-6 w-6 shrink-0 ${role === "brand" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${role === "brand" ? "text-primary" : "text-foreground"}`}>
                      Brand
                    </span>
                    <span className="text-xs text-muted-foreground text-center leading-snug">
                      Join the waitlist → get early access to browse and message vetted live shopping hosts.
                    </span>
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="waitlist-email">Email</Label>
                <Input
                  id="waitlist-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full rounded-full" disabled={submitting}>
                {submitting ? "Joining…" : (
                  <>Join the Waitlist <ArrowRight className="ml-1 h-4 w-4" /></>
                )}
              </Button>
              <Link
                to="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to home
              </Link>
            </CardFooter>
          </form>
        </Card>

        {/* Dev Tool */}
        <Card className="border-dashed border-muted-foreground/30 bg-card">
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
                  disabled={devSubmitting}
                >
                  <Video className="h-5 w-5 text-primary" />
                  <span className="text-xs">Creator</span>
                  <span className="text-[10px] text-muted-foreground">Sarah Chen</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => handleDevLogin("brand")}
                  disabled={devSubmitting}
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

export default Waitlist;
