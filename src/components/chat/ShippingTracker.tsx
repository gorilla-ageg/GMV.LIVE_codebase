import { Badge } from "@/components/ui/badge";
import { Package, Truck, MapPin, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShippingTrackerProps {
  shipment: {
    tracking_number: string | null;
    carrier: string | null;
    status: string;
    shipped_at: string | null;
    delivered_at: string | null;
  };
}

const statusConfig: Record<string, { icon: typeof Package; label: string; color: string }> = {
  pending: { icon: Package, label: "Preparing", color: "text-yellow-600" },
  shipped: { icon: Truck, label: "Shipped", color: "text-blue-600" },
  in_transit: { icon: MapPin, label: "In Transit", color: "text-blue-600" },
  delivered: { icon: CheckCircle2, label: "Delivered", color: "text-green-600" },
};

const ShippingTracker = ({ shipment }: ShippingTrackerProps) => {
  const config = statusConfig[shipment.status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2 max-w-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", config.color)} />
          <span className="text-sm font-medium">Shipping</span>
        </div>
        <Badge variant="outline" className="text-xs capitalize">
          {config.label}
        </Badge>
      </div>
      {shipment.carrier && (
        <p className="text-xs text-muted-foreground">
          {shipment.carrier}: <span className="font-mono">{shipment.tracking_number}</span>
        </p>
      )}
    </div>
  );
};

export default ShippingTracker;
