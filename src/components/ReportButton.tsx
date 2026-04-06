import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Flag, Loader2 } from "lucide-react";

const REASONS: Record<string, string[]> = {
  user: ["Spam or scam", "Inappropriate behavior", "Fake profile", "Harassment", "Other"],
  product: ["Misleading listing", "Scam or fraud", "Inappropriate content", "Counterfeit product", "Other"],
  deal: ["Not honoring agreement", "Payment issue", "Harassment", "Spam", "Other"],
};

interface Props {
  reportType: "user" | "product" | "deal";
  reportedUserId?: string;
  dealId?: string;
  productId?: string;
  variant?: "icon" | "button" | "outline";
  size?: "sm" | "default";
}

const ReportButton = ({ reportType, reportedUserId, dealId, productId, variant = "outline", size = "sm" }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!reason) throw new Error("Please select a reason");
      const { error } = await supabase.from("reports" as never).insert({
        reporter_id: user!.id,
        reported_user_id: reportedUserId || null,
        deal_id: dealId || null,
        product_id: productId || null,
        report_type: reportType,
        reason,
        description: description.trim() || null,
        status: "pending",
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      setOpen(false);
      setReason("");
      setDescription("");
      toast({ title: "Report submitted", description: "Our team will review this within 24-48 hours." });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // Don't show report button for your own content
  if (reportedUserId === user?.id) return null;

  return (
    <>
      {variant === "icon" ? (
        <button
          onClick={() => setOpen(true)}
          className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
          title="Report"
        >
          <Flag className="h-3.5 w-3.5" />
        </button>
      ) : (
        <Button
          variant="ghost"
          size={size}
          onClick={() => setOpen(true)}
          className="gap-1.5 text-muted-foreground hover:text-destructive"
        >
          <Flag className="h-3.5 w-3.5" />
          {variant === "button" && "Report"}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-destructive" />
              Report {reportType === "user" ? "User" : reportType === "product" ? "Product" : "Deal"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Reason</Label>
              <div className="flex flex-wrap gap-2">
                {REASONS[reportType].map((r) => (
                  <Badge
                    key={r}
                    variant={reason === r ? "default" : "outline"}
                    className={`cursor-pointer text-xs ${reason === r ? "bg-destructive text-destructive-foreground" : ""}`}
                    onClick={() => setReason(r)}
                  >
                    {r}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Details (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us more about what happened..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!reason || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Flag className="h-4 w-4 mr-1" />}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportButton;
