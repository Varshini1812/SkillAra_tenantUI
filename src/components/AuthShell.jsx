export default function AuthShell({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1117] px-4 py-10">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
