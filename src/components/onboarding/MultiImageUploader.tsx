import { useRef } from "react";
import { cn } from "@/lib/utils";
import { Upload, X } from "lucide-react";

interface ImageItem {
  file: File | null;
  previewUrl: string;
}

interface MultiImageUploaderProps {
  value: ImageItem[];
  onChange: (items: ImageItem[]) => void;
  max?: number;
  label?: string;
  className?: string;
}

const MultiImageUploader = ({ value, onChange, max = 3, label, className }: MultiImageUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = max - value.length;
    const newItems = files.slice(0, remaining).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    onChange([...value, ...newItems]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (index: number) => {
    const item = value[index];
    if (item.previewUrl.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl);
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <span className="text-sm font-medium text-foreground">{label}</span>}
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      <div className="flex flex-wrap gap-3">
        {value.map((item, i) => (
          <div key={i} className="group relative">
            <img
              src={item.previewUrl}
              alt={`Upload ${i + 1}`}
              className="h-24 w-24 rounded-lg border-2 border-border object-cover"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-secondary text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <Upload className="h-5 w-5" />
            <span className="text-xs">{value.length}/{max}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MultiImageUploader;
