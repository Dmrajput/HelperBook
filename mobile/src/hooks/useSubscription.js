import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getMySubscription, getPlans } from "../services/subscriptionService";

export default function useSubscription() {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshSubscription = useCallback(async () => {
    setError("");
    const [nextSubscription, nextPlans] = await Promise.all([getMySubscription(), getPlans()]);
    setSubscription(nextSubscription);
    setPlans(nextPlans);
    return nextSubscription;
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      refreshSubscription()
        .catch((loadError) => {
          if (active) setError(loadError.message || "Unable to verify your subscription.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [refreshSubscription])
  );

  const canAddEmployee = subscription ? subscription.remainingEmployeeSlots > 0 && !subscription.overLimit : null;

  return {
    subscription,
    plans,
    loading,
    error,
    refreshSubscription,
    canAddEmployee,
    remainingEmployeeSlots: subscription ? subscription.remainingEmployeeSlots : null,
  };
}
