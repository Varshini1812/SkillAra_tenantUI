import { createContext, useCallback, useContext, useMemo, useState } from "react";
import Icon from "./Icon.jsx";

const ToastContext = createContext(null);

const STYLES = {
  success: "border-success-border bg-success-subtle text-success",
  error: "border-danger-border bg-danger-subtle text-danger",
  info: "border-brand-border bg-brand-subtle text-brand-hover",
};

const ICONS = { success: "success", error: "danger", info: "info" };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, type = "info") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Polite live region: announced without stealing focus (`toast-accessibility`). */}
      <div
        className="pointer-events-none fixed left-1/2 top-6 z-[100] flex w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`animate-fade-rise pointer-events-auto flex items-start gap-2.5 rounded-surface border px-4 py-3 text-sm shadow-pop ${
              STYLES[t.type] || STYLES.info
            }`}
          >
            <Icon name={ICONS[t.type] || "info"} size={16} className="mt-0.5" />
            <p className="min-w-0 flex-1 break-token">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="-m-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-control opacity-70 transition-opacity duration-150 ease-standard hover:opacity-100"
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
