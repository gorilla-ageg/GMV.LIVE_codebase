import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Play } from "lucide-react";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const rotatingWords = [
  "TikTok Shop.",
  "Brand Campaigns.",
  "Product Launch.",
  "Flash Sales.",
];

const hosts = [
  { name: "Mia Chen", gmv: "$4,800", rating: "4.9", image: "/images/hosts/girl-1.png" },
  { name: "Jordan Lee", gmv: "$3,600", rating: "5.0", image: "/images/hosts/boy-1.png" },
  { name: "Aisha Patel", gmv: "$5,200", rating: "4.8", image: "/images/hosts/girl-2.png" },
  { name: "Sofia Martinez", gmv: "$3,200", rating: "4.9", image: "/images/hosts/girl-3.png" },
];

const HeroSection = () => {
  const [currentWord, setCurrentWord] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % rotatingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden hero-gradient pt-24 pb-16 sm:pt-32 sm:pb-24">
      {/* Cloud blobs */}
      <div className="cloud-blob bg-primary/20 w-[500px] h-[500px] -top-40 -left-40 absolute" />
      <div className="cloud-blob bg-accent/20 w-[600px] h-[600px] top-20 -right-60 absolute" />
      <div className="cloud-blob bg-primary/10 w-[400px] h-[400px] bottom-0 left-1/3 absolute" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="max-w-xl">
            <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border-0">
              Live Shopping Network
            </Badge>

            <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Match and Manage the Best Live Hosts For Your{" "}
              <span className="relative inline-block" style={{ minWidth: "280px" }}>
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

            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Stop scrambling for live hosts. GMV.live matches your brand with
              vetted creators who sell on camera, so you can go live faster and
              sell more.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link to="/auth">Browse Hosts</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth">Apply as a Host</Link>
              </Button>
            </div>
          </div>

          {/* Right — Host Cards */}
          <div className="grid grid-cols-2 gap-4 sm:gap-5">
            {hosts.map((host, i) => (
              <div
                key={host.name}
                className="group relative overflow-hidden rounded-2xl bg-card shadow-md border border-border/50 transition-shadow hover:shadow-xl"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="relative aspect-[3/4] bg-gradient-to-br from-secondary to-muted">
                  <img
                    src={host.image}
                    alt={host.name}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/80 text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                  {/* See Profile overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/60 to-transparent p-3 pt-10">
                    <span className="text-xs font-semibold text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      See Profile →
                    </span>
                  </div>
                </div>
                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-semibold text-card-foreground">{host.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Avg. {host.gmv} GMV per stream •{" "}
                    <Star className="inline h-3 w-3 text-amber-400 -mt-0.5" fill="currentColor" />{" "}
                    {host.rating}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
