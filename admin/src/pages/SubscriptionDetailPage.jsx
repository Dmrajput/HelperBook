import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/adminApi";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { PermissionGate } from "@/components/PermissionGate";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatDate, formatDateTime, formatINR, titleCase } from "@/lib/utils";

export default function SubscriptionDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [action, setAction] = useState(null);
  const [trialDays, setTrialDays] = useState("7");
  const [assignPlan, setAssignPlan] = useState({ planId: "starter", billingInterval: "monthly", complimentary: false });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["subscription", id],
    queryFn: () => adminApi.subscription(id),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["subscription", id] });

  const recoveryMutation = useMutation({
    mutationFn: (reason) =>
      adminApi.subscriptionRecovery(id, { extendTrialDays: Number(trialDays), reason }),
    onSuccess: () => {
      invalidate();
      setAction(null);
    },
  });

  const assignMutation = useMutation({
    mutationFn: (reason) =>
      adminApi.assignPlan(id, {
        planId: assignPlan.planId,
        billingInterval: assignPlan.billingInterval,
        complimentary: assignPlan.complimentary,
        reason,
      }),
    onSuccess: () => {
      invalidate();
      setAction(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (reason) => adminApi.cancelRenewal(id, { reason }),
    onSuccess: () => {
      invalidate();
      setAction(null);
    },
  });

  const sub = data?.subscription;
  const subId = sub?._id ? String(sub._id) : id;

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading || !sub) return <p className="text-sm text-muted">Loading subscription…</p>;

  const pending =
    action === "trial"
      ? recoveryMutation.isPending
      : action === "assign"
        ? assignMutation.isPending
        : action === "cancel"
          ? cancelMutation.isPending
          : false;

  return (
    <div>
      <PageHeader
        title={data.shop?.name || "Subscription"}
        description={`${sub.planId} · ${titleCase(sub.billingInterval || "monthly")}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <PermissionGate permission="subscriptions.update">
              {sub.isTrial && sub.status === "trialing" ? (
                <Button variant="secondary" onClick={() => setAction("trial")}>
                  Extend trial
                </Button>
              ) : null}
              <Button variant="secondary" onClick={() => setAction("assign")}>
                Assign plan
              </Button>
              {!sub.cancelAtPeriodEnd ? (
                <Button variant="danger" onClick={() => setAction("cancel")}>
                  Cancel renewal
                </Button>
              ) : null}
            </PermissionGate>
          </div>
        }
      />

      <motionGrid>
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <StatusBadge status={sub.status} />
              {sub.isTrial ? " · Trial" : ""}
            </p>
            <p>Source {sub.source || "—"}</p>
            <p>Period ends {formatDate(sub.currentPeriodEnd || sub.trialEndsAt)}</p>
            {sub.cancelAtPeriodEnd ? <p className="text-warning">Renewal cancelled at period end</p> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Company</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {data.shop ? (
              <Link to={`/companies/${data.shop.id}`} className="font-medium text-brand hover:underline">
                {data.shop.name}
              </Link>
            ) : (
              "—"
            )}
            <p className="mt-1 text-muted">Owner {data.shop?.owner || "—"}</p>
          </CardContent>
        </Card>
      </motionGrid>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 divide-y divide-border overflow-y-auto p-0">
            {(data.history || []).map((row) => (
              <div key={row.id} className="px-5 py-2 text-sm">
                <p className="font-medium">{titleCase(row.eventType)}</p>
                <p className="text-muted">
                  {row.toPlanId || "—"} · {formatDateTime(row.createdAt)}
                </p>
              </div>
            ))}
            {!data.history?.length ? <p className="px-5 py-4 text-sm text-muted">No history</p> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {(data.payments || []).map((payment) => (
              <Link
                key={payment.id}
                to={`/payments/${payment.id}`}
                className="flex justify-between px-5 py-2 text-sm hover:bg-slate-50"
              >
                <span>
                  <StatusBadge status={payment.status} /> {payment.refundStatus !== "none" ? `· Refund ${payment.refundStatus}` : ""}
                </span>
                <span>{formatINR(payment.amount)}</span>
              </Link>
            ))}
            {!data.payments?.length ? <p className="px-5 py-4 text-sm text-muted">No payments</p> : null}
          </CardContent>
        </Card>
      </section>

      {action === "trial" ? (
        <Card className="mt-4">
          <CardContent className="flex flex-wrap items-end gap-3 pt-5">
            <div>
              <Label>Extend by (days)</Label>
              <Input type="number" min={1} max={14} value={trialDays} onChange={(e) => setTrialDays(e.target.value)} className="w-24" />
            </div>
            <Button onClick={() => setAction("trial-confirm")}>Continue</Button>
            <Button variant="secondary" onClick={() => setAction(null)}>
              Cancel
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {action === "assign" ? (
        <Card className="mt-4">
          <CardContent className="grid gap-3 pt-5 sm:grid-cols-3">
            <div>
              <Label>Plan</Label>
              <Select value={assignPlan.planId} onChange={(e) => setAssignPlan({ ...assignPlan, planId: e.target.value })}>
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="business">Business</option>
                <option value="pro">Pro</option>
              </Select>
            </div>
            <div>
              <Label>Billing</Label>
              <Select
                value={assignPlan.billingInterval}
                onChange={(e) => setAssignPlan({ ...assignPlan, billingInterval: e.target.value })}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={assignPlan.complimentary}
                  onChange={(e) => setAssignPlan({ ...assignPlan, complimentary: e.target.checked })}
                />
                Complimentary
              </label>
              <Button onClick={() => setAction("assign-confirm")}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <ConfirmDialog
        open={action === "trial-confirm"}
        onClose={() => setAction("trial")}
        title="Extend trial"
        description={`Extends trial by ${trialDays} day(s) for subscription ${subId}.`}
        confirmLabel="Extend trial"
        loading={pending}
        onConfirm={(reason) => recoveryMutation.mutateAsync(reason)}
      />

      <ConfirmDialog
        open={action === "assign-confirm"}
        onClose={() => setAction("assign")}
        title="Assign plan"
        description={`Assign ${assignPlan.planId} (${assignPlan.billingInterval})${assignPlan.complimentary ? " as complimentary" : ""}.`}
        confirmLabel="Assign plan"
        loading={pending}
        onConfirm={(reason) => assignMutation.mutateAsync(reason)}
      />

      <ConfirmDialog
        open={action === "cancel"}
        onClose={() => setAction(null)}
        title="Cancel renewal"
        description="Stops automatic renewal at the end of the current period."
        confirmLabel="Cancel renewal"
        danger
        loading={pending}
        onConfirm={(reason) => cancelMutation.mutateAsync(reason)}
      />
    </div>
  );
}

function motionGrid({ children }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}