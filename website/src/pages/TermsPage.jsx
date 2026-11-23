import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { SITE } from "@/config/site";
import { usePlatform } from "@/hooks/usePlatform";

function OwnerReviewBanner() {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="note">
      <strong>Owner review required before launch.</strong> Draft terms—commercial and legal decisions must be confirmed by the owner
      before publication.
    </div>
  );
}

export function TermsPage() {
  const { contact } = usePlatform();
  const email = contact.contactEmail || "helperbookofficial@gmail.com";

  return (
    <>
      <Seo title="Terms of service" description="Terms governing use of HelperBook." path="/terms" noIndex />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <OwnerReviewBanner />
        <h1 className="mt-8 text-3xl font-semibold text-ink">Terms of service</h1>
        <p className="mt-2 text-sm text-muted">Effective date: 24 October 2026</p>

        <div className="mt-10 space-y-8 text-muted">
          <section>
            <h2 className="text-lg font-semibold text-ink">1. The service</h2>
            <p className="mt-3">
              {SITE.productName} is an online app for a shop to keep employee details, attendance, leave, salary calculations,
              advances, receipts, and reports. It is not a substitute for an accountant, payroll service, or lawyer. Calculations
              follow the records and settings the shop enters.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">2. Who may use it</h2>
            <p className="mt-3">
              Shop owners create an account with an Indian mobile number and a password. Employees can sign in only after the shop
              enables login for them. The owner is responsible for having a proper basis to store employee information and for
              keeping credentials private.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">3. Plans</h2>
            <p className="mt-3">
              Subscription plans, employee limits, and prices are set on the server. Published amounts appear on the{" "}
              <Link to="/pricing" className="text-brand hover:underline">
                pricing page
              </Link>{" "}
              when the API is available. A plan change that would exceed the active employee limit is blocked until the owner
              deactivates enough people. Existing employee records are not deleted by a downgrade. A trial may be available for Pro
              limits when started in the app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">4. Payment</h2>
            <p className="mt-3">
              Paid plans open Razorpay inside the mobile app. The API activates a plan only after it verifies a captured payment for
              the stored order, amount, and currency. Refund rules are determined by the owner and applicable law—they are not
              specified on this marketing site.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">5. Availability</h2>
            <p className="mt-3">
              HelperBook needs a network connection. There is no offline copy of shop data on the phone. Uptime commitments are not
              guaranteed unless the owner publishes them separately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">6. Acceptable use</h2>
            <p className="mt-3">
              Do not misuse the service, attempt to access another shop&apos;s data, submit false payment information, or attack the
              API. The operator may suspend an account that is inactive, abusive, or required to be suspended by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">7. Data</h2>
            <p className="mt-3">
              The shop owns the business records it enters. HelperBook processes them to provide the service, as described in the{" "}
              <Link to="/privacy" className="text-brand hover:underline">
                privacy policy
              </Link>
              . Export is available through report screens in the app. Deletion follows the account-deletion process described in-app
              and in the privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">8. Intellectual property</h2>
            <p className="mt-3">
              The {SITE.productName} name, app, and code are owned by {SITE.legalCompanyName}. Shop logos and records stay with the
              shop, subject to the rights needed to host and display them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">9. Liability and disputes</h2>
            <p className="mt-3">
              HelperBook is provided as a bookkeeping aid. To the extent allowed by law, we are not liable for indirect or
              consequential losses arising from use of the app. These terms are governed by the laws of India, and disputes are
              subject to the courts of Ahmedabad, Gujarat.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">10. Contact</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>
                Email:{" "}
                <a href={`mailto:${email}`} className="text-brand hover:underline">
                  {email}
                </a>
              </li>
              {contact.address ? <li>Address: {contact.address}</li> : <li>Address: Ahmedabad, Gujarat, India</li>}
            </ul>
          </section>

          <p className="text-sm">
            By submitting a <Link to="/book-demo" className="text-brand hover:underline">demo request</Link> or{" "}
            <Link to="/contact" className="text-brand hover:underline">inquiry</Link>, you also acknowledge our privacy policy.
          </p>
        </div>
      </div>
    </>
  );
}