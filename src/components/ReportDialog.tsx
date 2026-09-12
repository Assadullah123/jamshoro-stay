import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { reportListing } from "@/lib/listings";

const REASONS = [
  "Wrong information",
  "Fake listing",
  "Already unavailable",
  "Inappropriate content",
  "Spam or scam",
];

export function ReportDialog({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REASONS[0] as string);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await reportListing(listingId, reason, note.slice(0, 500));
      toast.success("Thanks — our team will review this listing.");
      setOpen(false);
      setNote("");
    } catch {
      toast.error("Could not send the report. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Flag /> Report Listing
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this listing</DialogTitle>
          <DialogDescription>Tell us what is wrong so we can review it.</DialogDescription>
        </DialogHeader>
        <RadioGroup value={reason} onValueChange={setReason} className="gap-2">
          {REASONS.map((r) => (
            <div key={r} className="flex items-center gap-2">
              <RadioGroupItem value={r} id={r} />
              <Label htmlFor={r} className="font-normal">
                {r}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <Textarea
          value={note}
          maxLength={500}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add any details (optional)"
        />
        <DialogFooter>
          <Button onClick={submit} disabled={busy}>
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
