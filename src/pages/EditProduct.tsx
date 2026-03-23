import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
import { X, Loader2 } from "lucide-react";

const PLATFORM_OPTIONS = ["TikTok", "Instagram", "Amazon Live", "YouTube", "Facebook"];

interface ImageItem {
  file: File | null;
  previewUrl: string;
}

const EditProduct = () => {
  const { id } = useParams<{ id: string }>();
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
  const [pastMonthGmv, setPastMonthGmv] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["edit-product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  useEffect(() => {
    if (!product) return;
    if (product.brand_id !== user?.id) {
      navigate("/my-products");
      return;
    }
    setTitle(product.title);
    setDescription(product.description || "");
    setCategory(product.category || "");
    setBudgetMin(product.budget_min?.toString() || "");
    setBudgetMax(product.budget_max?.toString() || "");
    setPlatforms(product.target_platforms || []);
    setCommissionInfo(product.commission_info || "");
    setPastMonthGmv(product.past_month_gmv?.toString() || "");
    setImages(
      (product.images || []).map((url: string) => ({ file: null, previewUrl: url }))
    );
  }, [product, user?.id, navigate]);

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    if (budgetMin && budgetMax && parseFloat(budgetMin) > parseFloat(budgetMax)) {
      toast({ title: "Invalid budget", description: "Min budget cannot be greater than max budget.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      // Upload new images
      const imageUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img.file) {
          const ext = img.file.name.split(".").pop();
          const path = `${user.id}/${id}/${Date.now()}-${i}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from("product-images")
            .upload(path, img.file, { upsert: true });
          if (uploadErr) throw uploadErr;
          const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
          imageUrls.push(urlData.publicUrl);
        } else {
          imageUrls.push(img.previewUrl);
        }
      }

      const { error } = await supabase
        .from("products")
        .update({
          title,
          description,
          category,
          budget_min: parseFloat(budgetMin) || null,
          budget_max: parseFloat(budgetMax) || null,
          target_platforms: platforms,
          commission_info: commissionInfo,
          past_month_gmv: parseFloat(pastMonthGmv) || null,
          images: imageUrls,
        })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Product updated!" });
      navigate("/my-products");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
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
            <div className="space-y-2">
              <Label>Past Month GMV ($)</Label>
              <Input type="number" value={pastMonthGmv} onChange={(e) => setPastMonthGmv(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default EditProduct;
