import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Link } from "react-router-dom";
import { Search, MapPin, Star, Users, Sparkles } from "lucide-react";
import { DEMO_CREATORS } from "@/data/demoData";

const NICHE_OPTIONS = ["Beauty", "Fashion", "Tech", "Food", "Fitness", "Lifestyle", "Gaming", "Home"];
const PLATFORM_OPTIONS = ["TikTok", "Instagram", "YouTube", "Facebook"];

const EXPERIENCE_LABELS: Record<string, string> = {
  new: "New Creator",
  some: "Getting Started",
  experienced: "Experienced",
  pro: "Pro",
};

const BrandFeed = () => {
  const [search, setSearch] = useState("");
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [followerRange, setFollowerRange] = useState<[number, number]>([0, 1000000]);

  const { data: creators, isLoading, isError } = useQuery({
    queryKey: ["creators", search],
    queryFn: async () => {
      let q = supabase
        .from("creator_profiles")
        .select("*, public_profiles!creator_profiles_profile_fkey(display_name, avatar_url, bio)")
        .order("created_at", { ascending: false });

      if (search) {
        q = q.or(`niches.cs.{${search}},location.ilike.%${search}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      // Only merge demo creators in development
      if (import.meta.env.DEV) {
        const demoMapped = DEMO_CREATORS
          .filter((d) => {
            if (!search) return true;
            const s = search.toLowerCase();
            return (
              d.niches.some((n) => n.toLowerCase().includes(s)) ||
              d.location.toLowerCase().includes(s) ||
              d.public_profiles.display_name.toLowerCase().includes(s)
            );
          })
          .map((d) => ({ ...d }));
        return [...(data || []), ...demoMapped];
      }
      return data || [];
    },
  });

  const toggleFilter = (value: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const filtered = creators?.filter((c: any) => {
    if (selectedNiches.length > 0 && !c.niches?.some((n: string) => selectedNiches.includes(n))) return false;
    if (selectedPlatforms.length > 0 && !c.platforms?.some((p: string) => selectedPlatforms.includes(p))) return false;
    const fc = c.follower_count ?? 0;
    if (fc < followerRange[0]) return false;
    if (followerRange[1] < 1000000 && fc > followerRange[1]) return false;
    return true;
  });

  const getDisplayRating = (rating: number | null) => {
    const r = Number(rating || 0);
    return r > 0 ? r.toFixed(1) : null;
  };

  return (
    <div className="flex gap-6">
      {/* Left Filter Sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-20 space-y-6 rounded-xl border border-border bg-card p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Niche</h3>
            <div className="space-y-2">
              {NICHE_OPTIONS.map((niche) => (
                <label key={niche} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={selectedNiches.includes(niche)}
                    onCheckedChange={() => toggleFilter(niche, selectedNiches, setSelectedNiches)}
                  />
                  {niche}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Platform</h3>
            <div className="space-y-2">
              {PLATFORM_OPTIONS.map((platform) => (
                <label key={platform} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={selectedPlatforms.includes(platform)}
                    onCheckedChange={() => toggleFilter(platform, selectedPlatforms, setSelectedPlatforms)}
                  />
                  {platform}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Followers</h3>
            <Slider
              min={0}
              max={1000000}
              step={10000}
              value={followerRange}
              onValueChange={(v) => setFollowerRange(v as [number, number])}
            />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{(followerRange[0] / 1000).toFixed(0)}k</span>
              <span>{followerRange[1] >= 1000000 ? "1M+" : `${(followerRange[1] / 1000).toFixed(0)}k`}</span>
            </div>
          </div>

          {(selectedNiches.length > 0 || selectedPlatforms.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => { setSelectedNiches([]); setSelectedPlatforms([]); setFollowerRange([0, 1000000]); }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {filtered?.length ?? 0} verified creators available
          </h1>
        </div>

        {/* Mobile search */}
        <div className="relative lg:hidden">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by niche, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border bg-card">
                <div className="aspect-[3/2] rounded-t-xl bg-muted" />
                <div className="space-y-3 p-4">
                  <div className="h-5 w-2/3 rounded bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <p className="py-12 text-center text-muted-foreground">Something went wrong loading creators. Please try refreshing the page.</p>
        ) : filtered?.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No creators match your filters. Try adjusting your search or clearing filters.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered?.map((creator: any) => (
              <Link
                key={creator.id}
                to={`/creators/${creator.user_id}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
              >
                {/* Hero photo */}
                <div className="relative aspect-[3/2] w-full overflow-hidden bg-muted">
                  {creator.portfolio_urls?.[0] ? (
                    <img
                      src={creator.portfolio_urls[0]}
                      alt={creator.public_profiles?.display_name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                      <Users className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  {getDisplayRating(creator.rating) ? (
                    <Badge className="absolute right-3 top-3 shadow-sm">
                      <Star className="mr-1 h-3 w-3 fill-current" />
                      {getDisplayRating(creator.rating)}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="absolute right-3 top-3 shadow-sm">
                      New
                    </Badge>
                  )}
                </div>

                {/* Info section */}
                <div className="flex flex-col gap-3 p-4">
                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    {getDisplayRating(creator.rating) ? (
                      <span className="flex items-center gap-0.5 font-medium text-foreground">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {getDisplayRating(creator.rating)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5" />
                        New
                      </span>
                    )}
                    {(creator.follower_count ?? 0) > 0 ? (
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {(creator.follower_count).toLocaleString()} followers
                      </span>
                    ) : creator.experience_level ? (
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="mr-1 h-3 w-3" />
                        {EXPERIENCE_LABELS[creator.experience_level] || creator.experience_level}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="mr-1 h-3 w-3" />
                        New Creator
                      </Badge>
                    )}
                    {creator.avg_gmv > 0 && (
                      <span className="font-medium text-foreground">
                        ${Number(creator.avg_gmv).toLocaleString()} avg GMV
                      </span>
                    )}
                  </div>

                  {/* Avatar + Name + Location */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                      <AvatarImage src={creator.public_profiles?.avatar_url} />
                      <AvatarFallback className="text-xs font-medium">
                        {(creator.public_profiles?.display_name || "C").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <span className="truncate text-base font-semibold text-foreground block">
                        {creator.public_profiles?.display_name || "Creator"}
                      </span>
                      {creator.location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{creator.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {creator.public_profiles?.bio && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{creator.public_profiles.bio}</p>
                  )}

                  {/* Tags: niches + product interests */}
                  <div className="flex flex-wrap gap-1.5">
                    {creator.niches?.slice(0, 3).map((n: string) => (
                      <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>
                    ))}
                    {creator.product_interests?.slice(0, 2).map((interest: string) => (
                      <Badge key={interest} variant="outline" className="text-xs">{interest}</Badge>
                    ))}
                    {creator.platforms?.slice(0, 2).map((p: string) => (
                      <Badge key={`plat-${p}`} variant="outline" className="text-xs">{p}</Badge>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandFeed;
