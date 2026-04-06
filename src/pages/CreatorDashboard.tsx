import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign, Handshake, Video, User,
  ArrowRight, Loader2, Package, AlertTriangle,
} from "lucide-react";

const STATUS_ORDER = [
  "negotiating", "agreed", "contracted", "signed",
  "funded", "escrow_funded", "shipped", "delivered",
  "in_progress", "live", "completed",
];

const STATUS_COLORS: Record<string, string> = {
  negotiating: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  agreed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  contracted: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  signed: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  funded: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  shipped: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  delivered: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
};

const CreatorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: creatorProfile } = useQuery({
    queryKey: ["creator-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creator_profiles")
        .select("payment_method, payment_handle")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: deals, isLoading: dealsLoading } = useQuery({
    queryKey: ["creator-deals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("id, status, rate, created_at, conversations!inner(brand_user_id, creator_user_id)")
        .eq("conversations.creator_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["available-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, images, category, budget_min, budget_max, public_profiles!products_brand_profile_fkey(display_name, avatar_url)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const activeDeals = deals?.filter((d) => d.status !== "completed" && d.status !== "cancelled") || [];
  const completedDeals = deals?.filter((d) => d.status === "completed") || [];
  const totalEarnings = completedDeals.reduce((sum, d) => sum + (Number(d.rate) || 0), 0);
  const upcomingStreams = deals?.filter((d) =>
    d.status === "delivered" || d.status === "in_progress"
  ) || [];

  const hasPaymentInfo = creatorProfile?.payment_method && creatorProfile?.payment_handle;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Missing payment warning */}
        {!hasPaymentInfo && creatorProfile !== undefined && (
          <div
            onClick={() => navigate("/settings/payment")}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 transition-colors hover:bg-yellow-500/15"
          >
            <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-500" />
            <p className="text-sm font-medium text-yellow-200">
              Set up your payment method to start receiving deals
              <ArrowRight className="ml-1 inline h-4 w-4" />
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Creator Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Find deals and track your earnings
            </p>
          </div>
          <Button variant="outline" asChild className="gap-2">
            <Link to="/profile">
              <User className="h-4 w-4" /> Update Profile
            </Link>
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <DollarSign className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  ${totalEarnings.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                <Video className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{upcomingStreams.length}</p>
                <p className="text-sm text-muted-foreground">Upcoming Streams</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Handshake className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activeDeals.length}</p>
                <p className="text-sm text-muted-foreground">Active Deals</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Available products — 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Available Products</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/feed" className="gap-1">
                  Browse all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {productsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !products?.length ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-12">
                  <Package className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-muted-foreground">No products available right now. Check back soon!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-medium text-foreground">
                          {product.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          by {(product as Record<string, unknown>).public_profiles
                            ? ((product as Record<string, unknown>).public_profiles as { display_name: string }).display_name
                            : "Brand"}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          {product.category && (
                            <Badge variant="secondary" className="text-xs">
                              {product.category}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            ${product.budget_min ?? "?"} – ${product.budget_max ?? "?"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* My Deals — 1 col */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">My Deals</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/deals" className="gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {dealsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !deals?.length ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-12">
                  <Handshake className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground text-center">
                    Browse brand products and apply for your first deal
                  </p>
                  <Button asChild size="sm">
                    <Link to="/feed" className="gap-1">
                      Browse Products <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {deals.slice(0, 8).map((deal) => (
                  <Link
                    key={deal.id}
                    to={`/deals/${deal.id}`}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        ${Number(deal.rate || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(deal.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs capitalize",
                        STATUS_COLORS[deal.status] || ""
                      )}
                    >
                      {deal.status?.replace(/_/g, " ")}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default CreatorDashboard;
