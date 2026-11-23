import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/adminApi";
import { DataTable } from "@/components/DataTable";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/roles";
import { formatDate } from "@/lib/utils";

const ROLES = ["super_admin", "support_agent", "finance_admin", "read_only_admin"];

export default function AdminsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "support_agent" });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admins"],
    queryFn: () => adminApi.admins(),
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createAdmin(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      setForm({ name: "", email: "", password: "", role: "support_agent" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }) => adminApi.setAdminActive(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admins"] }),
  });

  const rows = (data?.admins || []).map((admin) => ({
    id: admin._id || admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    status: admin.isActive ? "active" : "inactive",
    lastLoginAt: admin.lastLoginAt,
    createdAt: admin.createdAt,
    isActive: admin.isActive,
  }));

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div>
      <PageHeader title="Admin users" description="Super Admin only — create and enable platform admins." />

      <DataTable
        columns={[
          { key: "name", header: "Name", className: "font-medium" },
          { key: "email", header: "Email" },
          { key: "role", header: "Role", cell: (row) => ROLE_LABELS[row.role] || row.role },
          { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
          { key: "lastLoginAt", header: "Last login", cell: (row) => formatDate(row.lastLoginAt) },
          {
            key: "actions",
            header: "",
            cell: (row) => (
              <Button
                size="sm"
                variant="secondary"
                disabled={statusMutation.isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  statusMutation.mutate({ id: row.id, isActive: !row.isActive });
                }}
              >
                {row.isActive ? "Disable" : "Enable"}
              </Button>
            ),
          },
        ]}
        rows={rows}
        loading={isLoading}
        page={1}
        limit={rows.length || 20}
        total={rows.length}
        emptyTitle="No admins"
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Create admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
          >
            <Field label="Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </Field>
            <Field label="Temporary password">
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </Field>
            <Field label="Role">
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role] || role}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating…" : "Create admin"}
              </Button>
              {createMutation.error ? <p className="text-sm text-danger">{createMutation.error.message}</p> : null}
            </div>
          </form>
        </CardContent>
      </Card>
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