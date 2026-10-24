import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getDashboard } from "../services/dashboardService";

export function useDashboard(active = true) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const hasData = useRef(false);
  const requestId = useRef(0);

  const loadDashboard = useCallback(async () => {
    const id = ++requestId.current;
    if (!hasData.current) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const next = await getDashboard();
      if (id !== requestId.current) return;
      hasData.current = true;
      setData(next);
    } catch (nextError) {
      if (id !== requestId.current) return;
      setError(nextError);
    } finally {
      if (id === requestId.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    const id = ++requestId.current;
    setIsRefreshing(true);
    setError(null);

    try {
      const next = await getDashboard();
      if (id !== requestId.current) return;
      hasData.current = true;
      setData(next);
    } catch (nextError) {
      if (id !== requestId.current) return;
      setError(nextError);
    } finally {
      if (id === requestId.current) {
        setIsRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!active) {
        return undefined;
      }
      loadDashboard();
      return () => {
        requestId.current += 1;
      };
    }, [active, loadDashboard])
  );

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    loadDashboard,
    refreshDashboard,
  };
}
