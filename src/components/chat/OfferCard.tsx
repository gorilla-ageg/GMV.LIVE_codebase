import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Percent, Clock, Check, X, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfferCardProps {
  offer: {
    id: string;
    hourly_rate: number;
    commission_percentage: number;
    hours: number;
    note: string | null;
    status: string;
    sender_id: string;
  };
  isOwn: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onCounter?: () => void;
  isPending?: boolean;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  accepted: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  countered: "bg-blue-100 text-blue-800 border-blue-200",
  expired: "bg-gray-100 text-gray-800 border-gray-200",
};

const OfferCard = ({ offer, isOwn, onAccept, onReject, onCounter, isPending }: OfferCardProps) => {
  const total = offer.hourly_rate * offer.hours;
  const showActions = !isOwn && offer.status === "pending";

  return (
    <Card className={cn(
      "max-w-sm border-2",
      offer.status === "accepted" && "border-green-300",
      offer.status === "rejected" && "border-red-300",
      offer.status === "pending" && "border-primary/30",
      offer.status === "countered" && "border-blue-300",
    )}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">
            {isOwn ? "Your Offer" : "Offer Received"}
          </span>
          <Badge variant="outline" className={cn("text-xs capitalize", statusColors[offer.status])}>
            {offer.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Hourly Rate</p>
              <p className="font-semibold">${offer.hourly_rate}/hr</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Commission</p>
              <p className="font-semibold">{offer.commission_percentage}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Hours</p>
              <p className="font-semibold">{offer.hours}h</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-semibold">${total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {offer.note && (
          <p className="text-sm text-muted-foreground italic">"{offer.note}"</p>
        )}

        {showActions && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={onAccept} disabled={isPending} className="flex-1">
              <Check className="h-3.5 w-3.5 mr-1" /> Accept
            </Button>
            <Button size="sm" variant="outline" onClick={onCounter} disabled={isPending} className="flex-1">
              <ArrowLeftRight className="h-3.5 w-3.5 mr-1" /> Counter
            </Button>
            <Button size="sm" variant="destructive" onClick={onReject} disabled={isPending}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OfferCard;
