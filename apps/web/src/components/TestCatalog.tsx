"use client";

import React, { useState, useEffect } from "react";
import { Exam, Test } from "../lib/types";
import { FALLBACK_TESTS, fetchTests } from "../lib/api";
import {
  Layers,
  Clock,
  Award,
  CheckCircle2,
  PlayCircle,
  HelpCircle,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Info,
  Sparkles,
  Zap,
} from "lucide-react";

interface TestCatalogProps {
  exam: Exam;
  onSelectTest: (test: Test) => void;
}

export function TestCatalog({ exam, onSelectTest }: TestCatalogProps) {
  const [filter, setFilter] = useState<"all" | "full" | "sectional">("all");
  const [selectedInstructionTest, setSelectedInstructionTest] = useState<Test | null>(null);
  const [tests, setTests] = useState<Test[]>(FALLBACK_TESTS);

  useEffect(() => {
    if (exam?.id) {
      fetchTests(exam.id).then((loaded) => {
        if (loaded && loaded.length > 0) {
          setTests(loaded);
        }
      });
    }
  }, [exam?.id]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{exam.code} Official Test Series</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Timed Computer-Based Mock Examinations
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Simulated GATE test papers replicating official examination guidelines, virtual scientific calculators, server-authoritative timer limits, and deterministic question evaluation.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          {[
            { id: "all", label: "All Tests" },
            { id: "full", label: "Full Length Mock" },
            { id: "sectional", label: "Sectional Drills" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === tab.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {tests.length} available papers
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((t) => (
          <div
            key={t.id}
            className="startup-card p-6 bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-400"
          >
            <div>
              {/* Status and Question Count */}
              <div className="flex items-center justify-between mb-3">
                <span className="badge-pill-emerald text-[11px] py-0.5 px-2.5">
                  <span className="pulse-dot bg-emerald-500" />
                  <span>{t.status}</span>
                </span>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                  {t.total_questions} Questions
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="font-bold text-base text-slate-900 mb-1.5 leading-snug">
                {t.title}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                {t.description || "Authentic competitive test paper designed for timing and accuracy practice."}
              </p>

              {/* Meta stats */}
              <div className="space-y-2 py-3.5 border-t border-b border-slate-100 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    Examination Duration
                  </span>
                  <span className="font-semibold text-slate-900">
                    {Math.round(t.duration_seconds / 60)} minutes (3 Hours)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    Total Maximum Marks
                  </span>
                  <span className="font-semibold text-slate-900">
                    {t.total_marks} Marks
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Marking Rules
                  </span>
                  <span className="font-semibold text-slate-900">
                    MCQ (-33%) • MSQ/NAT (0%)
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-5 flex items-center gap-2.5 pt-1">
              <button
                onClick={() => setSelectedInstructionTest(t)}
                className="flex-1 py-2.5 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Instructions</span>
              </button>
              <button
                onClick={() => onSelectTest(t)}
                className="flex-1 py-2.5 px-3 rounded-lg btn-primary-gradient text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PlayCircle className="w-4 h-4 text-blue-100" />
                <span>Launch CBT</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Instructions Modal */}
      {selectedInstructionTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 relative">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {selectedInstructionTest.title}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Please review the computer-based testing guidelines before launching.
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2.5 leading-relaxed max-h-64 overflow-y-auto">
              <div className="font-semibold text-slate-900">Official Testing Rules:</div>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-600">
                <li>
                  Total duration is {Math.round(selectedInstructionTest.duration_seconds / 60)} minutes. The server countdown timer will automatically submit your attempt upon completion.
                </li>
                <li>
                  Questions consist of Multiple Choice Questions (MCQ), Multiple Select Questions (MSQ), and Numerical Answer Type (NAT).
                </li>
                <li>
                  Negative marking applies for incorrect MCQ responses (-0.33 for 1 mark, -0.66 for 2 marks). There is NO negative marking for MSQ and NAT questions.
                </li>
                <li>
                  A virtual scientific calculator is accessible in the upper right header throughout the test.
                </li>
                <li>
                  Detailed worked solutions and question-level analysis are accessible immediately upon submission.
                </li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedInstructionTest(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const target = selectedInstructionTest;
                  setSelectedInstructionTest(null);
                  onSelectTest(target);
                }}
                className="px-5 py-2 rounded-lg btn-primary-gradient text-xs font-semibold cursor-pointer"
              >
                Begin Examination Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
