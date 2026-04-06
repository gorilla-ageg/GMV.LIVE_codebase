import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Contract = Tables<"contracts">;
type DealSignature = Tables<"deal_signatures">;

interface ContractTerms {
  rate?: number;
  deliverables?: string;
  live_date?: string;
  usage_rights?: string[];
  brand_name?: string;
  creator_name?: string;
}

interface ContractViewProps {
  dealId: string;
  conversationId: string;
}

const ContractView = ({ dealId, conversationId }: ContractViewProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [signName, setSignName] = useState("");

  const { data: contract, isLoading: contractLoading, error: contractError } = useQuery({
    queryKey: ["contract", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("deal_id", dealId)
        .maybeSingle();
      if (error) throw error;
      return data as Contract | null;
    },
    enabled: !!dealId,
  });

  const { data: signatures, isLoading: sigsLoading } = useQuery({
    queryKey: ["deal-signatures", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_signatures")
        .select("*")
        .eq("deal_id", dealId);
      if (error) throw error;
      return data as DealSignature[];
    },
    enabled: !!dealId,
  });

  const { data: deal } = useQuery({
    queryKey: ["deal", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*, conversations(brand_user_id, creator_user_id)")
        .eq("id", dealId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!dealId,
  });

  const convo = (deal as Record<string, unknown>)?.conversations as { brand_user_id: string; creator_user_id: string } | undefined;

  const signMutation = useMutation({
    mutationFn: async () => {
      if (!signName.trim()) throw new Error("Please enter your full name");
      if (!convo) throw new Error("Deal data not loaded");

      // Check if already signed (prevent duplicate key error)
      const { data: existing } = await supabase
        .from("deal_signatures")
        .select("id")
        .eq("deal_id", dealId)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (existing) throw new Error("You have already signed this contract");

      // Insert signature
      const { error: sigErr } = await supabase.from("deal_signatures").insert({
        deal_id: dealId,
        user_id: user!.id,
        full_name: signName.trim(),
      });
      if (sigErr) throw sigErr;

      // Update contract timestamp
      const isBrand = convo.brand_user_id === user!.id;
      const { error: contractErr } = await supabase
        .from("contracts")
        .update(
          isBrand
            ? { brand_signed_at: new Date().toISOString() }
            : { creator_signed_at: new Date().toISOString() }
        )
        .eq("deal_id", dealId);
      if (contractErr) throw contractErr;

      // Re-fetch signatures to check if both have now signed (avoid race with stale cache)
      const { data: freshSigs, error: sigsFetchErr } = await supabase
        .from("deal_signatures")
        .select("*")
        .eq("deal_id", dealId);
      if (sigsFetchErr) throw sigsFetchErr;
      const otherSigned = (freshSigs || []).some((s) => s.user_id !== user!.id);
      if (otherSigned) {
        // Both signed - update deal status
        const { error: dealErr } = await supabase
          .from("deals")
          .update({ status: "contracted" })
          .eq("id", dealId);
        if (dealErr) throw dealErr;

        const { error: msgErr } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: user!.id,
          content: "Contract signed by both parties. Brand: please fund escrow to proceed.",
          message_type: "system_event",
          metadata: { event_type: "contract_signed" },
        });
        if (msgErr) throw msgErr;
      } else {
        // Only one party signed so far
        const { error: dealErr } = await supabase
          .from("deals")
          .update({ status: "signed" })
          .eq("id", dealId);
        if (dealErr) throw dealErr;

        const { error: msgErr } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: user!.id,
          content: `${signName.trim()} has signed the contract.`,
          message_type: "system_event",
          metadata: { event_type: "contract_signed" },
        });
        if (msgErr) throw msgErr;
      }
    },
    onSuccess: () => {
      setSignName("");
      queryClient.invalidateQueries({ queryKey: ["deal-signatures", dealId] });
      queryClient.invalidateQueries({ queryKey: ["contract", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deal-messages", conversationId] });
      toast({ title: "Contract signed!" });
    },
    onError: (err: Error) => toast({ title: "Error signing contract", description: err.message, variant: "destructive" }),
  });

  if (contractLoading || sigsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (contractError) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive text-sm">Failed to load contract: {(contractError as Error).message}</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-3 opacity-50" />
        <p className="font-medium">No contract generated yet</p>
        <p className="text-sm mt-1">Accept an offer in the chat to generate a contract.</p>
      </div>
    );
  }

  const terms = contract.terms as ContractTerms;
  const userSigned = signatures?.some((s) => s.user_id === user?.id) || signMutation.isSuccess;
  const brandSig = signatures?.find((s) => s.user_id === convo?.brand_user_id);
  const creatorSig = signatures?.find((s) => s.user_id === convo?.creator_user_id);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">Deal Contract</h2>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Brand</p>
            <p className="font-medium">{terms.brand_name || "Brand"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Creator</p>
            <p className="font-medium">{terms.creator_name || "Creator"}</p>
          </div>
        </div>

        <hr className="border-border" />

        <div className="space-y-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Rate</p>
            <p className="font-semibold text-lg">
              ${Number(terms.rate || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
          {terms.deliverables && (
            <div>
              <p className="text-muted-foreground text-xs">Deliverables</p>
              <p>{terms.deliverables}</p>
            </div>
          )}
          {terms.live_date && (
            <div>
              <p className="text-muted-foreground text-xs">Live Date</p>
              <p>{format(new Date(terms.live_date), "MMMM d, yyyy")}</p>
            </div>
          )}
          {terms.usage_rights && terms.usage_rights.length > 0 && (
            <div>
              <p className="text-muted-foreground text-xs">Usage Rights</p>
              <div className="flex gap-1 mt-1">
                {terms.usage_rights.map((r: string) => (
                  <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <hr className="border-border" />

        <div className="space-y-2 text-xs text-muted-foreground">
          <p><strong>Payment Terms:</strong> Payment held in escrow and released upon brand approval of deliverables.</p>
          <p><strong>Revisions:</strong> 1 revision round included.</p>
          <p><strong>Governing Law:</strong> State of California.</p>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border p-4 space-y-2">
          <p className="text-xs text-muted-foreground">Brand Signature</p>
          {brandSig ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle className="h-4 w-4" />
              <div>
                <p className="font-medium text-sm">{brandSig.full_name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(brandSig.signed_at), "MMM d, yyyy h:mm a")}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Awaiting...</span>
            </div>
          )}
        </div>
        <div className="rounded-lg border border-border p-4 space-y-2">
          <p className="text-xs text-muted-foreground">Creator Signature</p>
          {creatorSig ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle className="h-4 w-4" />
              <div>
                <p className="font-medium text-sm">{creatorSig.full_name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(creatorSig.signed_at), "MMM d, yyyy h:mm a")}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Awaiting...</span>
            </div>
          )}
        </div>
      </div>

      {/* Sign action */}
      {!userSigned && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <Label className="text-sm">Type your full name to sign</Label>
          <div className="flex gap-2">
            <Input
              value={signName}
              onChange={(e) => setSignName(e.target.value)}
              placeholder="John Smith"
              className="flex-1"
              disabled={signMutation.isPending}
            />
            <Button
              onClick={() => signMutation.mutate()}
              disabled={!signName.trim() || signMutation.isPending}
            >
              {signMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Signing...
                </>
              ) : (
                "Sign Contract"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractView;
