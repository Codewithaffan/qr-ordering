"use client";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

const TONES = {
  success: "border-green-200 bg-green-50 text-green-900",
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-orange-200 bg-white text-ink",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (message, { type = "info", title, duration = 4000 } = {}) => {
      const id = nextId.current++;
      setToasts((t) => [...t.slice(-3), { id, message, type, title }]);
      if (duration) setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      show: push,
      success: (m, o) => push(m, { ...o, type: "success" }),
      error: (m, o) => push(m, { ...o, type: "error", duration: 6000 }),
      info: (m, o) => push(m, { ...o, type: "info" }),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-md ${TONES[t.type]}`}
          >
            <div className="min-w-0 flex-1 text-sm">
              {t.title && <p className="font-semibold">{t.title}</p>}
              <p className="break-words">{t.message}</p>
            </div>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-current/60 hover:text-current">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
