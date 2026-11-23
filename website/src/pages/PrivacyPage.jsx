import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { SITE } from "@/config/site";
import { usePlatform } from "@/hooks/usePlatform";

function OwnerReviewBanner() {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="note">
      <strong>Owner review required before launch.</strong> This page is adapted from internal legal docs and must be reviewed by the
      owner (and counsel if needed) before publishing.
    </div>
  );
}

export function PrivacyPage() {
  const { contact } = usePlatform();
  const email = contact.contactEmail || "helperbookofficial@gmail.com";
  const effective = contact.privacyPolicyVersion || SITE.privacyPolicyVersion;

  return (
    <>
      <Seo
        title="Privacy policy"
        description="How HelperBook collects and uses information, including this marketing website."
        path="/privacy"
        noIndex
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <OwnerReviewBanner />
        <h1 className="mt-8 text-3xl font-semibold text-ink">Privacy policy</h1>
        <p className="mt-2 text-sm text-muted">Effective date: 24 October 2026 · Version {effective}</p>

        <div className="prose-like mt-10 space-y-8 text-muted">
          <section>
            <h2 className="text-lg font-semibold text-ink">Who provides the service</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>Legal name: {SITE.legalCompanyName}</li>
              <li>Trade name: {SITE.productName}</li>
              <li>Contact email: {email}</li>
              {contact.address ? <li>Address: {contact.address}</li> : <li>Address: Ahmedabad, Gujarat, India</li>}
              <li>
                Grievance contact: {SITE.legalCompanyName}, {email}
                {contact.address ? `, ${contact.address}` : ", Ahmedabad, Gujarat, India"}
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">Who this policy covers</h2>
            <p className="mt-3">
              Shop owners who create a HelperBook account, employees whose shop enables login, people who contact support, and
              visitors who submit a demo request or inquiry on this website. HelperBook is for small-business staff management. It
              is not directed at children under 13, and we do not knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">This marketing website</h2>
            <p className="mt-3">When you use this marketing website we may collect:</p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>
                <strong className="text-ink">Demo requests:</strong> name, business name, email, phone, team size, optional
                preferred date/time, timezone, optional message, privacy acknowledgement, optional marketing consent, reference id,
                and technical metadata such as a hashed IP and browser type for abuse prevention.
              </li>
              <li>
                <strong className="text-ink">Inquiries:</strong> name, email, optional phone and company, inquiry category,
                message, privacy acknowledgement, reference id, and similar technical metadata.
              </li>
              <li>
                <strong className="text-ink">Optional analytics:</strong> if configured, anonymous page events (no names, emails,
                phones, or message contents) sent to a first-party endpoint.
              </li>
            </ul>
            <p className="mt-3">
              We use this information to respond to you, schedule demos, improve the service, and prevent spam or abuse. We do not
              sell your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">Information the app processes</h2>
            <p className="mt-3">HelperBook processes:</p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>Mobile numbers, password hashes, and one-time codes used only to set or reset a password.</li>
              <li>Owner name, shop name, business type, address, contact details, working hours, and an optional shop logo.</li>
              <li>Employee name, phone number, role, joining date, status, and notes.</li>
              <li>Attendance, leave, and whether approved sick leave is treated as paid or unpaid.</li>
              <li>Salary amounts, bonuses, deductions, payment status, and salary receipts.</li>
              <li>Advance and repayment records.</li>
              <li>
                Subscription plan, trial state, Razorpay order and payment references, and coupon redemption records. Card or UPI
                credentials are entered on Razorpay&apos;s page and are not stored by HelperBook.
              </li>
              <li>Device id, device name, and platform stored with a login session. Push tokens and notification preferences.</li>
              <li>Support messages and account-deletion requests.</li>
              <li>IP address and request time in rate-limit records and server logs.</li>
            </ul>
            <p className="mt-3">HelperBook does not include a third-party analytics or crash-reporting SDK in the mobile app.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">Why this information is used</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>To create and secure accounts and respond to demo and inquiry requests.</li>
              <li>To show a shop only its own employees, attendance, leave, salary, advances, and reports.</li>
              <li>
                To calculate salary and advance balances from the records the shop enters. This is a bookkeeping aid, not tax,
                payroll, or legal advice.
              </li>
              <li>To send notifications the shop enables, such as leave updates and salary-paid notices.</li>
              <li>To bill the HelperBook subscription the owner chooses.</li>
              <li>To answer support and deletion requests.</li>
              <li>To investigate abuse, fraud, and security incidents.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">Processors</h2>
            <p className="mt-3">HelperBook uses processors only as needed to run the service, including hosting, database, SMS (if enabled), Razorpay, optional image hosting, and push notifications. Details are listed in the full policy document maintained by the owner.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">Storage and security</h2>
            <p className="mt-3">
              Data is stored in secured databases. Production connections use HTTPS/TLS. Marketing form submissions are stored with
              access limited to authorised administrators.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">Retention and deletion</h2>
            <p className="mt-3">
              Account deletion requests are handled through the mobile app support flow. Marketing leads are retained as needed to
              follow up and for legitimate business records. Records required for accounting, disputes, or legal obligations may be
              kept for longer periods.
            </p>
            <p className="mt-3">
              Public deletion instructions:{" "}
              <a
                href="https://helperbook.onrender.com/delete-account"
                className="text-brand hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                helperbook.onrender.com/delete-account
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">Your rights and contact</h2>
            <p className="mt-3">
              Write to{" "}
              <a href={`mailto:${email}`} className="text-brand hover:underline">
                {email}
              </a>{" "}
              to request access, correction, or deletion of your personal information. We will respond within a reasonable time under
              applicable Indian law, including the Digital Personal Data Protection Act, 2023 where it applies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">Changes</h2>
            <p className="mt-3">
              We may update this policy from time to time. The effective date at the top will change when we do. Continued use after an
              update means you accept the revised policy.
            </p>
          </section>

          <p className="text-sm">
            See also <Link to="/terms" className="text-brand hover:underline">Terms of service</Link> and{" "}
            <Link to="/contact" className="text-brand hover:underline">Contact</Link>.
          </p>
        </div>
      </div>
    </>
  );
}