import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import { Send, RefreshCw, MessageCircle, ArrowLeft, Plus, DollarSign, FileText, Package, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import OfferCard from "@/components/deals/OfferCard";
import OfferModal from "@/components/deals/OfferModal";
import SystemEventCard from "@/components/deals/SystemEventCard";
import StatusBadge from "@/components/deals/StatusBadge";
import DealSummaryPanel from "@/components/deals/DealSummaryPanel";
import ContractView from "@/components/deals/ContractView";
import ShipmentTracker from "@/components/deals/ShipmentTracker";
import AnalyticsTab from "@/components/deals/AnalyticsTab";

const ConversationThread = () => {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const [message, setMessage] = useState("");
  const [offerOpen, setOfferOpen] = useState(false);
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterDefaults, setCounterDefaults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("chat");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch conversation
  const { data: conversation } = useQuery({
    queryKey: ["conversation", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          brand_profile:public_profiles!conversations_brand_profile_fkey(display_name, avatar_url),
          creator_profile:public_profiles!conversations_creator_profile_fkey(display_name, avatar_url),
          product:products(title)
        `)
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch deal associated with this conversation
  const { data: deal } = useQuery({
    queryKey: ["deal-by-conversation", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("conversation_id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch messages
  const { data: messages, isLoading, refetch } = useQuery({
    queryKey: ["messages", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", id!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch offers if deal exists
  const { data: offers } = useQuery({
    queryKey: ["deal-offers", deal?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_offers")
        .select("*")
        .eq("deal_id", deal!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!deal?.id,
  });

  // Fetch escrow if deal exists
  const { data: escrow } = useQuery({
    queryKey: ["escrow", deal?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("escrow_payments")
        .select("*")
        .eq("deal_id", deal!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!deal?.id,
  });

  // Realtime subscription
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`conversation-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        () => queryClient.invalidateQueries({ queryKey: ["messages", id] })
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "deals", filter: `conversation_id=eq.${id}` },
        () => queryClient.invalidateQueries({ queryKey: ["deal-by-conversation", id] })
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, queryClient]);

  // Realtime for offers
  useEffect(() => {
    if (!deal?.id) return;
    const channel = supabase
      .channel(`deal-offers-${deal.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "deal_offers", filter: `deal_id=eq.${deal.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["deal-offers", deal.id] });
          queryClient.invalidateQueries({ queryKey: ["deal-by-conversation", id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [deal?.id, id, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, offers]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("messages").insert({
        conversation_id: id!,
        sender_id: user!.id,
        content,
        message_type: "text",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Create deal mutation (if doesn't exist)
  const createDealMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("deals").insert({
        conversation_id: id!,
        status: "negotiating" as any,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-by-conversation", id] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Send offer mutation
  const sendOfferMutation = useMutation({
    mutationFn: async (offer: { rate: number; deliverables: string; liveDate: string; usageRights: string[]; note: string }) => {
      let dealId = deal?.id;
      
      // Create deal if it doesn't exist
      if (!dealId) {
        const { data: newDeal, error: dealError } = await supabase.from("deals").insert({
          conversation_id: id!,
          status: "negotiating" as any,
        }).select().single();
        if (dealError) throw dealError;
        dealId = newDeal.id;
      }

      // Create offer
      await supabase.from("deal_offers").insert({
        deal_id: dealId,
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

      // Send message
      await supabase.from("messages").insert({
        conversation_id: id!,
        sender_id: user!.id,
        content: `Sent an offer: $${offer.rate.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        message_type: "offer",
        metadata: { offer_rate: offer.rate },
      });
    },
    onSuccess: () => {
      setOfferOpen(false);
      queryClient.invalidateQueries({ queryKey: ["deal-by-conversation", id] });
      queryClient.invalidateQueries({ queryKey: ["deal-offers", deal?.id] });
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Accept offer mutation
  const acceptMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const offer = offers?.find((o: any) => o.id === offerId);
      if (!offer) return;
      
      await supabase.from("deal_offers").update({ status: "accepted" }).eq("id", offerId);
      
      await supabase.from("deals").update({
        status: "agreed" as any,
        rate: (offer as any).rate,
        deliverables: (offer as any).deliverables,
        live_date: (offer as any).live_date,
        usage_rights: (offer as any).usage_rights,
      }).eq("id", deal!.id);
      
      // Create contract
      await supabase.from("contracts").insert({
        deal_id: deal!.id,
        terms: {
          rate: (offer as any).rate,
          deliverables: (offer as any).deliverables,
          live_date: (offer as any).live_date,
          usage_rights: (offer as any).usage_rights,
          brand_name: brandName,
          creator_name: creatorName,
        },
      });
      
      await supabase.from("messages").insert({
        conversation_id: id!,
        sender_id: user!.id,
        content: "Deal terms agreed. Contract has been generated.",
        message_type: "system_event",
        metadata: { event_type: "deal_agreed" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-offers", deal?.id] });
      queryClient.invalidateQueries({ queryKey: ["deal-by-conversation", id] });
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // Counter offer mutation
  const counterMutation = useMutation({
    mutationFn: async (offer: { rate: number; deliverables: string; liveDate: string; usageRights: string[]; note: string }) => {
      const pending = offers?.filter((o: any) => o.status === "pending") || [];
      for (const p of pending) {
        await supabase.from("deal_offers").update({ status: "countered" }).eq("id", p.id);
      }
      
      await supabase.from("deal_offers").insert({
        deal_id: deal!.id,
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
        conversation_id: id!,
        sender_id: user!.id,
        content: `Counter offer: $${offer.rate.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        message_type: "offer",
        metadata: { offer_rate: offer.rate },
      });
    },
    onSuccess: () => {
      setCounterOpen(false);
      queryClient.invalidateQueries({ queryKey: ["deal-offers", deal?.id] });
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // Fund escrow mutation
  const fundEscrowMutation = useMutation({
    mutationFn: async () => {
      await supabase.from("escrow_payments").insert({
        deal_id: deal!.id,
        amount: Number(deal!.rate) || 0,
        status: "funded",
        funded_at: new Date().toISOString(),
      });
      await supabase.from("deals").update({ status: "funded" as any }).eq("id", deal!.id);
      await supabase.from("messages").insert({
        conversation_id: id!,
        sender_id: user!.id,
        content: "Escrow has been funded. Product can now be shipped.",
        message_type: "system_event",
        metadata: { event_type: "escrow_funded" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-by-conversation", id] });
      queryClient.invalidateQueries({ queryKey: ["escrow", deal?.id] });
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMutation.mutate(message.trim());
  };

  const handleCta = () => {
    if (!deal) {
      setOfferOpen(true);
      return;
    }
    const status = deal.status;
    if (status === "negotiating") {
      setOfferOpen(true);
    } else if (status === "agreed") {
      setActiveTab("contract");
    } else if (status === "contracted" && isBrand) {
      fundEscrowMutation.mutate();
    } else if (status === "funded" && isBrand) {
      setActiveTab("shipment");
    } else if (status === "delivered" && !isBrand) {
      setActiveTab("analytics");
    } else if (status === "live" && isBrand) {
      setActiveTab("analytics");
    }
  };

  const isBrand = conversation?.brand_user_id === user?.id;
  const brandName = (conversation as any)?.brand_profile?.display_name || "Brand";
  const creatorName = (conversation as any)?.creator_profile?.display_name || "Creator";
  const otherParty = isBrand ? (conversation as any)?.creator_profile : (conversation as any)?.brand_profile;
  const otherName = otherParty?.display_name || "User";

  const suggestedFirstMessages = role === "brand"
    ? [
        "Hi! I'd love to work with you on a live stream for our product.",
        "We're looking for a host for our upcoming campaign. Can you share your rates?",
      ]
    : [
        "Hi! I'd love to learn more about this opportunity.",
        "I'm interested in hosting this. Here's my rate and availability.",
      ];

  // Build timeline
  const timeline = [
    ...(messages || []).map((m: any) => ({ ...m, _type: m.message_type === "system_event" ? "system" : m.message_type === "offer" ? "offer_msg" : "text", _time: m.created_at })),
  ].sort((a, b) => new Date(a._time).getTime() - new Date(b._time).getTime());

  const hasDealTabs = deal && deal.status !== "negotiating";

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row gap-6" style={{ height: "calc(100vh - 8rem)" }}>
        {/* Left Panel - Deal Summary (shows when deal exists) */}
        {deal && (
          <div className="lg:w-80 shrink-0">
            <DealSummaryPanel
              deal={deal}
              otherParty={otherParty}
              isBrand={isBrand}
              escrowAmount={escrow?.amount}
              onCta={handleCta}
              ctaLoading={fundEscrowMutation.isPending}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border pb-3 mb-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/messages"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold truncate">{otherName}</h2>
                {deal && <StatusBadge status={deal.status} />}
              </div>
              {(conversation as any)?.product?.title && (
                <p className="text-sm text-muted-foreground truncate">Re: {(conversation as any).product.title}</p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => refetch()} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabs (visible when deal has progressed) */}
          {hasDealTabs ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="mb-3">
                <TabsTrigger value="chat" className="gap-1.5"><MessageCircle className="h-4 w-4" />Chat</TabsTrigger>
                <TabsTrigger value="contract" className="gap-1.5"><FileText className="h-4 w-4" />Contract</TabsTrigger>
                <TabsTrigger value="shipment" className="gap-1.5"><Package className="h-4 w-4" />Shipment</TabsTrigger>
                <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="h-4 w-4" />Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 mt-0">
                <ChatContent
                  timeline={timeline}
                  offers={offers}
                  user={user}
                  isBrand={isBrand}
                  brandName={brandName}
                  creatorName={creatorName}
                  conversation={conversation}
                  deal={deal}
                  isLoading={isLoading}
                  suggestedFirstMessages={suggestedFirstMessages}
                  sendMutation={sendMutation}
                  acceptMutation={acceptMutation}
                  setCounterDefaults={setCounterDefaults}
                  setCounterOpen={setCounterOpen}
                  bottomRef={bottomRef}
                  message={message}
                  setMessage={setMessage}
                  handleSend={handleSend}
                  setOfferOpen={setOfferOpen}
                />
              </TabsContent>

              <TabsContent value="contract" className="flex-1 overflow-y-auto mt-0">
                <ContractView dealId={deal.id} conversationId={id!} />
              </TabsContent>

              <TabsContent value="shipment" className="flex-1 overflow-y-auto mt-0">
                <ShipmentTracker dealId={deal.id} conversationId={id!} isBrand={isBrand} />
              </TabsContent>

              <TabsContent value="analytics" className="flex-1 overflow-y-auto mt-0">
                <AnalyticsTab dealId={deal.id} conversationId={id!} isBrand={isBrand} />
              </TabsContent>
            </Tabs>
          ) : (
            <ChatContent
              timeline={timeline}
              offers={offers}
              user={user}
              isBrand={isBrand}
              brandName={brandName}
              creatorName={creatorName}
              conversation={conversation}
              deal={deal}
              isLoading={isLoading}
              suggestedFirstMessages={suggestedFirstMessages}
              sendMutation={sendMutation}
              acceptMutation={acceptMutation}
              setCounterDefaults={setCounterDefaults}
              setCounterOpen={setCounterOpen}
              bottomRef={bottomRef}
              message={message}
              setMessage={setMessage}
              handleSend={handleSend}
              setOfferOpen={setOfferOpen}
            />
          )}
        </div>
      </div>

      {/* Offer Modal */}
      <OfferModal
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
        onSubmit={(o) => sendOfferMutation.mutate(o)}
        isPending={sendOfferMutation.isPending}
        title="Send Offer"
      />

      {/* Counter Modal */}
      <OfferModal
        open={counterOpen}
        onClose={() => setCounterOpen(false)}
        onSubmit={(o) => counterMutation.mutate(o)}
        isPending={counterMutation.isPending}
        defaultValues={counterDefaults}
        title="Counter Offer"
      />
    </AppLayout>
  );
};

// Extracted Chat Content component
interface ChatContentProps {
  timeline: any[];
  offers: any[] | undefined;
  user: any;
  isBrand: boolean;
  brandName: string;
  creatorName: string;
  conversation: any;
  deal: any;
  isLoading: boolean;
  suggestedFirstMessages: string[];
  sendMutation: any;
  acceptMutation: any;
  setCounterDefaults: (v: any) => void;
  setCounterOpen: (v: boolean) => void;
  bottomRef: React.RefObject<HTMLDivElement>;
  message: string;
  setMessage: (v: string) => void;
  handleSend: (e: React.FormEvent) => void;
  setOfferOpen: (v: boolean) => void;
}

const ChatContent = ({
  timeline,
  offers,
  user,
  isBrand,
  brandName,
  creatorName,
  conversation,
  deal,
  isLoading,
  suggestedFirstMessages,
  sendMutation,
  acceptMutation,
  setCounterDefaults,
  setCounterOpen,
  bottomRef,
  message,
  setMessage,
  handleSend,
  setOfferOpen,
}: ChatContentProps) => {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 px-1">
        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : timeline.length === 0 && (!offers || offers.length === 0) ? (
          <div className="space-y-4">
            <p className="text-center text-muted-foreground">No messages yet. Say hello — or try one of these:</p>
            <div className="flex flex-col gap-2 max-w-md mx-auto">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" /> Suggested ways to start
              </p>
              {suggestedFirstMessages.map((text, i) => (
                <Button
                  key={i}
                  type="button"
                  variant="outline"
                  className="h-auto py-3 px-4 text-left text-sm font-normal whitespace-normal justify-start"
                  onClick={() => sendMutation.mutate(text)}
                  disabled={sendMutation.isPending}
                >
                  {text}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Render offer cards */}
            {offers?.map((offer: any) => (
              <OfferCard
                key={offer.id}
                rate={Number(offer.rate || offer.hourly_rate * offer.hours)}
                deliverables={offer.deliverables}
                liveDate={offer.live_date}
                usageRights={offer.usage_rights}
                note={offer.note}
                status={offer.status}
                isOwn={offer.sender_id === user?.id}
                senderName={offer.sender_id === conversation?.brand_user_id ? brandName : creatorName}
                onAccept={() => acceptMutation.mutate(offer.id)}
                onCounter={() => {
                  setCounterDefaults({
                    rate: Number(offer.rate || offer.hourly_rate * offer.hours),
                    deliverables: offer.deliverables,
                    liveDate: offer.live_date,
                    usageRights: offer.usage_rights,
                  });
                  setCounterOpen(true);
                }}
                isPending={acceptMutation.isPending}
              />
            ))}

            {/* Render messages */}
            {timeline.map((item: any) => {
              if (item._type === "system") {
                const meta = item.metadata as any;
                return <SystemEventCard key={item.id} content={item.content} eventType={meta?.event_type} timestamp={item.created_at} />;
              }
              const isOwn = item.sender_id === user?.id;
              return (
                <div key={item.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                    isOwn ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-foreground rounded-bl-md"
                  )}>
                    <p>{item.content}</p>
                    <p className={cn("text-[10px] mt-1", isOwn ? "text-primary-foreground/60" : "text-muted-foreground")}>
                      {format(new Date(item.created_at), "h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 border-t border-border pt-3">
        <Button type="button" variant="outline" size="icon" onClick={() => setOfferOpen(true)} title="Send Offer">
          <DollarSign className="h-4 w-4" />
        </Button>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message…"
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={sendMutation.isPending || !message.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ConversationThread;
