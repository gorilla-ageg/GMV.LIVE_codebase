import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import OfferCard from "./OfferCard";
import OfferModal from "./OfferModal";
import SystemEventCard from "./SystemEventCard";

interface DealChatProps {
  conversationId: string;
  dealId: string;
  dealStatus: string;
  brandUserId: string;
  creatorUserId: string;
  brandName: string;
  creatorName: string;
}

const DealChat = ({ conversationId, dealId, dealStatus, brandUserId, creatorUserId, brandName, creatorName }: DealChatProps) => {
  const { user, role } = useAuth();
  const [message, setMessage] = useState("");
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterDefaults, setCounterDefaults] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages } = useQuery({
    queryKey: ["deal-messages", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: offers } = useQuery({
    queryKey: ["deal-offers", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_offers")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`deal-chat-${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => queryClient.invalidateQueries({ queryKey: ["deal-messages", conversationId] })
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "deal_offers", filter: `deal_id=eq.${dealId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["deal-offers", dealId] });
          queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, dealId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, offers]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId, sender_id: user!.id, content, message_type: "text",
      });
      if (error) throw error;
    },
    onSuccess: () => { setMessage(""); queryClient.invalidateQueries({ queryKey: ["deal-messages", conversationId] }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const acceptMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const offer = offers?.find((o: any) => o.id === offerId);
      if (!offer) return;
      // Update offer status
      await supabase.from("deal_offers").update({ status: "accepted" }).eq("id", offerId);
      // Update deal with agreed terms
      await supabase.from("deals").update({
        status: "agreed" as any,
        rate: (offer as any).rate,
        deliverables: (offer as any).deliverables,
        live_date: (offer as any).live_date,
        usage_rights: (offer as any).usage_rights,
      }).eq("id", dealId);
      // Create contract
      await supabase.from("contracts").insert({
        deal_id: dealId,
        terms: {
          rate: (offer as any).rate,
          deliverables: (offer as any).deliverables,
          live_date: (offer as any).live_date,
          usage_rights: (offer as any).usage_rights,
          brand_name: brandName,
          creator_name: creatorName,
        },
      });
      // System message
      await supabase.from("messages").insert({
        conversation_id: conversationId, sender_id: user!.id,
        content: "🎉 Deal terms agreed. Contract has been generated.",
        message_type: "system_event",
        metadata: { event_type: "deal_agreed" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-offers", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal-messages", conversationId] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const counterMutation = useMutation({
    mutationFn: async (offer: { rate: number; deliverables: string; liveDate: string; usageRights: string[]; note: string }) => {
      // Mark existing pending offers as countered
      const pending = offers?.filter((o: any) => o.status === "pending") || [];
      for (const p of pending) {
        await supabase.from("deal_offers").update({ status: "countered" }).eq("id", p.id);
      }
      // Create new offer
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
      // Chat message
      await supabase.from("messages").insert({
        conversation_id: conversationId, sender_id: user!.id,
        content: `Counter offer: $${offer.rate.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        message_type: "offer",
        metadata: { offer_rate: offer.rate },
      });
    },
    onSuccess: () => {
      setCounterOpen(false);
      queryClient.invalidateQueries({ queryKey: ["deal-offers", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal-messages", conversationId] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMutation.mutate(message.trim());
  };

  // Merge messages and offers into timeline
  const timeline = [
    ...(messages || []).map((m: any) => ({ ...m, _type: m.message_type === "system_event" ? "system" : m.message_type === "offer" ? "offer_msg" : "text", _time: m.created_at })),
  ].sort((a, b) => new Date(a._time).getTime() - new Date(b._time).getTime());

  // Build an offer lookup for rendering offer cards inline
  const offersByTime = (offers || []).reduce((acc: any, o: any) => {
    acc[o.id] = o;
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-4 space-y-2 px-2">
        {/* Render standalone offer cards at top if negotiating */}
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
            senderName={offer.sender_id === brandUserId ? brandName : creatorName}
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
            isPending={acceptMutation.isPending || counterMutation.isPending}
          />
        ))}

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
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-border p-3">
        <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message…" className="flex-1" />
        <Button type="submit" size="icon" disabled={sendMutation.isPending || !message.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>

      <OfferModal
        open={counterOpen}
        onClose={() => setCounterOpen(false)}
        onSubmit={(o) => counterMutation.mutate(o)}
        isPending={counterMutation.isPending}
        defaultValues={counterDefaults}
        title="Counter Offer"
      />
    </div>
  );
};

export default DealChat;
