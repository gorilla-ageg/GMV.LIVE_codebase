import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import DealSummaryPanel from "@/components/deals/DealSummaryPanel";
import DealChat from "@/components/deals/DealChat";
import OfferModal from "@/components/deals/OfferModal";
import ContractView from "@/components/deals/ContractView";
import PaymentStep from "@/components/deals/PaymentStep";
import ShipmentTracker from "@/components/deals/ShipmentTracker";
import AnalyticsTab from "@/components/deals/AnalyticsTab";
import { ArrowLeft, MessageSquare, FileText, DollarSign, Package, BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tables, Enums } from "@/integrations/supabase/types";

type Deal = Tables<"deals">;
type DealStatus = Enums<"deal_status">;

interface ConversationJoin {
  id: string;
  brand_user_id: string;
  creator_user_id: string;
}

interface DealWithConversation extends Deal {
  conversations: ConversationJoin;
}

const DealRoom = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [offerOpen, setOfferOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");

  const { data: deal, isLoading, error: dealError } = useQuery({
    queryKey: ["deal", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*, conversations(id, brand_user_id, creator_user_id)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as DealWithConversation;
    },
    enabled: !!id,
  });

  const convo = deal?.conversations;
  const isBrand = convo?.brand_user_id === user?.id;

  const { data: brandProfile } = useQuery({
    queryKey: ["profile", convo?.brand_user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_profiles")
        .select("display_name, avatar_url")
        .eq("id", convo!.brand_user_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!convo?.brand_user_id,
  });

  const { data: creatorProfile } = useQuery({
    queryKey: ["profile", convo?.creator_user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_profiles")
        .select("display_name, avatar_url")
        .eq("id", convo!.creator_user_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!convo?.creator_user_id,
  });

  const { data: escrow } = useQuery({
    queryKey: ["escrow", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("escrow_payments")
        .select("*")
        .eq("deal_id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const sendOfferMutation = useMutation({
    mutationFn: async (offer: { rate: number; deliverables: string; liveDate: string; usageRights: string[]; note: string }) => {
      const { error: offerError } = await supabase.from("deal_offers").insert({
        deal_id: id!,
        sender_id: user!.id,
        rate: offer.rate,
        hourly_rate: 0,
        hours: 0,
        commission_percentage: 0,
        deliverables: offer.deliverables,
        live_date: offer.liveDate || null,
        usage_rights: offer.usageRights,
        note: offer.note || null,
        status: "pending",
      });
      if (offerError) throw offerError;

      // Ensure deal is in negotiating status
      await supabase.from("deals").update({ status: "negotiating" as DealStatus }).eq("id", id!);

      const { error: msgError } = await supabase.from("messages").insert({
        conversation_id: convo!.id,
        sender_id: user!.id,
        content: `New offer sent: $${offer.rate.toLocaleString("en-US", { minimumFractionDigits: 2 })}${offer.liveDate ? `, live date ${new Date(offer.liveDate).toLocaleDateString()}` : ""}`,
        message_type: "system_event",
        metadata: { event_type: "offer_sent", offer_rate: offer.rate },
      });
      if (msgError) throw msgError;
    },
    onSuccess: () => {
      setOfferOpen(false);
      queryClient.invalidateQueries({ queryKey: ["deal-offers", id] });
      queryClient.invalidateQueries({ queryKey: ["deal-messages", convo?.id] });
      queryClient.invalidateQueries({ queryKey: ["deal", id] });
      toast({ title: "Offer sent!" });
    },
    onError: (err: Error) => toast({ title: "Error sending offer", description: err.message, variant: "destructive" }),
  });

  const fundEscrowMutation = useMutation({
    mutationFn: async () => {
      // Create escrow row in "pending" state first (if it doesn't already exist)
      const { data: existingEscrow } = await supabase
        .from("escrow_payments")
        .select("id")
        .eq("deal_id", id!)
        .maybeSingle();

      if (!existingEscrow) {
        const { error: insertError } = await supabase.from("escrow_payments").insert({
          deal_id: id!,
          amount: Number(deal?.rate) || 0,
          status: "pending",
        });
        if (insertError) throw insertError;
      }

      // Use the secure RPC function to transition pending -> funded
      const { error: rpcError } = await supabase.rpc("fund_escrow", { _deal_id: id! });
      if (rpcError) throw rpcError;

      // Update deal status
      const { error: updateError } = await supabase
        .from("deals")
        .update({ status: "funded" as DealStatus })
        .eq("id", id!);
      if (updateError) throw updateError;

      const { error: msgError } = await supabase.from("messages").insert({
        conversation_id: convo!.id,
        sender_id: user!.id,
        content: `Escrow funded: $${Number(deal?.rate).toLocaleString("en-US", { minimumFractionDigits: 2 })} held securely. Brand can now ship the product.`,
        message_type: "system_event",
        metadata: { event_type: "escrow_funded" },
      });
      if (msgError) throw msgError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escrow", id] });
      queryClient.invalidateQueries({ queryKey: ["deal", id] });
      queryClient.invalidateQueries({ queryKey: ["deal-messages", convo?.id] });
      toast({ title: "Escrow funded!" });
    },
    onError: (err: Error) => toast({ title: "Error funding escrow", description: err.message, variant: "destructive" }),
  });

  const handleCta = () => {
    const status = deal?.status;
    if (status === "negotiating") { setOfferOpen(true); return; }
    if (status === "agreed" || status === "signed") { setActiveTab("contract"); return; }
    // After both sign, go to payment (direct pay via Venmo/PayPal/Zelle)
    if (status === "contracted") { setActiveTab("payment"); return; }
    if ((status === "escrow_funded" || status === "funded") && isBrand) { setActiveTab("shipment"); return; }
    if ((status === "escrow_funded" || status === "funded") && !isBrand) { setActiveTab("payment"); return; }
    if (status === "shipped") { setActiveTab("shipment"); return; }
    if (status === "delivered" && !isBrand) { setActiveTab("analytics"); return; }
    if (status === "live" || status === "in_progress") { setActiveTab("analytics"); return; }
    if (status === "completed") { toast({ title: "Rating coming soon!" }); return; }
    if (status === "disputed") { setActiveTab("chat"); return; }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (dealError) {
    return (
      <AppLayout>
        <div className="text-center py-12 space-y-3">
          <p className="text-destructive font-medium">Failed to load deal</p>
          <p className="text-sm text-muted-foreground">{(dealError as Error).message}</p>
          <Button variant="outline" onClick={() => navigate("/deals")}>Back to Deals</Button>
        </div>
      </AppLayout>
    );
  }

  if (!deal || !convo) {
    return (
      <AppLayout>
        <div className="text-center py-12 space-y-3">
          <p className="text-muted-foreground">Deal not found.</p>
          <Button variant="outline" onClick={() => navigate("/deals")}>Back to Deals</Button>
        </div>
      </AppLayout>
    );
  }

  const otherParty = isBrand
    ? { name: creatorProfile?.display_name || "Creator", avatarUrl: creatorProfile?.avatar_url || undefined }
    : { name: brandProfile?.display_name || "Brand", avatarUrl: brandProfile?.avatar_url || undefined };

  return (
    <AppLayout>
      <Button variant="ghost" size="sm" onClick={() => navigate("/deals")} className="mb-4 gap-1">
        <ArrowLeft className="h-4 w-4" /> Deals
      </Button>

      <div className="flex flex-col lg:flex-row gap-4" style={{ height: "calc(100vh - 10rem)" }}>
        {/* Left panel - summary */}
        <div className="w-full lg:w-[300px] shrink-0 rounded-xl border border-border bg-card overflow-y-auto">
          <DealSummaryPanel
            deal={deal}
            otherParty={otherParty}
            isBrand={isBrand}
            escrowAmount={escrow ? Number(escrow.amount) : undefined}
            onCta={handleCta}
            ctaLoading={fundEscrowMutation.isPending}
          />
        </div>

        {/* Right panel - tabs */}
        <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-2 pt-2">
              <TabsTrigger value="chat" className="gap-1.5"><MessageSquare className="h-3.5 w-3.5" />Chat</TabsTrigger>
              <TabsTrigger value="contract" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Contract</TabsTrigger>
              <TabsTrigger value="payment" className="gap-1.5"><DollarSign className="h-3.5 w-3.5" />Payment</TabsTrigger>
              <TabsTrigger value="shipment" className="gap-1.5"><Package className="h-3.5 w-3.5" />Shipment</TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="flex-1 overflow-hidden m-0">
              <DealChat
                conversationId={convo.id}
                dealId={deal.id}
                dealStatus={deal.status}
                brandUserId={convo.brand_user_id}
                creatorUserId={convo.creator_user_id}
                brandName={brandProfile?.display_name || "Brand"}
                creatorName={creatorProfile?.display_name || "Creator"}
                onTabChange={setActiveTab}
              />
            </TabsContent>
            <TabsContent value="contract" className="flex-1 overflow-y-auto m-0">
              <ContractView dealId={deal.id} conversationId={convo.id} />
            </TabsContent>
            <TabsContent value="payment" className="flex-1 overflow-y-auto m-0">
              <PaymentStep
                dealId={deal.id}
                conversationId={convo.id}
                isBrand={isBrand}
                dealStatus={deal.status}
                dealRate={Number(deal.rate) || 0}
                creatorUserId={convo.creator_user_id}
                onTabChange={setActiveTab}
              />
            </TabsContent>
            <TabsContent value="shipment" className="flex-1 overflow-y-auto m-0">
              <ShipmentTracker dealId={deal.id} conversationId={convo.id} isBrand={isBrand} />
            </TabsContent>
            <TabsContent value="analytics" className="flex-1 overflow-y-auto m-0">
              <AnalyticsTab dealId={deal.id} conversationId={convo.id} isBrand={isBrand} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <OfferModal
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
        onSubmit={(o) => sendOfferMutation.mutate(o)}
        isPending={sendOfferMutation.isPending}
        title={isBrand ? "Send Offer" : "Counter Offer"}
      />
    </AppLayout>
  );
};

export default DealRoom;
