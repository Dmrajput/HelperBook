import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function SettingsPage() {
  const { admin } = useAdminAuth();
  const [settings, setSettings] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (admin?.role !== "super_admin") return;
    Promise.all([adminApi.settings(), adminApi.admins()]).then(([nextSettings, nextAdmins]) => {
      setSettings(nextSettings);
      setAdmins(nextAdmins.admins || []);
    }).catch((loadError) => setError(loadError.message));
  }, [admin]);
  if (admin?.role !== "super_admin") return <main className="content"><h1>Settings</h1><p>Only a Super Admin can change platform settings.</p></main>;
  return (
    <main className="content">
      <h1>Settings</h1>
      {error ? <p className="error">{error}</p> : null}
      {settings ? <form className="panel" onSubmit={async (event) => { event.preventDefault(); setSettings(await adminApi.saveSettings(settings)); }}>
        <label>Display name<input value={settings.displayName} onChange={(event) => setSettings({ ...settings, displayName: event.target.value })} /></label>
        <label>Support email<input value={settings.supportEmail} onChange={(event) => setSettings({ ...settings, supportEmail: event.target.value })} /></label>
        <label>Support hours<input value={settings.supportHours} onChange={(event) => setSettings({ ...settings, supportHours: event.target.value })} /></label>
        <label>Maintenance banner<input value={settings.maintenanceBanner} onChange={(event) => setSettings({ ...settings, maintenanceBanner: event.target.value })} /></label>
        <label><input type="checkbox" checked={settings.couponsEnabled} onChange={(event) => setSettings({ ...settings, couponsEnabled: event.target.checked })} /> Coupons enabled</label>
        <button type="submit">Save</button>
      </form> : <p>Loading settings...</p>}
      <section className="panel"><h2>Admin accounts</h2>{admins.map((item) => <p key={item._id}>{item.email} · {item.role} · {item.isActive ? "Active" : "Disabled"}</p>)}</section>
      <p>Multi-factor authentication is not enabled yet. Password changes use the bootstrap command or a Super Admin creating a new account.</p>
    </main>
  );
}
