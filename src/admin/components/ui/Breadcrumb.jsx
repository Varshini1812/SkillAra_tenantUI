import { Link } from "react-router-dom";
import Icon from "./Icon.jsx";

/**
 * `items` is ordered root-first. The last item is the current page and is not a
 * link — it carries `aria-current="page"` instead.
 */
export default function Breadcrumb({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1.5">
              {i > 0 && (
                <Icon name="chevronRight" size={14} className="text-ink-subtle" />
              )}
              {item.to && !last ? (
                <Link
                  to={item.to}
                  className="rounded-control text-ink-muted transition-colors duration-150 ease-standard hover:text-brand-hover hover:underline underline-offset-2"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="font-semibold text-ink">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
