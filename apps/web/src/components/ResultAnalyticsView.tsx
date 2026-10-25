"use client";

import React, { useState } from "react";
import { Result } from "../lib/types";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Target,
  BarChart3,
  BookOpen,
  ArrowRight,
  RotateCcw,
  FileText,
} from "lucide-react";

interface ResultAnalyticsViewProps {
  result: Result;
  onRetake: () => void;
  onBackToDashboard: () => void;
}

export function ResultAnalyticsView({
  result,
  onRetake,
  onBackToDashboard,
}: ResultAnalyticsViewProps) {
  const [filter, setFilter] = useState<"all" | "correct" | "incorrect" | "unanswered">("all");

  const filteredQuestions = (result.question_results || []).filter((q) => {
    if (filter === "correct") return q.is_correct === true;
    if (filter === "incorrect") return q.is_correct === false && q.student_answer != null;
    if (filter === "unanswered") return q.student_answer == null;
    return true;
  });

  const percentage = result.percentage_score ?? 0;
  const isGoodScore = percentage >= 50;

  return (
    <div className="page-container" style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--border)", marginBottom: "2rem" }}>
        <div>
          <p className="label-tag" style={{ marginBottom: "0.375rem" }}>Performance Report</p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
            Mock Test Results
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--ink-muted)", marginTop: "0.25rem" }}>
            Evaluated on {new Date(result.evaluated_at).toLocaleString()} · Server-authoritative scoring
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.625rem" }}>
          <button onClick={onRetake} className="btn-secondary" style={{ fontSize: "0.8125rem" }}>
            <RotateCcw style={{ width: "0.875rem", height: "0.875rem" }} />
            Retake
          </button>
          <button onClick={onBackToDashboard} className="btn-primary" style={{ fontSize: "0.8125rem" }}>
            Dashboard
            <ArrowRight style={{ width: "0.875rem", height: "0.875rem" }} />
          </button>
        </div>
      </div>

      {/* ── Score summary ───────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>

        {/* Main score */}
        <div className="card-white" style={{ gridColumn: "span 2", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "1rem", right: "1rem", opacity: 0.06 }}>
            <Trophy style={{ width: "5rem", height: "5rem", color: "var(--navy)" }} />
          </div>
          <p className="label-tag" style={{ marginBottom: "0.5rem" }}>Final Score</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            <span style={{ fontSize: "3rem", fontWeight: 900, color: "var(--navy)", letterSpacing: "-0.03em", lineHeight: 1 }}>
              {result.total_score}
            </span>
            <span style={{ fontSize: "1rem", color: "var(--ink-muted)", fontWeight: 500 }}>
              / {result.max_possible_marks} marks
            </span>
          </div>
          <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <span style={{
              fontSize: "0.8125rem",
              fontWeight: 700,
              padding: "0.25rem 0.75rem",
              borderRadius: "9999px",
              ...(isGoodScore
                ? { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }
                : { background: "#fef9c3", color: "#854d0e", border: "1px solid #fde68a" }),
            }}>
              {isGoodScore ? "Good performance" : "Needs more practice"}
            </span>
            <span style={{ fontSize: "0.8125rem", color: "var(--ink-muted)" }}>
              Accuracy: <strong style={{ color: "var(--ink)" }}>{result.accuracy_percentage}%</strong>
            </span>
          </div>
        </div>

        {/* Accuracy */}
        <div className="card-white">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ink-muted)" }}>Accuracy</span>
            <Target style={{ width: "0.875rem", height: "0.875rem", color: "#16a34a" }} />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
            {result.accuracy_percentage}%
          </div>
          <div style={{ marginTop: "0.75rem", height: "6px", background: "#e2e8f0", borderRadius: "9999px", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "#22c55e", width: `${result.accuracy_percentage}%`, borderRadius: "9999px", transition: "width 1s ease" }} />
          </div>
        </div>

        {/* Percentage */}
        <div className="card-white">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ink-muted)" }}>Percentage</span>
            <BarChart3 style={{ width: "0.875rem", height: "0.875rem", color: "var(--navy)" }} />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>
            {result.percentage_score}%
          </div>
          <div style={{ marginTop: "0.75rem", height: "6px", background: "#e2e8f0", borderRadius: "9999px", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "var(--navy)", width: `${result.percentage_score}%`, borderRadius: "9999px", transition: "width 1s ease" }} />
          </div>
        </div>
      </div>

      {/* ── Breakdown pills ─────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "2.5rem" }}>
        <div className="card-white" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.5rem", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CheckCircle2 style={{ width: "1.125rem", height: "1.125rem", color: "#16a34a" }} />
          </div>
          <div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#16a34a" }}>{result.correct_count}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)", fontWeight: 600 }}>Correct</div>
          </div>
        </div>

        <div className="card-white" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.5rem", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <XCircle style={{ width: "1.125rem", height: "1.125rem", color: "#dc2626" }} />
          </div>
          <div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#dc2626" }}>{result.incorrect_count}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)", fontWeight: 600 }}>Incorrect</div>
          </div>
        </div>

        <div className="card-white" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.5rem", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <HelpCircle style={{ width: "1.125rem", height: "1.125rem", color: "#64748b" }} />
          </div>
          <div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--ink)" }}>{result.unanswered_count}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)", fontWeight: 600 }}>Skipped</div>
          </div>
        </div>
      </div>

      {/* ── Detailed Review ─────────────────────────────────────────────── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BookOpen style={{ width: "1rem", height: "1rem", color: "var(--navy)" }} />
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--ink)" }}>
              Detailed Question Review
            </h2>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: "flex", gap: "0.25rem", background: "#f1f5f9", padding: "0.25rem", borderRadius: "0.5rem", border: "1px solid var(--border)" }}>
            {(["all", "correct", "incorrect", "unanswered"] as const).map((f) => {
              const labels: Record<string, string> = {
                all: `All (${result.question_results?.length || 0})`,
                correct: `Correct (${result.correct_count})`,
                incorrect: `Wrong (${result.incorrect_count})`,
                unanswered: `Skipped (${result.unanswered_count})`,
              };
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "0.375rem 0.75rem",
                    borderRadius: "0.375rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    ...(filter === f
                      ? { background: "#fff", color: "var(--ink)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                      : { background: "transparent", color: "var(--ink-muted)" }),
                  }}
                >
                  {labels[f]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Questions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredQuestions.length === 0 && (
            <div className="empty-state">
              <HelpCircle style={{ width: "1.5rem", height: "1.5rem", color: "var(--ink-faint)" }} />
              <p style={{ color: "var(--ink-muted)", fontSize: "0.875rem" }}>No questions match this filter.</p>
            </div>
          )}

          {filteredQuestions.map((q, idx) => {
            const isAnswered = q.student_answer != null;

            return (
              <div
                key={q.question_id}
                className="card-white"
                style={{
                  borderLeft: q.is_correct
                    ? "3px solid #22c55e"
                    : isAnswered
                    ? "3px solid #ef4444"
                    : "3px solid #e2e8f0",
                }}
              >
                {/* Q header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", paddingBottom: "0.875rem", marginBottom: "0.875rem", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.1875rem 0.5rem", borderRadius: "0.25rem", background: "#f1f5f9", color: "var(--ink)" }}>
                    Q{q.question_number}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>Type: {q.question_type}</span>
                  </div>

                  {q.is_correct === true ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.625rem", borderRadius: "0.375rem", background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }}>
                      <CheckCircle2 style={{ width: "0.75rem", height: "0.75rem" }} />
                      Correct (+{q.marks_awarded} marks)
                    </span>
                  ) : isAnswered && q.marks_awarded > 0 ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.625rem", borderRadius: "0.375rem", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                      Partial credit (+{q.marks_awarded} marks)
                    </span>
                  ) : isAnswered ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.625rem", borderRadius: "0.375rem", background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" }}>
                      <XCircle style={{ width: "0.75rem", height: "0.75rem" }} />
                      Wrong ({q.marks_awarded} marks)
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)", padding: "0.25rem 0.625rem", background: "#f1f5f9", borderRadius: "0.375rem" }}>
                      Not attempted
                    </span>
                  )}
                </div>

                {/* Question text */}
                <p style={{ fontSize: "0.9375rem", color: "var(--ink)", lineHeight: 1.65, marginBottom: "1rem", whiteSpace: "pre-line" }}>
                  {q.question_text}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem", padding: "0.75rem 1rem", background: "#f8fafc", borderRadius: "0.375rem", border: "1px solid var(--border)", fontSize: "0.84375rem" }}>
                  <div>
                    <span style={{ color: "var(--ink-muted)", fontWeight: 500 }}>Your answer: </span>
                    <span style={{ fontWeight: 700, color: "var(--ink)", fontFamily: "monospace" }}>{q.student_answer ?? "—"}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--ink-muted)", fontWeight: 500 }}>Correct answer: </span>
                    <span style={{ fontWeight: 700, color: "#166534", fontFamily: "monospace" }}>{q.correct_answer ?? "Withheld"}</span>
                  </div>
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div style={{ padding: "0.875rem 1rem", background: "#eef2ff", borderRadius: "0.5rem", border: "1px solid #c7d2fe" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--navy)", marginBottom: "0.5rem" }}>
                      <FileText style={{ width: "0.875rem", height: "0.875rem" }} />
                      Step-by-step solution
                    </div>
                    <div style={{ fontSize: "0.84375rem", color: "#1e3a8a", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                      {q.explanation}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
