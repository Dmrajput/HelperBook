import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getAttendanceByDate } from "../services/attendanceService";

export function useDailyAttendance(date) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const requestId = useRef(0);
  const hasData = useRef(false);

  const load = useCallback(async ({ refresh = false } = {}) => {
    const id = ++requestId.current;
    if (refresh) {
      setIsRefreshing(true);
    } else if (!hasData.current) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const next = await getAttendanceByDate(date);
      if (id !== requestId.current) {
        return;
      }
      hasData.current = true;
      setData(next);
    } catch (nextError) {
      if (id !== requestId.current) {
        return;
      }
      setError(nextError);
      if (!refresh && !hasData.current) {
        setData(null);
      }
    } finally {
      if (id === requestId.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      hasData.current = false;
      load();
      return () => {
        requestId.current += 1;
      };
    }, [load])
  );

  return { data, isLoading, isRefreshing, error, load };
}
