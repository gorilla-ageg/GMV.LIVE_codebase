import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import ChipSelector from "@/components/onboarding/ChipSelector";
import ImageUploader from "@/components/onboarding/ImageUploader";
import MultiImageUploader from "@/components/onboarding/MultiImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Shield, Bell, CreditCard, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

const INDUSTRY_OPTIONS = [
  "Beauty", "Fashion", "Food & Beverage", "Tech", "Sports", "Home",
  "Health", "Entertainment", "Gaming", "Pet", "Finance", "Other",
];
const NICHE_OPTIONS = [
  "Beauty", "Fashion", "Lifestyle", "Food", "Gaming", "Fitness",
  "Comedy", "Tech", "Travel", "Education", "Finance", "Other",
];
const PLATFORM_OPTIONS = ["TikTok", "Instagram", "YouTube"];
const AUDIENCE_OPTIONS = ["Gen Z", "Millennials", "Parents", "Professionals", "Mixed"];

type Section = "profile" | "account" | "notifications" | "payment";

const Settings = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();

  const location = useLocation();
  const [section, setSection] = useState<Section>(
    location.pathname.includes("/payment") ? "payment" : "profile"
  );

  // Keep section in sync with URL changes
  useEffect(() => {
    if (location.pathname.includes("/payment")) setSection("payment");
    else if (location.pathname.includes("/profile")) setSection("profile");
  }, [location.pathname]);
  const [saving, setSaving] = useState(false);

  // Common
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Creator
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [niches, setNiches] = useState<string[]>([]);
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [youtubeHandle, setYoutubeHandle] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [facebookHandle, setFacebookHandle] = useState("");
  const [audience, setAudience] = useState<string[]>([]);

  // Creator — payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [paymentHandle, setPaymentHandle] = useState("");
  const [editingPayment, setEditingPayment] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  // Brand
  const [brandName, setBrandName] = useState("");
  const [website, setWebsite] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [campaignImages, setCampaignImages] = useState<{ file: File | null; previewUrl: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (profileError) {
        console.error("Failed to load profile:", profileError);
      }
      if (profile) {
        setDisplayName(profile.display_name || "");
        setBio(profile.bio || "");
        if (profile.avatar_url) setAvatarPreview(profile.avatar_url);
      }
      if (role === "creator") {
        const { data: cp, error: cpError } = await supabase.from("creator_profiles").select("*").eq("user_id", user.id).maybeSingle();
        if (cpError) console.error("Failed to load creator profile:", cpError);
        if (cp) {
          setPlatforms(cp.platforms || []);
          setNiches(cp.niches || []);
          setTiktokHandle((cp as any).tiktok_handle || "");
          setInstagramHandle((cp as any).instagram_handle || "");
          setYoutubeHandle((cp as any).youtube_handle || "");
          setTwitterHandle((cp as any).twitter_handle || "");
          setFacebookHandle((cp as any).facebook_handle || "");
          setAudience((cp as any).audience_type ? [(cp as any).audience_type] : []);
          if (cp.payment_method) setPaymentMethod(cp.payment_method as PaymentMethod);
          if (cp.payment_handle) setPaymentHandle(cp.payment_handle);
        }
      }
      if (role === "brand") {
        const { data: bp, error: bpError } = await supabase.from("brand_profiles").select("*").eq("user_id", user.id).maybeSingle();
        if (bpError) console.error("Failed to load brand profile:", bpError);
        if (bp) {
          setBrandName(bp.company_name || "");
          setWebsite(bp.website || "");
          setIndustries((bp as any).industries || []);
          if (bp.logo_url) setLogoPreview(bp.logo_url);
          if ((bp as any).campaign_images?.length) {
            setCampaignImages((bp as any).campaign_images.map((url: string) => ({ file: null, previewUrl: url })));
          }
        }
      }
    };
    load();
  }, [user, role]);

  const uploadImage = async (file: File, bucket: string, path: string): Promise<string> => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let avatarUrl = avatarPreview;
      if (avatarFile) {
        avatarUrl = await uploadImage(avatarFile, "avatars", `${user.id}/avatar`);
      }
      const { error: profileUpdateError } = await supabase.from("profiles").update({ display_name: displayName, bio, avatar_url: avatarUrl }).eq("id", user.id);
      if (profileUpdateError) throw profileUpdateError;

      if (role === "creator") {
        const { error: creatorUpdateError } = await supabase.from("creator_profiles").update({
          platforms, niches,
          tiktok_handle: tiktokHandle || null,
          instagram_handle: instagramHandle || null,
          youtube_handle: youtubeHandle || null,
          twitter_handle: twitterHandle || null,
          facebook_handle: facebookHandle || null,
          audience_type: audience[0] || null,
        } as any).eq("user_id", user.id);
        if (creatorUpdateError) throw creatorUpdateError;
      }

      if (role === "brand") {
        let logoUrl = logoPreview;
        if (logoFile) {
          logoUrl = await uploadImage(logoFile, "avatars", `${user.id}/logo`);
        }
        const uploadedCampaign: string[] = [];
        for (let i = 0; i < campaignImages.length; i++) {
          const item = campaignImages[i];
          if (item.file) {
            const url = await uploadImage(item.file, "product-images", `${user.id}/campaign-${i}`);
            uploadedCampaign.push(url);
          } else {
            uploadedCampaign.push(item.previewUrl);
          }
        }
        const { error: brandUpdateError } = await supabase.from("brand_profiles").update({
          company_name: brandName, website: website || null, logo_url: logoUrl,
          industries: industries as any, campaign_images: uploadedCampaign as any,
        }).eq("user_id", user.id);
        if (brandUpdateError) throw brandUpdateError;
      }

      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayment = async () => {
    if (!user || !paymentMethod || !paymentHandle.trim()) {
      toast({ title: "Both fields are required", variant: "destructive" });
      return;
    }
    setSavingPayment(true);
    try {
      const { error } = await supabase
        .from("creator_profiles")
        .update({
          payment_method: paymentMethod,
          payment_handle: paymentHandle.trim(),
        })
        .eq("user_id", user.id);
      if (error) throw error;
      setEditingPayment(false);
      toast({ title: "Payment info updated" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSavingPayment(false);
    }
  };

  const maskHandle = (handle: string): string => {
    if (!handle || handle.length <= 4) return handle;
    return handle.slice(0, handle.length > 6 ? 4 : 3) + "****";
  };

  const sidebarItems: { key: Section; label: string; icon: React.ReactNode; creatorOnly?: boolean }[] = [
    { key: "profile", label: "Profile Info", icon: <User className="h-4 w-4" /> },
    { key: "payment", label: "Payment", icon: <CreditCard className="h-4 w-4" />, creatorOnly: true },
    { key: "account", label: "Account & Security", icon: <Shield className="h-4 w-4" /> },
    { key: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Sidebar */}
        <div className="w-full shrink-0 md:w-56">
          <nav className="flex flex-row gap-1 md:flex-col">
            {sidebarItems.filter((item) => !item.creatorOnly || role === "creator").map((item) => (
              <button
                key={item.key}
                onClick={() => setSection(item.key)}
                className={cn(
                  "flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  section === item.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {section === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ImageUploader
                  value={avatarPreview}
                  onChange={(file, url) => { setAvatarFile(file); setAvatarPreview(url); }}
                  circular
                  label="Profile Photo"
                />

                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="min-h-[44px]" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Bio</Label>
                    <span className="text-xs text-muted-foreground">{bio.length}/160</span>
                  </div>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 160))}
                    className="min-h-[80px] resize-none"
                    maxLength={160}
                  />
                </div>

                {role === "creator" && (
                  <>
                    <div className="space-y-2">
                      <Label>Platforms</Label>
                      <ChipSelector options={PLATFORM_OPTIONS} selected={platforms} onChange={setPlatforms} />
                    </div>
                    <h3 className="text-sm font-medium text-muted-foreground pt-2">Social Media Handles</h3>
                    <div className="space-y-2">
                      <Label>TikTok</Label>
                      <Input value={tiktokHandle} onChange={(e) => setTiktokHandle(e.target.value)} placeholder="@yourhandle" className="min-h-[44px]" />
                    </div>
                    <div className="space-y-2">
                      <Label>Instagram</Label>
                      <Input value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} placeholder="@yourhandle" className="min-h-[44px]" />
                    </div>
                    <div className="space-y-2">
                      <Label>YouTube</Label>
                      <Input value={youtubeHandle} onChange={(e) => setYoutubeHandle(e.target.value)} placeholder="@yourchannel" className="min-h-[44px]" />
                    </div>
                    <div className="space-y-2">
                      <Label>X (Twitter)</Label>
                      <Input value={twitterHandle} onChange={(e) => setTwitterHandle(e.target.value)} placeholder="@yourhandle" className="min-h-[44px]" />
                    </div>
                    <div className="space-y-2">
                      <Label>Facebook</Label>
                      <Input value={facebookHandle} onChange={(e) => setFacebookHandle(e.target.value)} placeholder="yourpage" className="min-h-[44px]" />
                    </div>
                    <div className="space-y-2">
                      <Label>Content Niches</Label>
                      <ChipSelector options={NICHE_OPTIONS} selected={niches} onChange={setNiches} />
                    </div>
                    <div className="space-y-2">
                      <Label>Audience</Label>
                      <ChipSelector options={AUDIENCE_OPTIONS} selected={audience} onChange={setAudience} multiSelect={false} />
                    </div>
                  </>
                )}

                {role === "brand" && (
                  <>
                    <div className="space-y-2">
                      <Label>Brand Name</Label>
                      <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} className="min-h-[44px]" />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="min-h-[44px]" />
                    </div>
                    <ImageUploader
                      value={logoPreview}
                      onChange={(file, url) => { setLogoFile(file); setLogoPreview(url); }}
                      label="Brand Logo"
                    />
                    <div className="space-y-2">
                      <Label>Industries</Label>
                      <ChipSelector options={INDUSTRY_OPTIONS} selected={industries} onChange={setIndustries} />
                    </div>
                    <MultiImageUploader
                      value={campaignImages}
                      onChange={setCampaignImages}
                      max={3}
                      label="Campaign Images"
                    />
                  </>
                )}

                <div className="sticky bottom-4 pt-4">
                  <Button onClick={handleSave} disabled={saving} className="w-full min-h-[44px]">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {section === "payment" && role === "creator" && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!editingPayment && paymentMethod && paymentHandle ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Method</span>
                        <span className="text-sm font-medium text-foreground">{paymentMethod}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Handle</span>
                        <span className="text-sm font-medium text-foreground font-mono">
                          {maskHandle(paymentHandle)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Lock className="h-4 w-4 shrink-0" />
                      Only shared with brands after contract is signed
                    </div>

                    <Button variant="outline" onClick={() => setEditingPayment(true)}>
                      Edit Payment Info
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Payment Method *</Label>
                      <Select
                        value={paymentMethod}
                        onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}
                      >
                        <SelectTrigger className="min-h-[44px]">
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
                        className="min-h-[44px]"
                      />
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Lock className="h-4 w-4 shrink-0" />
                      Only shared with brands after contract is signed
                    </div>

                    <Button
                      onClick={handleSavePayment}
                      disabled={savingPayment || !paymentMethod || !paymentHandle.trim()}
                      className="w-full min-h-[44px]"
                    >
                      {savingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Payment Info"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {section === "account" && (
            <Card>
              <CardHeader>
                <CardTitle>Account & Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Email: {user?.email}
                </p>
                <p className="mt-4 text-sm text-muted-foreground">
                  To change your password, use the "Forgot Password" option on the login page.
                </p>
              </CardContent>
            </Card>
          )}

          {section === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Email notifications are enabled by default. More notification options will be available soon.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
