import { Link } from "react-router-dom";
import {
  Users,
  CalendarCheck,
  Wallet,
  HandCoins,
  Palmtree,
  BarChart3,
  Bell,
  FileText,
} from "lucide-react";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CtaBanner } from "@/components/CtaBanner";
import { SITE } from "@/config/site";
import { track } from "@/lib/analytics";

const SECTIONS = [
  {
    id: "employees",
    icon: Users,
    title: "Employee records",
    points: [
      "Add and update employee name, phone, role, joining date, status, and notes.",
      "Deactivate employees when they leave without deleting historical records.",
      "Employee login is optional and enabled per person by the shop owner.",
    ],
  },
  {
    id: "attendance",
    icon: CalendarCheck,
    title: "Attendance",
    points: [
      "Mark daily presence or absence for each employee.",
      "Review who is present, absent, or on approved leave for a given day.",
      "Attendance ties into salary calculations based on the rules you configure.",
    ],
  },
  {
    id: "salary",
    icon: Wallet,
    title: "Salary",
    points: [
      "Calculate monthly salary from attendance and configured pay rules.",
      "Apply bonuses or deductions you enter manually.",
      "Record when a salary is paid and the payment method (cash, UPI, or bank).",
      "Generate salary receipts from recorded payments.",
    ],
  },
  {
    id: "advances",
    icon: HandCoins,
    title: "Advances & khata",
    points: [
      "Log salary advances given to an employee.",
      "Record repayments and view remaining balance.",
      "Advance balances inform salary calculations when configured.",
    ],
  },
  {
    id: "leave",
    icon: Palmtree,
    title: "Leave",
    points: [
      "Employees or owners can submit leave requests depending on your workflow.",
      "Approve or decline requests and mark whether sick leave is paid or unpaid.",
      "Approved leave aligns with attendance and salary for the month.",
    ],
  },
  {
    id: "reports",
    icon: BarChart3,
    title: "Reports",
    points: [
      "View and export summaries from the records your shop has entered.",
      "Use exports for your own bookkeeping—not as statutory filings.",
      "Reports reflect your data; accuracy depends on what you record in the app.",
    ],
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Notifications",
    points: [
      "Push notifications for events such as leave updates when users allow notifications.",
      "Salary-paid notifications do not include the amount in the push text.",
    ],
  },
  {
    id: "subscription",
    icon: FileText,
    title: "Plans & subscription",
    points: [
      "Choose a plan that matches your active employee count.",
      "Paid subscriptions are processed through Razorpay inside the mobile app.",
      "Plan limits are enforced on the server based on active employees.",
    ],
  },
];

export function FeaturesPage() {
  return (
    <>
      <Seo
        title="Features"
        description="Explore HelperBook features: employees, attendance, salary, advances, leave, and reports for small teams."
        path="/features"
      />
      <div className="border-b border-border bg-brand-soft/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Features</h1>
          <p className="mt-3 max-w-2xl text-muted">
            What HelperBook actually does today—focused on records, calculations, and exports. We do not offer biometric
            attendance, GPS tracking, WhatsApp automation, AI assistants, or direct bank payment rails in the product.
          </p>
          <Link to="/book-demo" className="mt-6 inline-block" onClick={() => track("book_demo_cta_clicked", { location: "features_hero" })}>
            <Button size="lg">{SITE.primaryCta}</Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-14 sm:px-6">
        {SECTIONS.map(({ id, icon: Icon, title, points }) => (
          <section key={id} id={id} className="scroll-mt-24">
            <Card className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Icon size={24} strokeWidth={1.75} aria-hidden />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-ink">{title}</h2>
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted">
                    {points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </section>
        ))}
      </div>

      <CtaBanner heading="Want a guided tour?" description="Book a demo to walk through the features that matter for your team size." />
    </>
  );
}