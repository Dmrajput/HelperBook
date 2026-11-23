import { useState } from "react";
import { cn } from "@/lib/utils";

const TABS = [
  {
    id: "attendance",
    label: "Attendance",
    caption: "Mark daily presence and review who is present, on leave, or not marked.",
    body: (
      <div className="space-y-3">
        {[
          ["Anil Rao", "Present", "09:02", "18:11"],
          ["Priya Shah", "Leave", "—", "—"],
          ["Ravi Patel", "Present", "09:18", "18:05"],
        ].map(([name, status, inn, out]) => (
          <div key={name} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
            <div>
              <p className="font-medium text-ink">{name}</p>
              <p className="text-xs text-muted">Illustrative preview</p>
            </div>
            <div className="text-right">
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", status === "Present" ? "bg-emerald-50 text-emerald-700" : "bg-violet-50 text-violet-700")}>
                {status}
              </span>
              <p className="mt-1 text-xs text-muted">
                {inn} · {out}
              </p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "employees",
    label: "Employees",
    caption: "Keep employee records, roles, and joining details organized.",
    body: (
      <div className="space-y-3 text-sm">
        {["Anil Rao · Sales", "Priya Shah · Operations", "Ravi Patel · Helper"].map((row) => (
          <div key={row} className="rounded-xl border border-border px-3 py-3">
            <p className="font-medium text-ink">{row}</p>
            <p className="text-xs text-muted">Status: Active · Illustrative preview</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "salary",
    label: "Salary",
    caption: "Calculate monthly pay from attendance, then record cash, UPI, or bank payments.",
    body: (
      <div className="rounded-xl border border-border p-4 text-sm">
        <p className="font-medium text-ink">Salary summary · Illustrative</p>
        <dl className="mt-3 space-y-2 text-muted">
          <div className="flex justify-between"><dt>Base</dt><dd className="text-ink">₹18,000</dd></div>
          <div className="flex justify-between"><dt>Deductions</dt><dd className="text-ink">₹600</dd></div>
          <div className="flex justify-between border-t border-border pt-2 font-semibold"><dt>Payable</dt><dd className="text-ink">₹17,400</dd></div>
        </dl>
      </div>
    ),
  },
  {
    id: "leave",
    label: "Leave",
    caption: "Review leave requests and keep approved leave aligned with attendance and salary.",
    body: (
      <div className="space-y-3 text-sm">
        {[
          ["Casual leave", "Pending"],
          ["Sick leave", "Approved"],
        ].map(([type, status]) => (
          <div key={type} className="flex items-center justify-between rounded-xl border border-border px-3 py-3">
            <span className="font-medium text-ink">{type}</span>
            <span className="text-xs text-muted">{status} · Illustrative</span>
          </div>
        ))}
      </div>
    ),
  },
];

export function ProductPreview() {
  const [active, setActive] = useState(TABS[0].id);
  const current = TABS.find((tab) => tab.id === active) || TABS[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="flex flex-wrap gap-2 border-b border-border bg-surface px-3 py-3" role="tablist" aria-label="Product preview">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              active === tab.id ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
            )}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-5" role="tabpanel">
        <p className="mb-4 text-sm text-muted">{current.caption}</p>
        {current.body}
      </div>
    </div>
  );
}
