export const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", hint: "Reference optional" },
  { id: "upi", label: "UPI", hint: "Enter UPI transaction ID" },
  { id: "bank", label: "Bank Transfer", hint: "Enter UTR / transaction reference" },
];

export function methodLabel(method) {
  return PAYMENT_METHODS.find((item) => item.id === method)?.label || method || "";
}

export function methodHint(method) {
  return PAYMENT_METHODS.find((item) => item.id === method)?.hint || "Reference optional";
}
