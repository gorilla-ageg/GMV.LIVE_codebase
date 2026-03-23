import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "negotiating", label: "Negotiating" },
  { key: "agreed", label: "Agreed" },
  { key: "signed", label: "Signed" },
  { key: "escrow_funded", label: "Escrow Funded" },
  { key: "in_progress", label: "Live Session" },
  { key: "completed", label: "Completed" },
] as const;

const stepIndex = (status: string) => {
  if (status === "cancelled") return -1;
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
};

interface DealStatusBarProps {
  status: string;
  hourlyRate?: number | null;
  commissionPercentage?: number | null;
  hours?: number | null;
  totalAmount?: number | null;
}

const DealStatusBar = ({ status, hourlyRate, commissionPercentage, hours, totalAmount }: DealStatusBarProps) => {
  const current = stepIndex(status);

  if (status === "cancelled") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
        <p className="text-sm font-medium text-red-800">Deal Cancelled</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      {/* Progress steps */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium border-2 transition-colors",
                  i < current && "bg-primary border-primary text-primary-foreground",
                  i === current && "border-primary text-primary bg-primary/10",
                  i > current && "border-muted-foreground/30 text-muted-foreground/50"
                )}
              >
                {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  "mt-1 text-[10px] leading-tight text-center max-w-[60px]",
                  i <= current ? "text-foreground font-medium" : "text-muted-foreground/50"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-0.5 w-4 sm:w-8",
                  i < current ? "bg-primary" : "bg-muted-foreground/20"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Deal summary (when agreed or beyond) */}
      {current >= 1 && hourlyRate && (
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground border-t border-border pt-2">
          <span>${hourlyRate}/hr</span>
          <span>{commissionPercentage}% commission</span>
          <span>{hours}h</span>
          {totalAmount && <span className="font-semibold text-foreground">${totalAmount} total</span>}
        </div>
      )}
    </div>
  );
};

export default DealStatusBar;
