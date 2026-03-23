import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Play,
  Search,
  MessageSquare,
  BarChart3,
  Users,
  Zap,
  Shield,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
const rotatingWords = [
  "TikTok Shop.",
  "Brand Campaigns.",
  "Product Launch.",
  "Flash Sales.",
];

const hosts = [
  {
    img: "/images/hosts/boy-1.png",
    logo: "/images/logos/cal.png",
  },
  {
    img: "/images/hosts/girl-1.png",
    logo: "/images/logos/ucla.png",
  },
  {
    img: "/images/hosts/girl-2.png",
    logo: "/images/logos/lsu.png",
  },
  {
    img: "/images/hosts/girl-3.png",
    logo: "/images/logos/miami.png",
  },
];

const features = [
  {
    icon: Search,
    title: "Discover Vetted Hosts",
    description:
      "Browse a curated marketplace of live shopping hosts filtered by niche, platform, and proven sales metrics.",
  },
  {
    icon: MessageSquare,
    title: "Direct Messaging",
    description:
      "Chat with hosts, share your product brief, align on format and pricing — no agencies in the way.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description:
      "Track viewers, clicks, and conversions as they happen. Know your ROI before the stream even ends.",
  },
  {
    icon: Users,
    title: "Managed Campaigns",
    description:
      "Run multi-host campaigns across platforms. One dashboard to manage all your live shopping activations.",
  },
  {
    icon: Zap,
    title: "Fast Booking",
    description:
      "Go from brief to booked in hours, not weeks. Hosts respond fast and confirm availability instantly.",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description:
      "Funds are held in escrow until the stream is complete. Pay only for results, with full transparency.",
  },
];

const steps = [
  {
    step: 1,
    title: "Find Your Host",
    description:
      "Browse vetted live shopping hosts. Filter by niche, selling style, platform, and past performance. Watch highlight reels before you book.",
    img: "/images/steps/find-host.png",
  },
  {
    step: 2,
    title: "Align & Book",
    description:
      "Message hosts directly. Share your product brief, agree on format and budget, and lock in your live date. No agencies, no middlemen.",
    img: "/images/steps/align-book.png",
  },
  {
    step: 3,
    title: "Go Live & Sell",
    description:
      "Ship your product, drop your talking points, and watch them sell. Track viewers, clicks, and conversions in real time.",
    img: "/images/steps/go-live.png",
  },
];

const faqs = [
  {
    q: "What is live shopping?",
    a: "Live shopping is a real-time selling format where a host demonstrates and sells products via live video on platforms like TikTok Shop, Amazon Live, Instagram Live, and more.",
  },
  {
    q: "How do I find the right host for my brand?",
    a: "Use our filters to search by niche, platform, follower count, past GMV, and ratings. You can watch highlight reels and review portfolios before reaching out.",
  },
  {
    q: "What does it cost to use gmv.live?",
    a: "gmv.live charges a small platform fee on bookings. Host rates vary — you negotiate directly with hosts based on your budget and campaign needs.",
  },
  {
    q: "Which platforms are supported?",
    a: "We support TikTok Shop, Amazon Live, Instagram Live, YouTube Live, and custom brand storefronts. More platforms are added regularly.",
  },
  {
    q: "How are payments handled?",
    a: "Payments are held in escrow when you book. Funds are released to the host once the stream is completed and approved by you.",
  },
];

const brandNames = [
  "L'Oréal", "Sephora", "Nike", "Adidas", "Samsung", "Amazon",
  "Glossier", "Fenty", "Shein", "Zara", "H&M", "Unilever",
  "Estée Lauder", "TikTok", "Meta",
];

const Index = () => {
  const [currentWord, setCurrentWord] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % rotatingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ═══════ HERO ═══════ */}
      <section className="relative overflow-hidden pt-24 pb-14 sm:pt-32 sm:pb-16 lg:pt-40 lg:pb-24">
        <div className="cloud-blob bg-primary w-[500px] h-[500px] -top-40 -left-40 absolute" />
        <div className="cloud-blob bg-accent w-[600px] h-[600px] top-20 -right-60 absolute" />
        <div className="cloud-blob bg-primary w-[400px] h-[400px] bottom-0 left-1/3 absolute" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="min-w-0">
              <Badge
                variant="secondary"
                className="mb-4 sm:mb-6 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border-0"
              >
                Live Shopping Network
              </Badge>

              <h1 className="text-3xl font-black leading-[1.1] tracking-tight sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl">
                Match and Manage the Best Live Hosts For Your{" "}
                <span className="relative inline-block" style={{ minWidth: "min(100%, 280px)" }}>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={currentWord}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="inline-block text-primary whitespace-nowrap"
                    >
                      {rotatingWords[currentWord]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </h1>

              <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-relaxed text-muted-foreground">
                Connect your brand with campus creators ready to go live.
              </p>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground/90">
                Real hosts. Real-time demos. Real sales.
              </p>

              <div className="mt-6 sm:mt-8 flex flex-wrap gap-3 sm:gap-4">
                <Button size="lg" className="rounded-full px-6 sm:px-8 text-sm sm:text-base font-bold" asChild>
                  <Link to="/auth">Browse Hosts</Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-6 sm:px-8 text-sm sm:text-base font-bold" asChild>
                  <Link to="/auth">Apply as a Host</Link>
                </Button>
              </div>
            </div>

            {/* Right: Host cards */}
            <div className="min-w-0 flex justify-center lg:justify-end">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5 w-full max-w-[360px] sm:max-w-[400px] lg:max-w-[440px]">
                {hosts.map((host, i) => (
                  <div
                    key={i}
                    className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-card shadow-md border border-border/50 transition-shadow hover:shadow-xl min-w-0"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={host.img}
                        alt="College creator"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/80 text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
                          <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center p-2 sm:p-3">
                      <img
                        src={host.logo}
                        alt="University logo"
                        className="h-6 w-auto object-contain sm:h-8 lg:h-10"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ SOCIAL PROOF ═══════ */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-6 sm:mb-8 text-center text-sm sm:text-base font-medium text-muted-foreground">
            200+ e-commerce brands are already going live every week.
          </p>
          <div className="relative overflow-hidden">
            <div className="flex animate-scroll-logos w-max gap-12 sm:gap-16 px-4">
              {[...brandNames, ...brandNames].map((name, i) => (
                <span
                  key={i}
                  className="shrink-0 text-base sm:text-lg font-bold tracking-tight text-foreground/20 select-none"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FEATURE CARDS ═══════ */}
      <section className="py-12 sm:py-16 lg:py-20 xl:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl mb-8 sm:mb-12">
            Everything You Need to Go Live
          </h2>
          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border/50 bg-card p-4 sm:p-6 shadow-sm transition-shadow hover:shadow-lg min-w-0"
              >
                <div className="mb-3 sm:mb-4 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-card-foreground">{f.title}</h3>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="py-12 sm:py-16 lg:py-20 xl:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-3 sm:mt-4 max-w-xl text-center text-sm sm:text-base text-muted-foreground">
            From discovery to conversion — here's how <em>gmv.live</em> works for brands.
          </p>

          <div className="mt-10 sm:mt-14 space-y-8 sm:space-y-12">
            {steps.map((s) => (
              <div
                key={s.step}
                className="rounded-2xl border border-border/50 bg-card p-4 sm:p-6 lg:p-8 shadow-sm min-w-0"
              >
                <p className="text-sm font-mono font-semibold text-primary">{s.step}_</p>
                <h3 className="mt-2 text-lg font-bold text-card-foreground sm:text-xl lg:text-2xl">{s.title}</h3>
                <p className="mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed text-muted-foreground">{s.description}</p>
                <div className="mt-4 sm:mt-6 overflow-hidden rounded-xl bg-muted/10">
                  <img
                    src={s.img}
                    alt={s.title}
                    className="w-full h-auto object-contain rounded-xl"
                    loading="lazy"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section className="py-12 sm:py-16 lg:py-20 xl:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Still Have Questions?
          </h2>
          <Accordion type="single" collapsible className="mt-8 sm:mt-10">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-border">
                <AccordionTrigger className="text-left text-sm sm:text-base font-medium py-4 sm:py-5">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm sm:text-base pb-4 sm:pb-5">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-12 sm:py-16 lg:py-20 xl:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Start Selling Live Today
          </h2>
          <p className="mx-auto mt-3 sm:mt-4 max-w-xl text-sm sm:text-base text-muted-foreground">
            Join hundreds of brands already using <em>gmv.live</em> to find top live shopping
            hosts, run campaigns, and drive real-time sales.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col items-center gap-3 sm:gap-4">
            <Button size="lg" className="rounded-full px-6 sm:px-8 text-sm sm:text-base font-bold" asChild>
              <Link to="/auth">
                Get Started <ChevronRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Link
              to="/"
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Are you a creator? <ChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-border py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <p className="text-base sm:text-lg font-bold text-foreground">🤩 <em>gmv.live</em></p>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">support@gmv.live</p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link to="/for-brands" className="block hover:text-foreground">For Brands</Link>
              <Link to="/" className="block hover:text-foreground">For Creators</Link>
              <Link to="/pricing" className="block hover:text-foreground">Pricing</Link>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link to="/coming-soon" className="block hover:text-foreground">Privacy Policy</Link>
              <Link to="/coming-soon" className="block hover:text-foreground">Terms of Use</Link>
            </div>
          </div>
          <p className="mt-8 text-xs text-muted-foreground">
            © {new Date().getFullYear()} <em>gmv.live</em>. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
