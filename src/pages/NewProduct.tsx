import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import MultiImageUploader from "@/components/onboarding/MultiImageUploader";
import { X } from "lucide-react";

const PLATFORM_OPTIONS = ["TikTok", "Instagram", "Amazon Live", "YouTube", "Facebook"];

interface ImageItem {
  file: File | null;
  previewUrl: string;
}

const NewProduct = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [commissionInfo, setCommissionInfo] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (budgetMin && budgetMax && parseFloat(budgetMin) > parseFloat(budgetMax)) {
      toast({ title: "Invalid budget", description: "Min budget cannot be greater than max budget.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      // Create product first to get the ID
      const { data: newProduct, error: insertError } = await supabase.from("products").insert({
        brand_id: user.id,
        title,
        description,
        category,
        budget_min: parseFloat(budgetMin) || null,
        budget_max: parseFloat(budgetMax) || null,
        target_platforms: platforms,
        commission_info: commissionInfo,
      }).select("id").single();
      if (insertError) throw insertError;

      // Upload images if any
      if (images.length > 0) {
        const imageUrls: string[] = [];
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          if (img.file) {
            const ext = img.file.name.split(".").pop();
            const path = `${user.id}/${newProduct.id}/${Date.now()}-${i}.${ext}`;
            const { error: uploadErr } = await supabase.storage
              .from("product-images")
              .upload(path, img.file, { upsert: true });
            if (uploadErr) throw uploadErr;
            const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
            imageUrls.push(urlData.publicUrl);
          }
        }
        if (imageUrls.length > 0) {
          await supabase.from("products").update({ images: imageUrls }).eq("id", newProduct.id);
        }
      }

      toast({ title: "Product created!" });
      navigate("/my-products");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <MultiImageUploader
              value={images}
              onChange={setImages}
              max={5}
              label="Product Images"
            />
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Beauty, Tech" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Budget ($)</Label>
                <Input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Max Budget ($)</Label>
                <Input type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Target Platforms</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORM_OPTIONS.map((p) => (
                  <Badge
                    key={p}
                    variant={platforms.includes(p) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => togglePlatform(p)}
                  >
                    {p} {platforms.includes(p) && <X className="ml-1 h-3 w-3" />}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Commission Info</Label>
              <Input value={commissionInfo} onChange={(e) => setCommissionInfo(e.target.value)} placeholder="e.g. 10% per sale" />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creating…" : "Create Product"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default NewProduct;
