import { useEffect, useState } from "react";
import { useStreamChat } from "@/contexts/StreamChatContext";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import type { Channel } from "stream-chat";

const Messages = () => {
  const { client, ready } = useStreamChat();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client || !ready || !user) return;

    const loadChannels = async () => {
      setLoading(true);
      try {
        const filter = { type: "messaging", members: { $in: [user.id] } };
        const sort = [{ last_message_at: -1 as const }];
        const result = await client.queryChannels(filter, sort, { limit: 30 });
        setChannels(result);
      } catch (err) {
        console.error("Failed to load channels:", err);
      } finally {
        setLoading(false);
      }
    };

    loadChannels();

    // Listen for new messages to re-sort
    const handler = client.on("message.new", () => {
      loadChannels();
    });

    return () => { handler.unsubscribe(); };
  }, [client, ready, user]);

  if (!ready) {
    return (
      <AppLayout>
        <h1 className="mb-6 text-2xl font-bold">Messages</h1>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Connecting to chat...</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <h1 className="mb-6 text-2xl font-bold">Messages</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : channels.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">No conversations yet</p>
          <p className="text-sm text-muted-foreground/70">
            Start a conversation from a creator or product page
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {channels.map((channel) => {
            const otherMembers = Object.values(channel.state.members).filter(
              (m) => m.user_id !== user?.id
            );
            const otherUser = otherMembers[0]?.user;
            const lastMessage = channel.state.messages[channel.state.messages.length - 1];
            const channelId = channel.id || "";

            return (
              <button
                key={channelId}
                onClick={() => navigate(`/messages/${channelId}`)}
                className="flex w-full items-center gap-4 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/30"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={otherUser?.image as string | undefined} />
                  <AvatarFallback className="bg-secondary text-foreground">
                    {(otherUser?.name as string)?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {(otherUser?.name as string) || "User"}
                  </p>
                  {lastMessage && (
                    <p className="text-sm text-muted-foreground truncate">
                      {lastMessage.text || "Sent an attachment"}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {lastMessage?.created_at && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })}
                    </span>
                  )}
                  {(channel.countUnread() || 0) > 0 && (
                    <div className="mt-1 flex justify-end">
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                        {channel.countUnread()}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default Messages;
