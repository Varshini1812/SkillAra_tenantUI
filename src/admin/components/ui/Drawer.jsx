import { useEffect, useId, useRef } from "react";
import PanelCloseButton from "./PanelCloseButton.jsx";

export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = "max-w-2xl",
}) {
  const titleId = useId();
  const panelRef = useRef(null);
  const restoreRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    restoreRef.current = document.activeElement;
    panelRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      if (restoreRef.current instanceof HTMLElement) restoreRef.current.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
        aria-label="Close panel"
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`animate-slide-in-right relative z-10 flex h-full w-full ${width} flex-col border-l border-line bg-surface shadow-panel focus:outline-none`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-semibold text-ink">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
          </div>
          <PanelCloseButton onClick={onClose} />
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">{children}</div>

        {footer && (
          <footer className="flex flex-col-reverse gap-3 border-t border-line bg-surface-sunken px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </footer>
        )}
      </aside>
    </div>
  );
}
