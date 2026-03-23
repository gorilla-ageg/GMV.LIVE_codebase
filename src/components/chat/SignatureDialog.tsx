import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Check } from "lucide-react";

interface SignatureDialogProps {
  open: boolean;
  onClose: () => void;
  onSign: (fullName: string) => void;
  isPending: boolean;
  deal: {
    hourly_rate: number | null;
    commission_percentage: number | null;
    hours: number | null;
    total_amount: number | null;
  };
  otherPartyName: string;
  otherPartySigned: boolean;
}

const SignatureDialog = ({
  open,
  onClose,
  onSign,
  isPending,
  deal,
  otherPartyName,
  otherPartySigned,
}: SignatureDialogProps) => {
  const [fullName, setFullName] = useState("");
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !agreed) return;
    onSign(fullName.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Sign Agreement
          </DialogTitle>
          <DialogDescription>
            Review and sign the deal terms below.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
          <h4 className="font-semibold text-sm">Deal Terms</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Hourly Rate:</span>{" "}
              <span className="font-medium">${deal.hourly_rate}/hr</span>
            </div>
            <div>
              <span className="text-muted-foreground">Commission:</span>{" "}
              <span className="font-medium">{deal.commission_percentage}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Hours:</span>{" "}
              <span className="font-medium">{deal.hours}h</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total:</span>{" "}
              <span className="font-medium">${deal.total_amount}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {otherPartySigned ? (
            <span className="flex items-center gap-1 text-green-600">
              <Check className="h-4 w-4" /> {otherPartyName} has signed
            </span>
          ) : (
            <span className="text-muted-foreground">
              Waiting for {otherPartyName} to sign
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Legal Name</Label>
            <Input
              id="full_name"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
            />
            <label htmlFor="agree" className="text-sm text-muted-foreground leading-tight cursor-pointer">
              I agree to the deal terms above and understand this constitutes a binding agreement between both parties.
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !fullName.trim() || !agreed}>
              {isPending ? "Signing..." : "Sign Agreement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SignatureDialog;
