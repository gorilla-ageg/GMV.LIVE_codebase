import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  negotiating: { label: "Negotiating", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  agreed: { label: "Agreed", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  signed: { label: "Signed", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  contracted: { label: "Contracted", className: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
  escrow_funded: { label: "Escrow Funded", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  funded: { label: "Funded", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  shipped: { label: "Shipped", className: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
  in_progress: { label: "In Progress", className: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
  delivered: { label: "Delivered", className: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
  live: { label: "Live", className: "bg-primary/20 text-primary border-primary/30" },
  completed: { label: "Completed", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground border-border" },
  disputed: { label: "Disputed", className: "bg-destructive/20 text-destructive border-destructive/30" },
};

const StatusBadge = ({ status }: { status: string }) => {
  const config = statusConfig[status] || { label: status, className: "" };
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.className)}>
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
