import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getEmployeeAdvances, getEmployeeAdvanceTransactions } from "../services/advanceService";

export default function useAdvance(employeeId) {
  const [summary, setSummary] = useState(null);
  const [advances, setAdvances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!employeeId) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [advanceData, history] = await Promise.all([
        getEmployeeAdvances(employeeId, { limit: 50 }),
        getEmployeeAdvanceTransactions(employeeId, { limit: 20 }),
      ]);
      setEmployee(advanceData.employee);
      setSummary(advanceData.summary);
      setAdvances(advanceData.advances);
      setTransactions(history.transactions);
    } catch (loadError) {
      setError(loadError.message || "Unable to load advance information. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { summary, advances, transactions, employee, loading, error, reload: load };
}
