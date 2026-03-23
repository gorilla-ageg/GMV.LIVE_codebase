import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import StatusBadge from "@/components/deals/StatusBadge";
import { formatDistanceToNow } from "date-fns";
import { DollarSign, Loader2 } from "lucide-react";

const Messages = () => {
  const { user } = useAuth();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          brand_profile:public_profiles!conversations_brand_profile_fkey(display_name, avatar_url),
          creator_profile:public_profiles!conversations_creator_profile_fkey(display_name, avatar_url),
          product:products(title),
          deals(id, status, rate)
        `)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <AppLayout>
      <h1 className="mb-6 text-2xl font-bold">Messages</h1>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : conversations?.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">No conversations yet. Browse the feed to connect with creators and brands.</p>
      ) : (
        <div className="space-y-2">
          {conversations?.map((c: any) => {
            const isBrand = c.brand_user_id === user?.id;
            const other = isBrand ? c.creator_profile : c.brand_profile;
            const deal = c.deals?.[0];
            
            return (
              <Link key={c.id} to={`/messages/${c.id}`}>
                <Card className="border-border hover:border-primary/30 transition-colors">
                  <CardContent className="flex items-center gap-4 p-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={other?.avatar_url} />
                      <AvatarFallback className="bg-secondary text-foreground">
                        {other?.display_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{other?.display_name || "User"}</p>
                        {deal && <StatusBadge status={deal.status} />}
                      </div>
                      {c.product?.title && (
                        <p className="text-sm text-muted-foreground truncate">Re: {c.product.title}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {deal?.rate && (
                        <p className="text-sm font-semibold flex items-center gap-1 text-emerald-400">
                          <DollarSign className="h-3.5 w-3.5" />
                          {Number(deal.rate).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {c.last_message_at && formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default Messages;
