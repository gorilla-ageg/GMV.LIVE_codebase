import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";

const ComingSoon = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          Coming Soon
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground">
          We're building something big.
        </p>
        <Button className="mt-8 rounded-full" asChild>
          <Link to="/">← Back to Home</Link>
        </Button>
      </div>
    </div>
  );
};

export default ComingSoon;
