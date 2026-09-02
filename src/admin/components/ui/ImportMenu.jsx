import Icon from "./Icon.jsx";
import { useEffect, useRef, useState } from "react";
import { BTN_SECONDARY } from "./styles.js";

export default function ImportMenu({
  onImportClick,
  onDownloadSample,
  importing = false,
  disabled = false,
  label = "Import",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled || importing}
        onClick={() => setOpen((value) => !value)}
        className={`${BTN_SECONDARY} gap-2`}
      >
        {importing ? "Importing..." : label}
        <Icon name="chevronDown" size={14} className="text-ink-subtle" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+0.375rem)] z-30 w-64 overflow-hidden rounded-surface border border-line bg-surface p-1 shadow-pop">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-control px-2.5 py-2 text-left text-[0.8125rem] text-ink-muted transition-colors duration-200 ease-standard hover:bg-surface-sunken hover:text-ink"
            onClick={() => {
              setOpen(false);
              onImportClick();
            }}
          >
            <span className="font-medium text-ink">Upload CSV file</span>
            <span className="mt-0.5 block text-xs text-ink-subtle">Import users from a spreadsheet</span>
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-control px-2.5 py-2 text-left text-[0.8125rem] text-ink-muted transition-colors duration-200 ease-standard hover:bg-surface-sunken hover:text-ink"
            onClick={() => {
              setOpen(false);
              onDownloadSample();
            }}
          >
            <span className="font-medium text-ink">Download sample file</span>
            <span className="mt-0.5 block text-xs text-ink-subtle">
              Template with required column headers
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
