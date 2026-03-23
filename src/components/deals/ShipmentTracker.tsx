import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Circle, Package, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const CARRIERS = ["UPS", "FedEx", "USPS", "DHL"];
const STEPS = [
  { key: "pending", label: "Label Created" },
  { key: "shipped", label: "Shipped" },
  { key: "in_transit", label: "In Transit" },
  { key: "delivered", label: "Delivered" },
];

interface ShipmentTrackerProps {
  dealId: string;
  conversationId: string;
  isBrand: boolean;
}

const ShipmentTracker = ({ dealId, conversationId, isBrand }: ShipmentTrackerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");

  const { data: shipment, isLoading } = useQuery({
    queryKey: ["shipment", dealId],
    queryFn: async () => {
      const { data, error } = await supabase.from("shipments").select("*").eq("deal_id", dealId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const createShipment = useMutation({
    mutationFn: async () => {
      await supabase.from("shipments").insert({
        deal_id: dealId, tracking_number: trackingNumber, carrier, status: "shipped" as any, shipped_at: new Date().toISOString(),
      });
      await supabase.from("deals").update({ status: "shipped" as any }).eq("id", dealId);
      await supabase.from("messages").insert({
        conversation_id: conversationId, sender_id: user!.id,
        content: `Product shipped via ${carrier}. Tracking: ${trackingNumber}`,
        message_type: "system_event", metadata: { event_type: "product_shipped" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipment", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      toast({ title: "Shipment created!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const updates: any = { status: newStatus };
      if (newStatus === "delivered") updates.delivered_at = new Date().toISOString();
      await supabase.from("shipments").update(updates).eq("deal_id", dealId);
      if (newStatus === "delivered") {
        await supabase.from("deals").update({ status: "delivered" as any }).eq("id", dealId);
        await supabase.from("messages").insert({
          conversation_id: conversationId, sender_id: user!.id,
          content: "Product received by creator.",
          message_type: "system_event", metadata: { event_type: "product_received" },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipment", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;

  // No shipment yet — brand can create one
  if (!shipment) {
    if (!isBrand) return <div className="p-8 text-center text-muted-foreground">Waiting for brand to ship product…</div>;
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2"><Package className="h-5 w-5" /> Ship Product</h3>
        <div className="space-y-2">
          <Label>Tracking Number</Label>
          <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Enter tracking number" />
        </div>
        <div className="space-y-2">
          <Label>Carrier</Label>
          <Select value={carrier} onValueChange={setCarrier}>
            <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
            <SelectContent>{CARRIERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={() => createShipment.mutate()} disabled={!trackingNumber || !carrier || createShipment.isPending} className="w-full">
          {createShipment.isPending ? "Shipping…" : "Mark as Shipped"}
        </Button>
      </div>
    );
  }

  // Show tracker
  const currentIdx = STEPS.findIndex(s => s.key === shipment.status);

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h3 className="text-lg font-bold flex items-center gap-2"><Truck className="h-5 w-5" /> Shipment Tracking</h3>

      <div className="rounded-lg border border-border bg-card p-4 space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Tracking</span><span className="font-mono">{shipment.tracking_number}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Carrier</span><span>{shipment.carrier}</span></div>
      </div>

      {/* Stepper */}
      <div className="space-y-0">
        {STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={step.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                {done ? <CheckCircle className={cn("h-5 w-5", isCurrent ? "text-primary" : "text-emerald-400")} /> : <Circle className="h-5 w-5 text-muted-foreground/30" />}
                {i < STEPS.length - 1 && <div className={cn("w-0.5 h-8", done ? "bg-emerald-400" : "bg-muted-foreground/20")} />}
              </div>
              <p className={cn("text-sm pt-0.5", done ? "text-foreground font-medium" : "text-muted-foreground")}>{step.label}</p>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {isBrand && shipment.status !== "delivered" && (
        <div className="space-y-2">
          <Label>Update Status</Label>
          <Select value={shipment.status} onValueChange={(v) => updateStatus.mutate(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STEPS.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      {!isBrand && shipment.status === "delivered" && (
        <Button onClick={() => updateStatus.mutate("delivered")} disabled={updateStatus.isPending} className="w-full">
          {updateStatus.isPending ? "Confirming…" : "Mark as Received"}
        </Button>
      )}
    </div>
  );
};

export default ShipmentTracker;
