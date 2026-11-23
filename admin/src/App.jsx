import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { useAdminAuth } from "./context/AdminAuthContext";
import AdminLayout from "./layouts/AdminLayout";
import LoginPage from "./pages/LoginPage";
import OverviewPage from "./pages/OverviewPage";
import CompaniesPage from "./pages/CompaniesPage";
import CompanyDetailPage from "./pages/CompanyDetailPage";
import OwnersPage from "./pages/OwnersPage";
import OwnerDetailPage from "./pages/OwnerDetailPage";
import EmployeesPage from "./pages/EmployeesPage";
import EmployeeDetailPage from "./pages/EmployeeDetailPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import SubscriptionDetailPage from "./pages/SubscriptionDetailPage";
import PlansPage from "./pages/PlansPage";
import PaymentsPage from "./pages/PaymentsPage";
import PaymentDetailPage from "./pages/PaymentDetailPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AdminsPage from "./pages/AdminsPage";
import AuditPage from "./pages/AuditPage";
import SettingsPage from "./pages/SettingsPage";
import SupportPage from "./pages/SupportPage";
import CouponsPage from "./pages/CouponsPage";
import { ForbiddenPage } from "./components/PermissionGate";

function Private({ children }) {
  const { admin } = useAdminAuth();
  if (!admin) return <Navigate to="/login" replace />;
  return children;
}

function RequirePerm({ permission, superOnly, children }) {
  const { can, isSuper } = useAdminAuth();
  if (superOnly && !isSuper()) return <ForbiddenPage />;
  if (permission && !can(permission) && !(permission === "settings.manage" && isSuper()) && !(permission === "admins.manage" && isSuper())) {
    return <ForbiddenPage />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Private>
            <AdminLayout />
          </Private>
        }
      >
        <Route
          index
          element={
            <RequirePerm permission="dashboard.read">
              <OverviewPage />
            </RequirePerm>
          }
        />
        <Route path="companies" element={<RequirePerm permission="shops.read"><CompaniesPage /></RequirePerm>} />
        <Route path="companies/:id" element={<RequirePerm permission="shops.read"><CompanyDetailPage /></RequirePerm>} />
        <Route path="owners" element={<RequirePerm permission="users.read"><OwnersPage /></RequirePerm>} />
        <Route path="owners/:id" element={<RequirePerm permission="users.read"><OwnerDetailPage /></RequirePerm>} />
        <Route path="shops" element={<Navigate to="/companies" replace />} />
        <Route path="shops/:id" element={<ShopRedirect />} />
        <Route path="users" element={<Navigate to="/owners" replace />} />
        <Route path="users/:id" element={<OwnerRedirect />} />
        <Route path="employees" element={<RequirePerm permission="employees.read"><EmployeesPage /></RequirePerm>} />
        <Route path="employees/:id" element={<RequirePerm permission="employees.read"><EmployeeDetailPage /></RequirePerm>} />
        <Route path="subscriptions" element={<RequirePerm permission="subscriptions.read"><SubscriptionsPage /></RequirePerm>} />
        <Route path="subscriptions/:id" element={<RequirePerm permission="subscriptions.read"><SubscriptionDetailPage /></RequirePerm>} />
        <Route path="plans" element={<RequirePerm permission="subscriptions.read"><PlansPage /></RequirePerm>} />
        <Route path="plan-pricing" element={<Navigate to="/plans" replace />} />
        <Route path="payments" element={<RequirePerm permission="payments.read"><PaymentsPage /></RequirePerm>} />
        <Route path="payments/:id" element={<RequirePerm permission="payments.read"><PaymentDetailPage /></RequirePerm>} />
        <Route path="analytics" element={<RequirePerm permission="analytics.read"><AnalyticsPage /></RequirePerm>} />
        <Route path="admins" element={<RequirePerm superOnly><AdminsPage /></RequirePerm>} />
        <Route path="audit" element={<RequirePerm permission="audit.read"><AuditPage /></RequirePerm>} />
        <Route path="settings" element={<RequirePerm superOnly><SettingsPage /></RequirePerm>} />
        <Route path="settings/support" element={<RequirePerm permission="support.read"><SupportPage /></RequirePerm>} />
        <Route path="settings/coupons" element={<RequirePerm permission="coupons.read"><CouponsPage /></RequirePerm>} />
        <Route path="support" element={<Navigate to="/settings/support" replace />} />
        <Route path="coupons" element={<Navigate to="/settings/coupons" replace />} />
        <Route path="reports" element={<Navigate to="/analytics" replace />} />
      </Route>
    </Routes>
  );
}

function ShopRedirect() {
  const { id } = useParams();
  return <Navigate to={`/companies/${id}`} replace />;
}

function OwnerRedirect() {
  const { id } = useParams();
  return <Navigate to={`/owners/${id}`} replace />;
}
