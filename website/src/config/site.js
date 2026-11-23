/**
 * Central marketing configuration.
 * Values from GET /api/public/platform override empty fields at runtime.
 * Do not put secrets here.
 */
export const SITE = {
  productName: "HelperBook",
  legalCompanyName: "Divyarajsinh Mavendrasinh Padhiyar",
  tagline: "Everyday employee management, made simpler.",
  description:
    "HelperBook helps shops and small teams manage employees, attendance, salaries, leave, and advances in one place.",
  siteUrl: import.meta.env.VITE_SITE_URL || "https://helperbook.example",
  contactEmail: "helperbookofficial@gmail.com",
  contactPhone: "",
  whatsappNumber: "",
  address: "Ahmedabad, Gujarat, India",
  supportHours: "Monday to Saturday, 10:00 to 18:00 IST",
  appDownloadUrl: import.meta.env.VITE_APP_DOWNLOAD_URL || "",
  loginUrl: import.meta.env.VITE_LOGIN_URL || "",
  privacyPolicyVersion: "2026-10-24",
  reportingTimezone: "Asia/Kolkata",
  primaryCta: "Book a demo",
};

export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
