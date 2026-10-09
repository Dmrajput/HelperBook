import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { adminApi, setAdminExpiredHandler, setAdminTokens } from "../api/adminApi";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [ready, setReady] = useState(true);

  useEffect(() => {
    setAdminExpiredHandler(() => setAdmin(null));
  }, []);

  const value = useMemo(() => ({
    admin,
    ready,
    async login(email, password) {
      const data = await adminApi.login({ email, password });
      setAdminTokens({ access: data.accessToken, refresh: data.refreshToken });
      setAdmin(data.admin);
    },
    async logout() {
      try {
        await adminApi.logout();
      } catch {
        // Local sign-out still clears the in-memory session.
      }
      setAdminTokens({});
      setAdmin(null);
    },
    can(permission) {
      const list = admin?.permissions || [];
      return list.includes("*") || list.includes(permission);
    },
  }), [admin, ready]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
