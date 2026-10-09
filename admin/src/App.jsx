import { Navigate, Route, Routes } from "react-router-dom";
import { useAdminAuth } from "./context/AdminAuthContext";
import AdminLayout from "./layouts/AdminLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import UserDetailPage from "./pages/UserDetailPage";
import ShopsPage from "./pages/ShopsPage";
import ShopDetailPage from "./pages/ShopDetailPage";
import EmployeesPage from "./pages/EmployeesPage";
import EmployeeDetailPage from "./pages/EmployeeDetailPage";
import PaymentDetailPage from "./pages/PaymentDetailPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import PaymentsPage from "./pages/PaymentsPage";
import ReportsPage from "./pages/ReportsPage";
import SupportPage from "./pages/SupportPage";
import CouponsPage from "./pages/CouponsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AuditPage from "./pages/AuditPage";
import SettingsPage from "./pages/SettingsPage";

function Private({ children }) {
  const { admin } = useAdminAuth();
  if (!admin) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Private><AdminLayout /></Private>}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="shops" element={<ShopsPage />} />
        <Route path="shops/:id" element={<ShopDetailPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="employees/:id" element={<EmployeeDetailPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="payments/:id" element={<PaymentDetailPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="coupons" element={<CouponsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
