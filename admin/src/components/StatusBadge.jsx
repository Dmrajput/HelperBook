import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/utils";

const TONE = {
  active: "success",
  paid: "success",
  processed: "success",
  suspended: "danger",
  failed: "danger",
  expired: "danger",
  past_due: "danger",
  cancelled: "warning",
  cancel_at_period_end: "warning",
  trialing: "info",
  pending: "warning",
  created: "warning",
  requested: "warning",
  inactive: "default",
  free: "default",
};

export function StatusBadge({ status }) {
  const key = String(status || "").toLowerCase();
  return <Badge tone={TONE[key] || "default"}>{titleCase(status || "unknown")}</Badge>;
}
