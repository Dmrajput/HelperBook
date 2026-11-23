import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, MapPin, Clock, Phone, MessageCircle } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { publicApi, PublicApiError } from "@/api/publicApi";
import { SITE } from "@/config/site";
import { usePlatform } from "@/hooks/usePlatform";
import { track } from "@/lib/analytics";

const INQUIRY_SUCCESS = "Your inquiry has been received.";
const INQUIRY_DUPLICATE = "Your inquiry was already received.";

const CATEGORIES = [
  { value: "product_question", label: "Product question" },
  { value: "sales_inquiry", label: "Sales inquiry" },
  { value: "existing_customer_support", label: "Existing customer support" },
  { value: "partnership", label: "Partnership" },
  { value: "other", label: "Other" },
];

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(120),
  email: z.string().trim().email("Enter a valid email.").max(254),
  phone: z.string().max(30).optional(),
  companyName: z.string().max(160).optional(),
  inquiryCategory: z.enum(
    ["product_question", "sales_inquiry", "existing_customer_support", "partnership", "other"],
    { errorMap: () => ({ message: "Choose an inquiry type." }) }
  ),
  message: z.string().trim().min(10, "Enter at least 10 characters.").max(4000),
  privacyAccepted: z.literal(true, { errorMap: () => ({ message: "Please acknowledge the privacy policy." }) }),
  website: z.string().max(0).optional(),
});

const defaultValues = {
  fullName: "",
  email: "",
  phone: "",
  companyName: "",
  inquiryCategory: "",
  message: "",
  privacyAccepted: false,
  website: "",
};

function whatsappHref(number) {
  const digits = String(number).replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

export function ContactPage() {
  const { contact } = usePlatform();
  const idempotencyKey = useRef(crypto.randomUUID());
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  async function onSubmit(values) {
    setSubmitError("");
    if (values.website) return;
    try {
      const result = await publicApi.inquiry({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone || "",
        companyName: values.companyName || "",
        inquiryCategory: values.inquiryCategory,
        message: values.message,
        privacyAccepted: true,
        privacyPolicyVersion: SITE.privacyPolicyVersion,
        sourcePage: "/contact",
        idempotencyKey: idempotencyKey.current,
      });
      const message = result.duplicate ? INQUIRY_DUPLICATE : INQUIRY_SUCCESS;
      setSuccess({
        message,
        referenceId: result.lead?.referenceId || "",
      });
      track("inquiry_submitted", { category: values.inquiryCategory, duplicate: Boolean(result.duplicate) });
    } catch (err) {
      const msg = err instanceof PublicApiError ? err.message : "Something went wrong. Please try again.";
      setSubmitError(msg);
    }
  }

  const wa = contact.whatsappNumber ? whatsappHref(contact.whatsappNumber) : "";

  return (
    <>
      <Seo title="Contact" description="Contact the HelperBook team with product or sales questions." path="/contact" />
      <div className="border-b border-border bg-brand-soft/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h1 className="text-3xl font-semibold text-ink">Contact</h1>
          <p className="mt-3 max-w-2xl text-muted">Send an inquiry or use the details below. We respond during support hours when possible.</p>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-ink">Reach us</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            {contact.contactEmail ? (
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-brand" aria-hidden />
                <a href={`mailto:${contact.contactEmail}`} className="text-ink hover:underline">
                  {contact.contactEmail}
                </a>
              </li>
            ) : null}
            {contact.contactPhone ? (
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-brand" aria-hidden />
                <a href={`tel:${contact.contactPhone}`} className="text-ink hover:underline">
                  {contact.contactPhone}
                </a>
              </li>
            ) : null}
            {wa ? (
              <li className="flex items-center gap-2">
                <MessageCircle size={16} className="text-brand" aria-hidden />
                <a href={wa} target="_blank" rel="noopener noreferrer" className="text-ink hover:underline">
                  WhatsApp
                </a>
              </li>
            ) : null}
            {contact.address ? (
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 text-brand" aria-hidden />
                <span>{contact.address}</span>
              </li>
            ) : null}
            {contact.supportHours ? (
              <li className="flex items-center gap-2">
                <Clock size={16} className="text-brand" aria-hidden />
                <span>{contact.supportHours}</span>
              </li>
            ) : null}
          </ul>
        </Card>

        <div className="lg:col-span-3">
          {success ? (
            <Card className="border-success/30 bg-emerald-50/50 p-6">
              <h2 className="text-lg font-semibold text-ink">Thank you</h2>
              <p className="mt-2 text-muted">{success.message}</p>
              {success.referenceId ? (
                <p className="mt-3 text-sm text-ink">
                  Reference: <span className="font-mono font-semibold">{success.referenceId}</span>
                </p>
              ) : null}
            </Card>
          ) : (
            <Card className="p-6 sm:p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
                  <Input tabIndex={-1} {...register("website")} />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="fullName">Full name *</Label>
                    <Input id="fullName" autoComplete="name" {...register("fullName")} />
                    {errors.fullName ? <p className="mt-1 text-sm text-danger">{errors.fullName.message}</p> : null}
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" autoComplete="email" {...register("email")} />
                    {errors.email ? <p className="mt-1 text-sm text-danger">{errors.email.message}</p> : null}
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} />
                    {errors.phone ? <p className="mt-1 text-sm text-danger">{errors.phone.message}</p> : null}
                  </div>
                  <div>
                    <Label htmlFor="companyName">Company (optional)</Label>
                    <Input id="companyName" autoComplete="organization" {...register("companyName")} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="inquiryCategory">Inquiry type *</Label>
                  <Select id="inquiryCategory" defaultValue="" {...register("inquiryCategory")}>
                    <option value="" disabled>
                      Select…
                    </option>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                  {errors.inquiryCategory ? <p className="mt-1 text-sm text-danger">{errors.inquiryCategory.message}</p> : null}
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea id="message" rows={5} {...register("message")} />
                  {errors.message ? <p className="mt-1 text-sm text-danger">{errors.message.message}</p> : null}
                </div>

                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-border text-brand focus:ring-brand"
                    {...register("privacyAccepted")}
                  />
                  <span className="text-muted">
                    I agree to the{" "}
                    <Link to="/privacy" className="font-medium text-brand hover:underline">
                      privacy policy
                    </Link>
                    .
                  </span>
                </label>
                {errors.privacyAccepted ? <p className="text-sm text-danger">{errors.privacyAccepted.message}</p> : null}

                {submitError ? (
                  <p className="rounded-lg border border-danger/30 bg-red-50 px-3 py-2 text-sm text-danger" role="alert">
                    {submitError}
                  </p>
                ) : null}

                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? "Sending…" : "Send inquiry"}
                </Button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}