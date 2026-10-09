import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getLeaves } from "../services/leaveService";

export default function useLeave(params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const status = params?.status || "pending";
  const leaveType = params?.leaveType || "";
  const employeeId = params?.employeeId || "";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getLeaves({ status, leaveType, employeeId, limit: 20 }));
    } catch (loadError) {
      setError(loadError.message || "Unable to load leave requests. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [employeeId, leaveType, status]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { data, loading, error, reload: load };
}
