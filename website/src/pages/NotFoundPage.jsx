import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { SITE } from "@/config/site";

export function NotFoundPage() {
  return (
    <>
      <Seo title="Page not found" description="The page you requested was not found." noIndex />
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">404</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Page not found</h1>
        <p className="mt-3 text-muted">The link may be outdated or the page may have moved.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/">
            <Button>Back to home</Button>
          </Link>
          <Link to="/features">
            <Button variant="secondary">Features</Button>
          </Link>
          <Link to="/book-demo">
            <Button variant="outline">{SITE.primaryCta}</Button>
          </Link>
        </div>
      </div>
    </>
  );
}