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
import { formatDate, formatDateTime } from "@/lib/utils";

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [loginDialog, setLoginDialog] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => adminApi.employee(id),
  });

  const loginMutation = useMutation({
    mutationFn: ({ loginEnabled, reason }) => adminApi.employeeLogin(id, { loginEnabled, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee", id] });
      setLoginDialog(false);
    },
  });

  const employee = data?.employee;

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading || !employee) return <p className="text-sm text-muted">Loading employee…</p>;

  return (
    <div>
      <PageHeader
        title={employee.name}
        description="Salary and advance details are not available in the admin panel."
        actions={
          <PermissionGate permission="employees.update">
            <Button variant={employee.loginEnabled ? "danger" : "default"} onClick={() => setLoginDialog(true)}>
              {employee.loginEnabled ? "Disable login" : "Enable login"}
            </Button>
          </PermissionGate>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Role <strong>{employee.role}</strong>
            </p>
            <p>
              Status <StatusBadge status={employee.status} />
            </p>
            <p>Joined {formatDate(employee.joiningDate)}</p>
            <p>Phone {employee.phone || "Not available"}</p>
            <p>
              Login{" "}
              <Badge tone={employee.loginEnabled ? "success" : "default"}>
                {employee.loginEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </p>
            <p>Last login {employee.lastLoginAt ? formatDateTime(employee.lastLoginAt) : "Not recorded"}</p>
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
                <p className="text-muted">Owner {data.shop.owner || "—"}</p>
                <Link to={`/companies/${data.shop.id}`} className="mt-2 inline-block text-brand hover:underline">
                  Open company
                </Link>
              </>
            ) : (
              <p className="text-muted">No company linked.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={loginDialog}
        onClose={() => setLoginDialog(false)}
        title={employee.loginEnabled ? "Disable employee login" : "Enable employee login"}
        description={
          employee.loginEnabled
            ? "Disabling login revokes active employee sessions."
            : "The employee can sign in again with their existing credentials."
        }
        confirmLabel={employee.loginEnabled ? "Disable login" : "Enable login"}
        danger={employee.loginEnabled}
        loading={loginMutation.isPending}
        onConfirm={(reason) =>
          loginMutation.mutateAsync({ loginEnabled: !employee.loginEnabled, reason })
        }
      />
    </div>
  );
}