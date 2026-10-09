import AppText from "../AppText";
import { colors } from "../../theme";

const LABELS = {
  created: "Pending",
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export default function PaymentStatusBadge({ status }) {
  const failed = status === "failed";
  return (
    <AppText variant="label" color={failed ? colors.error : status === "paid" ? colors.success : colors.textSecondary}>
      {LABELS[status] || status}
    </AppText>
  );
}
