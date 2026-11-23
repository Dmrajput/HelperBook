import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/config/site";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/features", label: "Features" },
  { to: "/#how-it-works", label: "How it works", hash: true },
  { to: "/about", label: "About us" },
  { to: "/contact", label: "Contact" },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold text-ink">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">H</span>
      <span>{SITE.productName}</span>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {LINKS.map((link) =>
            link.hash ? (
              <a key={link.to} href={link.to} className="text-sm text-muted hover:text-ink">
                {link.label}
              </a>
            ) : (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => cn("text-sm hover:text-ink", isActive ? "font-semibold text-ink" : "text-muted")}
              >
                {link.label}
              </NavLink>
            )
          )}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {SITE.loginUrl ? (
            <a href={SITE.loginUrl} className="text-sm font-medium text-muted hover:text-ink">
              Sign in
            </a>
          ) : null}
          <Link to="/book-demo" onClick={() => track("book_demo_cta_clicked", { location: "header" })}>
            <Button>{SITE.primaryCta}</Button>
          </Link>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      {open ? (
        <div id="mobile-nav" className="border-t border-border bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3" aria-label="Mobile">
            {LINKS.map((link) =>
              link.hash ? (
                <a key={link.to} href={link.to} className="py-1 text-sm text-ink" onClick={() => setOpen(false)}>
                  {link.label}
                </a>
              ) : (
                <NavLink key={link.to} to={link.to} className="py-1 text-sm text-ink" onClick={() => setOpen(false)}>
                  {link.label}
                </NavLink>
              )
            )}
            <Link to="/book-demo" onClick={() => { setOpen(false); track("book_demo_cta_clicked", { location: "mobile_header" }); }}>
              <Button className="mt-2 w-full">{SITE.primaryCta}</Button>
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
