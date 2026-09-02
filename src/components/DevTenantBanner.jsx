import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { buildTenantUrl } from "../utils/tenant.js";

/** Shown only on plain localhost (no subdomain) during local dev. */
export default function DevTenantBanner() {
  const { updateDevTenant } = useAuth();
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    updateDevTenant(value);
    setSaved(true);
  };

  return (
    <div className="mb-6 rounded-surface border border-warning-border bg-warning-subtle p-4">
      <p className="text-sm font-medium text-warning">Local development</p>
      <p className="mt-1 text-sm text-warning">
        Use a tenant subdomain URL like{" "}
        <a href={buildTenantUrl("acme")} className="font-mono underline">
          acme.localhost:5173
        </a>
        , or set a fallback tenant below.
      </p>
      <form onSubmit={handleSave} className="mt-2 flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. acme"
          className="flex-1 rounded-control border border-warning-border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-control bg-warning px-4 py-2 text-sm font-medium text-white hover:bg-warning"
        >
          Set & Reload
        </button>
        {saved && <span className="self-center text-sm text-success">Reloading...</span>}
      </form>
    </div>
  );
}
