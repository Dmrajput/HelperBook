import { Link } from "react-router-dom";
import { SITE } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2 font-semibold text-ink">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">H</span>
            {SITE.productName}
          </div>
          <p className="mt-3 text-sm text-muted">{SITE.tagline}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
          <div>
            <p className="font-semibold text-ink">Product</p>
            <ul className="mt-3 space-y-2 text-muted">
              <li><Link to="/features" className="hover:text-ink">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-ink">Pricing</Link></li>
              <li><Link to="/book-demo" className="hover:text-ink">Book a demo</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-ink">Company</p>
            <ul className="mt-3 space-y-2 text-muted">
              <li><Link to="/about" className="hover:text-ink">About</Link></li>
              <li><Link to="/contact" className="hover:text-ink">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-ink">Legal</p>
            <ul className="mt-3 space-y-2 text-muted">
              <li><Link to="/privacy" className="hover:text-ink">Privacy</Link></li>
              <li><Link to="/terms" className="hover:text-ink">Terms</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted sm:px-6">
        © {new Date().getFullYear()} {SITE.productName}
        {SITE.legalCompanyName ? ` · ${SITE.legalCompanyName}` : ""}
      </div>
    </footer>
  );
}
