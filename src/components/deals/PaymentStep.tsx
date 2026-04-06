import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lock, DollarSign, CheckCircle2, MessageSquare,
  Loader2, Send,
} from "lucide-react";

interface PaymentStepProps {
  dealId: string;
  conversationId: string;
  isBrand: boolean;
  dealStatus: string;
  dealRate: number;
  creatorUserId: string;
  onTabChange?: (tab: string) => void;
}

const PAYMENT_STATUS_BEFORE_CONTRACT = [
  "negotiating", "agreed", "signed",
];

const PaymentStep = ({
  dealId,
  conversationId,
  isBrand,
  dealStatus,
  dealRate,
  creatorUserId,
  onTabChange,
}: PaymentStepProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const { data: creatorPayment, isLoading } = useQuery({
    queryKey: ["creator-payment-info", creatorUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creator_profiles")
        .select("payment_method, payment_handle")
        .eq("user_id", creatorUserId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!creatorUserId && !PAYMENT_STATUS_BEFORE_CONTRACT.includes(dealStatus),
  });

  const { data: deal } = useQuery({
    queryKey: ["deal-payment", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("payment_status, payment_method_used")
        .eq("id", dealId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!dealId,
  });

  const paymentStatus = deal?.payment_status || "unpaid";

  const markPaymentSent = useMutation({
    mutationFn: async () => {
      const { error: dealError } = await supabase
        .from("deals")
        .update({
          payment_status: "sent",
          payment_method_used: creatorPayment?.payment_method || null,
        })
        .eq("id", dealId);
      if (dealError) throw dealError;

      // System message is best-effort — don't fail the whole operation if RLS blocks it
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user!.id,
        content: `Payment of $${dealRate.toLocaleString()} sent via ${creatorPayment?.payment_method || "direct transfer"}`,
        message_type: "system_event",
        metadata: { event_type: "payment_sent" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-payment", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      toast({ title: "Payment marked as sent" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const confirmPayment = useMutation({
    mutationFn: async () => {
      const { error: dealError } = await supabase
        .from("deals")
        .update({ payment_status: "confirmed" })
        .eq("id", dealId);
      if (dealError) throw dealError;

      // System message is best-effort — don't fail the whole operation if RLS blocks it
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user!.id,
        content: "Payment confirmed received",
        message_type: "system_event",
        metadata: { event_type: "payment_confirmed" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-payment", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      toast({ title: "Payment confirmed!" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Locked state — contract not yet signed
  if (PAYMENT_STATUS_BEFORE_CONTRACT.includes(dealStatus)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-foreground">Sign contract first</p>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Payment details will be available after both parties sign the contract
        </p>
      </div>
    );
  }

  // Payment confirmed
  if (paymentStatus === "confirmed") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <p className="text-lg font-medium text-foreground">Payment Confirmed</p>
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
          ${dealRate.toLocaleString()} received
        </Badge>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Brand view — send payment
  if (isBrand && paymentStatus === "unpaid") {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Send Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="text-lg font-bold text-foreground">
                  ${dealRate.toLocaleString()}
                </span>
              </div>
              {creatorPayment?.payment_method && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Method</span>
                  <span className="text-sm font-medium text-foreground">
                    {creatorPayment.payment_method}
                  </span>
                </div>
              )}
              {creatorPayment?.payment_handle && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Send to</span>
                  <span className="text-sm font-medium text-foreground font-mono">
                    {creatorPayment.payment_handle}
                  </span>
                </div>
              )}
            </div>

            {!creatorPayment?.payment_method && (
              <p className="text-sm text-yellow-500">
                Creator hasn't set up payment info yet. Please message them to coordinate.
              </p>
            )}

            <Button
              className="w-full gap-2"
              onClick={() => markPaymentSent.mutate()}
              disabled={markPaymentSent.isPending || !creatorPayment?.payment_method}
            >
              {markPaymentSent.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Mark Payment Sent
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Brand view — waiting for confirmation
  if (isBrand && paymentStatus === "sent") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
          <DollarSign className="h-8 w-8 text-blue-500" />
        </div>
        <p className="text-lg font-medium text-foreground">Payment Sent</p>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Waiting for creator to confirm they received ${dealRate.toLocaleString()}
        </p>
        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
          Awaiting confirmation
        </Badge>
      </div>
    );
  }

  // Creator view — confirm payment
  if (!isBrand && paymentStatus === "sent") {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Confirm Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                Brand says they sent{" "}
                <span className="font-bold text-foreground">
                  ${dealRate.toLocaleString()}
                </span>
                {deal?.payment_method_used && (
                  <> via <span className="font-medium text-foreground">
                    {deal.payment_method_used}
                  </span></>
                )}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 gap-2"
                onClick={() => {
                  setConfirming(true);
                  confirmPayment.mutate();
                }}
                disabled={confirmPayment.isPending}
              >
                {confirmPayment.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Confirm Received
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => onTabChange?.("chat")}>
                <MessageSquare className="h-4 w-4" /> Message Brand
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Creator view — waiting for brand to send
  if (!isBrand && paymentStatus === "unpaid") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <DollarSign className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-foreground">Waiting for Payment</p>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          The brand will send ${dealRate.toLocaleString()} to your{" "}
          {creatorPayment?.payment_method || "payment method"}
        </p>
      </div>
    );
  }

  return null;
};

export default PaymentStep;
