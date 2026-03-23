import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const ComingSoon = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">Coming Soon</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          We are building something big.
        </h1>
        <p className="mt-4 max-w-md text-base sm:text-lg text-muted-foreground">
          This feature is not available yet. Join our waitlist to be the first to know when it launches.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button className="rounded-full gap-2" asChild>
            <Link to="/waitlist">
              Join the Waitlist <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
