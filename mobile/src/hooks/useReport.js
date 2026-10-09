import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

export default function useReport(loader, params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const key = JSON.stringify(params);

  const load = useCallback(
    async ({ refresh = false } = {}) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      try {
        const next = await loader(params);
        setData(next);
      } catch (loadError) {
        setData(null);
        setError(loadError.message || "Unable to load report. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loader, key]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { data, loading, refreshing, error, reload: () => load({ refresh: true }) };
}
