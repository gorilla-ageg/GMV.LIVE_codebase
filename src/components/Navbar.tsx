import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "For Brands", to: "/for-brands" },
  { label: "For Creators", to: "/" },
  { label: "Pricing", to: "/pricing" },
  { label: "Blog", to: "/blog" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (to: string) => {
    if (to === "/" && location.pathname === "/") return true;
    if (to === "/" && location.pathname === "/for-creators") return true;
    if (to !== "/" && location.pathname.startsWith(to)) return true;
    return false;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/20">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-foreground group"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <img src="/images/gmv-logo-mark.svg" alt="GMV.live" className="h-8 w-8 transition-transform group-hover:scale-110" />
          <span>GMV<span className="font-normal text-muted-foreground">.live</span></span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.label}
                to={link.to}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-full transition-all",
                  active
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {link.label}
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Button size="sm" className="rounded-full px-5 gap-1.5 font-semibold" asChild>
                <Link to="/dashboard">Dashboard <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
              <Button size="sm" variant="ghost" className="rounded-full gap-1.5 text-muted-foreground hover:text-foreground" onClick={handleSignOut}>
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth?tab=login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
                Log in
              </Link>
              <Button size="sm" className="rounded-full px-5 gap-1.5 font-semibold" asChild>
                <Link to="/auth">Get Started <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-foreground p-1.5 rounded-lg hover:bg-secondary transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border/20 bg-background/95 backdrop-blur-xl px-4 pb-5 pt-3 md:hidden">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.label}
                  to={link.to}
                  className={cn(
                    "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "text-foreground bg-secondary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-border/20 flex flex-col gap-2">
            {user ? (
              <>
                <Button size="sm" className="rounded-full gap-1.5 font-semibold" asChild>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard <ArrowRight className="h-3.5 w-3.5" /></Link>
                </Button>
                <Button size="sm" variant="ghost" className="rounded-full gap-1.5" onClick={() => { setMobileOpen(false); handleSignOut(); }}>
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="ghost" className="rounded-full" asChild>
                  <Link to="/auth?tab=login" onClick={() => setMobileOpen(false)}>Log in</Link>
                </Button>
                <Button size="sm" className="rounded-full gap-1.5 font-semibold" asChild>
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>Get Started <ArrowRight className="h-3.5 w-3.5" /></Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
