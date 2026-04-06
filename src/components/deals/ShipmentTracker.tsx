import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Circle, Package, Truck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Tables, Enums } from "@/integrations/supabase/types";

type Shipment = Tables<"shipments">;
type ShipmentStatus = Enums<"shipment_status">;

const CARRIERS = ["UPS", "FedEx", "USPS", "DHL"];
const STEPS: { key: ShipmentStatus; label: string }[] = [
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
  const [receiptConfirmed, setReceiptConfirmed] = useState(false);

  const { data: shipment, isLoading, error } = useQuery({
    queryKey: ["shipment", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .eq("deal_id", dealId)
        .maybeSingle();
      if (error) throw error;
      return data as Shipment | null;
    },
    enabled: !!dealId,
  });

  const createShipment = useMutation({
    mutationFn: async () => {
      if (!trackingNumber.trim()) throw new Error("Tracking number is required");
      if (!carrier) throw new Error("Carrier is required");

      const { error: shipErr } = await supabase.from("shipments").insert({
        deal_id: dealId,
        tracking_number: trackingNumber.trim(),
        carrier,
        status: "shipped" as ShipmentStatus,
        shipped_at: new Date().toISOString(),
      });
      if (shipErr) throw shipErr;

      const { error: dealErr } = await supabase
        .from("deals")
        .update({ status: "shipped" })
        .eq("id", dealId);
      if (dealErr) throw dealErr;

      const { error: msgErr } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user!.id,
        content: `Product shipped via ${carrier}. Tracking: ${trackingNumber.trim()}`,
        message_type: "system_event",
        metadata: { event_type: "product_shipped" },
      });
      // best-effort: don't block main operation if system message fails
    },
    onSuccess: () => {
      setTrackingNumber("");
      setCarrier("");
      queryClient.invalidateQueries({ queryKey: ["shipment", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal-messages", conversationId] });
      toast({ title: "Shipment created!" });
    },
    onError: (err: Error) => toast({ title: "Error creating shipment", description: err.message, variant: "destructive" }),
  });

  const updateStatus = useMutation({
    mutationFn: async (newStatus: ShipmentStatus) => {
      const updates: Partial<Shipment> = { status: newStatus };
      if (newStatus === "delivered") updates.delivered_at = new Date().toISOString();

      const { error: shipErr } = await supabase
        .from("shipments")
        .update(updates)
        .eq("deal_id", dealId);
      if (shipErr) throw shipErr;

      if (newStatus === "delivered") {
        const { error: dealErr } = await supabase
          .from("deals")
          .update({ status: "delivered" })
          .eq("id", dealId);
        if (dealErr) throw dealErr;

        const { error: msgErr } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: user!.id,
          content: "Product delivered. Creator can now go live.",
          message_type: "system_event",
          metadata: { event_type: "product_delivered" },
        });
        // best-effort: don't block main operation if system message fails
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipment", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal-messages", conversationId] });
    },
    onError: (err: Error) => toast({ title: "Error updating shipment", description: err.message, variant: "destructive" }),
  });

  const confirmReceiptMutation = useMutation({
    mutationFn: async () => {
      const { error: dealErr } = await supabase
        .from("deals")
        .update({ status: "delivered" })
        .eq("id", dealId);
      if (dealErr) throw dealErr;

      const { error: msgErr } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user!.id,
        content: "Product received by creator. Ready to go live!",
        message_type: "system_event",
        metadata: { event_type: "product_received" },
      });
      // best-effort: don't block main operation if system message fails
    },
    onSuccess: () => {
      setReceiptConfirmed(true);
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal-messages", conversationId] });
      toast({ title: "Receipt confirmed!" });
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
        <p className="text-sm text-destructive">Failed to load shipment: {(error as Error).message}</p>
      </div>
    );
  }

  // No shipment yet - brand can create one
  if (!shipment) {
    if (!isBrand) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <Package className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Waiting for brand to ship product</p>
          <p className="text-sm mt-1">You will be notified when shipping info is added.</p>
        </div>
      );
    }
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Package className="h-5 w-5" /> Ship Product
        </h3>
        <div className="space-y-2">
          <Label>Tracking Number</Label>
          <Input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Enter tracking number"
          />
        </div>
        <div className="space-y-2">
          <Label>Carrier</Label>
          <Select value={carrier} onValueChange={setCarrier}>
            <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
            <SelectContent>
              {CARRIERS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => createShipment.mutate()}
          disabled={!trackingNumber.trim() || !carrier || createShipment.isPending}
          className="w-full"
        >
          {createShipment.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Shipping...</>
          ) : (
            "Mark as Shipped"
          )}
        </Button>
      </div>
    );
  }

  // Show tracker
  const currentIdx = STEPS.findIndex((s) => s.key === shipment.status);

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <Truck className="h-5 w-5" /> Shipment Tracking
      </h3>

      <div className="rounded-lg border border-border bg-card p-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tracking</span>
          <span className="font-mono">{shipment.tracking_number}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Carrier</span>
          <span>{shipment.carrier}</span>
        </div>
        {shipment.shipped_at && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipped</span>
            <span className="text-xs">{new Date(shipment.shipped_at).toLocaleDateString()}</span>
          </div>
        )}
        {shipment.delivered_at && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivered</span>
            <span className="text-xs">{new Date(shipment.delivered_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Stepper */}
      <div className="space-y-0">
        {STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={step.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                {done ? (
                  <CheckCircle className={cn("h-5 w-5", isCurrent ? "text-primary" : "text-emerald-400")} />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/30" />
                )}
                {i < STEPS.length - 1 && (
                  <div className={cn("w-0.5 h-8", done ? "bg-emerald-400" : "bg-muted-foreground/20")} />
                )}
              </div>
              <p className={cn("text-sm pt-0.5", done ? "text-foreground font-medium" : "text-muted-foreground")}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Brand can update shipment status */}
      {isBrand && shipment.status !== "delivered" && (
        <div className="space-y-2">
          <Label>Update Status</Label>
          <Select
            value={shipment.status}
            onValueChange={(v) => updateStatus.mutate(v as ShipmentStatus)}
            disabled={updateStatus.isPending}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STEPS.map((s) => (
                <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Creator confirms receipt after delivery */}
      {!isBrand && shipment.status === "delivered" && !receiptConfirmed && (
        <Button
          onClick={() => confirmReceiptMutation.mutate()}
          disabled={confirmReceiptMutation.isPending}
          className="w-full"
        >
          {confirmReceiptMutation.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Confirming...</>
          ) : (
            "Confirm Receipt"
          )}
        </Button>
      )}
    </div>
  );
};

export default ShipmentTracker;
