import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, FileText, Shield } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface OfferCardProps {
  rate: number;
  deliverables?: string;
  liveDate?: string;
  usageRights?: string[];
  note?: string;
  status: string;
  isOwn: boolean;
  senderName?: string;
  onAccept?: () => void;
  onCounter?: () => void;
  isPending?: boolean;
}

const OfferCard = ({
  rate, deliverables, liveDate, usageRights, note,
  status, isOwn, senderName, onAccept, onCounter, isPending,
}: OfferCardProps) => {
  const showActions = !isOwn && status === "pending";

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div className={cn(
        "w-full max-w-[85%] rounded-xl border p-4 space-y-3",
        isOwn ? "bg-primary/5 border-primary/20" : "bg-card border-border"
      )}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {isOwn ? "Your offer" : `${senderName || "Offer"}`}
          </span>
          <Badge variant="outline" className={cn("text-[10px]",
            status === "accepted" && "text-emerald-400 border-emerald-500/30",
            status === "rejected" && "text-destructive border-destructive/30",
            status === "countered" && "text-amber-400 border-amber-500/30",
            status === "pending" && "text-blue-400 border-blue-500/30",
          )}>{status}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <div>
              <p className="text-[10px] text-muted-foreground">Rate</p>
              <p className="font-semibold">${rate.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          {liveDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-[10px] text-muted-foreground">Live Date</p>
                <p className="font-medium">{format(new Date(liveDate), "MMM d, yyyy")}</p>
              </div>
            </div>
          )}
        </div>

        {deliverables && (
          <div className="flex items-start gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-[10px] text-muted-foreground">Deliverables</p>
              <p>{deliverables}</p>
            </div>
          </div>
        )}

        {usageRights && usageRights.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-[10px] text-muted-foreground">Usage Rights</p>
              <div className="flex gap-1 flex-wrap mt-0.5">
                {usageRights.map((r) => (
                  <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {note && <p className="text-sm text-muted-foreground italic">"{note}"</p>}

        {showActions && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={onAccept} disabled={isPending} className="flex-1">Accept</Button>
            <Button size="sm" variant="outline" onClick={onCounter} disabled={isPending} className="flex-1">Counter</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferCard;
