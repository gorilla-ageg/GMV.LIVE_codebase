import { useState, useEffect } from "react";
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
import { User, Shield, Bell, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

type Section = "profile" | "account" | "notifications";

const Settings = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [section, setSection] = useState<Section>("profile");
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
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (profile) {
        setDisplayName(profile.display_name || "");
        setBio(profile.bio || "");
        if (profile.avatar_url) setAvatarPreview(profile.avatar_url);
      }
      if (role === "creator") {
        const { data: cp } = await supabase.from("creator_profiles").select("*").eq("user_id", user.id).single();
        if (cp) {
          setPlatforms(cp.platforms || []);
          setNiches(cp.niches || []);
          setTiktokHandle((cp as any).tiktok_handle || "");
          setInstagramHandle((cp as any).instagram_handle || "");
          setYoutubeHandle((cp as any).youtube_handle || "");
          setTwitterHandle((cp as any).twitter_handle || "");
          setFacebookHandle((cp as any).facebook_handle || "");
          setAudience((cp as any).audience_type ? [(cp as any).audience_type] : []);
        }
      }
      if (role === "brand") {
        const { data: bp } = await supabase.from("brand_profiles").select("*").eq("user_id", user.id).single();
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
      await supabase.from("profiles").update({ display_name: displayName, bio, avatar_url: avatarUrl }).eq("id", user.id);

      if (role === "creator") {
        await supabase.from("creator_profiles").update({
          platforms, niches,
          tiktok_handle: tiktokHandle || null,
          instagram_handle: instagramHandle || null,
          youtube_handle: youtubeHandle || null,
          twitter_handle: twitterHandle || null,
          facebook_handle: facebookHandle || null,
          audience_type: audience[0] || null,
        } as any).eq("user_id", user.id);
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
        await supabase.from("brand_profiles").update({
          company_name: brandName, website: website || null, logo_url: logoUrl,
          industries: industries as any, campaign_images: uploadedCampaign as any,
        }).eq("user_id", user.id);
      }

      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const sidebarItems: { key: Section; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "Profile Info", icon: <User className="h-4 w-4" /> },
    { key: "account", label: "Account & Security", icon: <Shield className="h-4 w-4" /> },
    { key: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Sidebar */}
        <div className="w-full shrink-0 md:w-56">
          <nav className="flex flex-row gap-1 md:flex-col">
            {sidebarItems.map((item) => (
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
