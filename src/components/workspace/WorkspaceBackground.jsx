export default function WorkspaceBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-[#07090f]" />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Gradient orbs */}
      <div className="workspace-orb absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-violet-600/25 blur-[120px]" />
      <div className="workspace-orb workspace-orb-delay absolute -right-20 top-1/3 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-[100px]" />
      <div className="workspace-orb workspace-orb-delay-2 absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-cyan-500/15 blur-[90px]" />

      {/* Diagonal shine */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/10 via-transparent to-blue-900/10" />

      {/* Floating decorative cards (background only) */}
      <div className="workspace-float absolute left-[8%] top-[18%] hidden h-24 w-36 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm xl:block" />
      <div className="workspace-float workspace-float-delay absolute right-[12%] top-[12%] hidden h-20 w-28 rounded-xl border border-violet-500/10 bg-violet-500/5 backdrop-blur-sm xl:block" />
      <div className="workspace-float workspace-float-delay-2 absolute bottom-[20%] left-[15%] hidden h-16 w-24 rounded-lg border border-blue-500/10 bg-blue-500/5 backdrop-blur-sm xl:block" />
    </div>
  );
}
