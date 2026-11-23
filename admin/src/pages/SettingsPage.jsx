import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/adminApi";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["settings"],
    queryFn: () => adminApi.settings(),
  });

  useEffect(() => {
    if (data) setSettings(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => adminApi.saveSettings(settings),
    onSuccess: (next) => {
      setSettings(next);
      queryClient.setQueryData(["settings"], next);
    },
  });

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Platform branding, support contact, and feature toggles."
        actions={
          <div className="flex gap-2">
            <Link
              to="/settings/support"
              className="inline-flex h-9 items-center rounded-md border border-border bg-white px-4 text-sm hover:bg-slate-50"
            >
              Support tickets
            </Link>
            <Link
              to="/settings/coupons"
              className="inline-flex h-9 items-center rounded-md border border-border bg-white px-4 text-sm hover:bg-slate-50"
            >
              Coupons
            </Link>
          </div>
        }
      />

      <Card className="mb-6 border-amber-100 bg-amber-50">
        <CardContent className="p-4 text-sm text-amber-950">
          <p className="font-medium">Security notes</p>
          <p className="mt-1">Multi-factor authentication is not available yet.</p>
          <p>Sessions are held in memory only — signing out or refreshing tokens ends the session.</p>
        </CardContent>
      </Card>

      {isLoading || !settings ? (
        <p className="text-sm text-muted">Loading settings…</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Platform</CardTitle>
            <CardDescription>Visible to shop owners in the app and support flows.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid max-w-xl gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
            >
              <Field label="Display name">
                <Input value={settings.displayName || ""} onChange={(e) => setSettings({ ...settings, displayName: e.target.value })} />
              </Field>
              <Field label="Support email">
                <Input type="email" value={settings.supportEmail || ""} onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })} />
              </Field>
              <Field label="Support phone">
                <Input value={settings.supportPhone || ""} onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })} />
              </Field>
              <Field label="Support hours">
                <Input value={settings.supportHours || ""} onChange={(e) => setSettings({ ...settings, supportHours: e.target.value })} />
              </Field>
              <Field label="Maintenance banner">
                <Input value={settings.maintenanceBanner || ""} onChange={(e) => setSettings({ ...settings, maintenanceBanner: e.target.value })} />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(settings.couponsEnabled)}
                  onChange={(e) => setSettings({ ...settings, couponsEnabled: e.target.checked })}
                />
                Coupons enabled
              </label>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving…" : "Save settings"}
              </Button>
              {saveMutation.error ? <p className="text-sm text-danger">{saveMutation.error.message}</p> : null}
            </form>
          </CardContent>
        </Card>
      )}
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