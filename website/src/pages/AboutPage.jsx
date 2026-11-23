import { Link } from "react-router-dom";
import { Mail, MapPin, Clock, Phone } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SITE } from "@/config/site";
import { usePlatform } from "@/hooks/usePlatform";
import { track } from "@/lib/analytics";

export function AboutPage() {
  const { contact, isLoading } = usePlatform();
  const intro = contact.companyDescription || SITE.description;

  return (
    <>
      <Seo
        title="About us"
        description={`Learn about ${SITE.productName} and who we build for.`}
        path="/about"
      />
      <div className="border-b border-border bg-brand-soft/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h1 className="text-3xl font-semibold text-ink sm:text-4xl">About {contact.productName}</h1>
          <p className="mt-3 max-w-2xl text-muted">{intro}</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-14 sm:px-6">
        <section>
          <h2 className="text-xl font-semibold text-ink">Why we built it</h2>
          <p className="mt-3 max-w-3xl text-muted">
            Many shop owners still juggle attendance notebooks, message threads, and ad-hoc salary notes. {SITE.productName}{" "}
            brings employee records, attendance, leave, salaries, advances, and reports into one app so daily management
            stays organised.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink">Who it&apos;s for</h2>
          <p className="mt-3 max-w-3xl text-muted">
            Owners of retail shops, small offices, and service businesses in India who want dependable employee
            management without enterprise software overhead.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink">Our approach</h2>
          <ul className="mt-3 max-w-3xl list-disc space-y-2 pl-5 text-muted">
            <li>Ship features that match real small-business routines—not buzzwords.</li>
            <li>Calculate and record from data the shop enters; we do not provide tax or legal advice.</li>
            <li>Keep pricing and limits transparent in the app and on this website.</li>
          </ul>
        </section>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-ink">Contact</h2>
          {isLoading ? <p className="mt-2 text-sm text-muted">Loading contact details…</p> : null}
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
            {contact.legalCompanyName ? (
              <li className="pt-2 text-xs text-muted">Legal name: {contact.legalCompanyName}</li>
            ) : null}
          </ul>
        </Card>

        <p className="text-xs text-muted">
          Legal copy on this website should be reviewed by the owner before public launch. See privacy and terms pages for
          current drafts.
        </p>

        <Link to="/book-demo" onClick={() => track("book_demo_cta_clicked", { location: "about" })}>
          <Button size="lg">{SITE.primaryCta}</Button>
        </Link>
      </div>
    </>
  );
}