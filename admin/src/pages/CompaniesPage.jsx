import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/adminApi";
import { DataTable } from "@/components/DataTable";
import { ErrorState } from "@/components/ErrorState";
import { FilterBar } from "@/components/FilterBar";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useQueryParams } from "@/hooks/useQueryParams";
import { formatDate, toSearchParams } from "@/lib/utils";

const DEFAULTS = { page: "1", limit: "20", search: "", status: "", planId: "" };

export default function CompaniesPage() {
  const navigate = useNavigate();
  const [params, setParams] = useQueryParams(DEFAULTS);
  const search = useDebouncedValue(params.search, 350);
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 20;

  const queryString = useMemo(
    () =>
      toSearchParams({
        page,
        limit,
        search: search || undefined,
        status: params.status || undefined,
        planId: params.planId || undefined,
      }),
    [page, limit, search, params.status, params.planId]
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["shops", queryString],
    queryFn: () => adminApi.shops(queryString),
  });

  return (
    <div>
      <PageHeader title="Companies" description="Shops on the platform — subscription and access status." />

      <FilterBar>
        <FilterField label="Search" className="min-w-[220px] flex-1">
          <Input
            placeholder="Name, owner, or city"
            value={params.search}
            onChange={(e) => setParams({ search: e.target.value, page: "1" })}
          />
        </FilterField>
        <FilterField label="Access" className="w-40">
          <Select value={params.status} onChange={(e) => setParams({ status: e.target.value, page: "1" })}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </Select>
        </FilterField>
        <FilterField label="Plan" className="w-40">
          <Select value={params.planId} onChange={(e) => setParams({ planId: e.target.value, page: "1" })}>
            <option value="">All plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="business">Business</option>
            <option value="pro">Pro</option>
          </Select>
        </FilterField>
      </FilterBar>

      {error ? <ErrorState message={error.message} onRetry={refetch} /> : null}

      <DataTable
        columns={[
          { key: "name", header: "Company", className: "font-medium" },
          { key: "owner", header: "Owner" },
          { key: "city", header: "City" },
          { key: "planId", header: "Plan", cell: (row) => row.planId || "—" },
          {
            key: "subscriptionStatus",
            header: "Subscription",
            cell: (row) => (row.subscriptionStatus ? <StatusBadge status={row.subscriptionStatus} /> : "—"),
          },
          {
            key: "employees",
            header: "Employees",
            cell: (row) =>
              row.employeeLimit != null ? `${row.activeEmployees}/${row.employeeLimit}` : row.activeEmployees,
          },
          {
            key: "status",
            header: "Access",
            cell: (row) => <StatusBadge status={row.status} />,
          },
          { key: "createdAt", header: "Registered", cell: (row) => formatDate(row.createdAt) },
        ]}
        rows={data?.shops || []}
        loading={isLoading}
        page={page}
        limit={limit}
        total={data?.total || 0}
        onPageChange={(next) => setParams({ page: String(next) })}
        onRowClick={(row) => navigate(`/companies/${row.id}`)}
        emptyTitle="No companies found"
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