import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/adminApi";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { PermissionGate } from "@/components/PermissionGate";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { cn, formatDate, formatDateTime, formatINR, titleCase, toSearchParams } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "owners", label: "Owners" },
  { id: "employees", label: "Employees" },
  { id: "subscription", label: "Subscription" },
  { id: "payments", label: "Payments" },
  { id: "activity", label: "Activity" },
  { id: "notes", label: "Notes" },
];

export default function CompanyDetailPage() {
  const { id } = useParams();
  const { can } = useAdminAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("overview");
  const [statusDialog, setStatusDialog] = useState(null);
  const [notesDraft, setNotesDraft] = useState("");

  const shopQuery = useQuery({
    queryKey: ["shop", id],
    queryFn: () => adminApi.shop(id),
  });

  const shop = shopQuery.data?.shop;
  const owner = shopQuery.data?.owner;
  const subscription = shopQuery.data?.subscription;

  const employeesQuery = useQuery({
    queryKey: ["employees", "shop", id],
    queryFn: () => adminApi.employees(toSearchParams({ shopId: id, limit: 50, page: 1 })),
    enabled: tab === "employees",
  });

  const paymentsQuery = useQuery({
    queryKey: ["payments", "shop", id],
    queryFn: () => adminApi.payments(toSearchParams({ shopId: id, limit: 20, page: 1, range: "last_30_days" })),
    enabled: tab === "payments",
  });

  const auditQuery = useQuery({
    queryKey: ["audit", "shop", id],
    queryFn: () => adminApi.audit(toSearchParams({ resourceType: "shop", resourceId: id, limit: 30, page: 1 })),
    enabled: tab === "activity",
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, reason }) => adminApi.shopStatus(id, { status, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop", id] });
      setStatusDialog(null);
    },
  });

  const notesMutation = useMutation({
    mutationFn: (adminNotes) => adminApi.shopUpdate(id, { adminNotes, reason: "Updated admin notes" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop", id] });
    },
  });

  if (shopQuery.error) {
    return <ErrorState message={shopQuery.error.message} onRetry={shopQuery.refetch} />;
  }

  return (
    <div>
      <PageHeader
        title={shop?.name || "Company"}
        description={shop ? `${shop.businessType || "Business"} · ${shop.city || "—"}, ${shop.state || "—"}` : "Loading…"}
        actions={
          shop && can("shops.suspend") ? (
            <Button
              variant={shop.accessSuspended ? "default" : "danger"}
              onClick={() => setStatusDialog(shop.accessSuspended ? "active" : "suspended")}
            >
              {shop.accessSuspended ? "Reactivate company" : "Suspend company"}
            </Button>
          ) : null
        }
      />

      {shop ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={shop.accessSuspended ? "suspended" : "active"} />
          <span className="text-sm text-muted">Registered {formatDate(shop.createdAt)}</span>
        </div>
      ) : null}

      <nav className="mb-6 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition",
              tab === item.id ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"
            )}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {shopQuery.isLoading ? <p className="text-sm text-muted">Loading company…</p> : null}

      {tab === "overview" && shop ? (
        <motionGrid>
          <InfoCard title="Access">
            <p>{shop.accessSuspended ? "Suspended" : "Active"}</p>
            {shop.accessSuspensionReason ? <p className="mt-1 text-sm text-muted">Reason: {shop.accessSuspensionReason}</p> : null}
          </InfoCard>
          <InfoCard title="Workforce">
            <p>{shop.activeEmployees} active employees</p>
          </InfoCard>
          <InfoCard title="Subscription">
            {subscription ? (
              <>
                <p>
                  {subscription.planId} · <StatusBadge status={subscription.status} />
                </p>
                <p className="mt-1 text-sm text-muted">Renews {formatDate(subscription.currentPeriodEnd)}</p>
              </>
            ) : (
              <p className="text-muted">No subscription record</p>
            )}
          </InfoCard>
        </motionGrid>
      ) : null}

      {tab === "owners" && owner ? (
        <Card>
          <CardContent className="p-5">
            <p className="font-medium text-ink">{owner.name}</p>
            <p className="text-sm text-muted">{owner.phone}</p>
            <p className="mt-2">
              Account <StatusBadge status={owner.status} />
            </p>
            <Link to={`/owners/${owner.id}`} className="mt-3 inline-block text-sm font-medium text-brand hover:underline">
              Open owner profile
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {tab === "owners" && !owner ? <p className="text-sm text-muted">No owner linked.</p> : null}

      {tab === "employees" ? (
        <DataTable
          columns={[
            { key: "name", header: "Name" },
            { key: "role", header: "Role" },
            { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
          ]}
          rows={employeesQuery.data?.employees || []}
          loading={employeesQuery.isLoading}
          page={1}
          limit={50}
          total={employeesQuery.data?.total || 0}
          emptyTitle="No employees"
        />
      ) : null}

      {tab === "subscription" && subscription ? (
        <Card>
          <CardContent className="space-y-2 p-5 text-sm">
            <p>
              Plan <strong>{subscription.planId}</strong>
            </p>
            <p>
              Status <StatusBadge status={subscription.status} />
              {subscription.isTrial ? " · Trial" : ""}
            </p>
            <Link to={`/subscriptions/${subscription.id}`} className="text-brand hover:underline">
              Open subscription
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {tab === "payments" ? (
        <DataTable
          columns={[
            { key: "createdAt", header: "Date", cell: (row) => formatDate(row.createdAt) },
            { key: "planId", header: "Plan" },
            { key: "amount", header: "Amount", cell: (row) => formatINR(row.amount) },
            { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
          ]}
          rows={paymentsQuery.data?.payments || []}
          loading={paymentsQuery.isLoading}
          page={1}
          limit={20}
          total={paymentsQuery.data?.total || 0}
          emptyTitle="No payments"
        />
      ) : null}

      {tab === "activity" ? (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {(auditQuery.data?.logs || []).map((log) => (
              <div key={log.id} className="px-4 py-3 text-sm">
                <p className="font-medium">{titleCase(log.action)}</p>
                <p className="text-muted">
                  {log.adminName} · {log.reason || "—"} · {formatDateTime(log.createdAt)}
                </p>
              </div>
            ))}
            {!auditQuery.isLoading && !auditQuery.data?.logs?.length ? (
              <p className="px-4 py-6 text-sm text-muted">No audit entries for this company.</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {tab === "notes" ? (
        <PermissionGate permission="shops.update" fallback={<p className="text-sm text-muted">You cannot edit notes.</p>}>
          <Card>
            <CardHeader>
              <CardTitle>Admin notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <motionNotes
                value={notesDraft || shop?.adminNotes || ""}
                onChange={setNotesDraft}
                placeholder="Internal notes for support and billing teams"
              />
              <Button
                disabled={notesMutation.isPending}
                onClick={() => notesMutation.mutate(notesDraft || shop?.adminNotes || "")}
              >
                {notesMutation.isPending ? "Saving…" : "Save notes"}
              </Button>
            </CardContent>
          </Card>
        </PermissionGate>
      ) : null}

      <ConfirmDialog
        open={Boolean(statusDialog)}
        onClose={() => setStatusDialog(null)}
        title={statusDialog === "suspended" ? "Suspend company" : "Reactivate company"}
        description="Company suspension blocks shop access but does not change the owner account or subscription."
        confirmLabel={statusDialog === "suspended" ? "Suspend" : "Reactivate"}
        danger={statusDialog === "suspended"}
        loading={statusMutation.isPending}
        onConfirm={(reason) => statusMutation.mutateAsync({ status: statusDialog, reason })}
      />
    </div>
  );
}

function motionGrid({ children }) {
  return <div className="grid gap-4 md:grid-cols-3">{children}</div>;
}

function InfoCard({ title, children }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm text-muted">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">{children}</CardContent>
    </Card>
  );
}

function motionNotes({ value, onChange, placeholder }) {
  return (
    <div>
      <Label htmlFor="shop-notes">Notes</Label>
      <Textarea id="shop-notes" rows={6} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}