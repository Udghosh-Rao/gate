"use client";

import React from "react";
import {
  Shield,
  Target,
  Heart,
  Code2,
  BookOpen,
  Globe,
  Mail,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { BRAND } from "../lib/brand";

interface AboutPageProps {
  onNavigate: (tab: string) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  const values = [
    {
      icon: Shield,
      title: "Academic integrity first",
      description:
        "Every question is authored and reviewed before publication. We do not auto-generate questions. Marking schemes replicate the official rules for each examination.",
    },
    {
      icon: Target,
      title: "Quality over volume",
      description:
        "We would rather have fifty carefully crafted questions than five thousand mediocre ones. Each question includes step-by-step mathematical solutions, not generic explanations.",
    },
    {
      icon: Heart,
      title: "Honest and transparent",
      description:
        "We do not invent testimonials, fake student counts, or misleading statistics. If something is not ready, we show a clean empty state rather than filling space with fiction.",
    },
    {
      icon: Code2,
      title: "Engineering rigour",
      description:
        "Server-authoritative timers. Precise negative marking. Tolerance-based NAT evaluation. We pay attention to the details that matter to students on exam day.",
    },
  ];

  const roadmap = [
    {
      phase: "Phase 1 — Active",
      title: "GATE DA",
      items: [
        "Syllabus and subject-wise study materials",
        "Topic-wise question bank (MCQ, MSQ, NAT)",
        "Sectional and full-length mock tests",
        "Authentic CBT simulator with scientific calculator",
        "Performance review with worked solutions",
      ],
      status: "active" as const,
    },
    {
      phase: "Phase 2",
      title: "GATE CS",
      items: [
        "Computer Science & Information Technology",
        "Algorithms, DBMS, OS, Theory of Computation",
        "Networks, compiler design, and more",
        "Separate question bank and test series",
      ],
      status: "upcoming" as const,
    },
    {
      phase: "Phase 3",
      title: "IIT JAM & others",
      items: [
        "IIT JAM Mathematics & Statistics",
        "Previous year question banks",
        "Additional competitive examinations",
        "Institutional and bulk-access options",
      ],
      status: "planned" as const,
    },
  ];

  return (
    <div style={{ paddingBottom: "5rem" }}>
      {/* Hero */}
      <section
        className="border-b border-border"
        style={{ padding: "5rem 0" }}
      >
        <div className="page-container">
          <div style={{ maxWidth: "640px" }}>
            <p className="label-tag" style={{ marginBottom: "0.75rem" }}>
              Our story
            </p>
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
              Building a serious competitive-exam preparation platform for India
            </h1>
            <p
              style={{
                fontSize: "1rem",
                color: "var(--ink-muted)",
                lineHeight: 1.7,
                marginBottom: "1rem",
              }}
            >
              {BRAND.name} started from a straightforward observation: students
              preparing for GATE and similar examinations needed more than PDFs
              and basic quizzes. They needed a structured place to study
              concepts, practise consistently, take realistic tests, understand
              their mistakes, and measure their progress.
            </p>
            <p
              style={{
                fontSize: "1rem",
                color: "var(--ink-muted)",
                lineHeight: 1.7,
              }}
            >
              We are starting with GATE Data Science and Artificial Intelligence
              and building deliberately. The platform expands only when the
              content and the experience meet the standard we set for the first
              examination.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="border-b border-border" style={{ padding: "4.5rem 0" }}>
        <div className="page-container">
          <div
            className="card-white"
            style={{
              maxWidth: "700px",
              borderLeft: "3px solid var(--navy)",
            }}
          >
            <p className="label-tag" style={{ marginBottom: "0.75rem" }}>
              Our mission
            </p>
            <p
              style={{
                fontSize: "1.0625rem",
                color: "var(--ink)",
                lineHeight: 1.7,
                marginBottom: "1rem",
                fontWeight: 500,
              }}
            >
              To give every serious competitive-exam aspirant access to
              preparation tools that are rigorous, authentic, and honest — at a
              price that does not exclude students who need it most.
            </p>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "var(--ink-muted)",
                lineHeight: 1.7,
              }}
            >
              The gap between an average score and a great score is rarely
              talent or expensive coaching. It is consistent practice with
              realistic tests, honest performance data, and explanations that
              actually teach.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-b border-border" style={{ padding: "4.5rem 0" }}>
        <div className="page-container">
          <p className="label-tag" style={{ marginBottom: "0.5rem" }}>What we stand for</p>
          <h2 className="section-title" style={{ marginBottom: "2.5rem" }}>
            Our principles
          </h2>
          <div className="grid-4">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div key={value.title} className="card-white">
                  <div
                    style={{
                      width: "2.25rem",
                      height: "2.25rem",
                      borderRadius: "0.5rem",
                      background: "#eef2ff",
                      border: "1px solid #c7d2fe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "0.875rem",
                    }}
                  >
                    <Icon
                      style={{
                        width: "1rem",
                        height: "1rem",
                        color: "#3730a3",
                      }}
                    />
                  </div>
                  <h3
                    style={{
                      fontSize: "0.9375rem",
                      fontWeight: 700,
                      color: "var(--ink)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {value.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.84375rem",
                      color: "var(--ink-muted)",
                      lineHeight: 1.6,
                    }}
                  >
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="border-b border-border" style={{ padding: "4.5rem 0" }}>
        <div className="page-container">
          <p className="label-tag" style={{ marginBottom: "0.5rem" }}>Where we are headed</p>
          <h2 className="section-title" style={{ marginBottom: "2.5rem" }}>
            Product roadmap
          </h2>
          <div className="grid-3">
            {roadmap.map((milestone) => (
              <div
                key={milestone.phase}
                className="card-white"
                style={{
                  borderLeft:
                    milestone.status === "active"
                      ? "3px solid var(--navy)"
                      : "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    marginBottom: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      padding: "0.1875rem 0.5rem",
                      borderRadius: "9999px",
                      ...(milestone.status === "active"
                        ? {
                            background: "#dcfce7",
                            color: "#166534",
                            border: "1px solid #bbf7d0",
                          }
                        : milestone.status === "upcoming"
                        ? {
                            background: "#fef9c3",
                            color: "#854d0e",
                            border: "1px solid #fde68a",
                          }
                        : {
                            background: "#f1f5f9",
                            color: "#64748b",
                            border: "1px solid #e2e8f0",
                          }),
                    }}
                  >
                    {milestone.status === "active"
                      ? "Active"
                      : milestone.status === "upcoming"
                      ? "Upcoming"
                      : "Planned"}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--ink-faint)",
                      fontWeight: 500,
                    }}
                  >
                    {milestone.phase}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "var(--ink)",
                    marginBottom: "1rem",
                  }}
                >
                  {milestone.title}
                </h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {milestone.items.map((item) => (
                    <li
                      key={item}
                      style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}
                    >
                      <CheckCircle2
                        style={{
                          width: "0.875rem",
                          height: "0.875rem",
                          flexShrink: 0,
                          marginTop: "0.125rem",
                          color:
                            milestone.status === "active"
                              ? "#16a34a"
                              : "var(--ink-faint)",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "0.84375rem",
                          color:
                            milestone.status === "active"
                              ? "var(--ink)"
                              : "var(--ink-muted)",
                          lineHeight: 1.5,
                        }}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we do not do */}
      <section className="border-b border-border" style={{ padding: "4.5rem 0" }}>
        <div className="page-container">
          <div style={{ maxWidth: "640px" }}>
            <p className="label-tag" style={{ marginBottom: "0.5rem" }}>Our constraints — by choice</p>
            <h2 className="section-title" style={{ marginBottom: "1.25rem" }}>
              What we are not building
            </h2>
            <p style={{ fontSize: "0.9375rem", color: "var(--ink-muted)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
              There is a temptation in EdTech to add every feature imaginable: live classes, 
              AI tutors, social feeds, gamification, streaks, leaderboards, and complex subscription 
              tiers. We are resisting it deliberately.
            </p>
            <p style={{ fontSize: "0.9375rem", color: "var(--ink-muted)", lineHeight: 1.7 }}>
              Our priority is to do a few things extremely well: organised study materials, 
              a rigorous question bank, authentic mock tests, and honest performance data. 
              Students who need those things will find them here, without noise.
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section style={{ padding: "4.5rem 0" }}>
        <div className="page-container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", maxWidth: "900px" }}>
            <div className="card-white">
              <Globe style={{ width: "1.25rem", height: "1.25rem", color: "var(--navy)", marginBottom: "0.875rem" }} />
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.5rem" }}>
                Work with us
              </h3>
              <p style={{ fontSize: "0.84375rem", color: "var(--ink-muted)", lineHeight: 1.6, marginBottom: "1rem" }}>
                We are a small team of engineers and educators. If you are a subject-matter expert, 
                content writer, or engineer who shares this vision, we would like to hear from you.
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

            <div className="card-white">
              <BookOpen style={{ width: "1.25rem", height: "1.25rem", color: "var(--navy)", marginBottom: "0.875rem" }} />
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.5rem" }}>
                Explore the platform
              </h3>
              <p style={{ fontSize: "0.84375rem", color: "var(--ink-muted)", lineHeight: 1.6, marginBottom: "1rem" }}>
                Browse the syllabus, study materials, and available mock tests. 
                Create a free account to track your attempt history.
              </p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button onClick={() => onNavigate("syllabus")} className="btn-secondary" style={{ fontSize: "0.8125rem" }}>
                  Syllabus
                </button>
                <button onClick={() => onNavigate("tests")} className="btn-primary" style={{ fontSize: "0.8125rem" }}>
                  Mock Tests
                  <ArrowRight style={{ width: "0.875rem", height: "0.875rem" }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
