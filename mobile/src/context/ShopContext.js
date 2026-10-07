import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  createShop as createShopRequest,
  deleteShopLogo,
  getMyShop,
  updateMyShop,
  uploadShopLogo,
} from "../services/shopService";

const ShopContext = createContext(null);

export function ShopProvider({ children }) {
  const { isAuthenticated, isLoading: authLoading, user, patchUser } = useAuth();
  const activeUserId = !authLoading && isAuthenticated ? user?.id || "" : "";
  const [shop, setShop] = useState(null);
  const [status, setStatus] = useState("idle");
  const [loadError, setLoadError] = useState("");
  const [trackedUserId, setTrackedUserId] = useState(null);
  const shopRef = useRef(null);

  if (activeUserId !== trackedUserId) {
    setTrackedUserId(activeUserId);
    shopRef.current = null;
    setShop(null);
    setLoadError("");
    setStatus(activeUserId ? "loading" : "ready");
  }

  const applyShop = useCallback((nextShop) => {
    shopRef.current = nextShop;
    setShop(nextShop);
    setStatus("ready");
    setLoadError("");
    if (nextShop?.owner?.fullName) {
      patchUser({ fullName: nextShop.owner.fullName });
    }
  }, [patchUser]);

  const fetchShop = useCallback(async () => {
    setLoadError("");
    if (!shopRef.current) {
      setStatus("loading");
    }

    try {
      const nextShop = await getMyShop();
      applyShop(nextShop);
      return nextShop;
    } catch (error) {
      if (!shopRef.current) {
        setLoadError(error.message);
        setStatus("error");
      }
      throw error;
    }
  }, [applyShop]);

  useEffect(() => {
    if (authLoading || !activeUserId) {
      return undefined;
    }

    let cancelled = false;
    getMyShop()
      .then((nextShop) => {
        if (!cancelled) {
          applyShop(nextShop);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          shopRef.current = null;
          setShop(null);
          setLoadError(error.message);
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeUserId, applyShop, authLoading]);

  const createShop = useCallback(async (payload) => createShopRequest(payload), []);
  const updateShop = useCallback(async (payload) => {
    const nextShop = await updateMyShop(payload);
    applyShop(nextShop);
    return nextShop;
  }, [applyShop]);
  const uploadLogo = useCallback(async (file, { adopt = true } = {}) => {
    const nextShop = await uploadShopLogo(file);
    if (adopt) {
      applyShop(nextShop);
    }
    return nextShop;
  }, [applyShop]);
  const removeLogo = useCallback(async () => {
    const nextShop = await deleteShopLogo();
    applyShop(nextShop);
    return nextShop;
  }, [applyShop]);

  const aligned = trackedUserId === activeUserId;
  const visibleShop = aligned ? shop : null;
  const visibleStatus = aligned ? status : activeUserId ? "loading" : "ready";

  const value = useMemo(
    () => ({
      shop: visibleShop,
      isLoading: visibleStatus === "idle" || visibleStatus === "loading",
      hasShop: Boolean(visibleShop),
      loadError: aligned ? loadError : "",
      fetchShop,
      createShop,
      updateShop,
      uploadLogo,
      removeLogo,
      adoptShop: applyShop,
    }),
    [visibleShop, visibleStatus, aligned, loadError, fetchShop, createShop, updateShop, uploadLogo, removeLogo, applyShop]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within ShopProvider");
  }
  return context;
}
