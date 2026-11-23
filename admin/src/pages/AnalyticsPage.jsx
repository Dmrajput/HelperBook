import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/adminApi";
import { ErrorState } from "@/components/ErrorState";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatINR, titleCase } from "@/lib/utils";

const SECTIONS = [
  { id: "acquisition", label: "Acquisition" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "revenue", label: "Revenue" },
  { id: "engagement", label: "Engagement" },
  { id: "support", label: "Support" },
];

const RANGE = "last_30_days";

export default function AnalyticsPage() {
  const [section, setSection] = useState("acquisition");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["analytics", section, RANGE],
    queryFn: () => adminApi.analytics(section, `range=${RANGE}`),
  });

  return (
    <div>
      <PageHeader title="Analytics" description="Section metrics with definitions from the API payload." />

      <div className="mb-6 w-56">
        <Label className="mb-1 block text-xs text-muted">Section</Label>
        <Select value={section} onChange={(e) => setSection(e.target.value)}>
          {SECTIONS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>

      {error ? <ErrorState message={error.message} onRetry={refetch} /> : null}
      {isLoading ? <p className="text-sm text-muted">Loading analytics…</p> : null}

      {data ? (
        <>
          <SectionBody section={section} data={data} />
          <Definitions definitions={data.definitions} section={section} data={data} />
        </>
      ) : null}
    </div>
  );
}

function SectionBody({ section, data }) {
  if (section === "acquisition") {
    return (
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <MetricCard label="Owners" value={data.owners ?? "—"} />
        <MetricCard label="Companies" value={data.shops ?? "—"} />
        <MetricCard label="Employees" value={data.employees ?? "—"} />
      </div>
    );
  }
  if (section === "subscriptions") {
    return (
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Paid" value={data.paid ?? "—"} />
        <MetricCard label="Free" value={data.free ?? "—"} />
        <MetricCard label="Trials" value={data.trials ?? "—"} />
        <MetricCard label="Expired" value={data.expired ?? "—"} />
        <MetricCard
          label="Trial conversion"
          value={data.trialConversionRate != null ? `${Math.round(data.trialConversionRate * 100)}%` : "—"}
        />
      </div>
    );
  }
  if (section === "revenue") {
    return (
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Collected" value={formatINR(data.collected)} />
        <MetricCard label="Refunded" value={formatINR(data.refunded)} />
        <MetricCard label="Net" value={formatINR(data.net)} />
        <MetricCard label="Successful payments" value={data.successful ?? "—"} />
      </div>
    );
  }
  if (section === "engagement") {
    return (
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <MetricCard label="Attendance marks" value={data.attendanceMarks ?? "—"} />
        <MetricCard label="Salary records" value={data.salaryRecords ?? "—"} />
        <MetricCard label="Leave requests" value={data.leaveRequests ?? "—"} />
      </div>
    );
  }
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard label="Open tickets" value={data.open ?? "—"} />
      <MetricCard label="Avg first response (min)" value={data.averageFirstResponseMinutes ?? "—"} />
      <MetricCard label="Avg resolution (min)" value={data.averageResolutionMinutes ?? "—"} />
      <MetricCard
        label="By category"
        value={data.byCategory?.length ? data.byCategory.map((r) => `${r._id}: ${r.count}`).join(", ") : "—"}
        hint="Ticket counts"
      />
    </div>
  );
}

function Definitions({ definitions, section, data }) {
  if (!definitions || typeof definitions !== "object") return null;

  let keys = Object.keys(definitions).filter((key) => {
    if (section === "revenue") return key.toLowerCase().includes("revenue") || key.toLowerCase().includes("payment");
    if (section === "subscriptions") return key.toLowerCase().includes("subscription") || key.toLowerCase().includes("trial");
    if (section === "acquisition") return key.toLowerCase().includes("registration") || key.toLowerCase().includes("owner");
    if (section === "engagement") return key.toLowerCase().includes("attendance") || key.toLowerCase().includes("salary");
    if (section === "support") return key.toLowerCase().includes("ticket") || key.toLowerCase().includes("support");
    return true;
  });

  if (!keys.length) keys = Object.keys(definitions).slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Definitions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {keys.map((key) => (
          <div key={key}>
            <p className="text-sm font-medium text-ink">{titleCase(key)}</p>
            <p className="text-sm text-muted">{definitions[key]}</p>
          </div>
        ))}
        {section === "support" && data.byPriority?.length ? (
          <motionPriority rows={data.byPriority} />
        ) : null}
      </CardContent>
    </Card>
  );
}

function motionPriority({ rows }) {
  return (
    <div>
      <p className="text-sm font-medium text-ink">By priority</p>
      <ul className="mt-1 text-sm text-muted">
        {rows.map((row) => (
          <li key={row._id}>
            {titleCase(row._id)}: {row.count}
          </li>
        ))}
      </ul>
    </div>
  );
}