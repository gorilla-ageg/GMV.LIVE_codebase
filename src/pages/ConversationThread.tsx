import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStreamChat } from "@/contexts/StreamChatContext";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Channel, MessageResponse } from "stream-chat";

const ConversationThread = () => {
  const { id: channelId } = useParams<{ id: string }>();
  const { client, ready } = useStreamChat();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client || !ready || !channelId) return;

    const initChannel = async () => {
      setLoading(true);
      try {
        const ch = client.channel("messaging", channelId);
        await ch.watch();
        setChannel(ch);
        setMessages(ch.state.messages as MessageResponse[]);
      } catch (err) {
        console.error("Failed to load channel:", err);
      } finally {
        setLoading(false);
      }
    };

    initChannel();
  }, [client, ready, channelId]);

  // Listen for new messages
  useEffect(() => {
    if (!channel) return;

    const handler = channel.on("message.new", (event) => {
      if (event.message) {
        setMessages((prev) => [...prev, event.message as MessageResponse]);
      }
    });

    return () => { handler.unsubscribe(); };
  }, [channel]);

  // Auto-scroll
  useEffect(() => {
    const el = document.getElementById("messages-bottom");
    el?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !channel) return;
    setSending(true);
    try {
      await channel.sendMessage({ text: message.trim() });
      setMessage("");
    } catch (err) {
      console.error("Failed to send:", err);
    } finally {
      setSending(false);
    }
  };

  const otherMembers = channel
    ? Object.values(channel.state.members).filter((m) => m.user_id !== user?.id)
    : [];
  const otherUser = otherMembers[0]?.user;

  if (!ready || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col" style={{ height: "calc(100vh - 8rem)" }}>
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border pb-3 mb-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/messages")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src={otherUser?.image as string | undefined} />
            <AvatarFallback>{(otherUser?.name as string)?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>
          <h2 className="text-lg font-semibold truncate">
            {(otherUser?.name as string) || "Chat"}
          </h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 px-1 py-2">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No messages yet. Say hello!
            </p>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.user?.id === user?.id;
              return (
                <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-foreground rounded-bl-md"
                  )}>
                    <p>{msg.text}</p>
                    {msg.created_at && (
                      <p className={cn(
                        "text-[10px] mt-1",
                        isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
                      )}>
                        {format(new Date(msg.created_at), "h:mm a")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div id="messages-bottom" />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex gap-2 border-t border-border pt-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={sending || !message.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
};

export default ConversationThread;
