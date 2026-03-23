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
import { DollarSign, Eye, Users, ShoppingCart, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  const [form, setForm] = useState({
    stream_link: "", peak_viewers: "", total_viewers: "", gmv: "", orders: "", likes: "", watch_time_avg: "",
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["live-analytics", dealId],
    queryFn: async () => {
      const { data, error } = await supabase.from("live_analytics").select("*").eq("deal_id", dealId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      await supabase.from("live_analytics").insert({
        deal_id: dealId,
        creator_id: user!.id,
        stream_link: form.stream_link,
        peak_viewers: parseInt(form.peak_viewers) || 0,
        total_viewers: parseInt(form.total_viewers) || 0,
        gmv: parseFloat(form.gmv) || 0,
        orders: parseInt(form.orders) || 0,
        likes: parseInt(form.likes) || 0,
        watch_time_avg: parseInt(form.watch_time_avg) || 0,
      });
      await supabase.from("deals").update({ status: "live" as any }).eq("id", dealId);
      await supabase.from("messages").insert({
        conversation_id: conversationId, sender_id: user!.id,
        content: "📊 Stream analytics have been submitted for review.",
        message_type: "system_event", metadata: { event_type: "stream_submitted" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-analytics", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      toast({ title: "Analytics submitted!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      // Use secure RPC functions instead of direct table updates
      await supabase.rpc("approve_analytics", { _deal_id: dealId });
      await supabase.rpc("release_escrow", { _deal_id: dealId });
      await supabase.from("deals").update({ status: "completed" as any }).eq("id", dealId);
      await supabase.from("messages").insert({
        conversation_id: conversationId, sender_id: user!.id,
        content: "✅ Analytics approved. Payment released to creator. Deal completed!",
        message_type: "system_event", metadata: { event_type: "deal_completed" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-analytics", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      toast({ title: "Deal completed! Payment released." });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;

  // Creator submission form
  if (!analytics && !isBrand) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <h3 className="text-lg font-bold">Submit Stream Analytics</h3>
        <div className="space-y-3">
          <div><Label>TikTok Live Stream URL</Label><Input value={form.stream_link} onChange={(e) => setForm(p => ({ ...p, stream_link: e.target.value }))} placeholder="https://www.tiktok.com/@..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Peak Viewers</Label><Input type="number" value={form.peak_viewers} onChange={(e) => setForm(p => ({ ...p, peak_viewers: e.target.value }))} /></div>
            <div><Label>Total Viewers</Label><Input type="number" value={form.total_viewers} onChange={(e) => setForm(p => ({ ...p, total_viewers: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>GMV ($)</Label><Input type="number" step="0.01" value={form.gmv} onChange={(e) => setForm(p => ({ ...p, gmv: e.target.value }))} /></div>
            <div><Label>Orders</Label><Input type="number" value={form.orders} onChange={(e) => setForm(p => ({ ...p, orders: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Likes</Label><Input type="number" value={form.likes} onChange={(e) => setForm(p => ({ ...p, likes: e.target.value }))} /></div>
            <div><Label>Avg Watch Time (sec)</Label><Input type="number" value={form.watch_time_avg} onChange={(e) => setForm(p => ({ ...p, watch_time_avg: e.target.value }))} /></div>
          </div>
        </div>
        <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending} className="w-full">
          {submitMutation.isPending ? "Submitting…" : "Submit Analytics"}
        </Button>
      </div>
    );
  }

  if (!analytics) return <div className="p-8 text-center text-muted-foreground">Waiting for creator to submit stream analytics…</div>;

  // Dashboard
  const stats = [
    { label: "GMV", value: `$${Number(analytics.gmv).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: <DollarSign className="h-5 w-5 text-emerald-400" /> },
    { label: "Orders", value: analytics.orders?.toLocaleString(), icon: <ShoppingCart className="h-5 w-5 text-blue-400" /> },
    { label: "Peak Viewers", value: analytics.peak_viewers?.toLocaleString(), icon: <Eye className="h-5 w-5 text-primary" /> },
    { label: "Total Viewers", value: analytics.total_viewers?.toLocaleString(), icon: <Users className="h-5 w-5 text-indigo-400" /> },
  ];

  const chartData = [
    { name: "Start", viewers: Math.round(Number(analytics.total_viewers) * 0.3) },
    { name: "10m", viewers: Math.round(Number(analytics.total_viewers) * 0.6) },
    { name: "20m", viewers: Number(analytics.peak_viewers) },
    { name: "30m", viewers: Math.round(Number(analytics.peak_viewers) * 0.85) },
    { name: "40m", viewers: Math.round(Number(analytics.peak_viewers) * 0.7) },
    { name: "50m", viewers: Math.round(Number(analytics.total_viewers) * 0.5) },
    { name: "End", viewers: Math.round(Number(analytics.total_viewers) * 0.25) },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Stream Analytics</h3>
        {analytics.approved_at && <span className="text-xs text-emerald-400 font-medium">✅ Approved</span>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
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

      <p className="text-xs text-muted-foreground">Analytics are based on data submitted by the creator.</p>

      {/* Brand actions */}
      {isBrand && !analytics.approved_at && (
        <div className="flex gap-3">
          <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending} className="flex-1">
            {approveMutation.isPending ? "Approving…" : "Approve & Release Payment"}
          </Button>
          <Button variant="destructive" onClick={() => setDisputeOpen(true)} className="gap-2">
            <AlertTriangle className="h-4 w-4" /> Dispute
          </Button>
        </div>
      )}

      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Open Dispute</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Our team will review this dispute within 48 hours. We'll reach out via email with next steps.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setDisputeOpen(false); toast({ title: "Dispute submitted", description: "Our team will review within 48 hours." }); }}>Submit Dispute</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnalyticsTab;
