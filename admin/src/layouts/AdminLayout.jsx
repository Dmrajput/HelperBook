import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Receipt,
  Search,
  Settings,
  Shield,
  Users,
  UserRound,
  WalletCards,
} from "lucide-react";
import { adminApi } from "@/api/adminApi";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, titleCase } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/roles";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard, permission: "dashboard.read", end: true },
  { to: "/companies", label: "Companies", icon: Building2, permission: "shops.read" },
  { to: "/owners", label: "Owners", icon: UserRound, permission: "users.read" },
  { to: "/employees", label: "Employees", icon: Users, permission: "employees.read" },
  { to: "/subscriptions", label: "Subscriptions", icon: WalletCards, permission: "subscriptions.read" },
  { to: "/plans", label: "Plans", icon: CreditCard, permission: "subscriptions.read" },
  { to: "/payments", label: "Payments", icon: Receipt, permission: "payments.read" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, permission: "analytics.read" },
  { to: "/admins", label: "Admin users", icon: Shield, permission: "admins.manage", superOnly: true },
  { to: "/audit", label: "Audit logs", icon: Activity, permission: "audit.read" },
  { to: "/settings", label: "Settings", icon: Settings, permission: "settings.manage", superOnly: true },
];

function crumbsFromPath(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (!parts.length) return [{ label: "Overview", to: "/" }];
  const map = {
    companies: "Companies",
    owners: "Owners",
    employees: "Employees",
    subscriptions: "Subscriptions",
    plans: "Plans",
    payments: "Payments",
    analytics: "Analytics",
    admins: "Admin users",
    audit: "Audit logs",
    settings: "Settings",
    support: "Support",
    coupons: "Coupons",
  };
  const crumbs = [{ label: "Overview", to: "/" }];
  let path = "";
  parts.forEach((part, index) => {
    path += `/${part}`;
    crumbs.push({
      label: map[part] || (part.length === 24 ? "Detail" : titleCase(part)),
      to: index === parts.length - 1 ? undefined : path,
    });
  });
  return crumbs;
}

export default function AdminLayout() {
  const { admin, logout, can, isSuper } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const crumbs = useMemo(() => crumbsFromPath(location.pathname), [location.pathname]);

  const links = NAV.filter((item) => {
    if (item.superOnly) return isSuper();
    if (item.permission === "admins.manage" || item.permission === "settings.manage") return isSuper();
    return can(item.permission);
  });

  useEffect(() => {
    setResults([]);
  }, [location.pathname]);

  async function runSearch(event) {
    event.preventDefault();
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const data = await adminApi.search(query.trim());
    setResults(data.results || []);
  }

  function openResult(item) {
    setResults([]);
    setQuery("");
    const path =
      item.type === "user"
        ? `/owners/${item.id}`
        : item.type === "shop"
          ? `/companies/${item.id}`
          : item.type === "employee"
            ? `/employees/${item.id}`
            : item.type === "payment"
              ? `/payments/${item.id}`
              : "/settings/support";
    navigate(path);
  }

  return (
    <div className="flex min-h-screen bg-surface text-ink">
      <aside
        className={cn(
          "sticky top-0 flex h-screen flex-col border-r border-border bg-[#0B1220] text-slate-200 transition-all",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-4">
          {!collapsed ? (
            <div>
              <p className="text-sm font-semibold text-white">HelperBook</p>
              <p className="text-xs text-slate-400">Platform Admin</p>
            </div>
          ) : (
            <span className="mx-auto text-sm font-semibold text-white">HB</span>
          )}
          <button
            type="button"
            className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                    isActive ? "bg-brand text-white" : "text-slate-300 hover:bg-white/10 hover:text-white",
                    collapsed && "justify-center px-2"
                  )
                }
                title={item.label}
              >
                <Icon size={18} />
                {!collapsed ? <span>{item.label}</span> : null}
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          {!collapsed ? (
            <div className="mb-2">
              <p className="truncate text-sm font-medium text-white">{admin?.name}</p>
              <p className="truncate text-xs text-slate-400">{ROLE_LABELS[admin?.role] || admin?.role}</p>
            </div>
          ) : null}
          <Button
            variant="ghost"
            className={cn("w-full justify-start text-slate-300 hover:bg-white/10 hover:text-white", collapsed && "justify-center px-0")}
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
          >
            <LogOut size={16} />
            {!collapsed ? "Sign out" : null}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-white/90 backdrop-blur">
          <div className="flex flex-wrap items-center gap-4 px-6 py-3">
            <nav className="flex min-w-0 flex-1 items-center gap-1 text-sm text-muted">
              {crumbs.map((crumb, index) => (
                <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                  {index > 0 ? <span>/</span> : null}
                  {crumb.to ? (
                    <Link to={crumb.to} className="hover:text-ink">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-ink">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
            <form onSubmit={runSearch} className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                className="pl-9"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search companies, owners, employees…"
                aria-label="Search"
              />
              {results.length ? (
                <div className="absolute left-0 right-0 top-11 z-30 overflow-hidden rounded-lg border border-border bg-white shadow-lg">
                  {results.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                      onClick={() => openResult(item)}
                    >
                      <span className="mr-2 text-xs uppercase text-muted">{item.type}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </form>
            <div className="text-right">
              <p className="text-sm font-medium">{admin?.name}</p>
              <p className="text-xs text-muted">{ROLE_LABELS[admin?.role] || admin?.role}</p>
            </div>
          </div>
        </header>
        <main className="flex-1 px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
