import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/adminApi";
import { DataTable } from "@/components/DataTable";
import { ErrorState } from "@/components/ErrorState";
import { FilterBar } from "@/components/FilterBar";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useQueryParams } from "@/hooks/useQueryParams";
import { formatDateTime, titleCase, toSearchParams } from "@/lib/utils";

const DEFAULTS = { page: "1", limit: "20", action: "", resourceType: "", resourceId: "" };

export default function AuditPage() {
  const [params, setParams] = useQueryParams(DEFAULTS);
  const action = useDebouncedValue(params.action, 350);
  const resourceId = useDebouncedValue(params.resourceId, 350);
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 20;

  const queryString = useMemo(
    () =>
      toSearchParams({
        page,
        limit,
        action: action || undefined,
        resourceType: params.resourceType || undefined,
        resourceId: resourceId || undefined,
      }),
    [page, limit, action, params.resourceType, resourceId]
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["audit", queryString],
    queryFn: () => adminApi.audit(queryString),
  });

  const rows = (data?.logs || []).map((log) => ({
    ...log,
    id: log.id || log._id,
  }));

  return (
    <div>
      <PageHeader title="Audit logs" description="Recorded admin actions with reasons." />

      <FilterBar>
        <FilterField label="Action" className="min-w-[180px] flex-1">
          <Input
            placeholder="e.g. shop.suspend"
            value={params.action}
            onChange={(e) => setParams({ action: e.target.value, page: "1" })}
          />
        </FilterField>
        <FilterField label="Resource type" className="w-40">
          <Input
            value={params.resourceType}
            onChange={(e) => setParams({ resourceType: e.target.value, page: "1" })}
            placeholder="shop"
          />
        </FilterField>
        <FilterField label="Resource ID" className="w-48">
          <Input
            value={params.resourceId}
            onChange={(e) => setParams({ resourceId: e.target.value, page: "1" })}
          />
        </FilterField>
      </FilterBar>

      {error ? <ErrorState message={error.message} onRetry={refetch} /> : null}

      <DataTable
        columns={[
          { key: "createdAt", header: "When", cell: (row) => formatDateTime(row.createdAt) },
          { key: "action", header: "Action", cell: (row) => titleCase(row.action) },
          { key: "resourceType", header: "Resource" },
          { key: "adminName", header: "Admin", cell: (row) => row.adminName || row.adminEmail || "—" },
          { key: "reason", header: "Reason", cell: (row) => row.reason || "—" },
        ]}
        rows={rows}
        loading={isLoading}
        page={page}
        limit={limit}
        total={data?.total || 0}
        onPageChange={(next) => setParams({ page: String(next) })}
        emptyTitle="No audit entries"
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