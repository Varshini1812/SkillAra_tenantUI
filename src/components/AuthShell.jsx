export default function AuthShell({ children }) {
  return (
    <div className="slim-scroll font-sans flex min-h-dvh items-center justify-center bg-canvas px-4 py-10 text-ink">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
