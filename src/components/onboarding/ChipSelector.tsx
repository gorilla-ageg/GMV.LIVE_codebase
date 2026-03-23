import { cn } from "@/lib/utils";

interface ChipSelectorProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multiSelect?: boolean;
  className?: string;
}

const ChipSelector = ({ options, selected, onChange, multiSelect = true, className }: ChipSelectorProps) => {
  const toggle = (option: string) => {
    if (multiSelect) {
      onChange(
        selected.includes(option)
          ? selected.filter((s) => s !== option)
          : [...selected, option]
      );
    } else {
      onChange(selected.includes(option) ? [] : [option]);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={cn(
              "min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium transition-all",
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary text-muted-foreground hover:border-primary/50 hover:text-foreground"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
};

export default ChipSelector;
