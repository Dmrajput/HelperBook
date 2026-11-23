import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/adminApi";
import { DataTable } from "@/components/DataTable";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { PermissionGate } from "@/components/PermissionGate";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatINR } from "@/lib/utils";

const emptyForm = {
  code: "",
  discountType: "percentage",
  discountValue: 10,
  startsAt: "",
  expiresAt: "",
};

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["coupons"],
    queryFn: () => adminApi.coupons(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      adminApi.createCoupon({
        ...form,
        discountValue: Number(form.discountValue),
        applicablePlanIds: ["starter", "business", "pro"],
        applicableBillingIntervals: ["monthly"],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      setForm(emptyForm);
    },
  });

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const rows = (data?.coupons || []).map((coupon) => ({ ...coupon, id: coupon.id || coupon._id }));

  return (
    <div>
      <PageHeader
        title="Coupons"
        description="Promotional codes for paid plans."
        actions={
          <Link to="/settings" className="text-sm font-medium text-brand hover:underline">
            Back to settings
          </Link>
        }
      />

      <DataTable
        columns={[
          { key: "code", header: "Code", className: "font-medium" },
          {
            key: "discountValue",
            header: "Discount",
            cell: (row) =>
              row.discountType === "percentage" ? `${row.discountValue}%` : formatINR(row.discountValue),
          },
          { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
          { key: "redemptions", header: "Used" },
        ]}
        rows={rows}
        loading={isLoading}
        page={1}
        limit={rows.length || 20}
        total={rows.length}
        emptyTitle="No coupons yet"
      />

      <PermissionGate permission="coupons.create">
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Create coupon</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid max-w-xl gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
            >
              <Field label="Code">
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
              </Field>
              <Field label="Discount type">
                <Select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed rupees</option>
                </Select>
              </Field>
              <Field label="Discount value">
                <Input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                  required
                />
              </Field>
              <Field label="Starts">
                <Input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  required
                />
              </Field>
              <Field label="Expires" className="sm:col-span-2">
                <Input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  required
                />
              </Field>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating…" : "Create coupon"}
                </Button>
                {createMutation.error ? <p className="mt-2 text-sm text-danger">{createMutation.error.message}</p> : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </PermissionGate>
    </div>
  );
}

function Field({ label, children, className }) {
  return (
    <div className={className}>
      <Label className="mb-1 block">{label}</Label>
      {children}
    </div>
  );
}