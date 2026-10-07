import { useCallback, useState } from "react";
import { checkServerHealth } from "../services/healthService";

export function useServerConnection() {
  const [status, setStatus] = useState("idle");

  const checkConnection = useCallback(async () => {
    setStatus("loading");

    try {
      const result = await checkServerHealth();
      setStatus(result?.success ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }, []);

  return {
    status,
    checkConnection,
  };
}
