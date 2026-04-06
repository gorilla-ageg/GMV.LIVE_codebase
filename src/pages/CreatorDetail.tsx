import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import ReportButton from "@/components/ReportButton";
import OfferModal from "@/components/deals/OfferModal";
import { useState } from "react";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  MapPin,
  Star,
  Users,
  TrendingUp,
  Music,
  Camera,
  Play,
  ExternalLink,
  CheckCircle2,
  Zap,
} from "lucide-react";
interface SocialCreator {
  tiktok_handle?: string | null;
  instagram_handle?: string | null;
  youtube_handle?: string | null;
  facebook_handle?: string | null;
  twitter_handle?: string | null;
}

const getSocialUrl = (platform: string, creator: SocialCreator): string | null => {
  const map: Record<string, { handle: string | null | undefined; urlPrefix: string }> = {
    TikTok: { handle: creator.tiktok_handle, urlPrefix: "https://tiktok.com/@" },
    Instagram: { handle: creator.instagram_handle, urlPrefix: "https://instagram.com/" },
    YouTube: { handle: creator.youtube_handle, urlPrefix: "https://youtube.com/@" },
    Facebook: { handle: creator.facebook_handle, urlPrefix: "https://facebook.com/" },
    "X (Twitter)": { handle: creator.twitter_handle, urlPrefix: "https://x.com/" },
    Twitter: { handle: creator.twitter_handle, urlPrefix: "https://x.com/" },
  };
  const entry = map[platform];
  if (!entry?.handle) return null;
  return entry.urlPrefix + entry.handle.replace(/^@/, "");
};

const CreatorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [offerOpen, setOfferOpen] = useState(false);

  const { data: creator, isLoading } = useQuery({
    queryKey: ["creator", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creator_profiles")
        .select("*, public_profiles!creator_profiles_profile_fkey(display_name, avatar_url, bio)")
        .eq("user_id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleStartConversation = async () => {
    if (!user || !creator) return;

    // Check for existing conversations (use limit(1) to avoid maybeSingle error with multiple rows)
    const { data: existingRows } = await supabase
      .from("conversations")
      .select("id, deals(id)")
      .eq("brand_user_id", user.id)
      .eq("creator_user_id", creator.user_id)
      .limit(1);

    const existing = existingRows?.[0];

    if (existing) {
      // If deal exists, go to deal room; otherwise create one
      const dealId = (existing.deals as { id: string }[])?.[0]?.id;
      if (dealId) {
        navigate(`/deals/${dealId}`);
      } else {
        // Check if a deal already exists (race condition guard)
        const { data: existingDeal } = await supabase
          .from("deals")
          .select("id")
          .eq("conversation_id", existing.id)
          .limit(1)
          .maybeSingle();
        if (existingDeal) {
          navigate(`/deals/${existingDeal.id}`);
          return;
        }
        const { data: deal, error } = await supabase
          .from("deals")
          .insert({ conversation_id: existing.id, status: "negotiating" as never })
          .select()
          .single();
        if (error) {
          // If duplicate key error, find the existing deal
          if (error.code === "23505") {
            const { data: fallback } = await supabase
              .from("deals").select("id").eq("conversation_id", existing.id).limit(1).maybeSingle();
            if (fallback) { navigate(`/deals/${fallback.id}`); return; }
          }
          toast({ title: "Error", description: error.message, variant: "destructive" });
          return;
        }
        navigate(`/deals/${deal.id}`);
      }
      return;
    }

    // Create conversation + deal
    const { data: convo, error: convoErr } = await supabase
      .from("conversations")
      .insert({ brand_user_id: user.id, creator_user_id: creator.user_id })
      .select()
      .single();
    if (convoErr) {
      // If conversation already exists (race condition), retry lookup
      if (convoErr.code === "23505") {
        return handleStartConversation();
      }
      toast({ title: "Error", description: convoErr.message, variant: "destructive" });
      return;
    }

    const { data: deal, error: dealErr } = await supabase
      .from("deals")
      .insert({ conversation_id: convo.id, status: "negotiating" as never })
      .select()
      .single();
    if (dealErr) {
      if (dealErr.code === "23505") {
        const { data: fallback } = await supabase
          .from("deals").select("id").eq("conversation_id", convo.id).limit(1).maybeSingle();
        if (fallback) { navigate(`/deals/${fallback.id}`); return; }
      }
      toast({ title: "Error", description: dealErr.message, variant: "destructive" });
      return;
    }

    navigate(`/deals/${deal.id}`);
  };

  const sendOfferMutation = useMutation({
    mutationFn: async (offer: { rate: number; deliverables: string; liveDate: string; usageRights: string[]; note: string }) => {
      if (!user || !creator) return;
      let convoId: string;
      let dealId: string;

      // Check for existing conversations (use limit(1) to avoid maybeSingle error with multiple rows)
      const { data: existingRows } = await supabase
        .from("conversations")
        .select("id, deals(id)")
        .eq("brand_user_id", user.id)
        .eq("creator_user_id", creator.user_id)
        .limit(1);

      const existing = existingRows?.[0];

      if (existing) {
        convoId = existing.id;
        const existingDeal = (existing.deals as { id: string }[])?.[0];
        if (existingDeal) {
          dealId = existingDeal.id;
        } else {
          // Double-check for deal before inserting (race condition guard)
          const { data: checkDeal } = await supabase
            .from("deals").select("id").eq("conversation_id", convoId).limit(1).maybeSingle();
          if (checkDeal) {
            dealId = checkDeal.id;
          } else {
            const { data: deal, error: dealErr } = await supabase
              .from("deals")
              .insert({ conversation_id: convoId, status: "negotiating" as never })
              .select()
              .single();
            if (dealErr) {
              if (dealErr.code === "23505") {
                const { data: fb } = await supabase
                  .from("deals").select("id").eq("conversation_id", convoId).limit(1).maybeSingle();
                if (fb) { dealId = fb.id; } else throw dealErr;
              } else throw dealErr;
            } else {
              dealId = deal.id;
            }
          }
        }
      } else {
        const { data: convo, error } = await supabase
          .from("conversations")
          .insert({ brand_user_id: user.id, creator_user_id: creator.user_id })
          .select()
          .single();
        if (error) throw error;
        convoId = convo.id;

        const { data: deal, error: dealErr } = await supabase
          .from("deals")
          .insert({ conversation_id: convoId, status: "negotiating" as never })
          .select()
          .single();
        if (dealErr) throw dealErr;
        dealId = deal.id;
      }

      await supabase.from("deal_offers").insert({
        deal_id: dealId!,
        sender_id: user.id,
        rate: offer.rate,
        hourly_rate: 0,
        hours: 0,
        commission_percentage: 0,
        deliverables: offer.deliverables,
        live_date: offer.liveDate || null,
        usage_rights: offer.usageRights,
        note: offer.note || null,
        status: "pending",
      } as never);

      // Best-effort system message (don't throw on failure)
      await supabase.from("messages").insert({
        conversation_id: convoId,
        sender_id: user.id,
        content: `New offer: $${offer.rate.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        message_type: "offer",
        metadata: { offer_rate: offer.rate },
      }).then(() => {});

      navigate(`/deals/${dealId!}`);
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-48 rounded-2xl bg-muted" />
          <div className="flex gap-4 items-end -mt-12 ml-6">
            <div className="h-24 w-24 rounded-full bg-muted border-4 border-background" />
            <div className="space-y-2 pb-2">
              <div className="h-6 w-40 rounded bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!creator) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg text-muted-foreground">Creator not found.</p>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeft className="mr-1 h-4 w-4" /> Go Back
          </Button>
        </div>
      </AppLayout>
    );
  }

  const profile = (creator as Record<string, unknown>).public_profiles as { display_name?: string; avatar_url?: string; bio?: string } | undefined;
  const displayName = profile?.display_name || "Creator";
  const initials = displayName.slice(0, 2).toUpperCase();
  const portfolioImages = creator.portfolio_urls?.filter(Boolean) || [];
  const heroImage = portfolioImages[0];

  const stats = [
    { icon: Users, label: "Followers", value: (creator.follower_count ?? 0).toLocaleString(), color: "text-accent" },
    { icon: TrendingUp, label: "Avg GMV", value: `$${Number(creator.avg_gmv || 0).toLocaleString()}`, color: "text-primary" },
    { icon: Star, label: "Rating", value: Number(creator.rating || 0) > 0 ? `${Number(creator.rating).toFixed(1)}/5` : "New", color: "text-amber-400" },
    { icon: Music, label: "Streams", value: creator.past_collabs?.length?.toString() || "0", color: "text-accent" },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="aspect-[3/1] w-full overflow-hidden bg-gradient-to-br from-primary/20 via-card to-accent/20">
            {heroImage && (
              <img
                src={heroImage}
                alt={`${displayName} portfolio`}
                className="h-full w-full object-cover opacity-60"
              />
            )}
          </div>
          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </div>

        {/* Avatar + Name + CTA row */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 relative z-10 px-2">
          <Avatar className="h-28 w-28 border-4 border-background shadow-xl ring-2 ring-primary/30">
            <AvatarImage src={profile?.avatar_url} alt={displayName} />
            <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{displayName}</h1>
              <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
            </div>
            {creator.tiktok_handle && (
              <p className="text-sm text-muted-foreground mt-0.5">@{creator.tiktok_handle}</p>
            )}
            {creator.location && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3.5 w-3.5" /> {creator.location}
              </p>
            )}
          </div>

          {/* CTA buttons */}
          <div className="flex gap-2 sm:pb-1 shrink-0">
            <Button variant="outline" onClick={handleStartConversation} className="gap-2">
              <MessageSquare className="h-4 w-4" /> Message
            </Button>
            {role === "brand" && (
              <Button onClick={() => setOfferOpen(true)} className="gap-2">
                <Send className="h-4 w-4" /> Send Offer
              </Button>
            )}
            <ReportButton reportType="user" reportedUserId={creator.user_id} variant="icon" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-border bg-card/50 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                <stat.icon className={`h-5 w-5 ${stat.color} mb-1.5`} />
                <span className="text-lg font-bold text-foreground">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bio + Details */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column: Bio + Tags */}
          <div className="lg:col-span-2 space-y-5">
            {profile?.bio && (
              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">About</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{profile.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Portfolio Gallery */}
            {portfolioImages.length > 0 && (
              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Portfolio</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {portfolioImages.map((url: string, idx: number) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
                      >
                        <img
                          src={url}
                          alt={`${displayName} portfolio ${idx + 1}`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-background/0 group-hover:bg-background/30 transition-colors flex items-center justify-center">
                          <ExternalLink className="h-5 w-5 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column: Details sidebar */}
          <div className="space-y-4">
            {/* Social Handles */}
            {(creator.tiktok_handle || creator.instagram_handle || creator.youtube_handle) && (
              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Socials</h2>
                  <div className="space-y-2.5">
                    {creator.tiktok_handle && (
                      <a
                        href={`https://tiktok.com/@${creator.tiktok_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors">
                          <Music className="h-4 w-4 text-foreground" />
                        </div>
                        <div>
                          <span className="font-medium text-foreground block text-xs">TikTok</span>
                          <span className="text-xs">@{creator.tiktok_handle}</span>
                        </div>
                        <ExternalLink className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                    {creator.instagram_handle && (
                      <a
                        href={`https://instagram.com/${creator.instagram_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors">
                          <Camera className="h-4 w-4 text-foreground" />
                        </div>
                        <div>
                          <span className="font-medium text-foreground block text-xs">Instagram</span>
                          <span className="text-xs">@{creator.instagram_handle}</span>
                        </div>
                        <ExternalLink className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                    {creator.youtube_handle && (
                      <a
                        href={`https://youtube.com/@${creator.youtube_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors">
                          <Play className="h-4 w-4 text-foreground" />
                        </div>
                        <div>
                          <span className="font-medium text-foreground block text-xs">YouTube</span>
                          <span className="text-xs">@{creator.youtube_handle}</span>
                        </div>
                        <ExternalLink className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Niches */}
            {creator.niches && creator.niches.length > 0 && (
              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Niches</h2>
                  <div className="flex flex-wrap gap-2">
                    {creator.niches.map((n: string) => (
                      <Badge key={n} className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">{n}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Platforms */}
            {creator.platforms && creator.platforms.length > 0 && (
              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Platforms</h2>
                  <div className="flex flex-wrap gap-2">
                    {creator.platforms.map((p: string) => {
                      const handle = getSocialUrl(p, creator);
                      if (handle) {
                        return (
                          <a key={p} href={handle} target="_blank" rel="noopener noreferrer">
                            <Badge variant="outline" className="border-accent/30 text-accent hover:bg-accent/10 cursor-pointer gap-1">
                              {p} <ExternalLink className="h-3 w-3" />
                            </Badge>
                          </a>
                        );
                      }
                      return <Badge key={p} variant="outline" className="border-accent/30 text-accent">{p}</Badge>;
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audience Type */}
            {creator.audience_type && (
              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Audience</h2>
                  <p className="text-sm text-muted-foreground">{creator.audience_type}</p>
                </CardContent>
              </Card>
            )}

            {/* Past Collabs */}
            {creator.past_collabs && creator.past_collabs.length > 0 && (
              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Past Collabs</h2>
                  <div className="space-y-2">
                    {creator.past_collabs.map((collab: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{collab}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Offer CTA (sticky feel on desktop) */}
            {role === "brand" && (
              <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="p-5 text-center">
                  <p className="text-sm font-medium text-foreground mb-3">Ready to collaborate?</p>
                  <Button onClick={() => setOfferOpen(true)} className="w-full gap-2">
                    <Send className="h-4 w-4" /> Send Offer
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <OfferModal
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
        onSubmit={(o) => sendOfferMutation.mutate(o)}
        isPending={sendOfferMutation.isPending}
      />
    </AppLayout>
  );
};

export default CreatorDetail;
