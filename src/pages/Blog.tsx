import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Clock } from "lucide-react";

const articles = [
  {
    slug: "live-shopping-600-billion-revolution",
    category: "Industry News",
    title: "Live Shopping Is Now a $600 Billion Market. Here's What That Means for Your Brand.",
    excerpt:
      "The live commerce market has exploded past $600 billion globally, with projections pointing toward $1 trillion by 2028. If your brand isn't selling live yet, you're leaving serious revenue on the table.",
    date: "Feb 20, 2026",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=450&fit=crop",
  },
  {
    slug: "how-to-launch-first-tiktok-shop-live",
    category: "Getting Started",
    title: "How to Launch Your First TikTok Shop Live (Step by Step)",
    excerpt:
      "TikTok Shop Live is the fastest-growing sales channel in e-commerce right now. This guide walks you through everything from setting up your shop to going live and converting viewers into buyers.",
    date: "Feb 18, 2026",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=450&fit=crop",
  },
  {
    slug: "why-college-creators-outperform-influencers",
    category: "Creator Economy",
    title: "Why College Creators Are Outselling Traditional Influencers in Live Commerce",
    excerpt:
      "Brands are discovering that college students with smaller, hyper-engaged audiences consistently outperform big-name influencers in live shopping. The reason? Authenticity and relatability sell.",
    date: "Feb 15, 2026",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=450&fit=crop",
  },
  {
    slug: "live-shopping-trends-2026",
    category: "Industry News",
    title: "5 Live Shopping Trends That Will Define 2026",
    excerpt:
      "From AI-powered product recommendations during streams to shoppable short-form replays, 2026 is bringing a new wave of innovation to live commerce. These are the trends brands need to watch.",
    date: "Feb 12, 2026",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop",
  },
  {
    slug: "escrow-payments-live-commerce",
    category: "Getting Started",
    title: "How Escrow Payments Are Making Live Commerce Safer for Brands",
    excerpt:
      "One of the biggest concerns brands have with live shopping is risk. What if the creator doesn't show up? What if the stream flops? Escrow-based platforms are solving this problem by holding funds until the job is done.",
    date: "Feb 8, 2026",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=450&fit=crop",
  },
  {
    slug: "amazon-live-vs-tiktok-shop",
    category: "Platform Guides",
    title: "Amazon Live vs. TikTok Shop: Which Platform Should Your Brand Start With?",
    excerpt:
      "Both platforms offer massive reach and built-in checkout, but they attract very different audiences. Here's a breakdown of costs, demographics, and conversion rates to help you pick the right fit.",
    date: "Feb 4, 2026",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1556742111-a301076d9d18?w=800&h=450&fit=crop",
  },
];

const Blog = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ═══════ HEADER ═══════ */}
      <section className="relative overflow-hidden pt-24 pb-12 sm:pt-32 sm:pb-14 lg:pt-40 lg:pb-16">
        <div className="cloud-blob bg-primary w-[500px] h-[500px] -top-40 -left-40 absolute" />
        <div className="cloud-blob bg-accent w-[400px] h-[400px] top-20 -right-40 absolute" />

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl lg:text-4xl xl:text-5xl">
            The Live Commerce Blog
          </h1>
          <p className="mx-auto mt-3 sm:mt-4 max-w-xl text-sm sm:text-base text-muted-foreground">
            Guides, trends, and strategies to help your brand win with live shopping.
          </p>
        </div>
      </section>

      {/* ═══════ HEADLINES ═══════ */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="divide-y divide-border/50 rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
            {articles.map((article) => (
              <div key={article.slug} className="p-4 sm:p-5 lg:p-6 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="rounded-full text-xs">
                    {article.category}
                  </Badge>
                </div>
                <h3 className="text-base font-semibold text-card-foreground leading-snug sm:text-lg">
                  {article.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                  {article.excerpt}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{article.date}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {article.readTime}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="py-12 sm:py-16 lg:py-20 xl:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Ready to Put Live Shopping to Work?
          </h2>
          <p className="mx-auto mt-3 sm:mt-4 max-w-xl text-sm sm:text-base text-muted-foreground">
            Sign up and get matched with vetted college creators who can sell your products live.
          </p>
          <div className="mt-6 sm:mt-8">
            <Button size="lg" className="rounded-full px-6 sm:px-8 text-sm sm:text-base font-bold" asChild>
              <Link to="/auth">
                Get Started <ChevronRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-border py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <p className="text-base sm:text-lg font-bold text-foreground"><em>GMB.live</em></p>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">support@GMB.live</p>
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
            © {new Date().getFullYear()} <em>GMB.live</em>. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Blog;
