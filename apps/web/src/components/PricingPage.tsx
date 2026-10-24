"use client";

import React from "react";
import {
  CheckCircle2,
  BookOpen,
  ClipboardList,
  Monitor,
  BarChart2,
  Mail,
  ArrowRight,
  HelpCircle,
  Shield,
} from "lucide-react";
import { BRAND } from "../lib/brand";

interface PricingPageProps {
  onNavigate: (tab: string) => void;
}

export function PricingPage({ onNavigate }: PricingPageProps) {
  const included = [
    { icon: BookOpen, text: "Browse syllabus and subject-wise study materials" },
    { icon: ClipboardList, text: "Access all published practice questions and topic-wise question sets" },
    { icon: Monitor, text: "Attempt available mock tests and sectional tests" },
    { icon: BarChart2, text: "Review your scores, explanations, and attempt history after submission" },
    { icon: Shield, text: "No paywall on core preparation features" },
  ];

  const faqs = [
    {
      q: "Is there a cost to use the platform?",
      a: "Our core preparation features — syllabus, study materials, question bank, and mock tests — are available to all registered users. We do not charge for access to these features at this stage. If we introduce paid features in the future, we will communicate this clearly and honestly.",
    },
    {
      q: "Do I need an account to use the platform?",
      a: "You can browse the syllabus and study materials without signing in. To attempt mock tests and track your performance history, you will need a free account. Registration takes under a minute.",
    },
    {
      q: "Are there subscription plans?",
      a: "We do not currently have paid subscription tiers. We are focused on building the content and preparation experience first. When access tiers are introduced, they will be priced affordably and described transparently.",
    },
    {
      q: "Will you offer institutional or bulk access?",
      a: "If you represent a coaching institute, college department, or organization that would like to use the platform for student preparation, write to us. We are open to discussing institutional arrangements.",
    },
    {
      q: "What data do you store about me?",
      a: "We store your account credentials (email and password, hashed), your test attempts, your answers, and your scores. We do not sell your data. Your data is used only to provide you with your performance history.",
    },
  ];

  return (
    <div style={{ paddingBottom: "5rem" }}>
      {/* Hero */}
      <section className="border-b border-border" style={{ padding: "5rem 0" }}>
        <div className="page-container">
          <div style={{ maxWidth: "640px" }}>
            <p className="label-tag" style={{ marginBottom: "0.75rem" }}>Access & pricing</p>
            <h1
              style={{
                fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                color: "var(--ink)",
                marginBottom: "1.25rem",
              }}
            >
              Straightforward access,<br />no surprises
            </h1>
            <p
              style={{
                fontSize: "1rem",
                color: "var(--ink-muted)",
                lineHeight: 1.7,
              }}
            >
              We believe preparation resources should be affordable and accessible. 
              Our platform is available to all registered students at no cost during our current phase. 
              This page explains what is included and answers common questions.
            </p>
          </div>
        </div>
      </section>

      {/* What is included */}
      <section className="border-b border-border" style={{ padding: "4.5rem 0" }}>
        <div className="page-container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "start" }}>
            <div>
              <p className="label-tag" style={{ marginBottom: "0.5rem" }}>What is included</p>
              <h2 className="section-title" style={{ marginBottom: "1.25rem" }}>
                Full access for registered students
              </h2>
              <p style={{ fontSize: "0.9375rem", color: "var(--ink-muted)", lineHeight: 1.7, marginBottom: "1.75rem" }}>
                Create a free account to access everything we have built. We are in our early phase — 
                content is being added regularly as it is reviewed and approved.
              </p>

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
                {included.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.text} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                      <CheckCircle2 style={{ width: "1rem", height: "1rem", color: "#16a34a", flexShrink: 0, marginTop: "0.125rem" }} />
                      <span style={{ fontSize: "0.9375rem", color: "var(--ink)", lineHeight: 1.55 }}>{item.text}</span>
                    </li>
                  );
                })}
              </ul>

              <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button onClick={() => onNavigate("tests")} className="btn-primary">
                  Browse mock tests
                  <ArrowRight style={{ width: "1rem", height: "1rem" }} />
                </button>
                <button onClick={() => onNavigate("syllabus")} className="btn-secondary">
                  View syllabus
                </button>
              </div>
            </div>

            {/* Honest note */}
            <div>
              <div
                className="card-white"
                style={{ borderLeft: "3px solid var(--navy)", marginBottom: "1.25rem" }}
              >
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.625rem" }}>
                  A note on pricing
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)", lineHeight: 1.7 }}>
                  We do not currently charge for access. We are building the content library and preparation 
                  experience first. If and when paid features are introduced — such as extended test series, 
                  downloadable resources, or institutional tools — they will be priced affordably and communicated 
                  transparently, well in advance.
                </p>
              </div>

              <div className="card-white">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <HelpCircle style={{ width: "1rem", height: "1rem", color: "var(--navy)" }} />
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--ink)" }}>
                    Need institutional access?
                  </h3>
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)", lineHeight: 1.65, marginBottom: "1rem" }}>
                  If you represent a coaching institute, college, or organization that wants to use this 
                  platform for student preparation, reach out to discuss options.
                </p>
                <a
                  href={`mailto:${BRAND.contactEmail}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    fontSize: "0.84375rem",
                    fontWeight: 600,
                    color: "var(--navy)",
                    textDecoration: "none",
                  }}
                >
                  <Mail style={{ width: "0.875rem", height: "0.875rem" }} />
                  {BRAND.contactEmail}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "4.5rem 0" }}>
        <div className="page-container" style={{ maxWidth: "760px" }}>
          <p className="label-tag" style={{ marginBottom: "0.5rem" }}>Common questions</p>
          <h2 className="section-title" style={{ marginBottom: "2.5rem" }}>
            Frequently asked
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {faqs.map((faq, i) => (
              <div
                key={faq.q}
                style={{
                  padding: "1.5rem 0",
                  borderBottom: i < faqs.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <h3
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    color: "var(--ink)",
                    marginBottom: "0.625rem",
                    lineHeight: 1.4,
                  }}
                >
                  {faq.q}
                </h3>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--ink-muted)",
                    lineHeight: 1.7,
                  }}
                >
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

          <div
            className="card-white"
            style={{ marginTop: "3rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}
          >
            <div style={{ flex: 1, minWidth: "200px" }}>
              <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.25rem" }}>
                Still have a question?
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)" }}>
                Write to us and we will respond within two working days.
              </p>
            </div>
            <a
              href={`mailto:${BRAND.supportEmail}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.625rem 1.25rem",
                borderRadius: "0.375rem",
                background: "var(--navy)",
                color: "#fff",
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              <Mail style={{ width: "0.875rem", height: "0.875rem" }} />
              {BRAND.supportEmail}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
