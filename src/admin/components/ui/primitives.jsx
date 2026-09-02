import { useId } from "react";
import Icon from "./Icon.jsx";

/**
 * The single component layer for the admin console.
 *
 * Contract lives in design-system/skillara/MASTER.md. Everything here is driven
 * by the tokens in src/index.css — no raw hex, no palette literals.
 *
 * Sizing floors: 32px (sm) / 36px (md) / 44px (lg) so every control clears the
 * WCAG 2.2 24x24 CSS px target minimum with room to spare.
 */

/* ==========================================================================
   Buttons
   ========================================================================== */

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-control font-semibold " +
  "transition-colors duration-200 ease-standard disabled:cursor-not-allowed disabled:opacity-50";

const BUTTON_SIZES = {
  sm: "min-h-8 px-3 text-[0.8125rem]",
  md: "min-h-9 px-4 text-sm",
  lg: "min-h-11 px-5 text-base",
};

const BUTTON_VARIANTS = {
  primary: "bg-brand text-brand-fg hover:bg-brand-hover active:bg-brand-active",
  secondary:
    "border border-line-strong bg-surface text-ink-muted hover:bg-surface-sunken hover:text-ink",
  ghost: "text-ink-muted hover:bg-surface-sunken hover:text-ink",
  danger: "bg-danger text-white hover:bg-danger-hover",
  dangerSubtle:
    "border border-danger-border bg-danger-subtle text-danger hover:bg-danger-border",
  /* For buttons painted with a tenant's own brand colour via inline style.
     An inline background always beats a hover:bg-* class, so hover feedback
     has to come from a property the inline style does not set. */
  tenant: "transition-opacity hover:opacity-90 active:opacity-80",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  disabled = false,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${BUTTON_BASE} ${BUTTON_SIZES[size]} ${BUTTON_VARIANTS[variant]} ${className}`.trim()}
      {...props}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}

/** Icon-only button. Always requires a `label` — it is the accessible name. */
export function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  className = "",
  ...props
}) {
  const box = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-11 w-11" : "h-9 w-9";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex ${box} shrink-0 items-center justify-center rounded-control transition-colors duration-200 ease-standard disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_VARIANTS[variant]} ${className}`.trim()}
      {...props}
    >
      <Icon name={icon} size={size === "sm" ? 16 : 18} />
    </button>
  );
}

/* ==========================================================================
   Surfaces
   ========================================================================== */

export function Card({ children, className = "", hover = false, as: Tag = "div", ...props }) {
  return (
    <Tag
      className={`rounded-surface border border-line bg-surface ${
        hover
          ? "transition-colors duration-200 ease-standard hover:border-line-strong"
          : ""
      } ${className}`.trim()}
      {...props}
    >
      {children}
    </Tag>
  );
}

/** Page title block. `actions` sits on the right and holds the single primary CTA. */
export function PageHeader({ title, description, actions, breadcrumb }) {
  return (
    <div className="mb-5">
      {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold leading-7 tracking-[-0.01em] text-ink">{title}</h1>
          {description && (
            <p className="mt-1 max-w-[75ch] text-[0.8125rem] leading-5 text-ink-muted">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function SectionHeading({ children, actions, id }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <h2 id={id} className="text-[0.9375rem] font-semibold text-ink">
        {children}
      </h2>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ==========================================================================
   Form fields
   ========================================================================== */

/**
 * Wraps any control with its label, hint and error, and wires the ARIA between
 * them. Errors render below the field and are announced (`error-placement`,
 * `aria-live-errors`).
 */
export function Field({ label, hint, error, required, htmlFor, children, className = "" }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-ink-muted">
          {label}
          {required && (
            <span className="text-danger" aria-hidden="true">
              {" "}
              *
            </span>
          )}
          {required && <span className="sr-only"> (required)</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="mt-1.5 text-xs text-ink-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${htmlFor}-error`}
          className="mt-1.5 flex items-start gap-1.5 text-xs text-danger"
          role="alert"
        >
          <Icon name="danger" size={14} className="mt-px" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

const CONTROL =
  "w-full rounded-control border bg-surface px-2.5 py-1.5 text-base sm:text-[0.8125rem] text-ink " +
  "transition-[border-color,box-shadow] duration-200 ease-standard " +
  "focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand-muted " +
  "disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-60 " +
  "read-only:bg-surface-sunken read-only:text-ink-muted";

function describedBy(id, hint, error) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export function Input({ label, hint, error, id, required, className = "", ...props }) {
  const auto = useId();
  const inputId = id || `in-${auto}`;
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={inputId}
      className={className}
    >
      <input
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId, hint, error)}
        className={`${CONTROL} ${error ? "border-danger" : "border-line-strong"}`}
        {...props}
      />
    </Field>
  );
}

export function Textarea({ label, hint, error, id, required, className = "", rows = 4, ...props }) {
  const auto = useId();
  const inputId = id || `ta-${auto}`;
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={inputId}
      className={className}
    >
      <textarea
        id={inputId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId, hint, error)}
        className={`${CONTROL} ${error ? "border-danger" : "border-line-strong"}`}
        {...props}
      />
    </Field>
  );
}

export function Select({
  label,
  hint,
  error,
  id,
  required,
  options = [],
  children,
  className = "",
  ...props
}) {
  const auto = useId();
  const selectId = id || `sel-${auto}`;
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={selectId}
      className={className}
    >
      <select
        id={selectId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(selectId, hint, error)}
        className={`${CONTROL} ${error ? "border-danger" : "border-line-strong"}`}
        {...props}
      >
        {children ??
          options.map((opt) =>
            typeof opt === "string" ? (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ) : (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            )
          )}
      </select>
    </Field>
  );
}

export function Checkbox({ label, hint, id, className = "", ...props }) {
  const auto = useId();
  const boxId = id || `cb-${auto}`;
  return (
    <div className={`flex items-start gap-2.5 ${className}`.trim()}>
      <input
        type="checkbox"
        id={boxId}
        aria-describedby={hint ? `${boxId}-hint` : undefined}
        className="mt-0.5 h-4.5 w-4.5 shrink-0 cursor-pointer rounded-chip border-line-strong text-brand accent-[var(--color-brand)]"
        {...props}
      />
      {label && (
        <div className="min-w-0">
          <label htmlFor={boxId} className="block text-sm text-ink">
            {label}
          </label>
          {hint && (
            <p id={`${boxId}-hint`} className="mt-0.5 text-xs text-ink-subtle">
              {hint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Focusable summary rendered at the top of a form after a failed submit, with a
 * link to each invalid field (`error-summary`, `focus-management`).
 */
export function ErrorSummary({ errors = {}, labels = {}, title = "Please fix the following", id }) {
  const entries = Object.entries(errors).filter(([, msg]) => Boolean(msg));
  if (entries.length === 0) return null;

  return (
    <div
      id={id}
      tabIndex={-1}
      role="alert"
      className="mb-5 rounded-surface border border-danger-border bg-danger-subtle p-4"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-danger">
        <Icon name="danger" size={16} />
        {title}
      </p>
      <ul className="mt-2 space-y-1 pl-6 text-sm text-danger">
        {entries.map(([field, message]) => (
          <li key={field} className="list-disc">
            <a href={`#${field}`} className="underline underline-offset-2">
              {labels[field] || field}: {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ==========================================================================
   Status
   ========================================================================== */

const BADGE_VARIANTS = {
  default: "border-line bg-surface-sunken text-ink-muted",
  neutral: "border-line bg-surface-sunken text-ink-muted",
  brand: "border-brand-border bg-brand-subtle text-brand-hover",
  info: "border-brand-border bg-brand-subtle text-brand-hover",
  success: "border-success-border bg-success-subtle text-success",
  warning: "border-warning-border bg-warning-subtle text-warning",
  error: "border-danger-border bg-danger-subtle text-danger",
  danger: "border-danger-border bg-danger-subtle text-danger",
};

const BADGE_ICONS = {
  success: "success",
  warning: "warning",
  error: "danger",
  danger: "danger",
};

/**
 * Meaning is never carried by colour alone — the label is always present, and
 * status variants also carry an icon (`color-not-only`).
 */
export function Badge({ children, variant = "default", icon = true, className = "" }) {
  const iconName = icon ? BADGE_ICONS[variant] : null;
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        BADGE_VARIANTS[variant] || BADGE_VARIANTS.default
      } ${className}`.trim()}
    >
      {iconName && <Icon name={iconName} size={12} />}
      <span className="truncate">{children}</span>
    </span>
  );
}

/** Dot + label pair for table status cells, where a full badge is too heavy. */
export function StatusDot({ variant = "default", children }) {
  const dot = {
    default: "bg-ink-subtle",
    success: "bg-success",
    warning: "bg-warning",
    error: "bg-danger",
    danger: "bg-danger",
    brand: "bg-brand",
  }[variant];

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm text-ink">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
      {children}
    </span>
  );
}

/* ==========================================================================
   Loading and empty
   ========================================================================== */

export function Skeleton({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-control bg-surface-sunken ${className}`.trim()}
    />
  );
}

/** Skeleton shaped like the table it replaces, so nothing shifts on load. */
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="p-4" aria-hidden="true">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-line py-3 last:border-0">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className={`h-4 ${c === 0 ? "w-1/3" : "flex-1"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Never leave a blank region — explain and offer the next action. */
export function EmptyState({ icon = "inbox", title, description, action, className = "" }) {
  return (
    <div className={`flex flex-col items-center px-6 py-10 text-center ${className}`.trim()}>
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-sunken text-ink-subtle">
        <Icon name={icon} size={24} />
      </span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && (
        <p className="mt-1 max-w-[48ch] text-[0.8125rem] text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Load failure always offers a recovery path (`error-recovery`). */
export function ErrorState({ title = "Could not load this", description, onRetry }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-subtle text-danger">
        <Icon name="warning" size={24} />
      </span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && (
        <p className="mt-1 max-w-[48ch] text-[0.8125rem] text-ink-muted">{description}</p>
      )}
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          <Icon name="refresh" size={16} />
          Try again
        </Button>
      )}
    </div>
  );
}

/* ==========================================================================
   Table
   ========================================================================== */

/** Horizontal scroll lives inside the table, never on the page body. */
export function TableWrap({ children, className = "" }) {
  return (
    <div className={`overflow-hidden rounded-surface border border-line bg-surface ${className}`.trim()}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function Table({ children, busy = false, className = "", ...props }) {
  return (
    <table
      aria-busy={busy || undefined}
      className={`w-full min-w-[640px] border-collapse text-left text-[0.8125rem] leading-5 ${className}`.trim()}
      {...props}
    >
      {children}
    </table>
  );
}

export function Th({ children, className = "", ...props }) {
  return (
    <th
      scope="col"
      className={`border-b border-line bg-surface-sunken px-3.5 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.04em] whitespace-nowrap text-ink-subtle ${className}`.trim()}
      {...props}
    >
      {children}
    </th>
  );
}

/**
 * Sortable column header. Exposes the current sort to assistive tech via
 * `aria-sort` and shows direction with an icon, not colour (`sortable-table`).
 */
export function SortableTh({ children, sortKey, sort, onSort, className = "" }) {
  const active = sort?.key === sortKey;
  const direction = active ? sort.direction : null;
  const ariaSort = active ? (direction === "asc" ? "ascending" : "descending") : "none";
  const next = active && direction === "asc" ? "desc" : "asc";

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`border-b border-line bg-surface-sunken px-3.5 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.04em] whitespace-nowrap text-ink-subtle ${className}`.trim()}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey, next)}
        className="inline-flex items-center gap-1.5 rounded-control py-0.5 uppercase tracking-wide transition-colors duration-150 ease-standard hover:text-ink"
      >
        {children}
        <Icon
          name={active ? (direction === "asc" ? "sortAsc" : "sortDesc") : "sort"}
          size={14}
          className={active ? "text-brand" : "text-ink-subtle"}
        />
        <span className="sr-only">
          {active
            ? `sorted ${direction === "asc" ? "ascending" : "descending"}, activate to sort ${next === "asc" ? "ascending" : "descending"}`
            : "activate to sort"}
        </span>
      </button>
    </th>
  );
}

export function Td({ children, className = "", ...props }) {
  return (
    <td className={`px-3.5 py-2 align-middle text-ink-muted ${className}`.trim()} {...props}>
      {children}
    </td>
  );
}

export function Tr({ children, className = "", ...props }) {
  return (
    <tr
      className={`border-b border-line transition-colors duration-150 ease-standard last:border-0 hover:bg-surface-sunken ${className}`.trim()}
      {...props}
    >
      {children}
    </tr>
  );
}

/**
 * Appears in place of the filter bar once rows are selected, so bulk editing never
 * means repeating a per-row action (`Bulk Actions`).
 */
export function BulkActionBar({ count, itemLabel = "item", onClear, children }) {
  if (!count) return null;
  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-surface border border-brand-border bg-brand-subtle p-3"
      role="region"
      aria-label="Bulk actions"
    >
      <p className="text-sm font-medium text-brand-hover">
        {count} {count === 1 ? itemLabel : `${itemLabel}s`} selected
      </p>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {children}
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}

/* ==========================================================================
   Metrics
   ========================================================================== */

/**
 * Dashboard metric. `delta` is a signed number; direction is shown with an icon
 * and a sign as well as colour, and `deltaLabel` says what it is measured against.
 */
export function StatCard({ label, value, prefix = "", suffix = "", delta, deltaLabel, loading }) {
  if (loading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="mt-3 h-7 w-20" />
      </Card>
    );
  }

  const up = typeof delta === "number" && delta > 0;
  const down = typeof delta === "number" && delta < 0;

  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-ink-subtle">{label}</p>
      <p className="tabular mt-1.5 text-2xl font-semibold leading-8 tracking-[-0.01em] text-ink">
        {prefix}
        {typeof value === "number" ? value.toLocaleString() : value}
        {suffix}
      </p>
      {typeof delta === "number" && (
        <p
          className={`mt-2 flex items-center gap-1 text-xs font-medium ${
            up ? "text-success" : down ? "text-danger" : "text-ink-subtle"
          }`}
        >
          <Icon name={up ? "sortAsc" : down ? "sortDesc" : "minus"} size={12} />
          <span className="tabular">
            {up ? "+" : ""}
            {delta}
          </span>
          {deltaLabel && <span className="font-normal text-ink-subtle">{deltaLabel}</span>}
        </p>
      )}
    </Card>
  );
}
