import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getAttendanceByDate } from "../services/attendanceService";

export function useDailyAttendance(date) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setData(null);
      setIsLoading(true);
    }
    setError(null);
    try {
      const next = await getAttendanceByDate(date);
      setData(next);
    } catch (nextError) {
      setError(nextError);
      if (!refresh) {
        setData(null);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { data, isLoading, isRefreshing, error, load };
}
