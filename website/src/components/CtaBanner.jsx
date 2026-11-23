import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SITE } from "@/config/site";
import { track } from "@/lib/analytics";

export function CtaBanner({
  heading = "See how HelperBook fits your business.",
  description = "Book a short demo to walk through attendance, salaries, leave, and advances with our team.",
}) {
  return (
    <section className="bg-brand-soft">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{heading}</h2>
          <p className="mt-2 text-muted">{description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/book-demo" onClick={() => track("book_demo_cta_clicked", { location: "final_cta" })}>
            <Button size="lg">{SITE.primaryCta}</Button>
          </Link>
          <Link to="/contact">
            <Button size="lg" variant="secondary">
              Send an inquiry
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
