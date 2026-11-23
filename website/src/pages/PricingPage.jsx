import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { publicApi, PublicApiError } from "@/api/publicApi";
import { SITE } from "@/config/site";
import { formatINR } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export function PricingPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["public", "plans"],
    queryFn: publicApi.plans,
  });

  const plans = data?.plans ?? [];
  const note = data?.note || "Prices are current published plan amounts in INR. Taxes may apply.";

  return (
    <>
      <Seo
        title="Pricing"
        description="HelperBook subscription plans for small teams. Prices in INR from the public API."
        path="/pricing"
      />
      <div className="border-b border-border bg-brand-soft/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h1 className="text-3xl font-semibold text-ink">Pricing</h1>
          <p className="mt-3 max-w-2xl text-muted">
            Plans shown here match what the HelperBook API publishes. The free tier is for single-employee use in the app
            and is not listed below. Subscriptions are purchased in the mobile app via Razorpay.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        {isLoading ? (
          <p className="text-muted">Loading plans…</p>
        ) : isError ? (
          <Card className="border-danger/20 bg-red-50/40 p-6">
            <p className="font-medium text-ink">Unable to load plans</p>
            <p className="mt-2 text-sm text-muted">
              {error instanceof PublicApiError ? error.message : "Check that the API is running and try again."}
            </p>
            <Link to="/book-demo" className="mt-4 inline-block">
              <Button variant="secondary">Book a demo instead</Button>
            </Link>
          </Card>
        ) : plans.length === 0 ? (
          <Card className="p-6">
            <p className="text-muted">No paid plans are published right now. Contact us for guidance.</p>
            <Link to="/contact" className="mt-4 inline-block">
              <Button variant="secondary">Contact</Button>
            </Link>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
            <p className="mt-8 text-sm text-muted">{note}</p>
            <p className="mt-4 text-sm text-muted">
              Need help choosing?{" "}
              <Link
                to="/book-demo"
                className="font-semibold text-brand hover:underline"
                onClick={() => track("book_demo_cta_clicked", { location: "pricing" })}
              >
                Book a demo
              </Link>
              .
            </p>
          </>
        )}
      </div>
    </>
  );
}

function PlanCard({ plan }) {
  const monthly = formatINR(plan.monthlyPrice);
  const list = plan.hasMonthlyDiscount && plan.monthlyListPrice != null ? formatINR(plan.monthlyListPrice) : null;
  const highlight = plan.id === "business";

  return (
    <Card className={cn("flex flex-col p-6", highlight && "ring-2 ring-brand")}>
      <h2 className="text-lg font-semibold text-ink">{plan.name}</h2>
      <p className="mt-1 text-sm text-muted">Up to {plan.employeeLimit} active employees</p>
      <div className="mt-6">
        <p className="text-3xl font-semibold text-ink">{monthly}</p>
        <p className="text-sm text-muted">per month</p>
        {list ? (
          <p className="mt-1 text-sm text-muted">
            <span className="line-through">{list}</span>
            {plan.monthlyDiscountPercent ? ` · ${plan.monthlyDiscountPercent}% off` : null}
          </p>
        ) : null}
        {plan.yearlyAvailable && plan.yearlyPrice != null ? (
          <p className="mt-2 text-sm text-muted">Yearly: {formatINR(plan.yearlyPrice)}</p>
        ) : (
          <p className="mt-2 text-sm text-muted">Yearly billing not configured</p>
        )}
      </div>
      <div className="mt-8 flex-1" />
      <Link
        to="/book-demo"
        className="mt-6 block"
        onClick={() => track("book_demo_cta_clicked", { location: "pricing_card", plan: plan.id })}
      >
        <Button className="w-full" variant={highlight ? "default" : "secondary"}>
          {SITE.primaryCta}
        </Button>
      </Link>
    </Card>
  );
}