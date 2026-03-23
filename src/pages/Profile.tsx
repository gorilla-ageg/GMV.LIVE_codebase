import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Settings, MapPin, Users, Star, TrendingUp, ExternalLink } from "lucide-react";

const Profile = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: creatorProfile } = useQuery({
    queryKey: ["my-creator-profile"],
    queryFn: async () => {
      const { data } = await supabase.from("creator_profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user && role === "creator",
  });

  const { data: brandProfile } = useQuery({
    queryKey: ["my-brand-profile"],
    queryFn: async () => {
      const { data } = await supabase.from("brand_profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user && role === "brand",
  });

  const initials = (profile?.display_name || "")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-5">
              <Avatar className="h-20 w-20">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.display_name} />}
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-foreground">{profile?.display_name}</h1>
                  <Button variant="outline" size="sm" onClick={() => navigate("/settings/profile")}>
                    <Settings className="mr-1 h-4 w-4" /> Edit Profile
                  </Button>
                </div>
                <Badge variant="secondary" className="capitalize">{role}</Badge>
                {profile?.bio && <p className="text-sm text-muted-foreground mt-2">{profile.bio}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Creator Details */}
        {role === "creator" && creatorProfile && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Followers", value: creatorProfile.follower_count?.toLocaleString() || "0", icon: Users },
                { label: "Avg GMV", value: `$${creatorProfile.avg_gmv?.toLocaleString() || "0"}`, icon: TrendingUp },
                { label: "Rating", value: creatorProfile.rating?.toFixed(1) || "0.0", icon: Star },
                { label: "Experience", value: creatorProfile.experience_level || "—", icon: TrendingUp },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="flex flex-col items-center py-4 text-center">
                    <stat.icon className="mb-1 h-4 w-4 text-muted-foreground" />
                    <span className="text-lg font-bold text-foreground">{stat.value}</span>
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Interests & Details */}
            <Card>
              <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {creatorProfile.product_interests && creatorProfile.product_interests.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Product Interests</p>
                    <div className="flex flex-wrap gap-1.5">
                      {creatorProfile.product_interests.map((i: string) => (
                        <Badge key={i} variant="outline">{i}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {creatorProfile.niches && creatorProfile.niches.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Content Niches</p>
                    <div className="flex flex-wrap gap-1.5">
                      {creatorProfile.niches.map((n: string) => (
                        <Badge key={n} variant="outline">{n}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {creatorProfile.platforms && creatorProfile.platforms.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Platforms</p>
                    <div className="flex flex-wrap gap-1.5">
                      {creatorProfile.platforms.map((p: string) => (
                        <Badge key={p} variant="outline">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {creatorProfile.has_tiktok_affiliate && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">TikTok Affiliate</p>
                    <p className="text-sm text-foreground capitalize">{creatorProfile.has_tiktok_affiliate === "yes" ? "Active" : "Needs Setup"}</p>
                  </div>
                )}
                {creatorProfile.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {creatorProfile.location}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social Links */}
            {(creatorProfile.tiktok_handle || creatorProfile.instagram_handle || creatorProfile.youtube_handle) && (
              <Card>
                <CardHeader><CardTitle className="text-base">Social Media</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: "TikTok", handle: creatorProfile.tiktok_handle, url: (h: string) => `https://tiktok.com/@${h}` },
                    { label: "Instagram", handle: creatorProfile.instagram_handle, url: (h: string) => `https://instagram.com/${h}` },
                    { label: "YouTube", handle: creatorProfile.youtube_handle, url: (h: string) => `https://youtube.com/@${h}` },
                    { label: "X", handle: creatorProfile.twitter_handle, url: (h: string) => `https://x.com/${h}` },
                    { label: "Facebook", handle: creatorProfile.facebook_handle, url: (h: string) => `https://facebook.com/${h}` },
                  ]
                    .filter((s) => s.handle)
                    .map((s) => (
                      <a
                        key={s.label}
                        href={s.url(s.handle!)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> {s.label}: @{s.handle}
                      </a>
                    ))}
                </CardContent>
              </Card>
            )}

            {/* Portfolio Images */}
            {profile?.profile_images && profile.profile_images.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Portfolio</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {profile.profile_images.map((url: string, i: number) => (
                      <img key={i} src={url} alt={`Portfolio ${i + 1}`} className="aspect-square rounded-lg border border-border object-cover" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Brand Details */}
        {role === "brand" && brandProfile && (
          <Card>
            <CardHeader><CardTitle className="text-base">Brand Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {brandProfile.company_name && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Company</p>
                  <p className="text-sm text-foreground">{brandProfile.company_name}</p>
                </div>
              )}
              {brandProfile.website && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Website</p>
                  <a href={brandProfile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                    <ExternalLink className="h-3.5 w-3.5" /> {brandProfile.website}
                  </a>
                </div>
              )}
              {brandProfile.industries && brandProfile.industries.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Industries</p>
                  <div className="flex flex-wrap gap-1.5">
                    {brandProfile.industries.map((i: string) => (
                      <Badge key={i} variant="outline">{i}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {brandProfile.campaign_images && brandProfile.campaign_images.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Campaign Images</p>
                  <div className="grid grid-cols-3 gap-3">
                    {brandProfile.campaign_images.map((url: string, i: number) => (
                      <img key={i} src={url} alt={`Campaign ${i + 1}`} className="aspect-square rounded-lg border border-border object-cover" />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Profile;
