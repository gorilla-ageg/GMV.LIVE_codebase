import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import OfferCard from "./OfferCard";
import OfferModal from "./OfferModal";
import SystemEventCard from "./SystemEventCard";
import type { Tables } from "@/integrations/supabase/types";

type Message = Tables<"messages">;
type DealOffer = Tables<"deal_offers">;

interface DealChatProps {
  conversationId: string;
  dealId: string;
  dealStatus: string;
  brandUserId: string;
  creatorUserId: string;
  brandName: string;
  creatorName: string;
  onTabChange?: (tab: string) => void;
}

const DealChat = ({
  conversationId, dealId, dealStatus,
  brandUserId, creatorUserId, brandName, creatorName,
  onTabChange,
}: DealChatProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterDefaults, setCounterDefaults] = useState<{
    rate?: number;
    deliverables?: string;
    liveDate?: string;
    usageRights?: string[];
  } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ["deal-messages", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversationId,
  });

  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ["deal-offers", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_offers")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as DealOffer[];
    },
    enabled: !!dealId,
  });

  // Realtime subscription for messages and offers
  useEffect(() => {
    if (!conversationId || !dealId) return;

    const channel = supabase
      .channel(`deal-chat-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          if (payload.new && (payload.new as Message).sender_id !== user?.id) {
            queryClient.invalidateQueries({ queryKey: ["deal-messages", conversationId] });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deal_offers", filter: `deal_id=eq.${dealId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["deal-offers", dealId] });
          queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, dealId, queryClient, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, offers]);

  // Send text message
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user!.id,
        content,
        message_type: "text",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["deal-messages", conversationId] });
    },
    onError: (err: Error) => toast({ title: "Failed to send message", description: err.message, variant: "destructive" }),
  });

  // Accept offer
  const acceptMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const offer = offers?.find((o) => o.id === offerId);
      if (!offer) throw new Error("Offer not found");

      // Update offer status to accepted
      const { error: offerErr } = await supabase
        .from("deal_offers")
        .update({ status: "accepted" })
        .eq("id", offerId);
      if (offerErr) throw offerErr;

      // Mark other pending offers as rejected
      const otherPending = offers?.filter((o) => o.id !== offerId && o.status === "pending") || [];
      for (const p of otherPending) {
        await supabase.from("deal_offers").update({ status: "rejected" }).eq("id", p.id);
      }

      // Update deal with agreed terms
      const { error: dealErr } = await supabase
        .from("deals")
        .update({
          status: "agreed",
          rate: offer.rate,
          deliverables: offer.deliverables,
          live_date: offer.live_date,
          usage_rights: offer.usage_rights,
        })
        .eq("id", dealId);
      if (dealErr) throw dealErr;

      // Create contract
      const { error: contractErr } = await supabase.from("contracts").insert({
        deal_id: dealId,
        terms: {
          rate: offer.rate,
          deliverables: offer.deliverables,
          live_date: offer.live_date,
          usage_rights: offer.usage_rights,
          brand_name: brandName,
          creator_name: creatorName,
        },
      });
      if (contractErr) throw contractErr;

      // System message
      const { error: msgErr } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user!.id,
        content: "Offer accepted. Contract has been generated — please review and sign.",
        message_type: "system_event",
        metadata: { event_type: "deal_agreed" },
      });
      if (msgErr) throw msgErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-offers", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal-messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["contract", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal-signatures", dealId] });
      toast({ title: "Offer accepted! Contract generated." });
      // Auto-switch to contract tab
      onTabChange?.("contract");
    },
    onError: (err: Error) => toast({ title: "Failed to accept offer", description: err.message, variant: "destructive" }),
  });

  // Counter offer
  const counterMutation = useMutation({
    mutationFn: async (offer: { rate: number; deliverables: string; liveDate: string; usageRights: string[]; note: string }) => {
      // Mark existing pending offers as countered
      const pending = offers?.filter((o) => o.status === "pending") || [];
      for (const p of pending) {
        const { error } = await supabase.from("deal_offers").update({ status: "countered" }).eq("id", p.id);
        if (error) throw error;
      }

      // Create new offer
      const { error: insertErr } = await supabase.from("deal_offers").insert({
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
      });
      if (insertErr) throw insertErr;

      // Ensure deal is in negotiating status
      await supabase.from("deals").update({ status: "negotiating" }).eq("id", dealId);

      // System message
      const senderLabel = user!.id === brandUserId ? brandName : creatorName;
      const { error: msgErr } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user!.id,
        content: `${senderLabel} sent a counter offer: $${offer.rate.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        message_type: "system_event",
        metadata: { event_type: "counter_offer", offer_rate: offer.rate },
      });
      if (msgErr) throw msgErr;
    },
    onSuccess: () => {
      setCounterOpen(false);
      setCounterDefaults(null);
      queryClient.invalidateQueries({ queryKey: ["deal-offers", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal-messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      toast({ title: "Counter offer sent!" });
    },
    onError: (err: Error) => toast({ title: "Failed to send counter", description: err.message, variant: "destructive" }),
  });

  const handleSend = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMutation.mutate(message.trim());
  }, [message, sendMutation]);

  const handleAccept = useCallback((offerId: string) => {
    acceptMutation.mutate(offerId);
  }, [acceptMutation]);

  const handleCounter = useCallback((offer: DealOffer) => {
    setCounterDefaults({
      rate: Number(offer.rate || ((offer.hourly_rate ?? 0) * (offer.hours ?? 0))),
      deliverables: offer.deliverables || "",
      liveDate: offer.live_date || "",
      usageRights: offer.usage_rights || [],
    });
    setCounterOpen(true);
  }, []);

  // Build merged timeline — filter out offer-type messages since offers render as OfferCards
  const timeline = [
    ...(messages || [])
      .filter((m) => m.message_type !== "offer")
      .map((m) => ({ _kind: "message" as const, _time: m.created_at, message: m })),
    ...(offers || []).map((o) => ({ _kind: "offer" as const, _time: o.created_at, offer: o })),
  ].sort((a, b) => new Date(a._time).getTime() - new Date(b._time).getTime());

  if (messagesLoading || offersLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messagesError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-destructive">Failed to load messages: {(messagesError as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-4 space-y-2 px-2">
        {timeline.map((item) => {
          if (item._kind === "offer") {
            const offer = item.offer;
            return (
              <OfferCard
                key={`offer-${offer.id}`}
                rate={Number(offer.rate || ((offer.hourly_rate ?? 0) * (offer.hours ?? 0)))}
                deliverables={offer.deliverables ?? undefined}
                liveDate={offer.live_date ?? undefined}
                usageRights={offer.usage_rights ?? undefined}
                note={offer.note ?? undefined}
                status={offer.status}
                isOwn={offer.sender_id === user?.id}
                senderName={offer.sender_id === brandUserId ? brandName : creatorName}
                onAccept={() => handleAccept(offer.id)}
                onCounter={() => handleCounter(offer)}
                isPending={acceptMutation.isPending || counterMutation.isPending}
              />
            );
          }
          const msg = item.message;
          if (msg.message_type === "system_event") {
            const meta = msg.metadata as Record<string, string> | null;
            return <SystemEventCard key={msg.id} content={msg.content} eventType={meta?.event_type} timestamp={msg.created_at} />;
          }
          const isOwn = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                isOwn ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-foreground rounded-bl-md"
              )}>
                <p>{msg.content}</p>
                <p className={cn("text-[10px] mt-1", isOwn ? "text-primary-foreground/60" : "text-muted-foreground")}>
                  {format(new Date(msg.created_at), "h:mm a")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-border p-3">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
          disabled={sendMutation.isPending}
        />
        <Button type="submit" size="icon" disabled={sendMutation.isPending || !message.trim()}>
          {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>

      <OfferModal
        open={counterOpen}
        onClose={() => { setCounterOpen(false); setCounterDefaults(null); }}
        onSubmit={(o) => counterMutation.mutate(o)}
        isPending={counterMutation.isPending}
        defaultValues={counterDefaults ?? undefined}
        title="Counter Offer"
      />
    </div>
  );
};

export default DealChat;
