import { useCallback, useEffect, useState } from "react";
import { getMonthlySalaries } from "../services/salaryService";

export default function useSalary(year, month) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async ({ refresh = false } = {}) => {
      if (!year || !month) {
        return;
      }
      if (refresh) {
        setRefreshing(true);
      } else {
        setData(null);
        setLoading(true);
      }
      setError("");
      try {
        const next = await getMonthlySalaries(year, month);
        setData(next);
      } catch (loadError) {
        setError(loadError.message || "Unable to load salaries. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [year, month]
  );

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, refreshing, error, reload: () => load({ refresh: true }), load };
}
