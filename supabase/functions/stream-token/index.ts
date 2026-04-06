import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { StreamChat } from "npm:stream-chat";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, userName, userImage } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("STREAM_API_KEY");
    const apiSecret = Deno.env.get("STREAM_API_SECRET");

    if (!apiKey || !apiSecret) {
      return new Response(JSON.stringify({ error: "Stream credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = StreamChat.getInstance(apiKey, apiSecret);

    // Upsert user in Stream
    await client.upsertUser({
      id: userId,
      name: userName || "User",
      image: userImage || undefined,
    });

    const token = client.createToken(userId);

    return new Response(JSON.stringify({ token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
