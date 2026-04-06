import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import ChipSelector from "@/components/onboarding/ChipSelector";
import SelectionCard from "@/components/onboarding/SelectionCard";
import ImageUploader from "@/components/onboarding/ImageUploader";
import MultiImageUploader from "@/components/onboarding/MultiImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2, Sparkles, TrendingUp, Star, Crown,
  CheckCircle2, HelpCircle, Lock,
} from "lucide-react";

const TOTAL_STEPS = 6;

const PAYMENT_METHODS = ["Venmo", "PayPal", "Zelle", "CashApp", "Wire", "Other"] as const;
type PaymentMethod = typeof PAYMENT_METHODS[number];

const PAYMENT_PLACEHOLDERS: Record<PaymentMethod, string> = {
  Venmo: "@your-username",
  PayPal: "your@email.com",
  Zelle: "Phone number or email linked to Zelle",
  CashApp: "$your-cashtag",
  Wire: "Your bank name (we'll coordinate directly)",
  Other: "How should the brand send money?",
};

const INTEREST_OPTIONS = [
  "Beauty", "Fashion", "Tech", "Home & Kitchen",
  "Food & Beverage", "Health & Fitness", "Toys & Games",
  "Lifestyle", "Pets", "Automotive", "Sports", "Other",
];

const EXPERIENCE_LEVELS = [
  { value: "new", title: "Brand New", description: "I haven't done live shopping yet", icon: Sparkles },
  { value: "some", title: "Getting Started", description: "I've done it a few times", icon: TrendingUp },
  { value: "experienced", title: "Experienced", description: "I do it regularly", icon: Star },
  { value: "pro", title: "Pro", description: "It's a big part of my income", icon: Crown },
] as const;

const AFFILIATE_OPTIONS = [
  { value: "yes", title: "Yes, I have one", description: "I'm already accepted into TikTok Shop", icon: CheckCircle2 },
  { value: "need_one", title: "I need one", description: "I'd like GMV.live to help me get set up", icon: HelpCircle },
] as const;

const OnboardingCreator = () => {
  const { user, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Auth guard handled by OnboardingRoute in App.tsx

  // Step 1
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Step 2
  const [interests, setInterests] = useState<string[]>([]);

  // Step 3
  const [experience, setExperience] = useState("");

  // Step 4
  const [affiliate, setAffiliate] = useState("");

  // Step 5 — Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [paymentHandle, setPaymentHandle] = useState("");

  // Step 6
  const [photos, setPhotos] = useState<{ file: File | null; previewUrl: string }[]>([]);

  // Load saved progress
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (profile) {
        if (profile.avatar_url) setAvatarPreview(profile.avatar_url);
        if (profile.onboarding_step) {
          const s = parseInt(profile.onboarding_step.replace("creator-", ""));
          if (s > 1 && s <= TOTAL_STEPS) setStep(s);
        }
      }
      const { data: cp } = await supabase
        .from("creator_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (cp) {
        if ((cp as any).first_name) setFirstName((cp as any).first_name);
        if ((cp as any).last_name) setLastName((cp as any).last_name);
        if ((cp as any).product_interests?.length) setInterests((cp as any).product_interests);
        if ((cp as any).experience_level) setExperience((cp as any).experience_level);
        if ((cp as any).has_tiktok_affiliate) setAffiliate((cp as any).has_tiktok_affiliate);
        if (cp.payment_method) setPaymentMethod(cp.payment_method as PaymentMethod);
        if (cp.payment_handle) setPaymentHandle(cp.payment_handle);
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

  const saveAndAdvance = async (nextStep: number, profileData: Record<string, any>, creatorData: Record<string, any>) => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from("profiles").update({
        ...profileData,
        onboarding_step: `creator-${nextStep}`,
      }).eq("id", user.id);

      const { data: existing } = await supabase
        .from("creator_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from("creator_profiles").update(creatorData as any).eq("user_id", user.id);
      } else {
        await supabase.from("creator_profiles").insert({ user_id: user.id, ...creatorData } as any);
      }
      setStep(nextStep);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Step 1 — Basics
  const handleStep1 = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({ title: "Please enter your first and last name", variant: "destructive" });
      return;
    }
    let avatarUrl = avatarPreview;
    if (avatarFile && user) {
      try {
        avatarUrl = await uploadImage(avatarFile, "avatars", `${user.id}/avatar`);
      } catch {
        toast({ title: "Failed to upload photo", variant: "destructive" });
        return;
      }
    }
    await saveAndAdvance(2, {
      display_name: `${firstName.trim()} ${lastName.trim()}`,
      avatar_url: avatarUrl,
    }, {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
    });
  };

  // Step 2 — Interests
  const handleStep2 = async () => {
    if (interests.length === 0) {
      toast({ title: "Select at least one interest", variant: "destructive" });
      return;
    }
    await saveAndAdvance(3, {}, { product_interests: interests });
  };

  // Step 3 — Experience
  const handleStep3 = async () => {
    if (!experience) {
      toast({ title: "Select your experience level", variant: "destructive" });
      return;
    }
    await saveAndAdvance(4, {}, { experience_level: experience });
  };

  // Step 4 — Affiliate
  const handleStep4 = async () => {
    if (!affiliate) {
      toast({ title: "Please select an option", variant: "destructive" });
      return;
    }
    await saveAndAdvance(5, {}, { has_tiktok_affiliate: affiliate });
  };

  // Step 5 — Payment
  const handleStep5 = async () => {
    if (!paymentMethod || !paymentHandle.trim()) {
      toast({ title: "Both payment fields are required", variant: "destructive" });
      return;
    }
    await saveAndAdvance(6, {}, {
      payment_method: paymentMethod,
      payment_handle: paymentHandle.trim(),
    });
  };

  // Step 6 — Photos & finish
  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        if (p.file) {
          const url = await uploadImage(p.file, "portfolio", `${user.id}/${i}`);
          urls.push(url);
        } else {
          urls.push(p.previewUrl);
        }
      }
      await supabase.from("profiles").update({
        profile_images: urls,
        onboarding_completed: true,
        onboarding_step: null,
      } as any).eq("id", user.id);
      // Also save to creator_profiles so BrandFeed can read portfolio_urls
      await supabase.from("creator_profiles").update({
        portfolio_urls: urls,
      } as any).eq("user_id", user.id);
      await refreshProfile();
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const goBack = async () => {
    const prev = Math.max(1, step - 1);
    setStep(prev);
    if (user) {
      await supabase.from("profiles").update({ onboarding_step: `creator-${prev}` }).eq("id", user.id);
    }
  };

  return (
    <OnboardingLayout
      currentStep={step}
      totalSteps={TOTAL_STEPS}
      showBack={step > 1}
      onBack={goBack}
      showSkip={step === 6}
      onSkip={async () => {
        if (!user) return;
        await supabase.from("profiles").update({
          onboarding_completed: true,
          onboarding_step: null,
        }).eq("id", user.id);
        await refreshProfile();
        navigate("/dashboard", { replace: true });
      }}
    >
      {/* Step 1 — Welcome & Basics */}
      {step === 1 && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome to GMV.live 👋</h1>
            <p className="mt-2 text-lg text-muted-foreground">Let's set up your creator profile</p>
          </div>

          <ImageUploader
            value={avatarPreview}
            onChange={(file, url) => { setAvatarFile(file); setAvatarPreview(url); }}
            circular
            label="Profile Photo"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="min-h-[48px] text-base"
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="min-h-[48px] text-base"
              />
            </div>
          </div>

          <Button onClick={handleStep1} disabled={saving} className="w-full min-h-[52px] text-base font-semibold">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
          </Button>
        </div>
      )}

      {/* Step 2 — Product Interests */}
      {step === 2 && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">What do you want to sell? 🛍️</h1>
            <p className="mt-2 text-lg text-muted-foreground">Pick the categories that interest you</p>
          </div>

          <ChipSelector
            options={INTEREST_OPTIONS}
            selected={interests}
            onChange={setInterests}
            className="justify-center"
          />

          <Button onClick={handleStep2} disabled={saving || interests.length === 0} className="w-full min-h-[52px] text-base font-semibold">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
          </Button>
        </div>
      )}

      {/* Step 3 — Experience Level */}
      {step === 3 && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Live shopping experience 🎬</h1>
            <p className="mt-2 text-lg text-muted-foreground">How familiar are you with live selling?</p>
          </div>

          <div className="space-y-3">
            {EXPERIENCE_LEVELS.map((level) => (
              <SelectionCard
                key={level.value}
                icon={level.icon}
                title={level.title}
                description={level.description}
                selected={experience === level.value}
                onClick={() => setExperience(level.value)}
              />
            ))}
          </div>

          <Button onClick={handleStep3} disabled={saving || !experience} className="w-full min-h-[52px] text-base font-semibold">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
          </Button>
        </div>
      )}

      {/* Step 4 — TikTok Affiliate */}
      {step === 4 && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">TikTok Shop affiliate 🏪</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Do you have a TikTok Shop affiliate account?
              <span className="block text-sm text-muted-foreground/70 mt-1">(1,000+ followers required)</span>
            </p>
          </div>

          <div className="space-y-3">
            {AFFILIATE_OPTIONS.map((option) => (
              <SelectionCard
                key={option.value}
                icon={option.icon}
                title={option.title}
                description={option.description}
                selected={affiliate === option.value}
                onClick={() => setAffiliate(option.value)}
              />
            ))}
          </div>

          <Button onClick={handleStep4} disabled={saving || !affiliate} className="w-full min-h-[52px] text-base font-semibold">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
          </Button>
        </div>
      )}

      {/* Step 5 — Payment Setup */}
      {step === 5 && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Payment setup 💰</h1>
            <p className="mt-2 text-lg text-muted-foreground">How should brands pay you?</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select
                value={paymentMethod}
                onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}
              >
                <SelectTrigger className="min-h-[48px] text-base">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Handle / ID *</Label>
              <Input
                value={paymentHandle}
                onChange={(e) => setPaymentHandle(e.target.value)}
                placeholder={paymentMethod ? PAYMENT_PLACEHOLDERS[paymentMethod as PaymentMethod] : "Select a method first"}
                className="min-h-[48px] text-base"
              />
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
              <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                This is only shown to brands after your contract is signed
              </p>
            </div>
          </div>

          <Button
            onClick={handleStep5}
            disabled={saving || !paymentMethod || !paymentHandle.trim()}
            className="w-full min-h-[52px] text-base font-semibold"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
          </Button>
        </div>
      )}

      {/* Step 6 — Photos */}
      {step === 6 && (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Show your style 📸</h1>
            <p className="mt-2 text-lg text-muted-foreground">Add photos to help brands see your content style</p>
          </div>

          <MultiImageUploader
            value={photos}
            onChange={setPhotos}
            max={4}
            label="Upload up to 4 photos"
          />

          <Button onClick={handleFinish} disabled={saving} className="w-full min-h-[52px] text-base font-semibold">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Complete Setup 🎉"}
          </Button>
        </div>
      )}
    </OnboardingLayout>
  );
};

export default OnboardingCreator;
