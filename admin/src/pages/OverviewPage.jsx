import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { adminApi } from "@/api/adminApi";
import { DataTable } from "@/components/DataTable";
import { ErrorState } from "@/components/ErrorState";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatDate, formatDateTime, formatINR, titleCase, toSearchParams } from "@/lib/utils";

const BRAND = "#4F46E5";
const RANGE_OPTIONS = [
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "this_month", label: "This month" },
  { value: "custom", label: "Custom range" },
];

const PLAN_COLORS = ["#4F46E5", "#6366F1", "#818CF8", "#A5B4FC", "#C7D2FE", "#312E81"];

function rangeQuery(range, startDate, endDate) {
  if (range === "custom") {
    return toSearchParams({ range: "custom", startDate, endDate });
  }
  return `range=${range}`;
}

function mergeTrendSeries(registrations = [], shops = []) {
  const map = new Map();
  registrations.forEach((row) => {
    map.set(row._id, { day: row._id, registrations: row.count, companies: 0 });
  });
  shops.forEach((row) => {
    const existing = map.get(row._id) || { day: row._id, registrations: 0, companies: 0 };
    existing.companies = row.count;
    map.set(row._id, existing);
  });
  return [...map.values()].sort((a, b) => a.day.localeCompare(b.day));
}

export default function OverviewPage() {
  const navigate = useNavigate();
  const [range, setRange] = useState("last_30_days");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const queryKey = range === "custom" ? `${range}-${startDate}-${endDate}` : range;
  const qs = rangeQuery(range, startDate, endDate);
  const customReady = range !== "custom" || (startDate && endDate);

  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary", queryKey],
    queryFn: () => adminApi.summary(qs),
    enabled: customReady,
  });

  const trendsQuery = useQuery({
    queryKey: ["dashboard", "trends", queryKey],
    queryFn: () => adminApi.trends(qs),
    enabled: customReady,
  });

  const attentionQuery = useQuery({
    queryKey: ["dashboard", "attention"],
    queryFn: () => adminApi.attention(),
  });

  const shopsQuery = useQuery({
    queryKey: ["shops", "recent"],
    queryFn: () => adminApi.shops("limit=5&page=1"),
  });

  const chartData = useMemo(
    () => mergeTrendSeries(trendsQuery.data?.registrations, trendsQuery.data?.shops),
    [trendsQuery.data]
  );

  const planDonut = useMemo(
    () =>
      (trendsQuery.data?.plans || []).map((row) => ({
        name: titleCase(row._id || "unknown"),
        value: row.count,
        planId: row._id,
      })),
    [trendsQuery.data]
  );

  const summary = summaryQuery.data;
  const attention = attentionQuery.data;
  const loading = summaryQuery.isLoading || trendsQuery.isLoading;
  const error = summaryQuery.error || trendsQuery.error;

  function retry() {
    summaryQuery.refetch();
    trendsQuery.refetch();
    attentionQuery.refetch();
  }

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Platform health, growth, and items that need your attention."
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <RangeSelect label="Range" value={range} onChange={setRange} options={RANGE_OPTIONS} />
            {range === "custom" ? (
              <>
                <div>
                  <Label className="mb-1 block text-xs text-muted">From</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted">To</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </>
            ) : null}
          </div>
        }
      />

      {error ? <ErrorState message={error.message} onRetry={retry} /> : null}

      {summary ? (
        <>
          <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            <MetricCard label="Companies (active)" value={summary.snapshot?.activeCompanies ?? "—"} />
            <MetricCard label="Owners" value={summary.owners ?? "—"} />
            <MetricCard label="Employees" value={summary.snapshot?.activeEmployees ?? "—"} />
            <MetricCard label="MRR" value={formatINR(summary.snapshot?.mrr ?? summary.mrr)} hint="Monthly recurring revenue" />
            <MetricCard label="Paid subs" value={summary.snapshot?.activePaidSubscriptions ?? "—"} />
            <MetricCard label="Trials" value={summary.snapshot?.activeTrials ?? "—"} />
            <MetricCard label="New companies" value={summary.period?.newCompanies ?? "—"} hint="In selected range" />
            <MetricCard label="New registrations" value={summary.period?.newRegistrations ?? "—"} />
            <MetricCard label="Revenue collected" value={formatINR(summary.period?.capturedRevenue)} />
            <MetricCard label="Open tickets" value={summary.snapshot?.openTickets ?? "—"} />
          </section>

          <div className="mb-6 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Registrations & new companies</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted">Loading chart…</p>
                ) : chartData.length ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="registrations" name="Owner registrations" stroke={BRAND} fill={BRAND} fillOpacity={0.2} />
                      <Area type="monotone" dataKey="companies" name="New companies" stroke="#818CF8" fill="#818CF8" fillOpacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted">No trend data for this range.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Plan distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {planDonut.length ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={planDonut} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                        {planDonut.map((entry, index) => (
                          <Cell key={entry.planId} fill={PLAN_COLORS[index % PLAN_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted">No subscription plans to show.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Recent companies</h2>
            <Link to="/companies" className="inline-flex items-center text-sm font-medium text-brand hover:underline">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <DataTable
            columns={[
              { key: "name", header: "Company" },
              { key: "planId", header: "Plan", cell: (row) => row.planId || "—" },
              {
                key: "status",
                header: "Status",
                cell: (row) => <StatusBadge status={row.status} />,
              },
              {
                key: "createdAt",
                header: "Registered",
                cell: (row) => formatDate(row.createdAt),
              },
            ]}
            rows={shopsQuery.data?.shops || []}
            loading={shopsQuery.isLoading}
            page={1}
            limit={5}
            total={shopsQuery.data?.total || 0}
            onRowClick={(row) => navigate(`/companies/${row.id}`)}
            emptyTitle="No companies yet"
          />
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h2 className="text-lg font-semibold text-ink">Needs attention</h2>
          </div>
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {!attention && attentionQuery.isLoading ? (
                <p className="p-4 text-sm text-muted">Loading…</p>
              ) : (
                <>
                  <AttentionBlock title="Expiring soon" items={attention?.expiringSubscriptions} render={(item) => (
                    <Link to={`/companies/${item.shopId}`} className="text-sm font-medium text-brand hover:underline">
                      {item.shopName} · {item.planId} · {formatDate(item.endsAt)}
                    </Link>
                  )} />
                  <AttentionBlock title="Failed payments" items={attention?.failedPayments} render={(item) => (
                    <span className="text-sm">
                      {item.shopName} · {formatINR(item.amount)} · {formatDate(item.createdAt)}
                    </span>
                  )} />
                  <AttentionBlock title="Near employee limit" items={attention?.nearLimitCompanies} render={(item) => (
                    <Link to={`/companies/${item.id}`} className="text-sm text-brand hover:underline">
                      {item.name} · {item.activeEmployees}/{item.employeeLimit} on {item.planId}
                    </Link>
                  )} />
                  <AttentionBlock title="Suspended companies" items={attention?.suspendedCompanies} render={(item) => (
                    <Link to={`/companies/${item.id}`} className="text-sm text-brand hover:underline">
                      {item.name}
                    </Link>
                  )} />
                </>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-ink">Recent admin activity</h2>
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {(attention?.recentAdminActivity || []).length ? (
                attention?.recentAdminActivity.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-ink">{titleCase(row.action)}</p>
                      <p className="text-muted">
                        {row.adminName || "Admin"} · {row.resourceType}
                        {row.reason ? ` · ${row.reason}` : ""}
                      </p>
                    </div>
                    <span className="text-xs text-muted">{formatDateTime(row.createdAt)}</span>
                  </li>
                ))
              ) : (
                <li className="px-4 py-6 text-sm text-muted">No recent admin actions.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function AttentionBlock({ title, items, render }) {
  if (!items?.length) return null;
  return (
    <div className="p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <ul className="space-y-2">
        {items.slice(0, 5).map((item) => (
          <li key={item.id}>{render(item)}</li>
        ))}
      </ul>
    </div>
  );
}

function RangeSelect({ label, value, onChange, options }) {
  return (
    <div>
      <Label className="mb-1 block text-xs text-muted">{label}</Label>
      <Select value={value} onChange={(e) => onChange(e.target.value)} className="min-w-[160px]">
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}