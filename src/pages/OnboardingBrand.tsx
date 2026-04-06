import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import ChipSelector from "@/components/onboarding/ChipSelector";
import ImageUploader from "@/components/onboarding/ImageUploader";
import MultiImageUploader from "@/components/onboarding/MultiImageUploader";
import SelectionCard from "@/components/onboarding/SelectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Loader2, Rocket, Search, DollarSign,
} from "lucide-react";

const TOTAL_STEPS = 4;

const INDUSTRY_OPTIONS = [
  "Beauty", "Fashion", "Food & Beverage", "Tech", "Sports", "Home",
  "Health", "Entertainment", "Gaming", "Pet", "Finance", "Other",
];

const CATEGORY_OPTIONS = [
  "Beauty", "Fashion", "Tech", "Home & Kitchen",
  "Food & Beverage", "Health & Fitness", "Toys & Games",
  "Lifestyle", "Pets", "Automotive", "Sports", "Other",
];

const RATE_RANGES = [
  { value: "0-10", label: "$0 – $10" },
  { value: "10-20", label: "$10 – $20" },
  { value: "20-30", label: "$20 – $30" },
  { value: "30-50", label: "$30 – $50" },
  { value: "50-75", label: "$50 – $75" },
  { value: "75-100", label: "$75 – $100" },
];

const OnboardingBrand = () => {
  const { user, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Auth guard handled by OnboardingRoute in App.tsx

  // Step 1 — Brand Basics
  const [brandName, setBrandName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [website, setWebsite] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);

  // Step 2 — First Product
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productImages, setProductImages] = useState<{ file: File | null; previewUrl: string }[]>([]);
  const [productCategories, setProductCategories] = useState<string[]>([]);

  // Step 3 — Pricing
  const [commission, setCommission] = useState(10);
  const [rateRange, setRateRange] = useState("");
  const [pastGmv, setPastGmv] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_step")
        .eq("id", user.id)
        .single();
      if (profile?.onboarding_step) {
        const s = parseInt(profile.onboarding_step.replace("brand-", ""));
        if (s > 1 && s <= TOTAL_STEPS) setStep(s);
      }
      const { data: bp } = await supabase
        .from("brand_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (bp) {
        setBrandName(bp.company_name || "");
        setWebsite(bp.website || "");
        setIndustries(bp.industries || []);
        if (bp.logo_url) setLogoPreview(bp.logo_url);
      }
    };
    load();
  }, [user]);

  const uploadImage = async (file: File, bucket: string, path: string): Promise<string> => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const goBack = async () => {
    if (step > 1) {
      const prev = step - 1;
      try {
        await supabase.from("profiles").update({ onboarding_step: `brand-${prev}` }).eq("id", user!.id);
        setStep(prev);
      } catch (err: any) {
        toast({ title: "Error going back", description: err.message, variant: "destructive" });
      }
    }
  };

  // Step 1 — save brand basics
  const handleStep1 = async () => {
    if (!user || !brandName.trim()) {
      toast({ title: "Brand name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let logoUrl = logoPreview;
      if (logoFile) {
        logoUrl = await uploadImage(logoFile, "avatars", `${user.id}/brand-logo`);
      }
      // Update display name & avatar on profile
      await supabase.from("profiles").update({
        display_name: brandName,
        avatar_url: logoUrl,
        onboarding_step: "brand-2",
      }).eq("id", user.id);

      // Upsert brand_profiles
      const { data: existing } = await supabase.from("brand_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (existing) {
        await supabase.from("brand_profiles").update({
          company_name: brandName, website: website || null, industries, logo_url: logoUrl,
        }).eq("user_id", user.id);
      } else {
        await supabase.from("brand_profiles").insert({
          user_id: user.id, company_name: brandName, website: website || null, industries, logo_url: logoUrl,
        });
      }
      setStep(2);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Step 2 — save first product
  const handleStep2 = async () => {
    if (!user || !productName.trim()) {
      toast({ title: "Product name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      // Upload product images
      const uploadedUrls: string[] = [];
      for (let i = 0; i < productImages.length; i++) {
        const item = productImages[i];
        if (item.file) {
          const url = await uploadImage(item.file, "product-images", `${user.id}/product-0/${i}`);
          uploadedUrls.push(url);
        } else {
          uploadedUrls.push(item.previewUrl);
        }
      }

      // Insert product (will be updated with pricing in step 3)
      const { data: existingProduct } = await supabase
        .from("products")
        .select("id")
        .eq("brand_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingProduct) {
        await supabase.from("products").update({
          title: productName,
          description: productDesc || null,
          images: uploadedUrls,
          category: productCategories[0] || null,
        }).eq("id", existingProduct.id);
      } else {
        await supabase.from("products").insert({
          brand_id: user.id,
          title: productName,
          description: productDesc || null,
          images: uploadedUrls,
          category: productCategories[0] || null,
        });
      }

      await supabase.from("profiles").update({ onboarding_step: "brand-3" }).eq("id", user.id);
      setStep(3);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Step 3 — save pricing & commission
  const handleStep3 = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Parse rate range into budget_min / budget_max
      let budgetMin: number | null = null;
      let budgetMax: number | null = null;
      if (rateRange) {
        const [min, max] = rateRange.split("-").map(Number);
        budgetMin = min;
        budgetMax = max;
      }

      // Update the product created in step 2
      const { data: product } = await supabase
        .from("products")
        .select("id")
        .eq("brand_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (product) {
        await supabase.from("products").update({
          commission_info: `${commission}%`,
          budget_min: budgetMin,
          budget_max: budgetMax,
          past_month_gmv: pastGmv ? parseFloat(pastGmv) : null,
        } as any).eq("id", product.id);
      }

      await supabase.from("profiles").update({ onboarding_step: "brand-4" }).eq("id", user.id);
      setStep(4);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const finish = async (destination: string) => {
    if (!user) return;
    try {
      await supabase.from("profiles").update({ onboarding_completed: true, onboarding_step: null }).eq("id", user.id);
      await refreshProfile();
      navigate(destination, { replace: true });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <OnboardingLayout
      currentStep={step}
      totalSteps={TOTAL_STEPS}
      showBack={step > 1 && step < 4}
      onBack={goBack}
      showSkip={step === 2}
      onSkip={async () => {
        await supabase.from("profiles").update({ onboarding_step: "brand-3" }).eq("id", user!.id);
        setStep(3);
      }}
    >
      {/* ── Step 1: Brand Basics ── */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Brand Basics</h2>
            <p className="text-muted-foreground">Tell us about your brand</p>
          </div>

          <ImageUploader
            value={logoPreview}
            onChange={(file, url) => { setLogoFile(file); setLogoPreview(url); }}
            label="Brand Logo"
            circular
          />

          <div className="space-y-2">
            <Label>Brand Name *</Label>
            <Input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Your brand name"
              className="min-h-[44px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Website (optional)</Label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourbrand.com"
              className="min-h-[44px]"
            />
          </div>

          <div className="space-y-2">
            <Label>What industry are you in?</Label>
            <ChipSelector options={INDUSTRY_OPTIONS} selected={industries} onChange={setIndustries} />
          </div>

          <Button onClick={handleStep1} disabled={saving} className="w-full min-h-[48px]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
          </Button>
        </div>
      )}

      {/* ── Step 2: First Product ── */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Your First Product</h2>
            <p className="text-muted-foreground">Add a product you'd like creators to promote</p>
          </div>

          <div className="space-y-2">
            <Label>Product Name *</Label>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Summer Glow Serum"
              className="min-h-[44px]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Description</Label>
              <span className="text-xs text-muted-foreground">{productDesc.length}/200</span>
            </div>
            <Textarea
              value={productDesc}
              onChange={(e) => setProductDesc(e.target.value.slice(0, 200))}
              placeholder="Briefly describe this product…"
              className="min-h-[80px] resize-none"
              maxLength={200}
            />
          </div>

          <MultiImageUploader
            value={productImages}
            onChange={setProductImages}
            max={4}
            label="Product Images (up to 4)"
          />

          <div className="space-y-2">
            <Label>Product Category</Label>
            <ChipSelector options={CATEGORY_OPTIONS} selected={productCategories} onChange={setProductCategories} />
          </div>

          <Button onClick={handleStep2} disabled={saving} className="w-full min-h-[48px]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
          </Button>
        </div>
      )}

      {/* ── Step 3: Pricing & Commission ── */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Pricing & Commission</h2>
            <p className="text-muted-foreground">Set your rates for creator partnerships</p>
          </div>

          {/* Commission slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Affiliate Commission</Label>
              <span className="rounded-md bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                {commission}%
              </span>
            </div>
            <Slider
              value={[commission]}
              onValueChange={([val]) => setCommission(val)}
              min={0}
              max={50}
              step={5}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
            </div>
          </div>

          {/* Hourly rate cards */}
          <div className="space-y-2">
            <Label>Hourly Rate Budget</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {RATE_RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRateRange(rateRange === r.value ? "" : r.value)}
                  className={`flex min-h-[48px] items-center justify-center rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                    rateRange === r.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/50"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Past month GMV */}
          <div className="space-y-2">
            <Label>Past Month GMV (optional)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                value={pastGmv}
                onChange={(e) => setPastGmv(e.target.value)}
                placeholder="e.g. 50000"
                className="min-h-[44px] pl-9"
              />
            </div>
          </div>

          <Button onClick={handleStep3} disabled={saving} className="w-full min-h-[48px]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
          </Button>
        </div>
      )}

      {/* ── Step 4: Completion ── */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">You're All Set!</h2>
            <p className="text-muted-foreground">Your brand profile and first product are ready</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={() => finish("/feed")}
              className="group flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/10"
            >
              <Search className="h-10 w-10 text-primary" />
              <span className="text-lg font-semibold text-foreground">Browse Creators</span>
            </button>
            <button
              onClick={() => finish("/my-products")}
              className="group flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-border bg-card p-6 transition-all hover:border-accent hover:shadow-lg hover:shadow-accent/10"
            >
              <DollarSign className="h-10 w-10 text-accent" />
              <span className="text-lg font-semibold text-foreground">View My Product</span>
            </button>
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
};

export default OnboardingBrand;
