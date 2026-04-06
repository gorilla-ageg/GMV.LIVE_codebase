import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Package, Handshake, CheckCircle2, Loader2,
  Ban, Play, Pause, ShieldCheck,
} from "lucide-react";

const AdminDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("users");

  // Metrics queries
  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, role, created_at, onboarding_completed, suspended")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, brand_id, status, category, created_at, public_profiles!products_brand_profile_fkey(display_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: deals } = useQuery({
    queryKey: ["admin-deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("id, status, rate, created_at, conversations(brand_user_id, creator_user_id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: creatorProfiles } = useQuery({
    queryKey: ["admin-creators"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creator_profiles")
        .select("user_id, niches, platforms, follower_count, avg_gmv, public_profiles!creator_profiles_profile_fkey(display_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: brandProfiles } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_profiles")
        .select("user_id, company_name, website, industry")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Mutations
  const suspendMutation = useMutation({
    mutationFn: async ({ userId, suspend }: { userId: string; suspend: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ suspended: suspend } as Record<string, unknown>)
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast({ title: "User updated" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const productStatusMutation = useMutation({
    mutationFn: async ({ productId, status }: { productId: string; status: string }) => {
      const { error } = await supabase.from("products").update({ status }).eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Product updated" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const totalUsers = profiles?.length ?? 0;
  const totalProducts = products?.length ?? 0;
  const totalDeals = deals?.length ?? 0;
  const completedDeals = deals?.filter((d) => d.status === "completed").length ?? 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={<Users className="h-6 w-6 text-blue-500" />} label="Total Users" value={totalUsers} bg="bg-blue-500/10" />
          <MetricCard icon={<Package className="h-6 w-6 text-purple-500" />} label="Products Listed" value={totalProducts} bg="bg-purple-500/10" />
          <MetricCard icon={<Handshake className="h-6 w-6 text-primary" />} label="Total Deals" value={totalDeals} bg="bg-primary/10" />
          <MetricCard icon={<CheckCircle2 className="h-6 w-6 text-emerald-500" />} label="Deals Completed" value={completedDeals} bg="bg-emerald-500/10" />
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="brands">Brands</TabsTrigger>
            <TabsTrigger value="creators">Creators</TabsTrigger>
          </TabsList>

          {/* Users */}
          <TabsContent value="users" className="space-y-2 mt-4">
            {profiles?.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.display_name || "No name"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs capitalize">{p.role}</Badge>
                      {p.onboarding_completed && <Badge variant="secondary" className="text-xs">Onboarded</Badge>}
                      {(p as Record<string, unknown>).suspended && <Badge variant="destructive" className="text-xs">Suspended</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {new Date(p.created_at).toLocaleDateString()}
                  </span>
                  {(p as Record<string, unknown>).suspended ? (
                    <Button
                      size="sm" variant="outline"
                      onClick={() => suspendMutation.mutate({ userId: p.id, suspend: false })}
                      disabled={suspendMutation.isPending}
                    >
                      <Play className="h-3 w-3 mr-1" /> Unsuspend
                    </Button>
                  ) : (
                    <Button
                      size="sm" variant="destructive"
                      onClick={() => suspendMutation.mutate({ userId: p.id, suspend: true })}
                      disabled={suspendMutation.isPending}
                    >
                      <Ban className="h-3 w-3 mr-1" /> Suspend
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {!profiles?.length && <EmptyState text="No users yet" />}
          </TabsContent>

          {/* Products */}
          <TabsContent value="products" className="space-y-2 mt-4">
            {products?.map((p) => {
              const brandName = (p as Record<string, unknown>).public_profiles
                ? ((p as Record<string, unknown>).public_profiles as { display_name: string }).display_name
                : "Unknown";
              return (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">by {brandName}</span>
                      {p.category && <Badge variant="secondary" className="text-xs">{p.category}</Badge>}
                      <Badge variant="outline" className="text-xs capitalize">{p.status}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                    {p.status === "active" ? (
                      <Button
                        size="sm" variant="outline"
                        onClick={() => productStatusMutation.mutate({ productId: p.id, status: "paused" })}
                        disabled={productStatusMutation.isPending}
                      >
                        <Pause className="h-3 w-3 mr-1" /> Pause
                      </Button>
                    ) : (
                      <Button
                        size="sm" variant="outline"
                        onClick={() => productStatusMutation.mutate({ productId: p.id, status: "active" })}
                        disabled={productStatusMutation.isPending}
                      >
                        <Play className="h-3 w-3 mr-1" /> Activate
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {!products?.length && <EmptyState text="No products yet" />}
          </TabsContent>

          {/* Deals */}
          <TabsContent value="deals" className="space-y-2 mt-4">
            {deals?.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground font-mono truncate">{d.id.slice(0, 8)}...</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-xs capitalize">{d.status?.replace(/_/g, " ")}</Badge>
                    {d.rate && <span className="text-xs text-muted-foreground">${Number(d.rate).toLocaleString()}</span>}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(d.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
            {!deals?.length && <EmptyState text="No deals yet" />}
          </TabsContent>

          {/* Brands */}
          <TabsContent value="brands" className="space-y-2 mt-4">
            {brandProfiles?.map((b) => (
              <div key={b.user_id} className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-sm font-medium text-foreground">{b.company_name || "Unnamed brand"}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {b.industry && <Badge variant="secondary" className="text-xs">{b.industry}</Badge>}
                  {b.website && <span className="text-xs text-muted-foreground truncate">{b.website}</span>}
                </div>
              </div>
            ))}
            {!brandProfiles?.length && <EmptyState text="No brands yet" />}
          </TabsContent>

          {/* Creators */}
          <TabsContent value="creators" className="space-y-2 mt-4">
            {creatorProfiles?.map((c) => {
              const name = (c as Record<string, unknown>).public_profiles
                ? ((c as Record<string, unknown>).public_profiles as { display_name: string }).display_name
                : "Unknown";
              return (
                <Link key={c.user_id} to={`/creators/${c.user_id}`} className="block rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30">
                  <p className="text-sm font-medium text-foreground">{name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {c.niches?.slice(0, 3).map((n: string) => (
                      <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>
                    ))}
                    {c.platforms?.slice(0, 2).map((p: string) => (
                      <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                    ))}
                    {(c.follower_count ?? 0) > 0 && (
                      <span className="text-xs text-muted-foreground">{Number(c.follower_count).toLocaleString()} followers</span>
                    )}
                    {(c.avg_gmv ?? 0) > 0 && (
                      <span className="text-xs text-muted-foreground">${Number(c.avg_gmv).toLocaleString()} avg GMV</span>
                    )}
                  </div>
                </Link>
              );
            })}
            {!creatorProfiles?.length && <EmptyState text="No creators yet" />}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

function MetricCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: number; bg: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export default AdminDashboard;
