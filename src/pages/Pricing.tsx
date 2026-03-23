import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Check, X, ChevronRight, ShieldCheck, DollarSign, Users } from "lucide-react";

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
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ═══════ HERO ═══════ */}
      <section className="relative overflow-hidden pt-24 pb-14 sm:pt-32 sm:pb-16 lg:pt-40 lg:pb-24">
        <div className="cloud-blob bg-primary w-[500px] h-[500px] -top-40 -left-40 absolute" />
        <div className="cloud-blob bg-accent w-[400px] h-[400px] top-20 -right-40 absolute" />

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
            Free to Use. We Only Win When You Win.
          </h1>
          <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground">
            There's zero cost to get started. We make money by taking a small commission on successful matchmaking and campaign management. That's it. Your success is literally our business model.
          </p>
        </div>
      </section>

      {/* ═══════ VALUE PROPS ═══════ */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-6 shadow-sm text-center min-w-0">
              <div className="mx-auto mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-card-foreground">Pay Per Campaign</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                We take a small commission on each live-shopping booking. No subscriptions, no hidden fees, no cost until a campaign runs.
              </p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-6 shadow-sm text-center min-w-0">
              <div className="mx-auto mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-card-foreground">Escrow Protection</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                Your payment is held in escrow. If the creator doesn't fulfill their part of the contract, you get your money back. Guaranteed.
              </p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-6 shadow-sm text-center min-w-0">
              <div className="mx-auto mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-card-foreground">Vetted College Hosts</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                Every creator on GMB.live is a verified college student with live-shopping experience. No guesswork, no unreliable hosts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ COMPARISON TABLE ═══════ */}
      <section className="py-12 sm:py-16 lg:py-20 xl:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl mb-3 sm:mb-4">
            GMB.live vs. The Rest
          </h2>
          <p className="mx-auto mb-8 sm:mb-12 max-w-xl text-center text-sm sm:text-base text-muted-foreground">
            See how we stack up against agencies and other platforms.
          </p>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[480px] sm:min-w-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-3 sm:p-4 text-left font-medium text-muted-foreground">Feature</th>
                    <th className="p-3 sm:p-4 text-center font-semibold text-primary">GMB.live</th>
                    <th className="p-3 sm:p-4 text-center font-medium text-muted-foreground">Agencies</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="p-3 sm:p-4 text-card-foreground">{row.feature}</td>
                      <td className="p-3 sm:p-4 text-center">
                        {row.us === true ? (
                          <Check className="mx-auto h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        ) : (
                          <X className="mx-auto h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                        )}
                      </td>
                      <td className="p-3 sm:p-4 text-center">
                        {row.them === true ? (
                          <Check className="mx-auto h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        ) : row.them === "Partial" ? (
                          <span className="text-xs font-medium text-muted-foreground">Partial</span>
                        ) : (
                          <X className="mx-auto h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
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

      {/* ═══════ CTA ═══════ */}
      <section className="py-12 sm:py-16 lg:py-20 xl:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Ready to Go Live?
          </h2>
          <p className="mx-auto mt-3 sm:mt-4 max-w-xl text-sm sm:text-base text-muted-foreground">
            Sign up and start connecting with vetted college creators. Completely free.
          </p>
          <div className="mt-8 sm:mt-10">
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

export default Pricing;
