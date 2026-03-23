import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SelectionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
}

const SelectionCard = ({ icon: Icon, title, description, selected, onClick, className }: SelectionCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex w-full min-h-[100px] items-center gap-5 rounded-2xl border-2 p-6 text-left transition-all duration-200",
        selected
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
          : "border-border bg-card hover:border-primary/40 hover:shadow-md",
        className
      )}
    >
      <div
        className={cn(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-colors",
          selected
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground group-hover:text-foreground"
        )}
      >
        <Icon className="h-7 w-7" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-lg font-semibold text-foreground">{title}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
      <div
        className={cn(
          "absolute right-5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border-2 transition-all",
          selected
            ? "border-primary bg-primary"
            : "border-muted-foreground/30"
        )}
      >
        {selected && (
          <svg className="h-full w-full text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    </button>
  );
};

export default SelectionCard;
