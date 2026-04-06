import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus, Package, Handshake, TrendingUp, Truck,
  ArrowRight, Loader2,
} from "lucide-react";

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

const BrandDashboard = () => {
  const { user } = useAuth();

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["brand-products", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, images, category, status, budget_min, budget_max")
        .eq("brand_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: deals, isLoading: dealsLoading } = useQuery({
    queryKey: ["brand-deals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("id, status, rate, created_at, conversations!inner(brand_user_id, creator_user_id)")
        .eq("conversations.brand_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const activeDeals = deals?.filter((d) => d.status !== "completed" && d.status !== "cancelled") || [];
  const completedDeals = deals?.filter((d) => d.status === "completed") || [];
  const totalGmv = completedDeals.reduce((sum, d) => sum + (Number(d.rate) || 0), 0);
  const pendingShipments = deals?.filter((d) =>
    d.status === "funded" || d.status === "escrow_funded" || d.status === "contracted"
  ) || [];

  const isLoading = productsLoading || dealsLoading;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Brand Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your products and deals
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="gap-2">
              <Link to="/browse">
                Browse Creators
              </Link>
            </Button>
            <Button asChild className="gap-2">
              <Link to="/products/new">
                <Plus className="h-4 w-4" /> Post New Product
              </Link>
            </Button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 sm:grid-cols-3">
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
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  ${totalGmv.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total GMV</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
                <Truck className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingShipments.length}</p>
                <p className="text-sm text-muted-foreground">Pending Shipments</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Products — 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Your Products</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/my-products" className="gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !products?.length ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-12">
                  <Package className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-muted-foreground">Post your first product to start finding creators</p>
                  <Button asChild size="sm">
                    <Link to="/products/new" className="gap-1">
                      <Plus className="h-4 w-4" /> Post Product
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {products.slice(0, 6).map((product) => (
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

          {/* Recent deal activity — 1 col */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Recent Deals</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/deals" className="gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {!activeDeals.length && !completedDeals.length ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-12">
                  <Handshake className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground text-center">
                    Your deals will appear here once creators respond
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {(deals || []).slice(0, 8).map((deal) => (
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

export default BrandDashboard;
