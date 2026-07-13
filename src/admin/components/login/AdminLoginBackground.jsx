export default function AdminLoginBackground({ variant = "super" }) {
  const accent = variant === "super" ? "from-indigo-100/40" : "from-emerald-100/30";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-slate-50" aria-hidden>
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} via-white to-slate-50`} />
      <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-violet-200/25 blur-3xl" />
    </div>
  );
}
