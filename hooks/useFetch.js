"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/apiClient";

/** Small data-fetching hook with loading / error state and a manual reload (no extra deps). */
export default function useFetch(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!url) return;
      if (!silent) setLoading(true);
      try {
        const result = await api.get(url);
        if (!mounted.current) return;
        setData(result);
        setError(null);
      } catch (err) {
        if (mounted.current) setError(err);
      } finally {
        if (mounted.current && !silent) setLoading(false);
      }
    },
    [url]
  );

  useEffect(() => {
    mounted.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount / url change
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  return { data, setData, error, loading, reload: load };
}
