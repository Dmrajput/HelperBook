const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function salaryPeriodLabel(year, month) {
  return `${MONTHS[month - 1]} ${year}`;
}

export function shortDate(key) {
  const [year, month, day] = key.split("-").map(Number);
  return `${day} ${SHORT_MONTHS[month - 1]}`;
}

export function dateSpan(startKey, endKey) {
  if (startKey === endKey) return shortDate(startKey);
  return `${shortDate(startKey)} - ${shortDate(endKey)}`;
}

export function salaryPaidCopy(name, period, amountLabel) {
  return {
    title: "Salary Paid",
    message: `${name}'s ${period} salary of ${amountLabel} has been recorded as paid.`,
    pushTitle: "Salary Paid",
    pushMessage: `${name}'s salary has been recorded as paid.`,
  };
}

export function salaryReminderCopy(name, period, amountLabel) {
  return {
    title: "Salary Reminder",
    message: `${name}'s ${period} salary of ${amountLabel} is still unpaid.`,
    pushTitle: "Salary Reminder",
    pushMessage: "You have unpaid employee salaries to review.",
  };
}

export function leaveSubmittedCopy(name, span) {
  return {
    title: "Leave Submitted",
    message: `${name} submitted a leave request for ${span}.`,
    pushTitle: "Leave Update",
    pushMessage: "A leave request has been updated.",
  };
}

export function leaveApprovedCopy(name, span) {
  return {
    title: "Leave Approved",
    message: `${name}'s leave request for ${span} was approved.`,
    pushTitle: "Leave Update",
    pushMessage: "A leave request has been updated.",
  };
}

export function leaveRejectedCopy(name, reason) {
  const detail = reason ? ` Reason: ${reason}` : "";
  return {
    title: "Leave Rejected",
    message: `${name}'s leave request was rejected.${detail}`,
    pushTitle: "Leave Update",
    pushMessage: "A leave request has been updated.",
  };
}

export function leaveCancelledCopy(name, span) {
  return {
    title: "Leave Cancelled",
    message: `${name}'s leave request for ${span} was cancelled.`,
    pushTitle: "Leave Update",
    pushMessage: "A leave request has been updated.",
  };
}

export function subscriptionExpiringCopy(days) {
  const message = days === 1
    ? "Your HelperBook subscription expires tomorrow."
    : `Your HelperBook subscription expires in ${days} days.`;
  const pushMessage = days === 1 ? "Your subscription expires tomorrow." : `Your subscription expires in ${days} days.`;
  return {
    title: "Subscription Reminder",
    message,
    pushTitle: "HelperBook Subscription",
    pushMessage,
  };
}

export function subscriptionExpiredCopy(source) {
  const trial = source === "trial";
  return {
    title: trial ? "Trial Ended" : "Subscription Expired",
    message: trial
      ? "Your HelperBook trial has ended. You're now on the Free plan."
      : "Your HelperBook subscription has expired. You're now on the Free plan.",
    pushTitle: "HelperBook Subscription",
    pushMessage: trial ? "Your HelperBook trial has ended." : "Your HelperBook subscription has expired.",
  };
}
