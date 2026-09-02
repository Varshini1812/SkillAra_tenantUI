export function SkillAraMark({ className = "h-5 w-5", alt = "" }) {
  return (
    <img
      src="/logo.png"
      alt={alt}
      aria-hidden={alt ? undefined : "true"}
      className={`shrink-0 object-contain ${className}`.trim()}
    />
  );
}

export function SkillAraWordmark({ className = "text-sm font-semibold text-ink" }) {
  return <span className={className}>SkillAra</span>;
}

/** Footer credit: this workspace runs on SkillAra. */
export function PoweredBySkillAra({ compact = false }) {
  if (compact) {
    return (
      <div
        className="flex items-center justify-center py-1 text-ink-subtle"
        title="Powered by SkillAra"
      >
        <SkillAraMark className="h-4 w-4" />
        <span className="sr-only">Powered by SkillAra</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1.5 py-1">
      <span className="text-[0.6875rem] text-ink-subtle">Powered by</span>
      <SkillAraMark className="h-4 w-4" />
      <SkillAraWordmark className="text-[0.6875rem] font-semibold text-ink-muted" />
    </div>
  );
}
