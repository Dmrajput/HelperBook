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

const DEFAULTS = { page: "1", limit: "20", search: "", status: "" };

export default function OwnersPage() {
  const navigate = useNavigate();
  const [params, setParams] = useQueryParams(DEFAULTS);
  const search = useDebouncedValue(params.search, 350);
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 20;

  const queryString = useMemo(
    () => toSearchParams({ page, limit, search: search || undefined, status: params.status || undefined }),
    [page, limit, search, params.status]
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["users", queryString],
    queryFn: () => adminApi.users(queryString),
  });

  return (
    <div>
      <PageHeader title="Owners" description="Shop owner accounts — distinct from company access suspension." />

      <FilterBar>
        <FilterField label="Search" className="min-w-[220px] flex-1">
          <Input
            placeholder="Name or phone"
            value={params.search}
            onChange={(e) => setParams({ search: e.target.value, page: "1" })}
          />
        </FilterField>
        <FilterField label="Status" className="w-40">
          <Select value={params.status} onChange={(e) => setParams({ status: e.target.value, page: "1" })}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </Select>
        </FilterField>
      </FilterBar>

      {error ? <ErrorState message={error.message} onRetry={refetch} /> : null}

      <DataTable
        columns={[
          { key: "name", header: "Owner", className: "font-medium" },
          { key: "phone", header: "Phone" },
          { key: "shopName", header: "Company", cell: (row) => row.shopName || "—" },
          { key: "planId", header: "Plan", cell: (row) => row.planId || "—" },
          {
            key: "subscriptionStatus",
            header: "Subscription",
            cell: (row) => (row.subscriptionStatus ? <StatusBadge status={row.subscriptionStatus} /> : "—"),
          },
          { key: "status", header: "Account", cell: (row) => <StatusBadge status={row.status} /> },
          { key: "createdAt", header: "Registered", cell: (row) => formatDate(row.createdAt) },
        ]}
        rows={data?.users || []}
        loading={isLoading}
        page={page}
        limit={limit}
        total={data?.total || 0}
        onPageChange={(next) => setParams({ page: String(next) })}
        onRowClick={(row) => navigate(`/owners/${row.id}`)}
        emptyTitle="No owners found"
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