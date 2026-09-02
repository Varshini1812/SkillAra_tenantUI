import { useEffect, useId, useRef } from "react";
import { Button } from "./primitives.jsx";
import Icon from "./Icon.jsx";

/**
 * Required before any destructive action (`confirmation-dialogs`).
 *
 * Escape and the backdrop both cancel (`modal-escape`); focus moves to the
 * cancel button on open — the safe default — and returns to whatever was
 * focused before when the dialog closes.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef(null);
  const restoreRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    restoreRef.current = document.activeElement;
    cancelRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      if (restoreRef.current instanceof HTMLElement) restoreRef.current.focus();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label={cancelLabel}
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="animate-fade-rise relative w-full max-w-md rounded-surface border border-line bg-surface p-6 shadow-panel"
      >
        <div className="flex items-start gap-3">
          {danger && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-subtle text-danger">
              <Icon name="warning" size={20} />
            </span>
          )}
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-ink">
              {title}
            </h2>
            <div id={descId} className="mt-1.5 text-sm text-ink-muted">
              {message}
            </div>
          </div>
        </div>

        {/* The destructive action sits apart from cancel, and carries the danger
            colour plus an explicit label (`destructive-emphasis`). */}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
