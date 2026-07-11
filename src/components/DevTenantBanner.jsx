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
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-medium text-amber-900">Local development</p>
      <p className="mt-1 text-sm text-amber-800">
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
          className="flex-1 rounded-lg border border-amber-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          Set & Reload
        </button>
        {saved && <span className="self-center text-sm text-green-600">Reloading...</span>}
      </form>
    </div>
  );
}
