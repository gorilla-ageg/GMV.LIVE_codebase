import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, ImagePlus, Trash2 } from "lucide-react";

const CATEGORIES = ["Beauty", "Fashion", "Tech", "Home & Kitchen", "Food & Beverage", "Health & Fitness", "Toys & Games", "Lifestyle", "Pets", "Sports", "Other"];
const PLATFORMS = ["TikTok", "Instagram", "YouTube", "Amazon Live", "Facebook"];
const MAX_IMAGES = 5;

interface Props {
  product?: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    budget_min: number | null;
    budget_max: number | null;
    target_platforms: string[] | null;
    commission_info: string | null;
    affiliate_link: string | null;
    images?: string[] | null;
  };
  onClose: () => void;
}

interface ImageItem {
  file: File | null;
  previewUrl: string;
}

const GmvStoreProductForm = ({ product, onClose }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(product?.title || "");
  const [description, setDescription] = useState(product?.description || "");
  const [category, setCategory] = useState(product?.category || "");
  const [budgetMin, setBudgetMin] = useState(product?.budget_min?.toString() || "");
  const [budgetMax, setBudgetMax] = useState(product?.budget_max?.toString() || "");
  const [platforms, setPlatforms] = useState<string[]>(product?.target_platforms || []);
  const [commission, setCommission] = useState(product?.commission_info || "");
  const [affiliateLink, setAffiliateLink] = useState(product?.affiliate_link || "");
  const [images, setImages] = useState<ImageItem[]>(
    product?.images?.filter(Boolean).map((url) => ({ file: null, previewUrl: url })) || []
  );
  const [imageUrlInput, setImageUrlInput] = useState("");

  const addImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url || images.length >= MAX_IMAGES) return;
    if (!url.startsWith("http")) return;
    setImages((prev) => [...prev, { file: null, previewUrl: url }]);
    setImageUrlInput("");
  };

  const isEdit = !!product;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - images.length;
    const toAdd = files.slice(0, remaining).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...toAdd]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    setImages((prev) => {
      const item = prev[idx];
      if (item.file) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title is required");
      if (!user) throw new Error("Not authenticated");

      // Upload new images
      const imageUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        if (item.file) {
          const path = `${user.id}/gmv-store/${Date.now()}-${i}-${item.file.name}`;
          const { error: uploadErr } = await supabase.storage
            .from("product-images")
            .upload(path, item.file, { upsert: true });
          if (uploadErr) throw uploadErr;
          const { data } = supabase.storage.from("product-images").getPublicUrl(path);
          imageUrls.push(data.publicUrl);
        } else {
          imageUrls.push(item.previewUrl);
        }
      }

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        category: category || null,
        budget_min: budgetMin ? Number(budgetMin) : null,
        budget_max: budgetMax ? Number(budgetMax) : null,
        target_platforms: platforms.length > 0 ? platforms : null,
        commission_info: commission.trim() || null,
        affiliate_link: affiliateLink.trim() || null,
        images: imageUrls.length > 0 ? imageUrls : null,
      };

      if (isEdit) {
        const { error } = await supabase.from("products").update(payload).eq("id", product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert({
          ...payload,
          brand_id: user.id,
          status: "active",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gmv-store-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: isEdit ? "Product updated" : "Product created" });
      onClose();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{isEdit ? "Edit Product" : "New GMV Store Product"}</h3>
        <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Title *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Product name" />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief product description..." rows={3} className="resize-none" />
        </div>

        {/* Image Upload */}
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Images ({images.length}/{MAX_IMAGES})
          </Label>
          <div className="flex flex-wrap gap-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative group h-20 w-20 rounded-lg overflow-hidden border border-border bg-muted">
                <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="h-20 w-20 rounded-lg border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
              >
                <ImagePlus className="h-5 w-5" />
                <span className="text-[9px] mt-0.5">Add</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
          {/* Paste image URL */}
          {images.length < MAX_IMAGES && (
            <div className="flex gap-2 mt-2">
              <Input
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImageUrl(); } }}
                placeholder="Paste image URL and press Enter"
                className="flex-1 h-9 text-xs"
              />
              <Button type="button" variant="outline" size="sm" onClick={addImageUrl} disabled={!imageUrlInput.trim()}>
                Add URL
              </Button>
            </div>
          )}
          {/* Show existing image URLs */}
          {images.length > 0 && (
            <div className="space-y-1 mt-2">
              {images.map((img, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[10px] text-muted-foreground truncate">
                  <span className="shrink-0 text-muted-foreground/50">{idx + 1}.</span>
                  <span className="truncate font-mono">{img.previewUrl}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Category</Label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <Badge key={c} variant={category === c ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => setCategory(category === c ? "" : c)}>
                {c}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Platforms</Label>
          <div className="flex flex-wrap gap-1.5">
            {PLATFORMS.map((p) => (
              <Badge key={p} variant={platforms.includes(p) ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => togglePlatform(p)}>
                {p}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Budget Min ($)</Label>
          <Input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="0" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Budget Max ($)</Label>
          <Input type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="1000" />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Commission Info</Label>
          <Input value={commission} onChange={(e) => setCommission(e.target.value)} placeholder="e.g. 15% commission + $500 flat fee" />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Affiliate Link (optional)</Label>
          <Input value={affiliateLink} onChange={(e) => setAffiliateLink(e.target.value)} placeholder="https://..." />
        </div>
      </div>

      <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !title.trim()} className="w-full rounded-full h-11 font-semibold">
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {isEdit ? "Save Changes" : "Create Product"}
      </Button>
    </div>
  );
};

export default GmvStoreProductForm;
