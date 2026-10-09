import AppText from "../AppText";

const LABEL = {
  paid: "Paid Leave",
  unpaid: "Unpaid Leave",
  sick: "Sick Leave",
};

export function leaveTypeLabel(type) {
  return LABEL[type] || "Leave";
}

export default function LeaveTypeBadge({ leaveType }) {
  return <AppText variant="body">{leaveTypeLabel(leaveType)}</AppText>;
}
