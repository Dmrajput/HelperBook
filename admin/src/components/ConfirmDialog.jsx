import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = "Confirm",
  danger = false,
  requireReason = true,
  loading = false,
  onConfirm,
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (requireReason && (reason.trim().length < 5 || reason.trim().length > 300)) {
      setError("Enter a reason between 5 and 300 characters.");
      return;
    }
    try {
      await onConfirm(reason.trim());
      setReason("");
      onClose();
    } catch (err) {
      setError(err.message || "The action failed.");
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!loading) onClose();
      }}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "default"} onClick={submit} disabled={loading}>
            {loading ? "Working…" : confirmLabel}
          </Button>
        </>
      }
    >
      {description ? <p className="mb-3 text-sm text-muted">{description}</p> : null}
      {requireReason ? (
        <div>
          <Label htmlFor="confirm-reason">Reason</Label>
          <Textarea
            id="confirm-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explain why this change is needed"
          />
        </div>
      ) : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </Dialog>
  );
}
