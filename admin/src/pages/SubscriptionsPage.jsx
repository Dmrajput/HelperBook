import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/adminApi";
import { DataTable } from "@/components/DataTable";
import { ErrorState } from "@/components/ErrorState";
import { FilterBar } from "@/components/FilterBar";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useQueryParams } from "@/hooks/useQueryParams";
import { formatDate, formatINR, toSearchParams } from "@/lib/utils";

const DEFAULTS = { page: "1", limit: "20", status: "", planId: "" };

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useQueryParams(DEFAULTS);
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 20;

  const queryString = useMemo(
    () =>
      toSearchParams({
        page,
        limit,
        status: params.status || undefined,
        planId: params.planId || undefined,
      }),
    [page, limit, params.status, params.planId]
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["subscriptions", queryString],
    queryFn: () => adminApi.subscriptions(queryString),
  });

  return (
    <div>
      <PageHeader title="Subscriptions" description="Billing status across companies." />

      <FilterBar>
        <FilterField label="Plan" className="w-40">
          <Select value={params.planId} onChange={(e) => setParams({ planId: e.target.value, page: "1" })}>
            <option value="">All</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="business">Business</option>
            <option value="pro">Pro</option>
          </Select>
        </FilterField>
        <FilterField label="Status" className="w-44">
          <Select value={params.status} onChange={(e) => setParams({ status: e.target.value, page: "1" })}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="expired">Expired</option>
            <option value="past_due">Past due</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </FilterField>
      </FilterBar>

      {error ? <ErrorState message={error.message} onRetry={refetch} /> : null}

      <DataTable
        columns={[
          { key: "shop", header: "Company", className: "font-medium" },
          { key: "owner", header: "Owner" },
          { key: "planId", header: "Plan" },
          { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
          { key: "isTrial", header: "Trial", cell: (row) => (row.isTrial ? "Yes" : "No") },
          {
            key: "employees",
            header: "Employees",
            cell: (row) =>
              row.employeeLimit != null ? `${row.activeEmployees}/${row.employeeLimit}` : row.activeEmployees,
          },
          { key: "amount", header: "Amount", cell: (row) => formatINR(row.amount) },
          {
            key: "renewal",
            header: "Renews",
            cell: (row) => formatDate(row.currentPeriodEnd || row.trialEndsAt),
          },
        ]}
        rows={data?.subscriptions || []}
        loading={isLoading}
        page={page}
        limit={limit}
        total={data?.total || 0}
        onPageChange={(next) => setParams({ page: String(next) })}
        onRowClick={(row) => navigate(`/subscriptions/${row.id}`)}
        emptyTitle="No subscriptions"
      />
    </div>
  );
}

function FilterField({ label, children, className }) {
  return (
    <div className={className}>
      <Label className="mb-1 block text-xs text-muted">{label}</Label>
      {children}
    </div>
  );
}