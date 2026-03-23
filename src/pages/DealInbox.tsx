import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AppLayout from "@/components/AppLayout";
import StatusBadge from "@/components/deals/StatusBadge";
import { Plus, DollarSign, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Enums } from "@/integrations/supabase/types";

type DealStatus = Enums<"deal_status">;

const ACTIVE_STATUSES: DealStatus[] = ["negotiating", "agreed", "signed", "contracted", "escrow_funded", "funded", "shipped", "in_progress", "delivered", "live"];
const COMPLETED_STATUSES: DealStatus[] = ["completed"];
const DISPUTED_STATUSES: DealStatus[] = ["disputed"];

interface ProfileData {
  display_name: string | null;
  avatar_url: string | null;
}

interface ConversationJoin {
  id: string;
  brand_user_id: string;
  creator_user_id: string;
  last_message_at: string | null;
  brand_profile: ProfileData | null;
  creator_profile: ProfileData | null;
}

interface DealRow {
  id: string;
  status: DealStatus;
  rate: number | null;
  deliverables: string | null;
  live_date: string | null;
  usage_rights: string[] | null;
  conversation_id: string;
  created_at: string;
  updated_at: string;
  conversations: ConversationJoin;
}

const DealInbox = () => {
  const { user, role } = useAuth();

  const { data: deals, isLoading, error } = useQuery({
    queryKey: ["deals-inbox", user?.id],
    queryFn: async () => {
      // First, find all conversations where the current user is a participant
      const { data: conversations, error: convoError } = await supabase
        .from("conversations")
        .select("id")
        .or(`brand_user_id.eq.${user!.id},creator_user_id.eq.${user!.id}`);
      if (convoError) throw convoError;

      if (!conversations || conversations.length === 0) return [];

      const convoIds = conversations.map((c) => c.id);

      const { data, error: dealsError } = await supabase
        .from("deals")
        .select(`
          *,
          conversations(
            id, brand_user_id, creator_user_id, last_message_at,
            brand_profile:public_profiles!conversations_brand_profile_fkey(display_name, avatar_url),
            creator_profile:public_profiles!conversations_creator_profile_fkey(display_name, avatar_url)
          )
        `)
        .in("conversation_id", convoIds)
        .order("updated_at", { ascending: false });
      if (dealsError) throw dealsError;
      return (data || []) as unknown as DealRow[];
    },
    enabled: !!user,
  });

  const filterDeals = (tab: string) => {
    if (!deals) return [];
    if (tab === "active") return deals.filter((d) => ACTIVE_STATUSES.includes(d.status));
    if (tab === "completed") return deals.filter((d) => COMPLETED_STATUSES.includes(d.status));
    if (tab === "disputed") return deals.filter((d) => DISPUTED_STATUSES.includes(d.status));
    return deals;
  };

  const renderDealRow = (deal: DealRow) => {
    const convo = deal.conversations;
    const isBrand = convo?.brand_user_id === user?.id;
    const other = isBrand ? convo?.creator_profile : convo?.brand_profile;

    return (
      <Link key={deal.id} to={`/deals/${deal.id}`}>
        <Card className="border-border hover:border-primary/30 transition-colors cursor-pointer">
          <CardContent className="p-4 flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={other?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-secondary text-foreground">{other?.display_name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{other?.display_name || "Unknown"}</p>
                <StatusBadge status={deal.status} />
              </div>
              {deal.deliverables && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{deal.deliverables}</p>
              )}
              {convo?.last_message_at && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(convo.last_message_at), { addSuffix: true })}
                </p>
              )}
            </div>
            {deal.rate && (
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                  {Number(deal.rate).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Deals</h1>
        {role === "brand" && (
          <Button asChild><Link to="/feed" className="gap-2"><Plus className="h-4 w-4" />New Deal</Link></Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 mb-4">
          <p className="text-sm text-destructive">Failed to load deals: {(error as Error).message}</p>
        </div>
      )}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="disputed">Disputed</TabsTrigger>
        </TabsList>
        {["all", "active", "completed", "disputed"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-2 mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filterDeals(tab).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {tab === "all"
                  ? "No deals yet. Start a conversation to negotiate your first deal."
                  : `No ${tab} deals.`}
              </p>
            ) : (
              filterDeals(tab).map(renderDealRow)
            )}
          </TabsContent>
        ))}
      </Tabs>
    </AppLayout>
  );
};

export default DealInbox;
