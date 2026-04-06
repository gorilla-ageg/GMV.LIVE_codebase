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
import { Search, DollarSign, TrendingUp, Package } from "lucide-react";


const CATEGORY_OPTIONS = ["Beauty", "Tech", "Fashion", "Health", "Home", "Food", "Pets", "Fitness"];
const PLATFORM_OPTIONS = ["TikTok", "Instagram", "YouTube", "Facebook", "Amazon Live"];

const CreatorFeed = () => {
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 5000]);

  const { data: products, isLoading, isError } = useQuery({
    queryKey: ["products", search],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("*, public_profiles!products_brand_profile_fkey(display_name, avatar_url)")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (search) {
        q = q.or(`title.ilike.%${search}%,category.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const toggleFilter = (value: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const filtered = products?.filter((p: typeof products[number]) => {
    if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
    if (selectedPlatforms.length > 0 && !p.target_platforms?.some((tp: string) => selectedPlatforms.includes(tp))) return false;
    const min = p.budget_min ?? 0;
    if (min < budgetRange[0]) return false;
    if (budgetRange[1] < 5000 && min > budgetRange[1]) return false;
    return true;
  });

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
            <h3 className="mb-3 text-sm font-semibold text-foreground">Category</h3>
            <div className="space-y-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <label key={cat} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={selectedCategories.includes(cat)}
                    onCheckedChange={() => toggleFilter(cat, selectedCategories, setSelectedCategories)}
                  />
                  {cat}
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
            <h3 className="mb-3 text-sm font-semibold text-foreground">Budget</h3>
            <Slider
              min={0}
              max={5000}
              step={100}
              value={budgetRange}
              onValueChange={(v) => setBudgetRange(v as [number, number])}
            />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>${budgetRange[0]}</span>
              <span>{budgetRange[1] >= 5000 ? "$5,000+" : `$${budgetRange[1].toLocaleString()}`}</span>
            </div>
          </div>

          {(selectedCategories.length > 0 || selectedPlatforms.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => { setSelectedCategories([]); setSelectedPlatforms([]); setBudgetRange([0, 5000]); }}
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
            {filtered?.length ?? 0} products available
          </h1>
        </div>

        {/* Mobile search */}
        <div className="relative lg:hidden">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, category…"
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
          <p className="py-12 text-center text-muted-foreground">Something went wrong loading products. Please try refreshing the page.</p>
        ) : filtered?.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No products match your filters. Try adjusting your search or clearing filters.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered?.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
              >
                {/* Product image */}
                <div className="relative aspect-[3/2] w-full overflow-hidden bg-muted">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                      <Package className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  {product.category && (
                    <Badge className="absolute right-3 top-3 shadow-sm">{product.category}</Badge>
                  )}
                </div>

                {/* Info section */}
                <div className="flex flex-col gap-3 p-4">
                  {/* Comparison row: easy to scan across cards */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    {(product.budget_min != null || product.budget_max != null) && (
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <DollarSign className="h-3.5 w-3.5" />
                        ${product.budget_min ?? "?"} – ${product.budget_max ?? "?"}
                      </span>
                    )}
                    {product.category && (
                      <span>{product.category}</span>
                    )}
                    {product.target_platforms?.length > 0 && (
                      <span>{product.target_platforms.slice(0, 2).join(", ")}</span>
                    )}
                  </div>

                  {/* Brand avatar + product title */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                      <AvatarImage src={product.public_profiles?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {(product.public_profiles?.display_name || "B").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold text-foreground">{product.title}</h3>
                      <p className="text-sm text-muted-foreground">by {product.public_profiles?.display_name || "Brand"}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>

                  {/* Commission & sales info */}
                  {product.commission_info && (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>{product.commission_info}</span>
                    </div>
                  )}

                  {/* Platform tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {product.target_platforms?.slice(0, 3).map((p: string) => (
                      <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
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

export default CreatorFeed;
