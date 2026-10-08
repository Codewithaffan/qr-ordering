"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

const MAX_QTY = 20;

/** Cart kept per table in sessionStorage (not sensitive; survives refresh, cleared when the tab closes). */
export default function useCart(storageKey, products) {
  const [items, setItems] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from browser storage after mount (SSR-safe)
      setItems(raw ? JSON.parse(raw) : {});
    } catch {
      setItems({});
    }
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      /* storage unavailable */
    }
  }, [items, ready, storageKey]);

  const setQty = useCallback((id, qty) => {
    setItems((prev) => {
      const next = { ...prev };
      const q = Math.min(Math.max(Math.floor(qty), 0), MAX_QTY);
      if (q === 0) delete next[id];
      else next[id] = q;
      return next;
    });
  }, []);

  const clear = useCallback(() => setItems({}), []);

  // Only lines whose product still exists and is available.
  const lines = useMemo(() => {
    const map = new Map((products || []).map((p) => [p._id, p]));
    return Object.entries(items)
      .map(([id, quantity]) => ({ product: map.get(id), quantity }))
      .filter((l) => l.product && l.product.isAvailable);
  }, [items, products]);

  const count = lines.reduce((n, l) => n + l.quantity, 0);
  return { items, lines, count, setQty, clear, maxQty: MAX_QTY };
}
