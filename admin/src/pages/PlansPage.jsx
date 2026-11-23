import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/adminApi";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { PermissionGate } from "@/components/PermissionGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatINR } from "@/lib/utils";

const emptyEdit = {
  planId: "",
  monthlyPrice: "",
  monthlyDiscountPrice: "",
  yearlyPrice: "",
  yearlyDiscountPrice: "",
  employeeLimit: "",
};

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [edit, setEdit] = useState(emptyEdit);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["plan-pricing"],
    queryFn: () => adminApi.planPricing(),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      adminApi.updatePlanPricing(edit.planId, {
        monthlyPrice: Number(edit.monthlyPrice),
        monthlyDiscountPrice: edit.monthlyDiscountPrice === "" ? null : Number(edit.monthlyDiscountPrice),
        yearlyPrice: edit.yearlyPrice === "" ? null : Number(edit.yearlyPrice),
        yearlyDiscountPrice: edit.yearlyDiscountPrice === "" ? null : Number(edit.yearlyDiscountPrice),
        employeeLimit: Number(edit.employeeLimit),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan-pricing"] });
      setEdit(emptyEdit);
    },
  });

  function startEdit(plan) {
    setEdit({
      planId: plan.planId,
      monthlyPrice: String(plan.monthlyPrice ?? ""),
      monthlyDiscountPrice:
        plan.monthlyDiscountPrice == null ? "" : String(plan.monthlyDiscountPrice),
      yearlyPrice: plan.yearlyPrice == null ? "" : String(plan.yearlyPrice),
      yearlyDiscountPrice: plan.yearlyDiscountPrice == null ? "" : String(plan.yearlyDiscountPrice),
      employeeLimit: String(plan.employeeLimit ?? ""),
    });
  }

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div>
      <PageHeader
        title="Plans"
        description="Regular and discounted prices shown to shop owners at checkout."
      />

      {isLoading ? <p className="text-sm text-muted">Loading plan pricing…</p> : null}

      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Plan</TH>
                <TH>Employees</TH>
                <TH>Monthly</TH>
                <TH>Yearly</TH>
                <TH>Shown in app</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {(data?.plans || []).map((plan) => (
                <TR key={plan.planId}>
                  <TD>
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-xs text-muted">{plan.planId}</p>
                  </TD>
                  <TD>{plan.employeeLimit}</TD>
                  <TD>
                    {plan.hasMonthlyDiscount ? (
                      <>
                        <span className="text-muted line-through">{formatINR(plan.monthlyPrice)}</span>{" "}
                        {formatINR(plan.effectiveMonthlyPrice)}
                      </>
                    ) : (
                      formatINR(plan.effectiveMonthlyPrice)
                    )}
                  </TD>
                  <TD>
                    {plan.effectiveYearlyPrice == null
                      ? "Not offered"
                      : plan.hasYearlyDiscount
                        ? (
                          <>
                            <span className="text-muted line-through">{formatINR(plan.yearlyPrice)}</span>{" "}
                            {formatINR(plan.effectiveYearlyPrice)}
                          </>
                        )
                        : formatINR(plan.effectiveYearlyPrice)}
                  </TD>
                  <TD className="text-sm text-muted">
                    {plan.planId === "free"
                      ? "Free"
                      : `${formatINR(plan.effectiveMonthlyPrice)}/mo${plan.hasMonthlyDiscount ? " (discounted)" : ""}`}
                  </TD>
                  <TD>
                    <PermissionGate permission="subscriptions.update">
                      {plan.planId !== "free" ? (
                        <Button size="sm" variant="secondary" onClick={() => startEdit(plan)}>
                          Edit
                        </Button>
                      ) : null}
                    </PermissionGate>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      {edit.planId ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Edit {edit.planId}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
            >
              <Field label="Regular monthly price (₹)">
                <Input type="number" min={1} required value={edit.monthlyPrice} onChange={(e) => setEdit({ ...edit, monthlyPrice: e.target.value })} />
              </Field>
              <Field label="Discount monthly (optional)">
                <Input type="number" min={1} value={edit.monthlyDiscountPrice} onChange={(e) => setEdit({ ...edit, monthlyDiscountPrice: e.target.value })} />
              </Field>
              <Field label="Regular yearly (optional)">
                <Input type="number" min={1} value={edit.yearlyPrice} onChange={(e) => setEdit({ ...edit, yearlyPrice: e.target.value })} />
              </Field>
              <Field label="Discount yearly (optional)">
                <Input type="number" min={1} value={edit.yearlyDiscountPrice} onChange={(e) => setEdit({ ...edit, yearlyDiscountPrice: e.target.value })} />
              </Field>
              <Field label="Employee limit">
                <Input type="number" min={1} max={500} required value={edit.employeeLimit} onChange={(e) => setEdit({ ...edit, employeeLimit: e.target.value })} />
              </Field>
              <div className="flex items-end gap-2 sm:col-span-2">
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving…" : "Save prices"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setEdit(emptyEdit)}>
                  Cancel
                </Button>
                {saveMutation.error ? <p className="text-sm text-danger">{saveMutation.error.message}</p> : null}
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      {children}
    </div>
  );
}