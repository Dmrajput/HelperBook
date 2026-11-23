import { useAdminAuth } from "@/context/AdminAuthContext";

export function PermissionGate({ permission, fallback = null, children }) {
  const { can } = useAdminAuth();
  if (permission && !can(permission)) return fallback;
  return children;
}

export function ForbiddenPage({ message = "You do not have permission to view this page." }) {
  return (
    <div className="rounded-xl border border-border bg-white p-10 text-center">
      <h1 className="text-lg font-semibold text-ink">Access denied</h1>
      <p className="mt-2 text-sm text-muted">{message}</p>
    </div>
  );
}
