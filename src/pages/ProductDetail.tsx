import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import {
  ArrowLeft,
  MessageSquare,
  Package,
  DollarSign,
  TrendingUp,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Tag,
  Monitor,
} from "lucide-react";
import { isDemoId, getDemoProduct } from "@/data/demoData";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isDemo = isDemoId(id || "");

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (isDemo) {
        const demo = getDemoProduct(id!);
        if (!demo) throw new Error("Not found");
        return demo;
      }
      const { data, error } = await supabase
        .from("products")
        .select("*, public_profiles!products_brand_profile_fkey(display_name, avatar_url, bio)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleStartConversation = async () => {
    if (!user || !product) return;
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("brand_user_id", product.brand_id)
      .eq("creator_user_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle();

    if (existing) {
      navigate(`/messages/${existing.id}`);
      return;
    }

    const { data: convo, error } = await supabase
      .from("conversations")
      .insert({ brand_user_id: product.brand_id, creator_user_id: user.id, product_id: product.id })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    navigate(`/messages/${convo.id}`);
  };

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

  if (!product) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg text-muted-foreground">Product not found.</p>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeft className="mr-1 h-4 w-4" /> Go Back
          </Button>
        </div>
      </AppLayout>
    );
  }

  const profile = (product as any).public_profiles || (product as any).profiles;
  const brandName = profile?.display_name || "Brand";
  const initials = brandName.slice(0, 2).toUpperCase();
  const heroImage = product.images?.[0];
  const galleryImages = product.images?.filter(Boolean) || [];

  const stats = [
    {
      icon: DollarSign,
      label: "Budget",
      value: product.budget_min || product.budget_max
        ? `$${product.budget_min ?? "?"} – $${product.budget_max ?? "?"}`
        : "Flexible",
      color: "text-primary",
    },
    {
      icon: Tag,
      label: "Category",
      value: product.category || "General",
      color: "text-accent",
    },
    {
      icon: Monitor,
      label: "Platforms",
      value: product.target_platforms?.length
        ? `${product.target_platforms.length} platform${product.target_platforms.length > 1 ? "s" : ""}`
        : "Any",
      color: "text-accent",
    },
    {
      icon: Calendar,
      label: "Preferred Date",
      value: product.preferred_date
        ? new Date(product.preferred_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "Flexible",
      color: "text-amber-400",
    },
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
            {heroImage ? (
              <img
                src={heroImage}
                alt={product.title}
                className="h-full w-full object-cover opacity-60"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-20 w-20 text-muted-foreground/20" />
              </div>
            )}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </div>

        {/* Avatar + Name + CTA row */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 relative z-10 px-2">
          <Avatar className="h-28 w-28 border-4 border-background shadow-xl ring-2 ring-primary/30">
            <AvatarImage src={profile?.avatar_url} alt={brandName} />
            <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{product.title}</h1>
              {product.category && <Badge>{product.category}</Badge>}
            </div>
            <p className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
              by {brandName}
            </p>
            {product.status && (
              <Badge variant="outline" className="mt-1 capitalize border-accent/30 text-accent">
                {product.status}
              </Badge>
            )}
          </div>

          {/* CTA button */}
          {!isDemo && (
            <div className="flex gap-2 sm:pb-1 shrink-0">
              <Button onClick={handleStartConversation} className="gap-2">
                <MessageSquare className="h-4 w-4" /> Message Brand
              </Button>
            </div>
          )}
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

        {/* Description + Details */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column: Description + Gallery */}
          <div className="lg:col-span-2 space-y-5">
            {product.description && (
              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">About This Product</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{product.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Product Gallery */}
            {galleryImages.length > 0 && (
              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Product Images</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {galleryImages.map((url: string, idx: number) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
                      >
                        <img
                          src={url}
                          alt={`${product.title} image ${idx + 1}`}
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
            {/* Budget Details */}
            {(product.budget_min != null || product.budget_max != null) && (
              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Budget</h2>
                  <p className="text-lg font-bold text-foreground">
                    ${product.budget_min ?? "?"} – ${product.budget_max ?? "?"}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Commission */}
            {product.commission_info && (
              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Commission</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium text-foreground">{product.commission_info}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Platforms */}
            {product.target_platforms && product.target_platforms.length > 0 && (
              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Platforms</h2>
                  <div className="flex flex-wrap gap-2">
                    {product.target_platforms.map((p: string) => (
                      <Badge key={p} variant="outline" className="border-accent/30 text-accent">{p}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preferred Date */}
            {product.preferred_date && (
              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Preferred Date</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 text-accent shrink-0" />
                    <span className="text-foreground">
                      {new Date(product.preferred_date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick CTA */}
            {!isDemo && (
              <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="p-5 text-center">
                  <p className="text-sm font-medium text-foreground mb-3">Want to promote this product?</p>
                  <Button onClick={handleStartConversation} className="w-full gap-2">
                    <MessageSquare className="h-4 w-4" /> Message Brand
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProductDetail;
