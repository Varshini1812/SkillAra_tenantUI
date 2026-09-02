import { useEffect, useRef } from "react";

export default function SlidePanel({
  open,
  onClose,
  children,
  width = "w-full max-w-6xl",
  ariaLabel = "Panel",
}) {
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
        className="absolute inset-0 bg-ink/50"
        onClick={onClose}
        aria-label="Close panel"
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={`animate-slide-in-right relative flex h-full ${width} flex-col border-l border-line bg-surface shadow-panel focus:outline-none`}
      >
        {children}
      </aside>
    </div>
  );
}
