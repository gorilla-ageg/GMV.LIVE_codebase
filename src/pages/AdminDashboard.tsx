import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import GmvStoreTab from "@/components/admin/GmvStoreTab";
import {
  Users, Package, Handshake, CheckCircle2,
  Ban, Play, Pause, ShieldCheck, Trash2, TrendingUp,
  DollarSign, Calendar, AlertTriangle, Eye, ChevronDown, ChevronUp,
  Globe, MapPin, Star, Music, Camera, ExternalLink, Mail,
} from "lucide-react";

interface DeleteTarget {
  type: "creator" | "brand" | "user" | "product";
  id: string;
  name: string;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const urlTab = new URLSearchParams(window.location.search).get("tab");
  const [tab, setTab] = useState(urlTab || "gmv-store");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [expandedCreator, setExpandedCreator] = useState<string | null>(null);

  // ─── Data queries ───

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, role, created_at, onboarding_completed, suspended")
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
        .select("id, title, brand_id, status, category, budget_min, budget_max, target_platforms, commission_info, preferred_date, created_at, public_profiles!products_brand_profile_fkey(display_name)")
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
        .select("id, status, rate, commission, deliverables, live_date, created_at, conversations(brand_user_id, creator_user_id)")
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
        .select("*, public_profiles!creator_profiles_profile_fkey(display_name, avatar_url)")
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
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: contactMessages } = useQuery({
    queryKey: ["admin-contact-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages" as never)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as { id: string; name: string; email: string; message: string; read: boolean; created_at: string }[];
    },
  });

  // ─── Mutations ───

  const suspendMutation = useMutation({
    mutationFn: async ({ userId, suspend }: { userId: string; suspend: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ suspended: suspend } as Record<string, unknown>)
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { suspend }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast({ title: suspend ? "User suspended" : "User unsuspended" });
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

  const deleteMutation = useMutation({
    mutationFn: async (target: DeleteTarget) => {
      if (target.type === "product") {
        const { error } = await supabase.from("products").delete().eq("id", target.id);
        if (error) throw error;
      } else if (target.type === "creator") {
        const { error: cpErr } = await supabase.from("creator_profiles").delete().eq("user_id", target.id);
        if (cpErr) throw cpErr;
        const { error: suspErr } = await supabase
          .from("profiles").update({ suspended: true } as Record<string, unknown>).eq("id", target.id);
        if (suspErr) throw suspErr;
      } else if (target.type === "brand") {
        const { error: prodErr } = await supabase.from("products").delete().eq("brand_id", target.id);
        if (prodErr) throw prodErr;
        const { error: bpErr } = await supabase.from("brand_profiles").delete().eq("user_id", target.id);
        if (bpErr) throw bpErr;
        const { error: suspErr } = await supabase
          .from("profiles").update({ suspended: true } as Record<string, unknown>).eq("id", target.id);
        if (suspErr) throw suspErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-creators"] });
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      setDeleteTarget(null);
      toast({ title: "Deleted successfully" });
    },
    onError: (err: Error) => {
      setDeleteTarget(null);
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  const markMessageRead = useMutation({
    mutationFn: async ({ id, read }: { id: string; read: boolean }) => {
      const { error } = await supabase.from("contact_messages" as never).update({ read } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] }),
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_messages" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
      toast({ title: "Message deleted" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // ─── Computed analytics ───

  const totalUsers = profiles?.length ?? 0;
  const totalProducts = products?.length ?? 0;
  const totalDeals = deals?.length ?? 0;
  const completedDeals = deals?.filter((d) => d.status === "completed").length ?? 0;
  const activeDeals = deals?.filter((d) => !["completed", "cancelled", "disputed"].includes(d.status)).length ?? 0;
  const disputedDeals = deals?.filter((d) => d.status === "disputed").length ?? 0;
  const totalGMV = deals?.reduce((sum, d) => sum + (Number(d.rate) || 0), 0) ?? 0;
  const suspendedUsers = profiles?.filter((p) => (p as Record<string, unknown>).suspended).length ?? 0;
  const onboardedUsers = profiles?.filter((p) => p.onboarding_completed).length ?? 0;
  const totalCreators = creatorProfiles?.length ?? 0;
  const totalBrands = brandProfiles?.length ?? 0;

  const dealStatusCounts: Record<string, number> = {};
  deals?.forEach((d) => {
    const s = d.status.replace(/_/g, " ");
    dealStatusCounts[s] = (dealStatusCounts[s] || 0) + 1;
  });

  const getBrandName = (brandId: string) => {
    const prof = profiles?.find((p) => p.id === brandId);
    const bp = brandProfiles?.find((b) => b.user_id === brandId);
    return prof?.display_name || bp?.company_name || "Brand";
  };

  const getCreatorName = (creatorId: string) => {
    const prof = profiles?.find((p) => p.id === creatorId);
    const cp = creatorProfiles?.find((c) => c.user_id === creatorId);
    const fullName = [cp?.first_name, cp?.last_name].filter(Boolean).join(" ");
    return prof?.display_name || fullName || "Creator";
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        </div>

        {/* ─── Metrics Grid ─── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={<Users className="h-5 w-5 text-blue-400" />} label="Total Users" value={totalUsers} sub={`${onboardedUsers} onboarded`} bg="bg-blue-500/10" />
          <MetricCard icon={<Package className="h-5 w-5 text-purple-400" />} label="Products" value={totalProducts} sub={`${products?.filter(p => p.status === "active").length ?? 0} active`} bg="bg-purple-500/10" />
          <MetricCard icon={<Handshake className="h-5 w-5 text-primary" />} label="Total Deals" value={totalDeals} sub={`${activeDeals} active`} bg="bg-primary/10" />
          <MetricCard icon={<DollarSign className="h-5 w-5 text-emerald-400" />} label="Total GMV" value={`$${totalGMV.toLocaleString()}`} sub={`${completedDeals} completed`} bg="bg-emerald-500/10" />
        </div>

        {/* ─── Secondary Metrics ─── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStat icon={<TrendingUp className="h-4 w-4" />} label="Creators" value={totalCreators} />
          <MiniStat icon={<Package className="h-4 w-4" />} label="Brands" value={totalBrands} />
          <MiniStat icon={<AlertTriangle className="h-4 w-4 text-amber-400" />} label="Disputed" value={disputedDeals} />
          <MiniStat icon={<Ban className="h-4 w-4 text-destructive" />} label="Suspended" value={suspendedUsers} />
        </div>

        {/* Deal Status Breakdown */}
        {Object.keys(dealStatusCounts).length > 0 && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Deal Pipeline</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(dealStatusCounts).map(([status, count]) => (
                  <Badge key={status} variant="secondary" className="text-xs capitalize gap-1.5">
                    {status} <span className="font-bold">{count}</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Tabs ─── */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="gmv-store" className="gap-1.5">
              <img src="/images/gmv-logo-mark.svg" alt="" className="h-3.5 w-3.5" /> GMV Store
            </TabsTrigger>
            <TabsTrigger value="users">Users ({totalUsers})</TabsTrigger>
            <TabsTrigger value="products">Products ({totalProducts})</TabsTrigger>
            <TabsTrigger value="deals">Deals ({totalDeals})</TabsTrigger>
            <TabsTrigger value="brands">Brands ({totalBrands})</TabsTrigger>
            <TabsTrigger value="creators">Creators ({totalCreators})</TabsTrigger>
            <TabsTrigger value="messages">
              Messages {(contactMessages?.filter(m => !m.read).length ?? 0) > 0 && (
                <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {contactMessages?.filter(m => !m.read).length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── GMV Store ── */}
          <TabsContent value="gmv-store">
            <GmvStoreTab />
          </TabsContent>

          {/* ── Users ── */}
          <TabsContent value="users" className="space-y-2 mt-4">
            {profiles?.map((p) => {
              const isSuspended = !!(p as Record<string, unknown>).suspended;
              return (
                <div key={p.id} className={`flex items-center justify-between rounded-lg border px-4 py-3 ${isSuspended ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={p.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">{(p.display_name || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.display_name || "No name"}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] capitalize">{p.role}</Badge>
                        {p.onboarding_completed && <Badge variant="secondary" className="text-[10px]">Onboarded</Badge>}
                        {isSuspended && <Badge variant="destructive" className="text-[10px]">Suspended</Badge>}
                        <span className="text-[10px] text-muted-foreground font-mono">{p.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                    {isSuspended ? (
                      <Button size="sm" variant="outline" onClick={() => suspendMutation.mutate({ userId: p.id, suspend: false })} disabled={suspendMutation.isPending}>
                        <Play className="h-3 w-3 mr-1" /> Unsuspend
                      </Button>
                    ) : p.role !== "admin" ? (
                      <Button size="sm" variant="destructive" onClick={() => suspendMutation.mutate({ userId: p.id, suspend: true })} disabled={suspendMutation.isPending}>
                        <Ban className="h-3 w-3 mr-1" /> Suspend
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {!profiles?.length && <EmptyState text="No users yet" />}
          </TabsContent>

          {/* ── Products ── */}
          <TabsContent value="products" className="space-y-2 mt-4">
            {products?.map((p) => {
              const profileName = (p as Record<string, unknown>).public_profiles
                ? ((p as Record<string, unknown>).public_profiles as { display_name: string | null }).display_name
                : null;
              const companyName = brandProfiles?.find(b => b.user_id === p.brand_id)?.company_name;
              const brandName = profileName || companyName || "Brand";
              return (
                <div key={p.id} className="rounded-lg border border-border bg-card px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">by {brandName}</span>
                        {p.category && <Badge variant="secondary" className="text-[10px]">{p.category}</Badge>}
                        <Badge variant="outline" className="text-[10px] capitalize">{p.status}</Badge>
                        {(p.budget_min != null || p.budget_max != null) && (
                          <span className="text-[10px] text-muted-foreground">${p.budget_min ?? "?"} - ${p.budget_max ?? "?"}</span>
                        )}
                        {p.target_platforms && p.target_platforms.length > 0 && (
                          <span className="text-[10px] text-muted-foreground">{p.target_platforms.join(", ")}</span>
                        )}
                        {p.commission_info && (
                          <span className="text-[10px] text-emerald-400">{p.commission_info}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {new Date(p.created_at).toLocaleDateString()}
                      </span>
                      {p.status === "active" ? (
                        <Button size="sm" variant="outline" onClick={() => productStatusMutation.mutate({ productId: p.id, status: "paused" })} disabled={productStatusMutation.isPending}>
                          <Pause className="h-3 w-3 mr-1" /> Pause
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => productStatusMutation.mutate({ productId: p.id, status: "active" })} disabled={productStatusMutation.isPending}>
                          <Play className="h-3 w-3 mr-1" /> Activate
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => setDeleteTarget({ type: "product", id: p.id, name: p.title })}>
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {!products?.length && <EmptyState text="No products yet" />}
          </TabsContent>

          {/* ── Deals ── */}
          <TabsContent value="deals" className="space-y-2 mt-4">
            {deals?.map((d) => {
              const convo = d.conversations as { brand_user_id: string; creator_user_id: string } | null;
              return (
                <Link key={d.id} to={`/deals/${d.id}`} className="block rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {convo ? `${getBrandName(convo.brand_user_id)} → ${getCreatorName(convo.creator_user_id)}` : d.id.slice(0, 8)}
                        </p>
                        <DealStatusBadge status={d.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        {d.rate && <span className="text-xs text-emerald-400 font-medium">${Number(d.rate).toLocaleString()}</span>}
                        {d.commission && <span className="text-[10px] text-muted-foreground">{d.commission}% commission</span>}
                        {d.deliverables && <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{d.deliverables}</span>}
                        {d.live_date && <span className="text-[10px] text-muted-foreground">{new Date(d.live_date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</span>
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              );
            })}
            {!deals?.length && <EmptyState text="No deals yet" />}
          </TabsContent>

          {/* ── Brands ── */}
          <TabsContent value="brands" className="space-y-2 mt-4">
            {brandProfiles?.map((b) => {
              const profile = profiles?.find(p => p.id === b.user_id);
              const isSuspended = !!(profile as Record<string, unknown> | undefined)?.suspended;
              const isAdmin = profile?.role === "admin";
              const isExpanded = expandedBrand === b.user_id;
              return (
                <div key={b.user_id} className={`rounded-lg border overflow-hidden ${isSuspended ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"}`}>
                  <div className="flex items-center justify-between px-4 py-3">
                    <button type="button" className="flex items-center gap-3 min-w-0 text-left" onClick={() => setExpandedBrand(isExpanded ? null : b.user_id)}>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={b.logo_url ?? undefined} />
                        <AvatarFallback className="text-xs">{(b.company_name || "B").slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{b.company_name || "Unnamed brand"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {b.industry && <Badge variant="secondary" className="text-[10px]">{b.industry}</Badge>}
                          {b.website && <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">{b.website}</span>}
                          {isSuspended && <Badge variant="destructive" className="text-[10px]">Suspended</Badge>}
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground hidden sm:inline">{new Date(b.created_at).toLocaleDateString()}</span>
                      {!isSuspended && !isAdmin && (
                        <Button size="sm" variant="outline" onClick={() => suspendMutation.mutate({ userId: b.user_id, suspend: true })} disabled={suspendMutation.isPending}>
                          <Ban className="h-3 w-3 mr-1" /> Suspend
                        </Button>
                      )}
                      {!isAdmin && (
                        <Button size="sm" variant="destructive" onClick={() => setDeleteTarget({ type: "brand", id: b.user_id, name: b.company_name || "this brand" })}>
                          <Trash2 className="h-3 w-3 mr-1" /> Delete
                        </Button>
                      )}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-border px-4 py-3 space-y-3 bg-muted/30">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <DetailField label="Company Name" value={b.company_name} />
                        <DetailField label="Display Name" value={profile?.display_name} />
                        <DetailField label="Industry" value={b.industry} />
                        {b.industries && b.industries.length > 0 && (
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Industries</p>
                            <div className="flex flex-wrap gap-1">{b.industries.map((ind) => <Badge key={ind} variant="outline" className="text-[10px]">{ind}</Badge>)}</div>
                          </div>
                        )}
                        <DetailField label="Website" value={b.website} link />
                        <DetailField label="User ID" value={b.user_id} mono />
                        <DetailField label="Joined" value={new Date(b.created_at).toLocaleString()} />
                        <DetailField label="Onboarded" value={profile?.onboarding_completed ? "Yes" : "No"} />
                      </div>
                      {b.logo_url && (
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Logo</p>
                          <img src={b.logo_url} alt="Logo" className="h-12 w-12 rounded-lg object-cover border border-border" />
                        </div>
                      )}
                      {b.campaign_images && b.campaign_images.length > 0 && (
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Campaign Images ({b.campaign_images.length})</p>
                          <div className="flex gap-2 flex-wrap">
                            {b.campaign_images.map((url, i) => (
                              <img key={i} src={url} alt={`Campaign ${i + 1}`} className="h-16 w-16 rounded-lg object-cover border border-border" />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {!brandProfiles?.length && <EmptyState text="No brands yet" />}
          </TabsContent>

          {/* ── Creators ── */}
          <TabsContent value="creators" className="space-y-2 mt-4">
            {creatorProfiles?.map((c) => {
              const profile = (c as Record<string, unknown>).public_profiles as { display_name?: string; avatar_url?: string } | undefined;
              const creatorName = [c.first_name, c.last_name].filter(Boolean).join(" ");
              const name = profile?.display_name || creatorName || "Creator";
              const userProfile = profiles?.find(p => p.id === c.user_id);
              const isSuspended = !!(userProfile as Record<string, unknown> | undefined)?.suspended;
              const isAdmin = userProfile?.role === "admin";
              const isExpanded = expandedCreator === c.user_id;
              return (
                <div key={c.user_id} className={`rounded-lg border overflow-hidden ${isSuspended ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"}`}>
                  <div className="flex items-center justify-between px-4 py-3">
                    <button type="button" className="flex items-center gap-3 min-w-0 text-left" onClick={() => setExpandedCreator(isExpanded ? null : c.user_id)}>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={profile?.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{name}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {c.experience_level && <Badge variant="outline" className="text-[10px] capitalize">{c.experience_level}</Badge>}
                          {c.location && <span className="text-[10px] text-muted-foreground">{c.location}</span>}
                          {(c.follower_count ?? 0) > 0 && (
                            <span className="text-[10px] text-muted-foreground">{Number(c.follower_count).toLocaleString()} followers</span>
                          )}
                          {(c.avg_gmv ?? 0) > 0 && (
                            <span className="text-[10px] text-emerald-400">${Number(c.avg_gmv).toLocaleString()} GMV</span>
                          )}
                          {isSuspended && <Badge variant="destructive" className="text-[10px]">Suspended</Badge>}
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link to={`/creators/${c.user_id}`} className="text-xs text-primary hover:underline hidden sm:inline">View</Link>
                      {!isSuspended && !isAdmin && (
                        <Button size="sm" variant="outline" onClick={() => suspendMutation.mutate({ userId: c.user_id, suspend: true })} disabled={suspendMutation.isPending}>
                          <Ban className="h-3 w-3 mr-1" /> Suspend
                        </Button>
                      )}
                      {!isAdmin && (
                        <Button size="sm" variant="destructive" onClick={() => setDeleteTarget({ type: "creator", id: c.user_id, name })}>
                          <Trash2 className="h-3 w-3 mr-1" /> Delete
                        </Button>
                      )}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-border px-4 py-3 space-y-3 bg-muted/30">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <DetailField label="First Name" value={c.first_name} />
                        <DetailField label="Last Name" value={c.last_name} />
                        <DetailField label="Display Name" value={profile?.display_name} />
                        <DetailField label="Location" value={c.location} />
                        <DetailField label="Experience" value={c.experience_level} />
                        <DetailField label="Followers" value={c.follower_count ? Number(c.follower_count).toLocaleString() : null} />
                        <DetailField label="Avg GMV" value={c.avg_gmv ? `$${Number(c.avg_gmv).toLocaleString()}` : null} />
                        <DetailField label="Rating" value={c.rating ? `${Number(c.rating).toFixed(1)}/5` : null} />
                        <DetailField label="Audience Type" value={c.audience_type} />
                        <DetailField label="TikTok Affiliate" value={c.has_tiktok_affiliate} />
                        <DetailField label="Payment Method" value={c.payment_method} />
                        <DetailField label="Payment Handle" value={c.payment_handle} />
                        <DetailField label="User ID" value={c.user_id} mono />
                        <DetailField label="Joined" value={new Date(c.created_at).toLocaleString()} />
                        <DetailField label="Onboarded" value={userProfile?.onboarding_completed ? "Yes" : "No"} />
                      </div>
                      {/* Social Handles */}
                      {(c.tiktok_handle || c.instagram_handle || c.facebook_handle) && (
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Social Handles</p>
                          <div className="flex flex-wrap gap-2">
                            {c.tiktok_handle && <Badge variant="outline" className="text-[10px] gap-1"><Music className="h-3 w-3" /> @{c.tiktok_handle}</Badge>}
                            {c.instagram_handle && <Badge variant="outline" className="text-[10px] gap-1"><Camera className="h-3 w-3" /> @{c.instagram_handle}</Badge>}
                            {c.facebook_handle && <Badge variant="outline" className="text-[10px] gap-1">FB: {c.facebook_handle}</Badge>}
                          </div>
                        </div>
                      )}
                      {/* Niches */}
                      {c.niches && c.niches.length > 0 && (
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Niches</p>
                          <div className="flex flex-wrap gap-1">{c.niches.map((n) => <Badge key={n} className="text-[10px] bg-primary/10 text-primary border-primary/20">{n}</Badge>)}</div>
                        </div>
                      )}
                      {/* Platforms */}
                      {c.platforms && c.platforms.length > 0 && (
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Platforms</p>
                          <div className="flex flex-wrap gap-1">{c.platforms.map((p) => <Badge key={p} variant="outline" className="text-[10px] border-accent/30 text-accent">{p}</Badge>)}</div>
                        </div>
                      )}
                      {/* Product Interests */}
                      {c.product_interests && c.product_interests.length > 0 && (
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Product Interests</p>
                          <div className="flex flex-wrap gap-1">{c.product_interests.map((pi) => <Badge key={pi} variant="secondary" className="text-[10px]">{pi}</Badge>)}</div>
                        </div>
                      )}
                      {/* Past Collabs */}
                      {c.past_collabs && c.past_collabs.length > 0 && (
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Past Collabs</p>
                          <div className="flex flex-wrap gap-1">{c.past_collabs.map((pc) => <Badge key={pc} variant="secondary" className="text-[10px]">{pc}</Badge>)}</div>
                        </div>
                      )}
                      {/* Portfolio URLs */}
                      {c.portfolio_urls && c.portfolio_urls.length > 0 && (
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Portfolio ({c.portfolio_urls.length})</p>
                          <div className="flex gap-2 flex-wrap">
                            {c.portfolio_urls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block h-16 w-16 rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors">
                                <img src={url} alt={`Portfolio ${i + 1}`} className="h-full w-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {!creatorProfiles?.length && <EmptyState text="No creators yet" />}
          </TabsContent>

          {/* ── Messages ── */}
          <TabsContent value="messages" className="space-y-2 mt-4">
            {contactMessages?.map((msg) => (
              <div key={msg.id} className={`rounded-lg border px-4 py-4 ${msg.read ? "border-border bg-card opacity-60" : "border-primary/20 bg-card"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{msg.name}</p>
                        <a href={`mailto:${msg.email}`} className="text-xs text-primary hover:underline">{msg.email}</a>
                        {!msg.read && <Badge className="bg-primary/20 text-primary border-0 text-[10px]">New</Badge>}
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground whitespace-pre-line">{msg.message}</p>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        {new Date(msg.created_at).toLocaleDateString()} at {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!msg.read ? (
                      <Button size="sm" variant="outline" onClick={() => markMessageRead.mutate({ id: msg.id, read: true })} disabled={markMessageRead.isPending}>
                        <Eye className="h-3 w-3 mr-1" /> Read
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => markMessageRead.mutate({ id: msg.id, read: false })} disabled={markMessageRead.isPending}>
                        Unread
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => deleteMessage.mutate(msg.id)} disabled={deleteMessage.isPending}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {!contactMessages?.length && <EmptyState text="No messages yet" />}
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── Delete Confirmation Dialog ─── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "product" ? (
                <>This will permanently delete the product <strong>{deleteTarget?.name}</strong>. This action cannot be undone.</>
              ) : (
                <>This will permanently delete <strong>{deleteTarget?.name}</strong>'s {deleteTarget?.type} profile
                {deleteTarget?.type === "brand" && " and all their products"}.
                Their user account will be suspended. This action cannot be undone.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

// ─── Sub-components ───

function DetailField({ label, value, mono, link }: { label: string; value: string | number | null | undefined; mono?: boolean; link?: boolean }) {
  if (!value) return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-xs text-muted-foreground/50 italic">Not set</p>
    </div>
  );
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      {link ? (
        <a href={String(value).startsWith("http") ? String(value) : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
          {String(value)} <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <p className={`text-xs text-foreground ${mono ? "font-mono" : ""}`}>{String(value)}</p>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, sub, bg }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; bg: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-lg font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function DealStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    negotiating: "text-amber-400 border-amber-500/30",
    agreed: "text-blue-400 border-blue-500/30",
    signed: "text-blue-400 border-blue-500/30",
    contracted: "text-indigo-400 border-indigo-500/30",
    funded: "text-emerald-400 border-emerald-500/30",
    escrow_funded: "text-emerald-400 border-emerald-500/30",
    shipped: "text-cyan-400 border-cyan-500/30",
    delivered: "text-teal-400 border-teal-500/30",
    live: "text-primary border-primary/30",
    in_progress: "text-primary border-primary/30",
    completed: "text-emerald-400 border-emerald-500/30",
    disputed: "text-destructive border-destructive/30",
    cancelled: "text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={`text-[10px] capitalize ${colors[status] || ""}`}>
      {status.replace(/_/g, " ")}
    </Badge>
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
