import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import ChipSelector from "@/components/onboarding/ChipSelector";

const USAGE_OPTIONS = ["Organic only", "Paid ads", "Whitelisting"];

interface OfferModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (offer: { rate: number; deliverables: string; liveDate: string; usageRights: string[]; note: string }) => void;
  isPending?: boolean;
  defaultValues?: { rate?: number; deliverables?: string; liveDate?: string; usageRights?: string[]; note?: string };
  title?: string;
}

const OfferModal = ({ open, onClose, onSubmit, isPending, defaultValues, title = "Send Offer" }: OfferModalProps) => {
  const [rate, setRate] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [liveDate, setLiveDate] = useState("");
  const [usageRights, setUsageRights] = useState<string[]>([]);
  const [note, setNote] = useState("");

  // Reset form when modal opens or defaultValues change
  useEffect(() => {
    if (open) {
      setRate(defaultValues?.rate?.toString() || "");
      setDeliverables(defaultValues?.deliverables || "");
      setLiveDate(defaultValues?.liveDate?.split("T")[0] || "");
      setUsageRights(defaultValues?.usageRights || []);
      setNote(defaultValues?.note || "");
    }
  }, [open, defaultValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(rate);
    if (!rate || !deliverables || isNaN(parsed) || parsed <= 0) return;
    onSubmit({
      rate: parseFloat(rate),
      deliverables,
      liveDate: liveDate ? new Date(liveDate).toISOString() : "",
      usageRights,
      note,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Rate ($)</Label>
            <Input type="number" min="0" step="0.01" placeholder="500.00" value={rate} onChange={(e) => setRate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Deliverables</Label>
            <Textarea placeholder="1x TikTok Live session (60 min), 2x short-form clips" value={deliverables} onChange={(e) => setDeliverables(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Live Date</Label>
            <Input type="date" value={liveDate} onChange={(e) => setLiveDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Usage Rights</Label>
            <ChipSelector options={USAGE_OPTIONS} selected={usageRights} onChange={setUsageRights} />
          </div>
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Input placeholder="Looking forward to working together!" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending || !rate || !deliverables}>
              {isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending...</>
              ) : (
                title
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OfferModal;
