import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/adminApi";
import { DataTable } from "@/components/DataTable";
import { ErrorState } from "@/components/ErrorState";
import { FilterBar } from "@/components/FilterBar";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useQueryParams } from "@/hooks/useQueryParams";
import { formatDate, toSearchParams } from "@/lib/utils";

const DEFAULTS = { page: "1", limit: "20", search: "", status: "", shopId: "" };

export default function EmployeesPage() {
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
        shopId: params.shopId || undefined,
      }),
    [page, limit, search, params.status, params.shopId]
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["employees", queryString],
    queryFn: () => adminApi.employees(queryString),
  });

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Platform view only — salary and advances are not shown here."
      />

      <FilterBar>
        <FilterField label="Search" className="min-w-[200px] flex-1">
          <Input
            placeholder="Employee name"
            value={params.search}
            onChange={(e) => setParams({ search: e.target.value, page: "1" })}
          />
        </FilterField>
        <FilterField label="Company ID" className="w-48">
          <Input
            placeholder="Shop ObjectId"
            value={params.shopId}
            onChange={(e) => setParams({ shopId: e.target.value, page: "1" })}
          />
        </FilterField>
        <FilterField label="Status" className="w-36">
          <Select value={params.status} onChange={(e) => setParams({ status: e.target.value, page: "1" })}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </FilterField>
      </FilterBar>

      {error ? <ErrorState message={error.message} onRetry={refetch} /> : null}

      <DataTable
        columns={[
          { key: "name", header: "Employee", className: "font-medium" },
          { key: "shop", header: "Company" },
          { key: "role", header: "Role" },
          { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
          {
            key: "loginEnabled",
            header: "Login",
            cell: (row) => (
              <Badge tone={row.loginEnabled ? "success" : "default"}>{row.loginEnabled ? "Enabled" : "Disabled"}</Badge>
            ),
          },
          { key: "lastLoginAt", header: "Last login", cell: (row) => formatDate(row.lastLoginAt) },
        ]}
        rows={data?.employees || []}
        loading={isLoading}
        page={page}
        limit={limit}
        total={data?.total || 0}
        onPageChange={(next) => setParams({ page: String(next) })}
        onRowClick={(row) => navigate(`/employees/${row.id}`)}
        emptyTitle="No employees found"
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