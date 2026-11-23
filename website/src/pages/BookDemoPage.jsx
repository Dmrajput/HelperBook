import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { publicApi, PublicApiError } from "@/api/publicApi";
import { SITE } from "@/config/site";
import { track } from "@/lib/analytics";

const DEMO_SUCCESS =
  "Your demo request has been received. Our team will contact you to confirm a suitable time.";
const DEMO_DUPLICATE = "Your demo request was already received.";

const TEAM_OPTIONS = [
  { value: "1-5", label: "1–5 people" },
  { value: "6-20", label: "6–20 people" },
  { value: "21-50", label: "21–50 people" },
  { value: "51-100", label: "51–100 people" },
  { value: "101+", label: "101+ people" },
];

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(120),
  companyName: z.string().trim().min(2, "Enter your business name.").max(160),
  email: z.string().trim().email("Enter a valid work email.").max(254),
  phone: z.string().trim().min(8, "Enter a valid phone number.").max(30),
  teamSize: z.enum(["1-5", "6-20", "21-50", "51-100", "101+"], {
    errorMap: () => ({ message: "Choose a team size." }),
  }),
  preferredDate: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Enter a valid date (YYYY-MM-DD)."),
  preferredTimeWindow: z.string().max(80).optional(),
  timezone: z.string().max(64).optional(),
  message: z.string().max(4000).optional(),
  privacyAccepted: z.literal(true, { errorMap: () => ({ message: "Please acknowledge the privacy policy." }) }),
  marketingConsent: z.boolean().optional(),
  website: z.string().max(0).optional(),
});

const defaultValues = {
  fullName: "",
  companyName: "",
  email: "",
  phone: "",
  teamSize: "",
  preferredDate: "",
  preferredTimeWindow: "",
  timezone: "Asia/Kolkata",
  message: "",
  privacyAccepted: false,
  marketingConsent: false,
  website: "",
};

export function BookDemoPage() {
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
      const result = await publicApi.demoRequest({
        fullName: values.fullName,
        companyName: values.companyName,
        email: values.email,
        phone: values.phone,
        teamSize: values.teamSize,
        preferredDate: values.preferredDate || "",
        preferredTimeWindow: values.preferredTimeWindow || "",
        timezone: values.timezone || "Asia/Kolkata",
        message: values.message || "",
        privacyAccepted: true,
        marketingConsent: values.marketingConsent === true,
        privacyPolicyVersion: SITE.privacyPolicyVersion,
        sourcePage: "/book-demo",
        idempotencyKey: idempotencyKey.current,
      });
      const message = result.duplicate ? DEMO_DUPLICATE : DEMO_SUCCESS;
      setSuccess({
        message,
        referenceId: result.lead?.referenceId || "",
      });
      track("demo_request_submitted", { duplicate: Boolean(result.duplicate) });
    } catch (err) {
      const msg = err instanceof PublicApiError ? err.message : "Something went wrong. Please try again.";
      setSubmitError(msg);
    }
  }

  return (
    <>
      <Seo
        title="Book a demo"
        description="Schedule a HelperBook demo. Our team will contact you to confirm a suitable time."
        path="/book-demo"
      />
      <div className="border-b border-border bg-brand-soft/40">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h1 className="text-3xl font-semibold text-ink">Book a demo</h1>
          <p className="mt-3 text-muted">
            Tell us about your team. We will reach out to arrange a walkthrough. A preferred date is only a request—not a
            confirmed appointment.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
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
              <motionHoneypot register={register} />

              <Field label="Full name" error={errors.fullName?.message} required>
                <Input id="fullName" autoComplete="name" {...register("fullName")} />
              </Field>

              <Field label="Business name" error={errors.companyName?.message} required>
                <Input id="companyName" autoComplete="organization" {...register("companyName")} />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Work email" error={errors.email?.message} required>
                  <Input id="email" type="email" autoComplete="email" {...register("email")} />
                </Field>
                <Field label="Phone" error={errors.phone?.message} required>
                  <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} />
                </Field>
              </div>

              <Field label="Team size" error={errors.teamSize?.message} required>
                <Select id="teamSize" defaultValue="" {...register("teamSize")}>
                  <option value="" disabled>
                    Select…
                  </option>
                  {TEAM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Preferred date (optional)" error={errors.preferredDate?.message} hint="Request only—we will confirm by email or phone.">
                  <Input id="preferredDate" type="date" {...register("preferredDate")} />
                </Field>
                <Field label="Preferred time window (optional)" error={errors.preferredTimeWindow?.message}>
                  <Input id="preferredTimeWindow" placeholder="e.g. Weekday mornings" {...register("preferredTimeWindow")} />
                </Field>
              </div>

              <input type="hidden" {...register("timezone")} />

              <Field label="Anything we should know? (optional)" error={errors.message?.message}>
                <Textarea id="message" rows={4} {...register("message")} />
              </Field>

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
                  </Link>{" "}
                  (required).
                </span>
              </label>
              {errors.privacyAccepted ? <p className="text-sm text-danger">{errors.privacyAccepted.message}</p> : null}

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-border text-brand focus:ring-brand"
                  {...register("marketingConsent")}
                />
                <span className="text-muted">Send me occasional product updates (optional).</span>
              </label>

              {submitError ? (
                <p className="rounded-lg border border-danger/30 bg-red-50 px-3 py-2 text-sm text-danger" role="alert">
                  {submitError}
                </p>
              ) : null}

              <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? "Submitting…" : "Submit demo request"}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </>
  );
}

function motionHoneypot({ register }) {
  return (
    <div className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
      <Label htmlFor="website">Website</Label>
      <Input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
    </div>
  );
}

function Field({ label, children, error, hint, required }) {
  return (
    <div>
      <Label>
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </Label>
      {children}
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      {error ? <p className="mt-1 text-sm text-danger">{error}</p> : null}
    </div>
  );
}