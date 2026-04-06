import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Check, X, ArrowRight, ShieldCheck, DollarSign, Users,
  Zap, FileText, BarChart3, Mail, MessageSquare, Phone,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const comparisonRows = [
  { feature: "Free to start, no upfront cost", us: true, them: false },
  { feature: "Vetted college student creators", us: true, them: false },
  { feature: "Escrow payments with guaranteed refund", us: true, them: false },
  { feature: "Creator goes live or money back", us: true, them: false },
  { feature: "Software-powered with low fees", us: true, them: false },
  { feature: "End-to-end campaign management", us: true, them: "Partial" },
  { feature: "Direct messaging with creators", us: true, them: "Partial" },
  { feature: "Real-time analytics dashboard", us: true, them: "Partial" },
  { feature: "No monthly subscription", us: true, them: false },
];

const Pricing = () => {
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from("contact_messages" as never).insert({
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        message: contactForm.message.trim(),
      } as never);
      if (error) throw error;
      setContactForm({ name: "", email: "", message: "" });
      toast({ title: "Message sent!", description: "We'll get back to you within 24 hours." });
    } catch {
      toast({ title: "Failed to send", description: "Please email us directly at support@gmv.live", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ═══════════════════════════════════════════
          HERO — Left copy + Right pricing cards
      ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-[126px] sm:pt-[142px] lg:pt-[142px] pb-16 sm:pb-20 lg:pb-24">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(349,98%,56%,0.06),transparent_50%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Left — copy */}
            <div>
              <div className="inline-flex items-center gap-3 mb-6 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20">
                  <DollarSign className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider">Zero platform fees</p>
              </div>

              <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl leading-[1.05]">
                We only win
                <br />
                <span className="text-primary">when you win.</span>
              </h1>

              <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
                No subscriptions. No upfront costs. Just a small success fee
                when a campaign actually delivers results.
              </p>

              <div className="mt-7 flex flex-wrap gap-4">
                <Button size="lg" className="rounded-full px-8 text-base font-bold shadow-lg shadow-primary/20 h-12" asChild>
                  <Link to="/auth">Get Started Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 self-center">
                  Talk to sales <ArrowRight className="h-3 w-3" />
                </a>
              </div>

              <div className="mt-8 flex flex-col gap-2.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> No credit card required</span>
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Cancel anytime</span>
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Money-back guarantee</span>
              </div>
            </div>

            {/* Right — pricing cards */}
            <div className="space-y-4">
              {/* For Brands — highlighted, on top */}
              <div className="rounded-2xl border-2 border-primary bg-card p-6 relative">
                <Badge className="absolute -top-3 right-6 bg-primary text-primary-foreground text-xs px-3 py-1">Most Popular</Badge>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">For Brands</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-black text-foreground">$0</span>
                  <span className="text-muted-foreground text-sm">to start</span>
                </div>
                <p className="text-sm text-muted-foreground mb-5">Small commission on successful bookings.</p>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {[
                    "Browse all creators free",
                    "Deal rooms & messaging",
                    "Offer negotiation",
                    "E-signed contracts",
                    "Escrow payments",
                    "Stream analytics",
                    "Shipment tracking",
                    "Money-back guarantee",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full rounded-full h-11 font-semibold" asChild>
                  <Link to="/auth">Start a Campaign <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
                </Button>
              </div>

              {/* Creator + Enterprise side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5 flex flex-col">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">For Creators</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-2xl font-black text-foreground">$0</span>
                    <span className="text-muted-foreground text-xs">/forever</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">Keep 100% of earnings.</p>
                  <div className="space-y-2 flex-1">
                    {["Free profile", "Get discovered", "E-signed contracts", "Keep all commissions", "Venmo / PayPal / Zelle"].map((item) => (
                      <div key={item} className="flex items-start gap-1.5 text-xs">
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-5 rounded-full h-9 text-xs" variant="outline" asChild>
                    <Link to="/auth">Join as Creator</Link>
                  </Button>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 flex flex-col">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Enterprise</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-2xl font-black text-foreground">Custom</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">Volume + dedicated support.</p>
                  <div className="space-y-2 flex-1">
                    {["Everything in Brand", "Account manager", "Multi-host campaigns", "Volume discounts", "Custom reporting"].map((item) => (
                      <div key={item} className="flex items-start gap-1.5 text-xs">
                        <Check className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                        <span className="text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-5 rounded-full h-9 text-xs" variant="outline" asChild>
                    <a href="#contact">Contact Sales</a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          VALUE PROPS
      ═══════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">What you get</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              More than just a marketplace
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: DollarSign, title: "Pay Per Campaign", desc: "Small commission on each booking. No subscriptions, no hidden fees, no cost until a campaign runs." },
              { icon: ShieldCheck, title: "Escrow Protection", desc: "Payment held in escrow. If the creator doesn't deliver, you get your money back. Guaranteed." },
              { icon: Users, title: "Vetted Creators", desc: "Every creator on GMV.live is verified with live-shopping experience. No guesswork." },
              { icon: FileText, title: "E-Signed Contracts", desc: "Generate and sign contracts in-app. Terms are locked before any payment happens." },
              { icon: BarChart3, title: "Real-Time Analytics", desc: "Track viewers, GMV, orders, and conversion rate as the stream happens." },
              { icon: Zap, title: "Instant Setup", desc: "No onboarding calls. Sign up, browse creators, and send your first offer in minutes." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6 sm:p-8 hover:border-primary/20 transition-colors">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          COMPARISON TABLE
      ═══════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Comparison</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              GMV.live vs. Agencies
            </h2>
            <p className="mt-4 text-muted-foreground">
              See why brands choose us over traditional influencer agencies.
            </p>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[480px] sm:min-w-0 overflow-hidden rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="p-4 text-left font-medium text-muted-foreground">Feature</th>
                    <th className="p-4 text-center font-bold text-primary">GMV.live</th>
                    <th className="p-4 text-center font-medium text-muted-foreground">Agencies</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-secondary/10 transition-colors">
                      <td className="p-4 text-foreground">{row.feature}</td>
                      <td className="p-4 text-center">
                        {row.us === true ? (
                          <div className="flex items-center justify-center">
                            <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            </div>
                          </div>
                        ) : (
                          <X className="mx-auto h-4 w-4 text-destructive" />
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {row.them === true ? (
                          <Check className="mx-auto h-4 w-4 text-emerald-400" />
                        ) : row.them === "Partial" ? (
                          <span className="text-xs font-medium text-amber-400">Partial</span>
                        ) : (
                          <div className="flex items-center justify-center">
                            <div className="h-6 w-6 rounded-full bg-destructive/10 flex items-center justify-center">
                              <X className="h-3.5 w-3.5 text-destructive" />
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA
      ═══════════════════════════════════════════ */}
      <section className="py-28 sm:py-36">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Ready to go live?
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Join hundreds of brands and creators already on GMV.live. It's free to start.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="rounded-full px-8 text-base font-bold shadow-lg shadow-primary/20 h-12" asChild>
              <Link to="/auth">Get Started Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CONTACT US
      ═══════════════════════════════════════════ */}
      <section id="contact" className="py-24 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Left — info */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Get in touch</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Have questions? We'd love to help.
              </h2>
              <p className="mt-5 text-muted-foreground leading-relaxed">
                Whether you're a brand exploring live commerce for the first time
                or a creator with questions about getting started — reach out.
                We usually respond within a few hours.
              </p>

              <div className="mt-10 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Email</p>
                    <a href="mailto:support@gmv.live" className="text-sm text-primary hover:underline">support@gmv.live</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Live Chat</p>
                    <p className="text-sm text-muted-foreground">Available Mon-Fri, 9am-6pm PST</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Response Time</p>
                    <p className="text-sm text-muted-foreground">Usually within 2-4 hours</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — form */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h3 className="text-lg font-bold text-foreground mb-6">Send us a message</h3>
              <form onSubmit={handleContact} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="contact-name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</Label>
                  <Input
                    id="contact-name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your name"
                    className="h-11 bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="you@company.com"
                    className="h-11 bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-message" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Message</Label>
                  <Textarea
                    id="contact-message"
                    value={contactForm.message}
                    onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Tell us what you need help with..."
                    rows={4}
                    className="bg-secondary/50 border-border/50 resize-none"
                  />
                </div>
                <Button type="submit" disabled={sending} className="w-full h-11 rounded-full font-semibold">
                  {sending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════ */}
      <footer className="border-t border-border py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-2">
                <img src="/images/gmv-logo-mark.svg" alt="GMV.live" className="h-7 w-7" />
                <span className="text-lg font-bold">GMV<span className="font-normal text-muted-foreground">.live</span></span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">The live commerce marketplace.</p>
              <p className="mt-1 text-sm text-muted-foreground">support@gmv.live</p>
            </div>
            <div className="space-y-2.5 text-sm text-muted-foreground">
              <Link to="/for-brands" className="block hover:text-foreground transition-colors">For Brands</Link>
              <Link to="/" className="block hover:text-foreground transition-colors">For Creators</Link>
              <Link to="/pricing" className="block hover:text-foreground transition-colors">Pricing</Link>
              <Link to="/blog" className="block hover:text-foreground transition-colors">Blog</Link>
            </div>
            <div className="space-y-2.5 text-sm text-muted-foreground">
              <Link to="/coming-soon" className="block hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/coming-soon" className="block hover:text-foreground transition-colors">Terms of Use</Link>
            </div>
          </div>
          <p className="mt-10 text-xs text-muted-foreground">&copy; {new Date().getFullYear()} GMV.live. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
