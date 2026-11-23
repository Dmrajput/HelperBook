import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/adminApi";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { PermissionGate } from "@/components/PermissionGate";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDateTime, formatINR } from "@/lib/utils";

export default function PaymentDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [refundOpen, setRefundOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["payment", id],
    queryFn: () => adminApi.payment(id),
  });

  const refundMutation = useMutation({
    mutationFn: (reason) => adminApi.refund(id, { reason }),
    onSuccess: (result) => {
      setNotice(result.message || `Refund status: ${result.refundStatus}`);
      queryClient.invalidateQueries({ queryKey: ["payment", id] });
      setRefundOpen(false);
    },
  });

  const payment = data?.payment;
  const isManual = !payment?.razorpayPaymentId;

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading || !payment) return <p className="text-sm text-muted">Loading payment…</p>;

  return (
    <div>
      <PageHeader
        title={formatINR(payment.amount)}
        description={`${payment.planId} · ${payment.billingInterval}`}
        actions={
          <PermissionGate permission="payments.refund">
            {payment.status === "paid" && payment.refundStatus !== "processed" && payment.refundStatus !== "pending" ? (
              <Button variant="danger" onClick={() => setRefundOpen(true)}>
                Request refund
              </Button>
            ) : null}
          </PermissionGate>
        }
      />

      {notice ? <p className="mb-4 text-sm text-success">{notice}</p> : null}

      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge status={payment.status} />
        <StatusBadge status={payment.refundStatus} />
        <Badge tone={isManual ? "warning" : "info"}>{isManual ? "Manual" : "Razorpay"}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Paid {payment.paidAt ? formatDateTime(payment.paidAt) : "—"}</p>
            <p>Created {formatDateTime(payment.createdAt)}</p>
            {payment.listAmount != null && payment.listAmount !== payment.amount ? (
              <p>
                List {formatINR(payment.listAmount)} · Discount {formatINR(payment.discount)}
              </p>
            ) : null}
            {payment.couponCode ? <p>Coupon {payment.couponCode}</p> : null}
            {payment.refundReason ? <p className="text-muted">Refund reason: {payment.refundReason}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isManual ? "Manual entry" : "Provider"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {isManual ? (
              <p>Recorded manually by an admin — not verified through Razorpay.</p>
            ) : (
              <>
                <p>Order {payment.razorpayOrderId || "—"}</p>
                <p>Payment ID {payment.razorpayPaymentId || "Not captured"}</p>
                {payment.providerRefundId ? <p>Provider refund {payment.providerRefundId}</p> : null}
              </>
            )}
          </CardContent>
        </Card>

        {data.shop ? (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Company</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <Link to={`/companies/${data.shop.id}`} className="font-medium text-brand hover:underline">
                {data.shop.name}
              </Link>
              <p className="text-muted">Owner {data.shop.owner}</p>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <ConfirmDialog
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        title={`Refund ${formatINR(payment.amount)}`}
        description={
          isManual
            ? "Manual payments are marked requested; Razorpay refunds apply only when a provider payment ID exists."
            : "The payment stays paid until the provider confirms the refund."
        }
        confirmLabel="Request refund"
        danger
        loading={refundMutation.isPending}
        onConfirm={(reason) => refundMutation.mutateAsync(reason)}
      />
    </div>
  );
}