import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SendOfferDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (offer: {
    hourly_rate: number;
    commission_percentage: number;
    hours: number;
    note: string;
  }) => void;
  isPending: boolean;
  defaultValues?: {
    hourly_rate?: number;
    commission_percentage?: number;
    hours?: number;
  };
  isCounter?: boolean;
}

const SendOfferDialog = ({
  open,
  onClose,
  onSend,
  isPending,
  defaultValues,
  isCounter,
}: SendOfferDialogProps) => {
  const [hourlyRate, setHourlyRate] = useState(defaultValues?.hourly_rate?.toString() || "");
  const [commission, setCommission] = useState(defaultValues?.commission_percentage?.toString() || "");
  const [hours, setHours] = useState(defaultValues?.hours?.toString() || "");
  const [note, setNote] = useState("");

  const total = (parseFloat(hourlyRate) || 0) * (parseFloat(hours) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(hourlyRate);
    const comm = parseFloat(commission);
    const hrs = parseFloat(hours);
    if (!rate || !comm || !hrs) return;
    onSend({ hourly_rate: rate, commission_percentage: comm, hours: hrs, note });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isCounter ? "Counter Offer" : "Send Offer"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
              <Input
                id="hourly_rate"
                type="number"
                min="0"
                step="0.01"
                placeholder="50.00"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission">Commission (%)</Label>
              <Input
                id="commission"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="15"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hours">Number of Hours</Label>
            <Input
              id="hours"
              type="number"
              min="0.5"
              step="0.5"
              placeholder="3"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              required
            />
          </div>
          {total > 0 && (
            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="text-sm text-muted-foreground">Estimated Total</p>
              <p className="text-2xl font-bold">${total.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">+ {commission || 0}% commission on sales</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              placeholder="Add a message with your offer..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sending..." : isCounter ? "Send Counter Offer" : "Send Offer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SendOfferDialog;
