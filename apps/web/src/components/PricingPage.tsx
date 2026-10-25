"use client";

import React from "react";
import { ShieldCheck, WalletCards } from "lucide-react";

interface PricingPageProps { onNavigate: (tab: string) => void; }

export function PricingPage({ onNavigate }: PricingPageProps) {
  return (
    <main className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
      <p className="text-sm font-semibold text-blue-700">Access and privacy</p>
      <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-slate-950">Straightforward access to available preparation content.</h1>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <WalletCards className="text-blue-700" size={22} />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">Payments</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">There is no payment or checkout feature in the current application. No paid plan is offered through this site.</p>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <ShieldCheck className="text-blue-700" size={22} />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">Account data</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">The application stores account details, test attempts, saved answers, and results to provide its features. A project owner must provide and review the public privacy notice and terms before launch.</p>
        </section>
      </div>
      <button onClick={() => onNavigate("home")} className="mt-8 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Return to exams</button>
    </main>
  );
}
