import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { StreamChat, type Channel } from "stream-chat";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

interface StreamChatContextType {
  client: StreamChat | null;
  ready: boolean;
}

const StreamChatCtx = createContext<StreamChatContextType>({ client: null, ready: false });

export const useStreamChat = () => useContext(StreamChatCtx);

export const StreamChatProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [client, setClient] = useState<StreamChat | null>(null);
  const [ready, setReady] = useState(false);

  const connect = useCallback(async (userId: string, userName: string, userImage?: string) => {
    if (!STREAM_API_KEY) {
      console.warn("Stream API key not configured");
      return;
    }

    const chatClient = StreamChat.getInstance(STREAM_API_KEY);

    // Get token from Supabase edge function
    try {
      const { data, error } = await supabase.functions.invoke("stream-token", {
        body: { userId, userName, userImage },
      });

      if (error) {
        console.error("Failed to get Stream token:", error);
        return;
      }

      const token = data?.token;
      if (!token) {
        console.error("No token returned from stream-token function");
        return;
      }

      await chatClient.connectUser(
        { id: userId, name: userName, image: userImage },
        token
      );

      setClient(chatClient);
      setReady(true);
    } catch (err) {
      console.error("Stream Chat connection error:", err);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      // Disconnect on logout
      if (client) {
        client.disconnectUser().then(() => {
          setClient(null);
          setReady(false);
        });
      }
      return;
    }

    const loadProfile = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      await connect(
        user.id,
        profile?.display_name || user.email?.split("@")[0] || "User",
        profile?.avatar_url || undefined
      );
    };

    loadProfile();

    return () => {
      // Cleanup handled by disconnect on user change
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <StreamChatCtx.Provider value={{ client, ready }}>
      {children}
    </StreamChatCtx.Provider>
  );
};
