import React from "react";

export default function LockedFeature({ title, description, onUpgrade }) {
  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-surface border border-dashed border-line-strong bg-surface-sunken p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-sunken ring-8 ring-white">
        <svg className="h-8 w-8 text-ink-subtle" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <h3 className="mt-6 text-base font-semibold text-ink">Premium Feature: {title}</h3>
      <p className="mt-2 text-sm text-ink-subtle max-w-sm">
        {description}
      </p>
      <div className="mt-6">
        <button
          type="button"
          onClick={() => {
            if (onUpgrade) onUpgrade();
            else window.alert("Contact your platform admin to upgrade your plan.");
          }}
          className="inline-flex items-center rounded-control bg-brand px-3.5 py-2.5 text-sm font-semibold text-white  hover:bg-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Contact Admin to Upgrade
        </button>
      </div>
    </div>
  );
}
