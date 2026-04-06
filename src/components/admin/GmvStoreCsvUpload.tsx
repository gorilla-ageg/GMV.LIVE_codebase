import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Loader2, X, Download, CheckCircle2 } from "lucide-react";

interface CsvRow {
  title: string;
  description?: string;
  category?: string;
  budget_min?: string;
  budget_max?: string;
  target_platforms?: string;
  commission_info?: string;
  affiliate_link?: string;
  image_urls?: string;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Handle quoted commas
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of lines[i]) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === "," && !inQuotes) { values.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ""; });

    if (row.title) {
      rows.push(row as unknown as CsvRow);
    }
  }
  return rows;
}

interface Props {
  onClose: () => void;
}

const GmvStoreCsvUpload = ({ onClose }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCsv(text);
      setParsedRows(rows);
      if (rows.length === 0) {
        toast({ title: "No valid rows found", description: "Make sure your CSV has a 'title' column header.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!user || parsedRows.length === 0) throw new Error("No data to upload");

      const products = parsedRows.map((row) => ({
        brand_id: user.id,
        title: row.title,
        description: row.description || null,
        category: row.category || null,
        budget_min: row.budget_min ? Number(row.budget_min) : null,
        budget_max: row.budget_max ? Number(row.budget_max) : null,
        target_platforms: row.target_platforms
          ? row.target_platforms.split("|").map((p) => p.trim()).filter(Boolean)
          : null,
        commission_info: row.commission_info || null,
        affiliate_link: row.affiliate_link || null,
        images: row.image_urls
          ? row.image_urls.split("|").map((u) => u.trim()).filter(Boolean)
          : null,
        status: "active" as const,
      }));

      const { error } = await supabase.from("products").insert(products);
      if (error) throw error;
      return products.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["gmv-store-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: `${count} products imported!`, description: "You can now add images to each product." });
      onClose();
    },
    onError: (err: Error) => toast({ title: "Import failed", description: err.message, variant: "destructive" }),
  });

  const downloadTemplate = () => {
    const template = `title,description,category,budget_min,budget_max,target_platforms,commission_info,affiliate_link,image_urls
"Rare Beauty Soft Pinch Blush","Live launch of the new blush collection",Beauty,500,2000,"TikTok|Instagram","15% commission + $500 flat fee",https://example.com/product,"https://images.example.com/blush1.jpg|https://images.example.com/blush2.jpg"
"Galaxy Buds3 Pro","Tech review livestream for Galaxy Buds",Tech,800,3000,"TikTok|YouTube","10% commission + product gifting",https://example.com/product2,https://images.example.com/buds.jpg`;
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gmv-store-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" /> CSV Import
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Upload a CSV with product data. Required column: <strong>title</strong>. Optional: description, category, budget_min, budget_max, target_platforms (pipe-separated), commission_info, affiliate_link, <strong>image_urls</strong> (pipe-separated URLs).
        </p>
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 text-xs">
          <Download className="h-3.5 w-3.5" /> Download Template CSV
        </Button>
      </div>

      {/* File input */}
      <div
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors p-8 cursor-pointer"
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" onChange={handleFile} className="hidden" />
        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
        {fileName ? (
          <p className="text-sm font-medium text-foreground">{fileName}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Click to select a CSV file</p>
        )}
      </div>

      {/* Preview */}
      {parsedRows.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {parsedRows.length} product{parsedRows.length !== 1 ? "s" : ""} ready to import
          </p>
          <div className="max-h-60 overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="p-2 text-left text-muted-foreground">#</th>
                  <th className="p-2 text-left text-muted-foreground">Title</th>
                  <th className="p-2 text-left text-muted-foreground">Category</th>
                  <th className="p-2 text-left text-muted-foreground">Budget</th>
                  <th className="p-2 text-left text-muted-foreground">Platforms</th>
                  <th className="p-2 text-left text-muted-foreground">Images</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row, i) => (
                  <tr key={i} className="border-b border-border/30">
                    <td className="p-2 text-muted-foreground">{i + 1}</td>
                    <td className="p-2 font-medium text-foreground truncate max-w-[200px]">{row.title}</td>
                    <td className="p-2 text-muted-foreground">{row.category || "—"}</td>
                    <td className="p-2 text-muted-foreground">
                      {row.budget_min || row.budget_max
                        ? `$${row.budget_min || "?"} – $${row.budget_max || "?"}`
                        : "—"}
                    </td>
                    <td className="p-2 text-muted-foreground">{row.target_platforms?.replace(/\|/g, ", ") || "—"}</td>
                    <td className="p-2 text-muted-foreground">
                      {row.image_urls ? `${row.image_urls.split("|").filter(Boolean).length} img` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={uploadMutation.isPending}
            className="w-full rounded-full h-11 font-semibold"
          >
            {uploadMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Importing...</>
            ) : (
              `Import ${parsedRows.length} Product${parsedRows.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default GmvStoreCsvUpload;
