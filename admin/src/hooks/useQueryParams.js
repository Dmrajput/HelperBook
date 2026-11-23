import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export function useQueryParams(defaults = {}) {
  const [params, setParams] = useSearchParams();

  const values = useMemo(() => {
    const next = { ...defaults };
    Object.keys({ ...defaults, ...Object.fromEntries(params.entries()) }).forEach((key) => {
      const raw = params.get(key);
      next[key] = raw == null || raw === "" ? defaults[key] ?? "" : raw;
    });
    return next;
  }, [params, defaults]);

  const setValues = useCallback(
    (patch) => {
      const next = new URLSearchParams(params);
      Object.entries(patch).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "" || value === defaults[key]) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });
      setParams(next, { replace: true });
    },
    [defaults, params, setParams]
  );

  return [values, setValues];
}
