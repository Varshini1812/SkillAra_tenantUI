import { Link } from "react-router-dom";

export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="mb-4 flex items-center gap-2 text-sm text-slate-900" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-2">
          {i > 0 && <span className="text-slate-600">/</span>}
          {item.to ? (
            <Link to={item.to} className="hover:text-indigo-400">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-300">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
