import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  showSkip?: boolean;
  onSkip?: () => void;
  showBack?: boolean;
  onBack?: () => void;
}

const OnboardingLayout = ({
  children,
  currentStep,
  totalSteps,
  showSkip,
  onSkip,
  showBack,
  onBack,
}: OnboardingLayoutProps) => {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      {/* Thin edge-to-edge progress bar */}
      <Progress value={percentage} className="h-1 rounded-none" />

      {/* Top bar */}
      <div className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {showBack && onBack && (
              <button
                onClick={onBack}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <Link to="/" className="text-xl font-bold text-foreground">
              GMV.live
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              {currentStep} of {totalSteps}
            </span>
            {showSkip && onSkip && (
              <button
                onClick={onSkip}
                className="min-h-[44px] text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content — vertically centered */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl animate-fade-in-up">{children}</div>
      </div>
    </div>
  );
};

export default OnboardingLayout;
