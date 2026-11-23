import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  CalendarCheck,
  Wallet,
  HandCoins,
  Palmtree,
  BarChart3,
  ChevronDown,
  Store,
  Building2,
  Wrench,
  TrendingUp,
} from "lucide-react";
import { Seo } from "@/components/Seo";
import { CtaBanner } from "@/components/CtaBanner";
import { ProductPreview } from "@/components/ProductPreview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SITE } from "@/config/site";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const PROBLEMS = [
  {
    pain: "Attendance scattered across notebooks and messages",
    fix: "Mark daily attendance in one place and see who is present, absent, or on leave.",
  },
  {
    pain: "Salary time turns into manual calculations",
    fix: "Calculate monthly pay from attendance and record how each salary was paid.",
  },
  {
    pain: "Employee advances are hard to track",
    fix: "Log advances and repayments so balances stay clear over time.",
  },
  {
    pain: "Leave requests get lost in chat",
    fix: "Review leave requests and keep approved leave aligned with attendance and salary.",
  },
];

const FEATURES = [
  {
    icon: Users,
    title: "Employee records",
    description: "Store names, roles, joining dates, status, and notes for everyone on your team.",
  },
  {
    icon: CalendarCheck,
    title: "Attendance",
    description: "Mark who is present or absent each day and review attendance alongside leave.",
  },
  {
    icon: Wallet,
    title: "Salary",
    description: "Calculate pay from your records, then note cash, UPI, or bank payments when salaries are paid.",
  },
  {
    icon: HandCoins,
    title: "Advances & khata",
    description: "Track advances given to employees and record repayments against the balance.",
  },
  {
    icon: Palmtree,
    title: "Leave",
    description: "Submit and review leave requests and choose how approved leave affects salary.",
  },
  {
    icon: BarChart3,
    title: "Reports",
    description: "Export summaries from the data your shop enters for your own records.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Set up your shop",
    body: "Create your account, add shop details, and invite employees when you are ready.",
  },
  {
    step: "2",
    title: "Run daily routines",
    body: "Mark attendance, record leave, and keep advances updated as the month moves along.",
  },
  {
    step: "3",
    title: "Close the month with clarity",
    body: "Calculate salaries from attendance, record payments, and review reports.",
  },
];

const AUDIENCES = [
  { icon: Store, title: "Retail & shops", body: "Counter teams, helpers, and floor staff in one ledger." },
  { icon: Building2, title: "Small offices", body: "Lightweight HR routines without heavyweight software." },
  { icon: Wrench, title: "Service businesses", body: "Field and desk teams with clear attendance history." },
  { icon: TrendingUp, title: "Growing teams", body: "Move off spreadsheets before records outgrow notebooks." },
];

const FAQS = [
  {
    q: "What is HelperBook?",
    a: "HelperBook is a mobile app for shop owners to manage employees, attendance, leave, salaries, advances, and reports in one place.",
  },
  {
    q: "Do employees need their own login?",
    a: "Employees can sign in only after the shop owner enables login for them. Owners always control access.",
  },
  {
    q: "Does HelperBook file taxes or run payroll compliance?",
    a: "No. HelperBook helps you calculate and record based on the data you enter. It is not tax, payroll, or legal advice.",
  },
  {
    q: "How do I see pricing?",
    a: "Published in-app subscription plans are shown on the pricing page. Book a demo if you want a walkthrough first.",
  },
  {
    q: "How do I get started?",
    a: "Book a demo and our team will contact you, or send an inquiry from the contact page.",
  },
];

function FaqItem({ item, open, onToggle }) {
  const panelId = `faq-${item.q.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="font-medium text-ink">{item.q}</span>
        <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted transition", open && "rotate-180")} aria-hidden />
      </button>
      <div id={panelId} role="region" hidden={!open} className="pb-4 text-sm text-muted">
        {item.a}
      </div>
    </div>
  );
}

export function HomePage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <>
      <Seo path="/" />
      <section className="border-b border-border bg-gradient-to-b from-brand-soft/60 to-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
          <div className="order-1 lg:order-none">
            <span className="inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
              Employee management, simplified
            </span>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              Everyday employee management,{" "}
              <span className="text-brand">made simpler.</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted">{SITE.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/book-demo" onClick={() => track("book_demo_cta_clicked", { location: "hero" })}>
                <Button size="lg">{SITE.primaryCta}</Button>
              </Link>
              <Link to="/features">
                <Button size="lg" variant="secondary">
                  Explore features
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">Built for shops, small offices, and growing teams.</p>
          </div>
          <div className="order-2 lg:order-none">
            <ProductPreview />
          </div>
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-ink sm:text-3xl">Sound familiar?</h2>
            <p className="mt-2 text-muted">Common pain points—and how HelperBook addresses them with real app features.</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {PROBLEMS.map((item) => (
              <Card key={item.pain} className="p-6">
                <p className="text-sm font-medium text-danger/90">The problem</p>
                <p className="mt-1 font-medium text-ink">{item.pain}</p>
                <p className="mt-4 text-sm font-medium text-brand">In HelperBook</p>
                <p className="mt-1 text-sm text-muted">{item.fix}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-ink sm:text-3xl">Everything in one workspace</h2>
            <p className="mt-2 text-muted">Core modules shop owners use every week—no exaggerated claims.</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Icon size={22} strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm text-muted">{description}</p>
              </Card>
            ))}
          </div>
          <p className="mt-8">
            <Link to="/features" className="text-sm font-semibold text-brand hover:underline">
              See full feature details →
            </Link>
          </p>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 bg-surface py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold text-ink sm:text-3xl">How it works</h2>
          <p className="mt-2 max-w-xl text-muted">Three straightforward steps from setup to month-end clarity.</p>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((item) => (
              <li key={item.step} className="relative rounded-2xl border border-border bg-white p-6">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  {item.step}
                </span>
                <h3 className="mt-4 font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm text-muted">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ArchiveShowcase />
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold text-ink sm:text-3xl">Who it&apos;s for</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-border bg-white p-5">
                <Icon className="text-brand" size={24} strokeWidth={1.75} aria-hidden />
                <h3 className="mt-3 font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-semibold text-ink">Built for Indian small businesses</h2>
          <p className="mt-4 text-muted">
            {SITE.productName} is designed for owners who want employee records, attendance, and pay in one app—without
            enterprise complexity. Learn more about our approach on the about page.
          </p>
          <Link to="/about" className="mt-6 inline-block text-sm font-semibold text-brand hover:underline">
            About {SITE.productName}
          </Link>
        </div>
      </section>

      <section className="border-y border-border bg-surface py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold text-ink">Frequently asked questions</h2>
          <div className="mt-6">
            {FAQS.map((item) => (
              <FaqItem
                key={item.q}
                item={item}
                open={openFaq === item.q}
                onToggle={() => setOpenFaq((prev) => (prev === item.q ? null : item.q))}
              />
            ))}
          </div>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}

function ArchiveShowcase() {
  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
      <div>
        <h2 className="text-2xl font-semibold text-ink sm:text-3xl">See the app before you commit</h2>
        <p className="mt-2 text-muted">
          These screens are illustrative previews of attendance, employees, salary, and leave—not a live account.
        </p>
      </div>
      <ProductPreview />
    </div>
  );
}