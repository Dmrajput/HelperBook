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
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useQueryParams } from "@/hooks/useQueryParams";
import { formatDate, formatINR, toSearchParams, titleCase } from "@/lib/utils";

const DEFAULTS = { page: "1", limit: "20", status: "", range: "last_30_days" };

export default function PaymentsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useQueryParams(DEFAULTS);
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 20;

  const queryString = useMemo(
    () => toSearchParams({ page, limit, status: params.status || undefined, range: params.range || "last_30_days" }),
    [page, limit, params.status, params.range]
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["payments", queryString],
    queryFn: () => adminApi.payments(queryString),
  });

  return (
    <div>
      <PageHeader
        title="Payments"
        description="HelperBook subscription charges — not employee payroll."
      />

      <FilterBar>
        <FilterField label="Range" className="w-44">
          <Select value={params.range} onChange={(e) => setParams({ range: e.target.value, page: "1" })}>
            <option value="last_7_days">Last 7 days</option>
            <option value="last_30_days">Last 30 days</option>
            <option value="this_month">This month</option>
          </Select>
        </FilterField>
        <FilterField label="Status" className="w-40">
          <Select value={params.status} onChange={(e) => setParams({ status: e.target.value, page: "1" })}>
            <option value="">All</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </Select>
        </FilterField>
      </FilterBar>

      {error ? <ErrorState message={error.message} onRetry={refetch} /> : null}

      <DataTable
        columns={[
          { key: "createdAt", header: "Date", cell: (row) => formatDate(row.createdAt) },
          { key: "shopName", header: "Company" },
          { key: "planId", header: "Plan" },
          { key: "amount", header: "Amount", cell: (row) => formatINR(row.amount) },
          {
            key: "source",
            header: "Source",
            cell: (row) => (
              <Badge tone={row.source === "manual" ? "warning" : "info"}>{titleCase(row.source || "razorpay")}</Badge>
            ),
          },
          { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
          { key: "refundStatus", header: "Refund", cell: (row) => <StatusBadge status={row.refundStatus} /> },
        ]}
        rows={data?.payments || []}
        loading={isLoading}
        page={page}
        limit={limit}
        total={data?.total || 0}
        onPageChange={(next) => setParams({ page: String(next) })}
        onRowClick={(row) => navigate(`/payments/${row.id}`)}
        emptyTitle="No payments"
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