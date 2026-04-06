import { cn } from "@/lib/utils";
import { CheckCircle, FileText, DollarSign, Package, Video, AlertTriangle, Handshake } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  offer_sent: <DollarSign className="h-4 w-4 text-blue-400" />,
  counter_offer: <DollarSign className="h-4 w-4 text-amber-400" />,
  deal_agreed: <Handshake className="h-4 w-4 text-emerald-400" />,
  contract_signed: <FileText className="h-4 w-4 text-indigo-400" />,
  contract_generated: <FileText className="h-4 w-4 text-blue-400" />,
  escrow_funded: <DollarSign className="h-4 w-4 text-emerald-400" />,
  escrow_released: <DollarSign className="h-4 w-4 text-green-400" />,
  payment_sent: <DollarSign className="h-4 w-4 text-blue-400" />,
  payment_confirmed: <CheckCircle className="h-4 w-4 text-green-400" />,
  product_shipped: <Package className="h-4 w-4 text-sky-400" />,
  product_delivered: <Package className="h-4 w-4 text-teal-400" />,
  product_received: <CheckCircle className="h-4 w-4 text-teal-400" />,
  stream_submitted: <Video className="h-4 w-4 text-primary" />,
  deal_completed: <CheckCircle className="h-4 w-4 text-green-400" />,
  dispute_opened: <AlertTriangle className="h-4 w-4 text-destructive" />,
};

interface SystemEventCardProps {
  content: string;
  eventType?: string;
  timestamp: string;
}

const SystemEventCard = ({ content, eventType, timestamp }: SystemEventCardProps) => {
  const icon = eventType ? iconMap[eventType] : <CheckCircle className="h-4 w-4 text-muted-foreground" />;
  return (
    <div className="flex justify-center my-3">
      <div className="flex items-center gap-2 rounded-full bg-secondary/50 border border-border px-4 py-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{content}</span>
      </div>
    </div>
  );
};

export default SystemEventCard;
