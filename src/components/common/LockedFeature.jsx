import React from "react";

export default function LockedFeature({ title, description, onUpgrade }) {
  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 ring-8 ring-white">
        <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <h3 className="mt-6 text-base font-semibold text-slate-900">Premium Feature: {title}</h3>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        {description}
      </p>
      <div className="mt-6">
        <button
          type="button"
          onClick={() => {
            if (onUpgrade) onUpgrade();
            else window.alert("Contact your platform admin to upgrade your plan.");
          }}
          className="inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Contact Admin to Upgrade
        </button>
      </div>
    </div>
  );
}
