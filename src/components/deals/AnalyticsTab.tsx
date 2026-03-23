import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CheckCircle, DollarSign, Eye, Users, ShoppingCart, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type LiveAnalytics = Tables<"live_analytics">;

interface AnalyticsTabProps {
  dealId: string;
  conversationId: string;
  isBrand: boolean;
}

const AnalyticsTab = ({ dealId, conversationId, isBrand }: AnalyticsTabProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  const [form, setForm] = useState({
    stream_link: "",
    peak_viewers: "",
    total_viewers: "",
    gmv: "",
    orders: "",
    likes: "",
    watch_time_avg: "",
  });

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ["live-analytics", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_analytics")
        .select("*")
        .eq("deal_id", dealId)
        .maybeSingle();
      if (error) throw error;
      return data as LiveAnalytics | null;
    },
    enabled: !!dealId,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!form.stream_link.trim()) throw new Error("Stream link is required");

      const { error: insertErr } = await supabase.from("live_analytics").insert({
        deal_id: dealId,
        creator_id: user!.id,
        stream_link: form.stream_link.trim(),
        peak_viewers: parseInt(form.peak_viewers) || 0,
        total_viewers: parseInt(form.total_viewers) || 0,
        gmv: parseFloat(form.gmv) || 0,
        orders: parseInt(form.orders) || 0,
        likes: parseInt(form.likes) || 0,
        watch_time_avg: parseInt(form.watch_time_avg) || 0,
      });
      if (insertErr) throw insertErr;

      const { error: dealErr } = await supabase
        .from("deals")
        .update({ status: "live" })
        .eq("id", dealId);
      if (dealErr) throw dealErr;

      const { error: msgErr } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user!.id,
        content: "Stream analytics have been submitted for review.",
        message_type: "system_event",
        metadata: { event_type: "stream_submitted" },
      });
      if (msgErr) throw msgErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-analytics", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal-messages", conversationId] });
      toast({ title: "Analytics submitted!" });
    },
    onError: (err: Error) => toast({ title: "Error submitting analytics", description: err.message, variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      // Use secure RPC functions
      const { error: approveErr } = await supabase.rpc("approve_analytics", { _deal_id: dealId });
      if (approveErr) throw approveErr;

      const { error: releaseErr } = await supabase.rpc("release_escrow", { _deal_id: dealId });
      if (releaseErr) throw releaseErr;

      const { error: dealErr } = await supabase
        .from("deals")
        .update({ status: "completed" })
        .eq("id", dealId);
      if (dealErr) throw dealErr;

      const { error: msgErr } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user!.id,
        content: "Analytics approved. Payment released to creator. Deal completed!",
        message_type: "system_event",
        metadata: { event_type: "deal_completed" },
      });
      if (msgErr) throw msgErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-analytics", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      queryClient.invalidateQueries({ queryKey: ["escrow", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal-messages", conversationId] });
      toast({ title: "Deal completed! Payment released." });
    },
    onError: (err: Error) => toast({ title: "Error approving analytics", description: err.message, variant: "destructive" }),
  });

  const disputeMutation = useMutation({
    mutationFn: async () => {
      const { error: dealErr } = await supabase
        .from("deals")
        .update({ status: "disputed" })
        .eq("id", dealId);
      if (dealErr) throw dealErr;

      const { error: msgErr } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user!.id,
        content: `Dispute opened: ${disputeReason || "Brand has raised concerns about the deliverables."}`,
        message_type: "system_event",
        metadata: { event_type: "dispute_opened" },
      });
      if (msgErr) throw msgErr;
    },
    onSuccess: () => {
      setDisputeOpen(false);
      setDisputeReason("");
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal-messages", conversationId] });
      toast({ title: "Dispute submitted", description: "Our team will review within 48 hours." });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-destructive">Failed to load analytics: {(error as Error).message}</p>
      </div>
    );
  }

  // Creator submission form
  if (!analytics && !isBrand) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <h3 className="text-lg font-bold">Submit Stream Analytics</h3>
        <div className="space-y-3">
          <div>
            <Label>TikTok Live Stream URL</Label>
            <Input
              value={form.stream_link}
              onChange={(e) => setForm((p) => ({ ...p, stream_link: e.target.value }))}
              placeholder="https://www.tiktok.com/@..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Peak Viewers</Label>
              <Input
                type="number"
                value={form.peak_viewers}
                onChange={(e) => setForm((p) => ({ ...p, peak_viewers: e.target.value }))}
              />
            </div>
            <div>
              <Label>Total Viewers</Label>
              <Input
                type="number"
                value={form.total_viewers}
                onChange={(e) => setForm((p) => ({ ...p, total_viewers: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>GMV ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.gmv}
                onChange={(e) => setForm((p) => ({ ...p, gmv: e.target.value }))}
              />
            </div>
            <div>
              <Label>Orders</Label>
              <Input
                type="number"
                value={form.orders}
                onChange={(e) => setForm((p) => ({ ...p, orders: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Likes</Label>
              <Input
                type="number"
                value={form.likes}
                onChange={(e) => setForm((p) => ({ ...p, likes: e.target.value }))}
              />
            </div>
            <div>
              <Label>Avg Watch Time (sec)</Label>
              <Input
                type="number"
                value={form.watch_time_avg}
                onChange={(e) => setForm((p) => ({ ...p, watch_time_avg: e.target.value }))}
              />
            </div>
          </div>
        </div>
        <Button
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending || !form.stream_link.trim()}
          className="w-full"
        >
          {submitMutation.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</>
          ) : (
            "Submit Analytics"
          )}
        </Button>
      </div>
    );
  }

  if (!analytics && isBrand) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Eye className="h-8 w-8 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Waiting for creator to submit stream analytics</p>
        <p className="text-sm mt-1">You will be notified when analytics are submitted.</p>
      </div>
    );
  }

  if (!analytics) return null;

  // Dashboard
  const stats = [
    {
      label: "GMV",
      value: `$${Number(analytics.gmv || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      icon: <DollarSign className="h-5 w-5 text-emerald-400" />,
    },
    {
      label: "Orders",
      value: (analytics.orders || 0).toLocaleString(),
      icon: <ShoppingCart className="h-5 w-5 text-blue-400" />,
    },
    {
      label: "Peak Viewers",
      value: (analytics.peak_viewers || 0).toLocaleString(),
      icon: <Eye className="h-5 w-5 text-primary" />,
    },
    {
      label: "Total Viewers",
      value: (analytics.total_viewers || 0).toLocaleString(),
      icon: <Users className="h-5 w-5 text-indigo-400" />,
    },
  ];

  const chartData = [
    { name: "Start", viewers: Math.round(Number(analytics.total_viewers || 0) * 0.3) },
    { name: "10m", viewers: Math.round(Number(analytics.total_viewers || 0) * 0.6) },
    { name: "20m", viewers: Number(analytics.peak_viewers || 0) },
    { name: "30m", viewers: Math.round(Number(analytics.peak_viewers || 0) * 0.85) },
    { name: "40m", viewers: Math.round(Number(analytics.peak_viewers || 0) * 0.7) },
    { name: "50m", viewers: Math.round(Number(analytics.total_viewers || 0) * 0.5) },
    { name: "End", viewers: Math.round(Number(analytics.total_viewers || 0) * 0.25) },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Stream Analytics</h3>
        {analytics.approved_at && (
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" /> Approved
          </span>
        )}
      </div>

      {analytics.stream_link && (
        <div className="text-sm">
          <span className="text-muted-foreground">Stream: </span>
          <a
            href={analytics.stream_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {analytics.stream_link}
          </a>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              {s.icon}
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border">
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-4">Viewers Over Time (est.)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(0 0% 55%)" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(0 0% 55%)" }} />
              <Tooltip contentStyle={{ background: "hsl(0 0% 7%)", border: "1px solid hsl(0 0% 15%)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="viewers" fill="hsl(349 98% 56%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {analytics.watch_time_avg != null && analytics.watch_time_avg > 0 && (
        <p className="text-xs text-muted-foreground">
          Average watch time: {analytics.watch_time_avg}s | Likes: {(analytics.likes || 0).toLocaleString()}
        </p>
      )}

      <p className="text-xs text-muted-foreground">Analytics are based on data submitted by the creator.</p>

      {/* Brand actions */}
      {isBrand && !analytics.approved_at && (
        <div className="flex gap-3">
          <Button
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending}
            className="flex-1"
          >
            {approveMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Approving...</>
            ) : (
              "Approve & Release Payment"
            )}
          </Button>
          <Button variant="destructive" onClick={() => setDisputeOpen(true)} className="gap-2">
            <AlertTriangle className="h-4 w-4" /> Dispute
          </Button>
        </div>
      )}

      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Open Dispute</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Describe your concern. Our team will review this dispute within 48 hours.
            </p>
            <Input
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Reason for dispute..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => disputeMutation.mutate()}
              disabled={disputeMutation.isPending}
            >
              {disputeMutation.isPending ? "Submitting..." : "Submit Dispute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnalyticsTab;
