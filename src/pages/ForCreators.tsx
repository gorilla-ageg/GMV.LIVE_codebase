import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LiveVideoCard from "@/components/LiveVideoCard";
import {
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  DollarSign,
  Shield,
  Globe,
  TrendingUp,
  Users,
  ShoppingBag,
  Zap,
  Video,
  Star,
  Mic,
  Play,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "What is a Live Shopping Host?", a: "A live shopping host sells products in real-time on platforms like TikTok Shop, Amazon Live, or Instagram Live. You demo products, engage your audience, and earn commission on every sale plus a flat rate per stream." },
  { q: "Do I need experience?", a: "No! Many of our top hosts started with zero experience. If you're comfortable on camera and can engage an audience, you have what it takes. We'll help you get set up." },
  { q: "How much can I earn?", a: "Hosts earn $200-$1,000+ per stream as a flat fee, plus 10-25% commission on all sales. Top performers earn $5,000+ per week across multiple streams." },
  { q: "Does GMV.live take a cut?", a: "No. We charge brands a platform fee. Your commission and flat rate stay 100% yours." },
  { q: "How do payments work?", a: "After your stream, the brand approves deliverables and payment is sent directly to your Venmo, PayPal, or Zelle. No invoicing needed." },
];

const ForCreators = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ═══════════════════════════════════════════
          SECTION 1: HERO — Big statement + live video
      ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-28 pb-0 sm:pt-36 lg:pt-44">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/5" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/6 rounded-full blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 text-xs font-semibold uppercase tracking-widest border-primary/30 text-primary px-4 py-1.5">
              <Video className="h-3 w-3 mr-1.5" /> For Creators
            </Badge>

            <h1 className="text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Go live.{" "}
              <span className="text-primary">Get paid.</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground leading-relaxed sm:text-xl max-w-xl mx-auto">
              Brands are looking for live-shopping hosts right now.
              Stream products you love, build your audience, earn real money.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="rounded-full px-8 text-base font-bold shadow-lg shadow-primary/20 h-12" asChild>
                <Link to="/auth">Start Hosting <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 text-base h-12" asChild>
                <Link to="/for-brands">I'm a Brand <ChevronRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Live stream video strip — shows real streams */}
        <div className="relative mt-32 sm:mt-40 lg:mt-48 pb-24 sm:pb-32">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
              This is live shopping
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { video: "/videos/creator-1.mp4", poster: "/images/thumbs/creator-1.png", label: "Beauty haul stream", sublabel: "$4.8K GMV earned" },
                { video: "/videos/creator-2.mp4", poster: "/images/thumbs/creator-2.png", label: "Tech review stream", sublabel: "$3.2K GMV earned" },
                { video: "/videos/creator-3.mp4", poster: "/images/thumbs/creator-3.png", label: "Fashion try-on", sublabel: "$5.1K GMV earned" },
                { video: "/videos/creator-4.mp4", poster: "/images/thumbs/creator-4.png", label: "Skincare demo", sublabel: "$2.9K GMV earned" },
                { video: "/videos/creator-5.mp4", poster: "/images/thumbs/creator-5.png", label: "Product unboxing", sublabel: "$6.3K GMV earned" },
              ].map((stream, i) => (
                <div key={i} className={`${i >= 2 && i < 3 ? "hidden sm:block" : ""} ${i >= 3 ? "hidden lg:block" : ""}`}>
                  <LiveVideoCard {...stream} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 2: TRUST BAR
      ═══════════════════════════════════════════ */}
      <section className="mt-20 sm:mt-28 border-y border-border/30 bg-card/20 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> No experience needed</span>
            <span className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-emerald-400" /> Commission + flat fee</span>
            <span className="flex items-center gap-2"><Globe className="h-4 w-4 text-emerald-400" /> Work from anywhere</span>
            <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-emerald-400" /> Secure payments</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 3: THE OPPORTUNITY — Market stats
      ═══════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 sm:mb-20">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">The opportunity</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Live shopping is <span className="text-primary">exploding</span>
            </h2>
            <p className="mt-5 text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
              The biggest shift in e-commerce since social media. Early movers are earning life-changing money.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { value: "$600B+", label: "Global live shopping market by 2027", icon: ShoppingBag },
              { value: "10x", label: "Higher conversion than traditional e-com", icon: TrendingUp },
              { value: "500+", label: "New creator millionaires every month", icon: Users },
              { value: "20%", label: "Of all e-commerce will be live by 2027", icon: Zap },
            ].map((stat) => (
              <div key={stat.value} className="rounded-2xl border border-border bg-card p-6 sm:p-8 text-center hover:border-primary/20 transition-colors">
                <stat.icon className="mx-auto h-6 w-6 text-primary/60 mb-4" />
                <p className="text-3xl font-black text-primary sm:text-4xl lg:text-5xl">{stat.value}</p>
                <p className="mt-3 text-sm text-muted-foreground leading-snug">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 4: HOW IT WORKS — Step by step
      ═══════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 lg:py-40 relative overflow-hidden bg-card/30">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 sm:mb-20">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">How it works</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Four steps to your first stream
            </h2>
            <p className="mt-5 text-lg text-muted-foreground max-w-md mx-auto">
              Sign up, get matched, go live, get paid. It really is that simple.
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                step: "01", icon: Mic, title: "Build your profile",
                desc: "Showcase your niche, past streams, and selling style. Brands browse creators like you every day.",
                color: "text-primary bg-primary/10",
                preview: (
                  <div className="mt-5 rounded-xl border border-border bg-secondary/30 p-4 flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Your Creator Profile</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Beauty + Tech | 12K followers | 4.9 rating</p>
                      <div className="flex gap-1.5 mt-2">
                        <Badge variant="secondary" className="text-[10px]">TikTok</Badge>
                        <Badge variant="secondary" className="text-[10px]">Instagram</Badge>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                step: "02", icon: Users, title: "Get matched with brands",
                desc: "Brands reach out with product offers. Chat, negotiate rates, and agree on terms — all inside GMV.live.",
                color: "text-blue-400 bg-blue-500/10",
                preview: (
                  <div className="mt-5 rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-7 w-7 shrink-0 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400">S</div>
                      <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                        Hey! We'd love you to host a live stream for our new product line. $500 + 15% commission?
                      </div>
                    </div>
                    <div className="flex items-start justify-end gap-3">
                      <div className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
                        Sounds great! Let's do it
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                step: "03", icon: Play, title: "Go live & sell",
                desc: "Stream on TikTok, Instagram, or YouTube. Demo products, engage your audience, and drive sales in real-time.",
                color: "text-emerald-400 bg-emerald-500/10",
                preview: (
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {[
                      { video: "/videos/creator-6.mp4", poster: "/images/thumbs/creator-6.png", label: "Live now" },
                      { video: "/videos/creator-7.mp4", poster: "/images/thumbs/creator-7.png", label: "Live now" },
                      { video: "/videos/creator-8.mp4", poster: "/images/thumbs/video-05.png", label: "Live now" },
                    ].map((v, i) => (
                      <LiveVideoCard key={i} {...v} />
                    ))}
                  </div>
                ),
              },
              {
                step: "04", icon: DollarSign, title: "Get paid instantly",
                desc: "Brand approves your stream, payment hits your account. No invoicing, no chasing. We handle everything.",
                color: "text-amber-400 bg-amber-500/10",
                preview: (
                  <div className="mt-5 flex flex-col items-center rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
                    <p className="text-sm text-muted-foreground">Stream approved</p>
                    <p className="mt-2 text-4xl font-black text-emerald-400">+ $1,240</p>
                    <p className="mt-1 text-xs text-muted-foreground">Sent to Venmo @you</p>
                  </div>
                ),
              },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl border border-border bg-card p-6 sm:p-8 hover:border-primary/20 transition-colors">
                <div className="flex gap-5">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${s.color}`}>
                    <s.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-mono font-bold text-muted-foreground mb-1">STEP {s.step}</p>
                    <h3 className="text-lg font-bold sm:text-xl">{s.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed sm:text-base">{s.desc}</p>
                  </div>
                </div>
                {s.preview}
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Button size="lg" className="rounded-full px-8 text-base font-bold h-12" asChild>
              <Link to="/auth">Create Your Profile <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 5: EARNINGS — What you can make
      ═══════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Real earnings</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Creators earn <span className="text-primary">$500 – $5,000</span> per stream
              </h2>
              <p className="mt-5 text-muted-foreground leading-relaxed text-lg">
                Commission on every sale plus a guaranteed flat rate. The more you sell, the more you earn. No ceiling.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  "15-25% commission on all live sales",
                  "$200-$1,000 flat fee per stream",
                  "Bonuses for top-performing streams",
                  "Weekly payouts via Venmo, PayPal, or Zelle",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock earnings dashboard */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This week</span>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-xs">+23% vs last week</Badge>
              </div>
              <p className="text-5xl font-black text-foreground">$2,847</p>
              <div className="space-y-3">
                {[
                  { brand: "Sephora", product: "Rare Beauty Blush Launch", amount: "$1,240", status: "Paid" },
                  { brand: "Crocs", product: "Spring Collection Stream", amount: "$890", status: "Paid" },
                  { brand: "Samsung", product: "Galaxy Buds Demo", amount: "$717", status: "Pending" },
                ].map((deal) => (
                  <div key={deal.brand} className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{deal.brand}</p>
                      <p className="text-xs text-muted-foreground">{deal.product}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{deal.amount}</p>
                      <p className={`text-[10px] font-medium ${deal.status === "Paid" ? "text-emerald-400" : "text-amber-400"}`}>{deal.status}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
                <Star className="h-3 w-3 text-amber-400" />
                <span>4.9 avg rating across 12 streams this month</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 6: BRAND TRUST
      ═══════════════════════════════════════════ */}
      <section className="py-16 border-y border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground mb-8">Brands already using live shopping</p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14">
            {["adidas", "crocs", "sephora", "walmart", "samsung"].map((b) => (
              <img key={b} src={`/images/brands/${b}.png`} alt={b} className="h-8 w-auto object-contain brightness-0 invert opacity-30 hover:opacity-60 transition-opacity sm:h-10" />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 7: FAQ
      ═══════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">FAQ</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Common questions</h2>
          </div>
          <Accordion type="single" collapsible>
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-border">
                <AccordionTrigger className="text-left text-base font-medium py-5">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base pb-6 leading-relaxed">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 8: FINAL CTA
      ═══════════════════════════════════════════ */}
      <section className="relative py-28 sm:py-36 lg:py-44 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/8 rounded-full blur-[140px]" />

        <div className="relative mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Ready to go live?
          </h2>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            Join hundreds of creators already earning on GMV.live. Your first brand deal could be days away.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="rounded-full px-8 text-base font-bold shadow-lg shadow-primary/20 h-12" asChild>
              <Link to="/auth">Join GMV.live — It's Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          <Link to="/for-brands" className="inline-flex items-center mt-5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Are you a brand? <ChevronRight className="ml-1 h-3 w-3" />
          </Link>
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

export default ForCreators;
