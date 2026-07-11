import { useEffect, useRef, useState } from "react";

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
        className="admin-btn-secondary inline-flex items-center gap-2 px-4"
      >
        {importing ? "Importing..." : label}
        <span className="text-xs text-slate-400">▾</span>
      </button>

      {open && (
        <div className="admin-import-menu">
          <button
            type="button"
            className="admin-import-menu-item"
            onClick={() => {
              setOpen(false);
              onImportClick();
            }}
          >
            <span className="font-medium text-slate-800">Upload CSV file</span>
            <span className="mt-0.5 block text-xs text-slate-500">Import users from a spreadsheet</span>
          </button>
          <button
            type="button"
            className="admin-import-menu-item"
            onClick={() => {
              setOpen(false);
              onDownloadSample();
            }}
          >
            <span className="font-medium text-slate-800">Download sample file</span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Template with required column headers
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
