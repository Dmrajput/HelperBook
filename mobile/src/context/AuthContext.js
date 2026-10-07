import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { setSessionExpiredHandler } from "../api/apiClient";
import {
  getCurrentUser,
  logout as requestLogout,
  requestOtp as requestOtpRequest,
  verifyOtp as verifyOtpRequest,
} from "../services/authService";
import { getDeviceInfo } from "../utils/deviceInfo";
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "../utils/tokenStorage";

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

      const currentUser = await getCurrentUser();
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

  const requestOtp = useCallback(async (phoneNumber) => {
    return requestOtpRequest({
      phoneNumber,
      countryCode: "+91",
    });
  }, []);

  const verifyOtp = useCallback(async ({ phoneNumber, otp }) => {
    const device = await getDeviceInfo();
    const result = await verifyOtpRequest({
      phoneNumber,
      countryCode: "+91",
      otp,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      platform: device.platform,
    });

    await saveTokens({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    setAccessToken(result.accessToken);
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
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
      requestOtp,
      verifyOtp,
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
      requestOtp,
      verifyOtp,
      logout,
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
