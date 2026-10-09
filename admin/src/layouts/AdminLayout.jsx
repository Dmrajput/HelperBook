import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { adminApi } from "../api/adminApi";
import { useAdminAuth } from "../context/AdminAuthContext";

const LINKS = [
  ["/", "Dashboard", "dashboard.read"],
  ["/users", "Users", "users.read"],
  ["/shops", "Shops", "shops.read"],
  ["/employees", "Employees", "employees.read"],
  ["/subscriptions", "Subscriptions", "subscriptions.read"],
  ["/payments", "Payments", "payments.read"],
  ["/reports", "Reports", "reports.read"],
  ["/support", "Support", "support.read"],
  ["/coupons", "Coupons", "coupons.read"],
  ["/analytics", "Analytics", "analytics.read"],
  ["/audit", "Audit logs", "audit.read"],
  ["/settings", "Settings", "settings.manage"],
];

export default function AdminLayout() {
  const { admin, logout, can } = useAdminAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  return (
    <div className="shell">
      <aside className="sidebar">
        <strong>HelperBook Admin</strong>
        {LINKS.filter(([, , permission]) => permission === "settings.manage" ? admin?.role === "super_admin" : can(permission)).map(([to, label]) => (
          <NavLink key={to} to={to} end={to === "/"}>{label}</NavLink>
        ))}
      </aside>
      <div className="main">
        <header className="topbar">
          <form onSubmit={async (event) => {
            event.preventDefault();
            const data = await adminApi.search(query);
            setResults(data.results || []);
          }}>
            <input aria-label="Search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search owners, shops, tickets" />
          </form>
          <div className="row">
            <span>{admin?.name}</span>
            <button className="secondary" type="button" onClick={async () => { await logout(); navigate("/login"); }}>Logout</button>
          </div>
        </header>
        {results.length ? (
          <div className="content">
            {results.map((item) => <button key={`${item.type}-${item.id}`} className="secondary" type="button" onClick={() => { setResults([]); navigate(item.type === "ticket" ? "/support" : `/${item.type === "user" ? "users" : item.type === "employee" ? "employees" : item.type === "payment" ? "payments" : "shops"}/${item.id}`); }}>{item.label}</button>)}
          </div>
        ) : null}
        <Outlet />
      </div>
    </div>
  );
}
