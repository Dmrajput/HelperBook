import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getDashboard } from "../services/dashboardService";

export function useDashboard(active = true) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const hasData = useRef(false);

  const loadDashboard = useCallback(async () => {
    if (!hasData.current) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const next = await getDashboard();
      hasData.current = true;
      setData(next);
    } catch (nextError) {
      setError(nextError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const next = await getDashboard();
      hasData.current = true;
      setData(next);
    } catch (nextError) {
      setError(nextError);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!active) {
        return undefined;
      }
      loadDashboard();
      return undefined;
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
