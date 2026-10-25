"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";
import { ShieldCheck, WalletCards } from "lucide-react";
import {
  BillingPlan,
  BillingSubscription,
  cancelBillingSubscription,
  createBillingCheckout,
  fetchBillingPlans,
  fetchMySubscriptions,
  getAuthToken,
} from "../lib/api";

interface PricingPageProps {
  onNavigate: (tab: string) => void;
  onOpenAuth: (mode?: "login" | "register") => void;
}

type RazorpayOptions = {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  currency: string;
  handler: () => void;
  modal: { ondismiss: () => void };
};

type RazorpayInstance = { open: () => void };

export function PricingPage({ onNavigate, onOpenAuth }: PricingPageProps) {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<BillingSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [scriptReady, setScriptReady] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(async () => {
      const signedIn = Boolean(getAuthToken());
      setHasSession(signedIn);
      try {
        const availablePlans = await fetchBillingPlans();
        setPlans(availablePlans);
        if (signedIn) setSubscriptions(await fetchMySubscriptions());
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load pricing information.");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const verifySubscriptionActivation = async () => {
    setNotice("Payment response received. Access is granted only after Razorpay confirms the subscription on the server.");
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        const current = await fetchMySubscriptions();
        setSubscriptions(current);
        if (current.some((item) => item.status === "active")) {
          setNotice("Razorpay confirmed an active subscription. Your account access is updated.");
          return;
        }
      } catch {
        return;
      }
    }
    setNotice("The subscription is still awaiting provider verification. You can check again in your account shortly.");
  };

  const startCheckout = async (plan: BillingPlan) => {
    setError(null);
    setNotice(null);
    if (!getAuthToken()) {
      onOpenAuth("login");
      return;
    }
    setLoadingPlan(plan.id);
    try {
      if (!scriptReady) throw new Error("Secure checkout is loading. Please try again in a moment.");
      const checkout = await createBillingCheckout(plan.id);
      const Razorpay = (window as Window & { Razorpay?: new (options: RazorpayOptions) => RazorpayInstance }).Razorpay;
      if (!Razorpay) throw new Error("Razorpay Checkout could not be loaded.");
      const instance = new Razorpay({
        key: checkout.key_id,
        subscription_id: checkout.subscription_id,
        name: checkout.name,
        description: checkout.description,
        currency: checkout.currency,
        handler: () => { void verifySubscriptionActivation(); },
        modal: { ondismiss: () => setLoadingPlan(null) },
      });
      instance.open();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start secure checkout.");
      setLoadingPlan(null);
    }
  };

  const cancelSubscription = async (subscription: BillingSubscription) => {
    if (!window.confirm("Stop future renewals? Your paid access remains available until its current paid-through date.")) return;
    setError(null);
    try {
      await cancelBillingSubscription(subscription.id);
      setNotice("Cancellation was scheduled. Access remains active through the paid-through date.");
      setSubscriptions(await fetchMySubscriptions());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to schedule cancellation.");
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => setError("Secure checkout could not be loaded. Please try again later.")}
      />
      <main className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <p className="text-sm font-semibold text-blue-700">Plans and access</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-950">Choose preparation access that fits your study plan.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">Plan prices and included examinations are loaded from the platform. Payment confirmation and access are controlled by the server.</p>

        {error && <p role="alert" className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}
        {notice && <p role="status" className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">{notice}</p>}

        <section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-label="Subscription plans">
          {loading ? (
            <p className="text-sm text-slate-500">Loading available plans…</p>
          ) : plans.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">No paid plans are currently available.</p>
          ) : plans.map((plan) => (
            <article key={plan.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">{plan.name}</h2>
              <p className="mt-2 min-h-10 text-sm leading-5 text-slate-600">{plan.description || "Exam preparation access"}</p>
              <p className="mt-5 text-3xl font-bold text-slate-950">
                {new Intl.NumberFormat("en-IN", { style: "currency", currency: plan.currency, maximumFractionDigits: 0 }).format(plan.amount_minor / 100)}
                <span className="ml-1 text-sm font-medium text-slate-500">/{plan.interval_count > 1 ? `${plan.interval_count} ` : ""}{plan.interval_unit.replace("ly", "")}</span>
              </p>
              <p className="mt-3 text-xs text-slate-500">Includes {plan.included_exam_ids.length} examination{plan.included_exam_ids.length === 1 ? "" : "s"} · recurring billing</p>
              <button
                type="button"
                onClick={() => startCheckout(plan)}
                disabled={loadingPlan === plan.id}
                className="mt-6 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
              >
                {loadingPlan === plan.id ? "Opening secure checkout…" : hasSession ? "Continue to checkout" : "Sign in to continue"}
              </button>
            </article>
          ))}
        </section>

        {hasSession && subscriptions.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-slate-950">Your subscriptions</h2>
            <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{subscription.plan_name}</p>
                    <p className="mt-1 text-xs text-slate-500">Status: {subscription.status} · paid through {subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : "not confirmed"}</p>
                    {subscription.cancel_at_cycle_end && <p className="mt-1 text-xs text-amber-700">Renewal cancellation is scheduled.</p>}
                  </div>
                  {subscription.status === "active" && !subscription.cancel_at_cycle_end && (
                    <button type="button" onClick={() => cancelSubscription(subscription)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel renewal</button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <WalletCards className="text-blue-700" size={22} />
            <h2 className="mt-3 font-semibold text-slate-900">Payments</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Checkout uses Razorpay. A browser callback alone never grants access; the server waits for a signed provider webhook.</p>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <ShieldCheck className="text-blue-700" size={22} />
            <h2 className="mt-3 font-semibold text-slate-900">Access protection</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Examinations can be attached to plans. Paid notes still require private file storage and an in-app reader before they can be sold.</p>
          </section>
        </div>
        <button onClick={() => onNavigate("home")} className="mt-8 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Return to exams</button>
      </main>
    </>
  );
}
