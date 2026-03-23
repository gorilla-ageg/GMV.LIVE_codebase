import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="relative">
          <h1 className="text-8xl sm:text-9xl font-black text-primary/20 select-none">404</h1>
          <p className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl font-bold text-foreground">
            Page Not Found
          </p>
        </div>
        <p className="mt-6 max-w-md text-sm sm:text-base text-muted-foreground">
          The page you are looking for does not exist or has been moved.
          Let us get you back on track.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button className="rounded-full gap-2" asChild>
            <Link to="/">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button variant="outline" className="rounded-full gap-2" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
