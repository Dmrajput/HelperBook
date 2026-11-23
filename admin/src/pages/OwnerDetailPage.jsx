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
import { formatDate, formatDateTime, formatINR } from "@/lib/utils";

export default function OwnerDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["user", id],
    queryFn: () => adminApi.user(id),
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, reason }) => adminApi.userStatus(id, { status, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      setDialog(null);
    },
  });

  const user = data?.user;

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading || !user) return <p className="text-sm text-muted">Loading owner…</p>;

  return (
    <div>
      <PageHeader
        title={user.name || "Owner"}
        description={`Phone ${user.phone}`}
        actions={
          <PermissionGate permission="users.suspend">
            {user.status === "active" ? (
              <Button variant="danger" onClick={() => setDialog("suspended")}>
                Suspend account
              </Button>
            ) : (
              <PermissionGate permission="users.update">
                <Button onClick={() => setDialog("active")}>Reactivate account</Button>
              </PermissionGate>
            )}
          </PermissionGate>
        }
      />

      <div className="mb-6">
        <StatusBadge status={user.status} />
        {user.suspensionReason ? <p className="mt-2 text-sm text-muted">Reason: {user.suspensionReason}</p> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Registered {formatDate(user.createdAt)}</p>
            <p>Last login {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Not recorded"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {data.shop ? (
              <>
                <p className="font-medium">{data.shop.name}</p>
                <p className="mt-1 text-muted">Access {data.shop.accessSuspended ? "suspended" : "active"}</p>
                <Link to={`/companies/${data.shop.id}`} className="mt-2 inline-block text-brand hover:underline">
                  Open company
                </Link>
              </>
            ) : (
              <p className="text-muted">No company yet.</p>
            )}
          </CardContent>
        </Card>

        {data.subscription ? (
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>
                {data.subscription.planId} · <StatusBadge status={data.subscription.status} />
              </p>
              {data.subscription.isTrial ? <p className="mt-1 text-muted">On trial</p> : null}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Recent payments</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {(data.payments || []).length ? (
              data.payments.map((payment) => (
                <Link
                  key={payment.id}
                  to={`/payments/${payment.id}`}
                  className="flex justify-between px-5 py-2 text-sm hover:bg-slate-50"
                >
                  <span>
                    {payment.planId} · <StatusBadge status={payment.status} />
                  </span>
                  <span>{formatINR(payment.amount)}</span>
                </Link>
              ))
            ) : (
              <p className="px-5 py-4 text-sm text-muted">No payments</p>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(dialog)}
        onClose={() => setDialog(null)}
        title={dialog === "suspended" ? "Suspend owner account" : "Reactivate owner account"}
        description="Suspension revokes owner sessions; company records remain."
        confirmLabel={dialog === "suspended" ? "Suspend" : "Reactivate"}
        danger={dialog === "suspended"}
        loading={statusMutation.isPending}
        onConfirm={(reason) => statusMutation.mutateAsync({ status: dialog, reason })}
      />
    </div>
  );
}