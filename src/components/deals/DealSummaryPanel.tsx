import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DollarSign, Calendar, FileText, Send, Package, Eye, Video, Star, Loader2 } from "lucide-react";
import { format } from "date-fns";
import StatusBadge from "./StatusBadge";

interface DealSummaryPanelProps {
  deal: any;
  otherParty: { name: string; avatarUrl?: string };
  isBrand: boolean;
  escrowAmount?: number;
  onCta: () => void;
  ctaLoading?: boolean;
}

const getCta = (status: string, isBrand: boolean): { label: string; icon: React.ReactNode; disabled?: boolean } => {
  switch (status) {
    case "negotiating": return isBrand
      ? { label: "Send Offer", icon: <Send className="h-4 w-4" /> }
      : { label: "Counter Offer", icon: <Send className="h-4 w-4" /> };
    case "agreed":
    case "contracted":
    case "signed": return isBrand
      ? { label: "Fund Escrow →", icon: <DollarSign className="h-4 w-4" /> }
      : { label: "Awaiting payment…", icon: <Loader2 className="h-4 w-4 animate-spin" />, disabled: true };
    case "escrow_funded":
    case "funded": return isBrand
      ? { label: "Mark as Shipped →", icon: <Package className="h-4 w-4" /> }
      : { label: "Awaiting product…", icon: <Loader2 className="h-4 w-4 animate-spin" />, disabled: true };
    case "shipped": return isBrand
      ? { label: "View Tracking", icon: <Package className="h-4 w-4" /> }
      : { label: "Track Package →", icon: <Package className="h-4 w-4" /> };
    case "delivered": return isBrand
      ? { label: "Awaiting live…", icon: <Loader2 className="h-4 w-4 animate-spin" />, disabled: true }
      : { label: "Submit Stream →", icon: <Video className="h-4 w-4" /> };
    case "in_progress":
    case "live": return isBrand
      ? { label: "View Analytics →", icon: <Eye className="h-4 w-4" /> }
      : { label: "Submit Stream Link →", icon: <Video className="h-4 w-4" /> };
    case "completed": return isBrand
      ? { label: "Rate Creator →", icon: <Star className="h-4 w-4" /> }
      : { label: "Rate Brand →", icon: <Star className="h-4 w-4" /> };
    default: return { label: "View Deal", icon: <Eye className="h-4 w-4" /> };
  }
};

const DealSummaryPanel = ({ deal, otherParty, isBrand, escrowAmount, onCta, ctaLoading }: DealSummaryPanelProps) => {
  const cta = getCta(deal.status, isBrand);

  return (
    <div className="flex flex-col h-full p-4 space-y-5">
      {/* Party info */}
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={otherParty.avatarUrl} />
          <AvatarFallback className="bg-secondary text-foreground">{otherParty.name?.charAt(0) || "?"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{otherParty.name}</p>
          <p className="text-xs text-muted-foreground">{isBrand ? "Creator" : "Brand"}</p>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</p>
        <StatusBadge status={deal.status} />
      </div>

      {/* Deal terms */}
      {deal.rate && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Agreed Rate</p>
          <p className="text-lg font-bold flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            {Number(deal.rate).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
      )}

      {deal.deliverables && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Deliverables</p>
          <p className="text-sm">{deal.deliverables}</p>
        </div>
      )}

      {deal.live_date && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Live Date</p>
          <p className="text-sm flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-blue-400" />
            {format(new Date(deal.live_date), "MMM d, yyyy")}
          </p>
        </div>
      )}

      {escrowAmount !== undefined && escrowAmount > 0 && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
          <p className="text-[10px] uppercase tracking-wider text-emerald-400">In Escrow</p>
          <p className="text-lg font-bold text-emerald-400">${escrowAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
      )}

      {/* CTA */}
      <div className="mt-auto pt-4">
        <Button
          onClick={onCta}
          disabled={cta.disabled || ctaLoading}
          className="w-full gap-2"
          size="lg"
        >
          {ctaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : cta.icon}
          {cta.label}
        </Button>
      </div>
    </div>
  );
};

export default DealSummaryPanel;
