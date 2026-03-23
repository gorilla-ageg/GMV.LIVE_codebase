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
import { Plus, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ACTIVE_STATUSES = ["negotiating", "agreed", "signed", "contracted", "escrow_funded", "funded", "shipped", "in_progress", "delivered", "live"];
const COMPLETED_STATUSES = ["completed"];
const DISPUTED_STATUSES = ["disputed"];

const DealInbox = () => {
  const { user, role } = useAuth();

  const { data: deals, isLoading } = useQuery({
    queryKey: ["deals-inbox"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          conversations(
            id, brand_user_id, creator_user_id, last_message_at,
            brand_profile:public_profiles!conversations_brand_profile_fkey(display_name, avatar_url),
            creator_profile:public_profiles!conversations_creator_profile_fkey(display_name, avatar_url)
          )
        `)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filterDeals = (tab: string) => {
    if (!deals) return [];
    if (tab === "active") return deals.filter((d: any) => ACTIVE_STATUSES.includes(d.status));
    if (tab === "completed") return deals.filter((d: any) => COMPLETED_STATUSES.includes(d.status));
    if (tab === "disputed") return deals.filter((d: any) => DISPUTED_STATUSES.includes(d.status));
    return deals;
  };

  const renderDealRow = (deal: any) => {
    const convo = deal.conversations;
    const isBrand = convo?.brand_user_id === user?.id;
    const other = isBrand ? convo?.creator_profile : convo?.brand_profile;

    return (
      <Link key={deal.id} to={`/deals/${deal.id}`}>
        <Card className="border-border hover:border-primary/30 transition-colors cursor-pointer">
          <CardContent className="p-4 flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={other?.avatar_url} />
              <AvatarFallback className="bg-secondary text-foreground">{other?.display_name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{other?.display_name || "Unknown"}</p>
                <StatusBadge status={deal.status} />
              </div>
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
              <p className="text-center text-muted-foreground py-8">Loading deals…</p>
            ) : filterDeals(tab).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No deals yet. Start a conversation to negotiate your first deal.</p>
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
