import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Upload, X, Pencil } from "lucide-react";

interface ImageUploaderProps {
  value: string | null;
  onChange: (file: File | null, previewUrl: string | null) => void;
  circular?: boolean;
  label?: string;
  className?: string;
}

const ImageUploader = ({ value, onChange, circular = false, label, className }: ImageUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value);

  // Sync internal preview state when the value prop changes externally
  // (e.g., when data loads from Supabase after mount)
  useEffect(() => {
    if (value && !preview) {
      setPreview(value);
    }
  }, [value]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange(file, url);
  };

  const remove = () => {
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    onChange(null, null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const currentPreview = preview || value;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {label && <span className="text-sm font-medium text-foreground">{label}</span>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {currentPreview ? (
        <div className="group relative">
          <img
            src={currentPreview}
            alt="Preview"
            className={cn(
              "h-28 w-28 object-cover border-2 border-border",
              circular ? "rounded-full" : "rounded-lg"
            )}
          />
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center gap-2 bg-background/60 opacity-0 transition-opacity group-hover:opacity-100",
              circular ? "rounded-full" : "rounded-lg"
            )}
          >
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={remove}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex min-h-[112px] min-w-[112px] flex-col items-center justify-center gap-2 border-2 border-dashed border-border bg-secondary text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground",
            circular ? "rounded-full" : "rounded-lg"
          )}
        >
          <Upload className="h-6 w-6" />
          <span className="text-xs">Upload</span>
        </button>
      )}
    </div>
  );
};

export default ImageUploader;
