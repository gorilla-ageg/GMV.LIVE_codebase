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
import ShipmentTracker from "@/components/deals/ShipmentTracker";
import AnalyticsTab from "@/components/deals/AnalyticsTab";
import { ArrowLeft, MessageSquare, FileText, Package, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const DealRoom = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [offerOpen, setOfferOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");

  const { data: deal, isLoading } = useQuery({
    queryKey: ["deal", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*, conversations(brand_user_id, creator_user_id, id)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const convo = (deal as any)?.conversations;
  const isBrand = convo?.brand_user_id === user?.id;

  const { data: brandProfile } = useQuery({
    queryKey: ["profile", convo?.brand_user_id],
    queryFn: async () => {
      const { data } = await supabase.from("public_profiles").select("display_name, avatar_url").eq("id", convo.brand_user_id).single();
      return data;
    },
    enabled: !!convo?.brand_user_id,
  });

  const { data: creatorProfile } = useQuery({
    queryKey: ["profile", convo?.creator_user_id],
    queryFn: async () => {
      const { data } = await supabase.from("public_profiles").select("display_name, avatar_url").eq("id", convo.creator_user_id).single();
      return data;
    },
    enabled: !!convo?.creator_user_id,
  });

  const { data: escrow } = useQuery({
    queryKey: ["escrow", id],
    queryFn: async () => {
      const { data } = await supabase.from("escrow_payments").select("*").eq("deal_id", id!).maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const sendOfferMutation = useMutation({
    mutationFn: async (offer: { rate: number; deliverables: string; liveDate: string; usageRights: string[]; note: string }) => {
      await supabase.from("deal_offers").insert({
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
      } as any);
      await supabase.from("messages").insert({
        conversation_id: convo.id,
        sender_id: user!.id,
        content: `New offer: $${offer.rate.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        message_type: "offer",
        metadata: { offer_rate: offer.rate },
      });
    },
    onSuccess: () => {
      setOfferOpen(false);
      queryClient.invalidateQueries({ queryKey: ["deal-offers", id] });
      queryClient.invalidateQueries({ queryKey: ["deal-messages", convo?.id] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const fundEscrowMutation = useMutation({
    mutationFn: async () => {
      await supabase.from("escrow_payments").insert({
        deal_id: id!,
        amount: Number(deal?.rate) || 0,
        status: "funded" as any,
        funded_at: new Date().toISOString(),
      });
      await supabase.from("deals").update({ status: "funded" as any }).eq("id", id!);
      await supabase.from("messages").insert({
        conversation_id: convo.id,
        sender_id: user!.id,
        content: `Escrow funded: $${Number(deal?.rate).toLocaleString("en-US", { minimumFractionDigits: 2 })} held securely. Brand can now ship the product.`,
        message_type: "system_event",
        metadata: { event_type: "escrow_funded" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escrow", id] });
      queryClient.invalidateQueries({ queryKey: ["deal", id] });
      toast({ title: "Escrow funded!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleCta = () => {
    const status = deal?.status;
    if (status === "negotiating") { setOfferOpen(true); return; }
    if ((status === "agreed" || status === "contracted" || status === "signed") && isBrand) { fundEscrowMutation.mutate(); return; }
    if ((status === "escrow_funded" || status === "funded") && isBrand) { setActiveTab("shipment"); return; }
    if (status === "shipped") { setActiveTab("shipment"); return; }
    if (status === "delivered" && !isBrand) { setActiveTab("analytics"); return; }
    if (status === "live" || status === "in_progress") { setActiveTab("analytics"); return; }
    if (status === "completed") { toast({ title: "Rating coming soon!" }); return; }
  };

  if (isLoading) return <AppLayout><p className="text-muted-foreground">Loading deal…</p></AppLayout>;
  if (!deal || !convo) return <AppLayout><p className="text-muted-foreground">Deal not found.</p></AppLayout>;

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
              />
            </TabsContent>
            <TabsContent value="contract" className="flex-1 overflow-y-auto m-0">
              <ContractView dealId={deal.id} conversationId={convo.id} />
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
