import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { setSessionExpiredHandler } from "../api/apiClient";
import {
  getCurrentUser,
  loginWithPassword as loginRequest,
  logout as requestLogout,
  registerOwner as registerRequest,
  requestPasswordReset as requestPasswordResetRequest,
  resetPassword as resetPasswordRequest,
} from "../services/authService";
import { getDeviceInfo } from "../utils/deviceInfo";
import { unregisterCurrentPushToken } from "../services/pushNotificationService";
import { clearTokens, getAccessToken, getRefreshToken, getSessionRole, saveTokens } from "../utils/tokenStorage";
import { getEmployeeProfile, logoutEmployee, saveEmployeeSession } from "../services/employeeAuthService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startupError, setStartupError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const clearSession = useCallback(async () => {
    await clearTokens();
    setUser(null);
    setAccessToken(null);
  }, []);

  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    setStartupError("");

    try {
      const existingAccess = await getAccessToken();
      const existingRefresh = await getRefreshToken();

      if (!existingAccess && !existingRefresh) {
        setUser(null);
        setAccessToken(null);
        return;
      }

      const role = await getSessionRole();
      const currentUser = role === "employee" ? await getEmployeeProfile() : await getCurrentUser();
      const token = await getAccessToken();
      setUser(currentUser);
      setAccessToken(token);
    } catch (error) {
      if (error?.isNetworkError) {
        setStartupError(error.message);
        return;
      }

      await clearTokens();
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setAccessToken(null);
    });
    restoreSession();

    return () => {
      setSessionExpiredHandler(null);
    };
  }, [restoreSession]);

  const saveOwnerSession = useCallback(async (result) => {
    await saveTokens({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      role: "owner",
    });
    setAccessToken(result.accessToken);
    setUser(result.user);
    return result;
  }, []);

  const login = useCallback(async ({ phoneNumber, password }) => {
    const device = await getDeviceInfo();
    const result = await loginRequest({
      phoneNumber,
      countryCode: "+91",
      password,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      platform: device.platform,
    });
    return saveOwnerSession(result);
  }, [saveOwnerSession]);

  const register = useCallback(async ({ fullName, phoneNumber, password }) => {
    const device = await getDeviceInfo();
    const result = await registerRequest({
      fullName,
      phoneNumber,
      countryCode: "+91",
      password,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      platform: device.platform,
    });
    return saveOwnerSession(result);
  }, [saveOwnerSession]);

  const requestPasswordReset = useCallback(async (phoneNumber) => {
    return requestPasswordResetRequest({
      phoneNumber,
      countryCode: "+91",
    });
  }, []);

  const resetPassword = useCallback(async ({ phoneNumber, otp, password }) => {
    const device = await getDeviceInfo();
    const result = await resetPasswordRequest({
      phoneNumber,
      countryCode: "+91",
      otp,
      password,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      platform: device.platform,
    });
    return saveOwnerSession(result);
  }, [saveOwnerSession]);

  const completeEmployeeLogin = useCallback(async (result) => {
    await saveEmployeeSession(result);
    setAccessToken(result.accessToken);
    setUser({
      id: result.user.employeeId,
      role: "employee",
      name: result.user.name,
      phone: result.user.phone,
    });
    return result;
  }, []);

  const logout = useCallback(async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      await unregisterCurrentPushToken();
      const refreshToken = await getRefreshToken();
      const role = await getSessionRole();
      if (refreshToken && role === "employee") {
        await logoutEmployee(refreshToken);
      } else if (refreshToken) {
        await requestLogout(refreshToken);
      }
    } catch {
      // The local session is still cleared when the server cannot be reached.
    } finally {
      await clearSession();
      setIsLoggingOut(false);
    }
  }, [clearSession, isLoggingOut]);

  const patchUser = useCallback((partial) => {
    setUser((current) => (current ? { ...current, ...partial } : current));
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isLoading,
      startupError,
      isLoggingOut,
      login,
      register,
      requestPasswordReset,
      resetPassword,
      completeEmployeeLogin,
      logout,
      patchUser,
      retrySession: restoreSession,
    }),
    [
      user,
      accessToken,
      isLoading,
      startupError,
      isLoggingOut,
      login,
      register,
      requestPasswordReset,
      resetPassword,
      logout,
      completeEmployeeLogin,
      patchUser,
      restoreSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
