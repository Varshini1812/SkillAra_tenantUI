import PanelCloseButton from "./PanelCloseButton.jsx";

export default function Drawer({ open, onClose, title, subtitle, children, footer, width = "max-w-2xl" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close panel"
      />
      <aside
        className={`relative z-10 flex h-full w-full ${width} flex-col border-l border-slate-200 bg-white shadow-2xl`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 id="drawer-title" className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <PanelCloseButton onClick={onClose} />
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">{children}</div>
        {footer && (
          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </footer>
        )}
      </aside>
    </div>
  );
}
