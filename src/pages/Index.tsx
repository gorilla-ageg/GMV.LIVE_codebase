import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LiveVideoCard from "@/components/LiveVideoCard";
import {
  Search,
  MessageSquare,
  BarChart3,
  Shield,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  DollarSign,
  Package,
  FileText,
  Video,
  TrendingUp,
  Eye,
  Zap,
  Play,
  Users,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "What is live shopping?", a: "Live shopping is real-time selling where a host demonstrates products via live video on platforms like TikTok Shop, Amazon Live, and Instagram Live. Audiences watch, ask questions, and buy — all in one session." },
  { q: "How do I find the right host?", a: "Browse our marketplace filtered by niche, platform, follower count, past GMV, and ratings. Review portfolios and reach out directly — no agencies needed." },
  { q: "What does it cost?", a: "GMV.live charges a small platform fee. Host rates vary and you negotiate directly. Most hosts charge a flat rate ($200-$1,000) plus commission (10-25%) on sales." },
  { q: "How are payments handled?", a: "After both parties sign the in-app contract, you pay the creator directly via Venmo, PayPal, or Zelle. Payment info is only shared after contract signing." },
  { q: "What ROI can I expect?", a: "Live shopping converts 5-15x better than static ads. Brands on GMV.live see 8-15% conversion rates and 3x higher AOV compared to traditional influencer campaigns." },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ═══════════════════════════════════════════
          SECTION 1: HERO — Dashboard preview + videos
      ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-28 pb-0 sm:pt-36 lg:pt-44">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/8" />
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-primary/6 rounded-full blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div>
              <Badge variant="outline" className="mb-6 text-xs font-semibold uppercase tracking-widest border-accent/30 text-accent px-4 py-1.5">
                <Package className="h-3 w-3 mr-1.5" /> For Brands
              </Badge>

              <h1 className="text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                Find creators who{" "}
                <span className="text-primary">sell live.</span>
              </h1>

              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-lg">
                Browse verified live-shopping hosts, negotiate deals, sign contracts, and track real-time performance — all from one dashboard.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" className="rounded-full px-8 text-base font-bold shadow-lg shadow-primary/20 h-12" asChild>
                  <Link to="/auth">Browse Creators <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-8 text-base h-12" asChild>
                  <Link to="/">I'm a Creator <ChevronRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Vetted creators</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> E-signed contracts</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Real-time analytics</span>
              </div>
            </div>

            {/* Right: Mock dashboard */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-2xl shadow-primary/5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-red-500/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <div className="h-3 w-3 rounded-full bg-green-500/60" />
                <span className="ml-2 text-[10px] text-muted-foreground font-mono">gmv.live/dashboard</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "Active Deals", value: "12", icon: MessageSquare, color: "text-primary" },
                  { label: "Total GMV", value: "$48K", icon: DollarSign, color: "text-emerald-400" },
                  { label: "Avg Conv.", value: "8.2%", icon: TrendingUp, color: "text-accent" },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl bg-secondary/50 p-3 text-center">
                    <m.icon className={`h-4 w-4 mx-auto mb-1 ${m.color}`} />
                    <p className="text-lg font-bold text-foreground">{m.value}</p>
                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Top Creators</p>
              <div className="space-y-2">
                {[
                  { img: "/images/hosts/girl-1.png", name: "Mia Chen", niche: "Beauty", gmv: "$4.8K", rating: "4.9" },
                  { img: "/images/hosts/boy-1.png", name: "Jordan Lee", niche: "Tech", gmv: "$3.6K", rating: "5.0" },
                  { img: "/images/hosts/girl-2.png", name: "Aisha Patel", niche: "Fashion", gmv: "$5.2K", rating: "4.8" },
                ].map((c) => (
                  <div key={c.name} className="flex items-center gap-3 rounded-lg bg-secondary/30 px-3 py-2.5">
                    <img src={c.img} alt={c.name} className="h-9 w-9 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">{c.niche}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-emerald-400">{c.gmv} avg</p>
                      <p className="text-[10px] text-amber-400">{c.rating} stars</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Video proof strip — what live shopping looks like */}
        <div className="relative mt-32 sm:mt-40 lg:mt-48 pb-24 sm:pb-32">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
              See what your campaign could look like
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { video: "/videos/video-01.mp4", poster: "/images/thumbs/video-01.png", label: "Beauty product launch" },
                { video: "/videos/video-02.mp4", poster: "/images/thumbs/video-02.png", label: "Tech product demo" },
                { video: "/videos/video-03.mp4", poster: "/images/thumbs/video-03.png", label: "Fashion haul stream" },
                { video: "/videos/video-04.mp4", poster: "/images/thumbs/video-04.png", label: "Product unboxing" },
              ].map((stream, i) => (
                <LiveVideoCard key={i} {...stream} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 2: BRAND LOGOS
      ═══════════════════════════════════════════ */}
      <section className="mt-20 sm:mt-28 border-y border-border/30 bg-card/20 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14">
            {["adidas", "crocs", "sephora", "walmart", "samsung"].map((b) => (
              <img key={b} src={`/images/brands/${b}.png`} alt={b} className="h-7 w-auto object-contain brightness-0 invert opacity-30 hover:opacity-60 transition-opacity sm:h-9" />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 3: WHY LIVE COMMERCE (brand perspective)
      ═══════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 sm:mb-20">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">Why live commerce</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Your next sales channel <span className="text-primary">converts 10x better</span>
            </h2>
            <p className="mt-5 text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Static ads are losing attention. Live shopping puts your product in front of engaged buyers with a trusted host who sells it in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Search, title: "Discover Vetted Hosts", desc: "Browse creators filtered by niche, platform, followers, and proven sales metrics. No guesswork." },
              { icon: MessageSquare, title: "Direct Deal Room", desc: "Chat with creators, negotiate rates, agree on deliverables — no agencies or middlemen." },
              { icon: FileText, title: "E-Signed Contracts", desc: "Generate and sign contracts in-app. Payment info is only shared after both parties sign." },
              { icon: Shield, title: "Secure Payments", desc: "Pay via Venmo, PayPal, or Zelle after signing. No upfront fees, no payment until you're committed." },
              { icon: BarChart3, title: "Stream Analytics", desc: "Track viewers, GMV, orders, and conversion rate in real-time. Know your ROI instantly." },
              { icon: Zap, title: "Fast Booking", desc: "Go from brief to booked in hours. Creators respond fast and confirm availability instantly." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6 sm:p-8 hover:border-accent/20 transition-colors">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent mb-5">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground sm:text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 4: HOW IT WORKS (brand perspective)
      ═══════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 lg:py-40 relative overflow-hidden bg-card/30">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/3 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 sm:mb-20">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">How it works</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Launch a campaign in 3 steps
            </h2>
            <p className="mt-5 text-lg text-muted-foreground max-w-md mx-auto">
              Find a host, align on your brief, and watch them sell your product live.
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                step: "01", icon: Search, title: "Find your host",
                desc: "Browse creators by niche, platform, and past performance. Review portfolios, ratings, and GMV history before you reach out.",
                color: "text-accent bg-accent/10",
              },
              {
                step: "02", icon: MessageSquare, title: "Negotiate & sign",
                desc: "Message creators directly. Agree on rates, deliverables, and live date. Sign the contract in-app — no paperwork, no lawyers.",
                color: "text-blue-400 bg-blue-500/10",
              },
              {
                step: "03", icon: Video, title: "Ship, stream & track",
                desc: "Ship your product, the creator goes live. Watch real-time metrics: viewers, clicks, orders, GMV. Know your ROI before the stream ends.",
                color: "text-primary bg-primary/10",
              },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl border border-border bg-card p-6 sm:p-8 hover:border-accent/20 transition-colors">
                <div className="flex gap-5">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${s.color}`}>
                    <s.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold text-muted-foreground mb-1">STEP {s.step}</p>
                    <h3 className="text-lg font-bold sm:text-xl">{s.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed sm:text-base">{s.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Button size="lg" className="rounded-full px-8 text-base font-bold h-12" asChild>
              <Link to="/auth">Start Your First Campaign <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 5: RESULTS — Campaign ROI preview
      ═══════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">Real results</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Live streams convert <span className="text-primary">10x better</span> than static ads
              </h2>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
                Brands on GMV.live see dramatically higher engagement and conversion compared to traditional influencer campaigns.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  "8-15% average conversion rate on live streams",
                  "3x higher average order value vs. static posts",
                  "Direct audience Q&A drives purchase confidence",
                  "Full performance tracking and ROI visibility",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock campaign results */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Campaign: Rare Beauty Launch</span>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-xs">Completed</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Total GMV", value: "$12,400", icon: DollarSign, color: "text-emerald-400" },
                  { label: "Peak Viewers", value: "2,847", icon: Eye, color: "text-primary" },
                  { label: "Orders", value: "186", icon: Package, color: "text-blue-400" },
                  { label: "Conv. Rate", value: "11.2%", icon: TrendingUp, color: "text-accent" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-secondary/50 p-4 text-center">
                    <s.icon className={`h-4 w-4 mx-auto mb-1.5 ${s.color}`} />
                    <p className="text-xl font-bold text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-secondary/30 p-4">
                <div className="flex items-center gap-3">
                  <img src="/images/hosts/girl-1.png" alt="Mia" className="h-10 w-10 rounded-full object-cover" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Mia Chen</p>
                    <p className="text-xs text-muted-foreground">Beauty | TikTok Shop | 320K followers</p>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-0 text-[10px]">Top Host</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">Campaign cost: $1,500 | ROAS: 8.3x</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 6: FAQ
      ═══════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 lg:py-40 bg-card/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">FAQ</p>
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
          SECTION 7: FINAL CTA
      ═══════════════════════════════════════════ */}
      <section className="relative py-28 sm:py-36 lg:py-44 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-primary/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/8 rounded-full blur-[140px]" />

        <div className="relative mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Start selling live today
          </h2>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            Join hundreds of brands already using GMV.live to find top creators and drive real-time sales.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="rounded-full px-8 text-base font-bold shadow-lg shadow-primary/20 h-12" asChild>
              <Link to="/auth">Get Started — It's Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          <Link to="/" className="inline-flex items-center mt-5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Are you a creator? <ChevronRight className="ml-1 h-3 w-3" />
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

export default Index;
