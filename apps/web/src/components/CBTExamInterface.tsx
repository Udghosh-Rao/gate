"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AttemptQuestion, AttemptAnswer, Result, Test, User } from "../lib/types";
import { saveAttemptAnswer, submitAttempt } from "../lib/api";
import { ScientificCalculator } from "./ScientificCalculator";
import {
  Clock,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  CheckSquare,
  Square,
  HelpCircle,
  Sparkles,
} from "lucide-react";

interface CBTExamInterfaceProps {
  test: Test;
  attemptId: string;
  questions: AttemptQuestion[];
  savedAnswers: AttemptAnswer[];
  remainingSeconds: number;
  currentUser: User | null;
  onFinishTest: (result: Result) => void;
  onExitTest: () => void;
}

export function CBTExamInterface({
  test,
  attemptId,
  questions,
  savedAnswers,
  remainingSeconds,
  currentUser,
  onFinishTest,
  onExitTest,
}: CBTExamInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AttemptAnswer>>(() => {
    const initial = Object.fromEntries(questions.map((q, idx) => [q.id, {
      question_id: q.id,
      selected_option_ids: [],
      numerical_answer: undefined,
      is_marked_for_review: false,
      is_visited: idx === 0,
      time_spent_seconds: 0,
    }])) as Record<string, AttemptAnswer>;
    for (const answer of savedAnswers) initial[answer.question_id] = { ...initial[answer.question_id], ...answer };
    return initial;
  });
  const [timeLeft, setTimeLeft] = useState<number>(remainingSeconds);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);
  const submitHandler = useRef<(() => Promise<void>) | null>(null);
  const pendingSaves = useRef<Map<string, Promise<void>>>(new Map());

  const persistAnswer = async (qId: string, updated: AttemptAnswer) => {
    setSyncStatus("saving");
    setSyncErrorMsg(null);
    try {
      const prior = pendingSaves.current.get(qId) || Promise.resolve();
      const next = prior.catch(() => undefined).then(async () => { await saveAttemptAnswer(attemptId, qId, updated); });
      pendingSaves.current.set(qId, next);
      await next;
      setSyncStatus("saved");
    } catch (err: unknown) {
      setSyncStatus("error");
      setSyncErrorMsg(err instanceof Error ? err.message : "Failed to sync answer to server");
    }
  };

  // Server-authoritative style countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          void submitHandler.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentQ = questions[currentIndex] || questions[0];
  const currentAns = answers[currentQ?.id] || {
    question_id: currentQ?.id,
    selected_option_ids: [],
    numerical_answer: undefined,
    is_marked_for_review: false,
    is_visited: true,
    time_spent_seconds: 0,
  };

  const handleSelectOption = (optId: string) => {
    if (!currentQ) return;
    setAnswers((prev) => {
      const existing = prev[currentQ.id] || { ...currentAns };
      let newSelected: string[] = [];

      if (currentQ.question_type === "MCQ") {
        newSelected = [optId];
      } else if (currentQ.question_type === "MSQ") {
        const curList = existing.selected_option_ids || [];
        if (curList.includes(optId)) {
          newSelected = curList.filter((id) => id !== optId);
        } else {
          newSelected = [...curList, optId];
        }
      }

      const updated = {
        ...existing,
        selected_option_ids: newSelected,
        is_visited: true,
      };
      persistAnswer(currentQ.id, updated);
      return { ...prev, [currentQ.id]: updated };
    });
  };

  const handleNATKeypad = (val: string) => {
    if (!currentQ) return;
    setAnswers((prev) => {
      const existing = prev[currentQ.id] || { ...currentAns };
      let curStr = existing.numerical_answer !== undefined ? String(existing.numerical_answer) : "";

      if (val === "C") {
        curStr = "";
      } else if (val === "BS") {
        curStr = curStr.slice(0, -1);
      } else if (val === ".") {
        if (!curStr.includes(".")) curStr += ".";
      } else if (val === "-") {
        if (curStr.startsWith("-")) curStr = curStr.slice(1);
        else curStr = "-" + curStr;
      } else {
        curStr += val;
      }

      const numVal = curStr === "" || curStr === "-" ? undefined : parseFloat(curStr);
      const updated = {
        ...existing,
        numerical_answer: numVal,
        is_visited: true,
      };
      persistAnswer(currentQ.id, updated);
      return { ...prev, [currentQ.id]: updated };
    });
  };

  const handleClearResponse = () => {
    if (!currentQ) return;
    setAnswers((prev) => {
      const existing = prev[currentQ.id] || { ...currentAns };
      const updated = {
        ...existing,
        selected_option_ids: [],
        numerical_answer: undefined,
      };
      persistAnswer(currentQ.id, updated);
      return { ...prev, [currentQ.id]: updated };
    });
  };

  const handleSaveAndNext = () => {
    if (currentIndex < questions.length - 1) {
      navigateTo(currentIndex + 1);
    }
  };

  const handleMarkForReviewAndNext = () => {
    if (!currentQ) return;
    setAnswers((prev) => {
      const existing = prev[currentQ.id] || { ...currentAns };
      const updated = {
        ...existing,
        is_marked_for_review: !existing.is_marked_for_review,
      };
      persistAnswer(currentQ.id, updated);
      return { ...prev, [currentQ.id]: updated };
    });

    if (currentIndex < questions.length - 1) {
      navigateTo(currentIndex + 1);
    }
  };

  const navigateTo = (idx: number) => {
    setCurrentIndex(idx);
    const targetQ = questions[idx];
    if (targetQ) {
      setAnswers((prev) => ({
        ...prev,
        [targetQ.id]: {
          ...(prev[targetQ.id] || {
            question_id: targetQ.id,
            selected_option_ids: [],
            numerical_answer: undefined,
            is_marked_for_review: false,
            time_spent_seconds: 0,
          }),
          is_visited: true,
        },
      }));
    }
  };

  const getQuestionPaletteState = (qId: string) => {
    const a = answers[qId];
    if (!a || !a.is_visited) return "not-visited";

    const hasAnswer =
      (a.selected_option_ids && a.selected_option_ids.length > 0) ||
      a.numerical_answer !== undefined;

    if (a.is_marked_for_review) {
      return hasAnswer ? "answered-review" : "review";
    }
    return hasAnswer ? "answered" : "not-answered";
  };

  // Palette counts summary
  const summaryCounts = {
    answered: 0,
    not_answered: 0,
    not_visited: 0,
    review: 0,
    answered_review: 0,
  };

  questions.forEach((q) => {
    const state = getQuestionPaletteState(q.id);
    if (state === "answered") summaryCounts.answered++;
    else if (state === "not-answered") summaryCounts.not_answered++;
    else if (state === "not-visited") summaryCounts.not_visited++;
    else if (state === "review") summaryCounts.review++;
    else if (state === "answered-review") summaryCounts.answered_review++;
  });

  const handleSubmitFinal = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const saves = [...pendingSaves.current.values()];
      const saveResults = await Promise.allSettled(saves);
      if (saveResults.some((item) => item.status === "rejected")) {
        throw new Error("Some answers could not be saved. Retry the save before submitting.");
      }
      const result = await submitAttempt(attemptId);
      setShowSubmitModal(false);
      onFinishTest(result);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to submit attempt. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [attemptId, onFinishTest]);

  useEffect(() => {
    submitHandler.current = handleSubmitFinal;
  }, [handleSubmitFinal]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top CBT Banner */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
            GATE
          </div>
          <div>
            <div className="font-bold text-sm text-white leading-tight">{test.title}</div>
            <div className="text-[11px] text-slate-400">Computer Based Test (CBT) Simulation</div>
          </div>
        </div>

        {/* Center / Timer & Calculator */}
        <div className="flex items-center gap-3">
          {syncStatus === "saving" && (
            <span className="text-[11px] text-slate-400 font-medium animate-pulse hidden md:inline">
              Syncing answer...
            </span>
          )}
          {syncStatus === "saved" && (
            <span className="text-[11px] text-emerald-400 font-medium hidden md:inline">
              ✓ Saved
            </span>
          )}
          {syncStatus === "error" && (
            <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 bg-rose-950/60 border border-rose-800/80 px-2 py-0.5 rounded font-medium" title={syncErrorMsg || "Failed to persist answer"}>
              <AlertCircle className="w-3 h-3 text-rose-400" />
              <span>Sync Failed</span>
            </span>
          )}

          <button
            onClick={() => setIsCalculatorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-400 border border-slate-700 transition-colors"
          >
            <Calculator className="w-4 h-4" />
            <span className="hidden sm:inline">Calculator</span>
          </button>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-amber-400 font-mono font-bold text-sm shadow-inner">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Time Left: {formatTimer(timeLeft)}</span>
          </div>
        </div>

        {/* Candidate Profile Widget */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-white">
              {currentUser?.full_name || "Candidate (Guest)"}
            </div>
            <div className="text-[10px] text-slate-400">
              {currentUser ? `ID: ${currentUser.id.slice(0, 8).toUpperCase()}` : "Candidate"}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white border border-slate-700">
            {currentUser?.full_name ? currentUser.full_name[0] : "C"}
          </div>
        </div>
      </header>

      {/* Main Examination Viewport */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left / Center: Question Panel */}
        <div className="flex-1 flex flex-col bg-slate-950 border-r border-slate-800 overflow-y-auto">
          {/* Section & Question Header */}
          <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Type: {currentQ?.question_type}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                +{currentQ?.positive_marks} Marks
              </span>
              <span className="text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                -{currentQ?.negative_marks} Marks
              </span>
            </div>
          </div>

          {/* Question Text */}
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="text-base text-slate-100 font-medium leading-relaxed whitespace-pre-line mb-8">
              {currentQ?.text}
            </div>

            {/* Answer Input depending on Type */}
            {currentQ?.question_type === "MCQ" && (
              <div className="space-y-3 max-w-2xl">
                {currentQ.options.map((opt) => {
                  const isSelected = currentAns.selected_option_ids?.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-600/15 border-blue-500 text-white shadow-md shadow-blue-500/10"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center text-xs font-bold border transition-colors ${
                          isSelected
                            ? "border-blue-400 bg-blue-500 text-white"
                            : "border-slate-600 text-slate-400"
                        }`}
                      >
                        {opt.label}
                      </div>
                      <span className="text-sm">{opt.text}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {currentQ?.question_type === "MSQ" && (
              <div className="space-y-3 max-w-2xl">
                <div className="text-xs text-amber-400/90 font-medium flex items-center gap-1.5 mb-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Multiple Select Question: Select all options that apply.
                </div>
                {currentQ.options.map((opt) => {
                  const isSelected = currentAns.selected_option_ids?.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-indigo-600/15 border-indigo-500 text-white shadow-md shadow-indigo-500/10"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="mt-0.5">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-indigo-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold text-slate-400 mr-2">{opt.label})</span>
                        {opt.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {currentQ?.question_type === "NAT" && (
              <div className="max-w-md bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                <div className="text-xs text-cyan-400 font-semibold mb-3 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4" />
                  Numerical Answer Type (Enter value using on-screen keypad)
                </div>

                <div className="bg-slate-950 border border-slate-700 rounded-xl p-3 text-right text-2xl font-mono font-bold text-white tracking-widest min-h-[50px] mb-4">
                  {currentAns.numerical_answer !== undefined ? currentAns.numerical_answer : "--"}
                </div>

                {/* Virtual Numeric Keypad */}
                <div className="grid grid-cols-3 gap-2">
                  {["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", ".", "-"].map((key) => (
                    <button
                      key={key}
                      onClick={() => handleNATKeypad(key)}
                      className="py-3 bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-sm rounded-lg border border-slate-700 transition-colors"
                    >
                      {key}
                    </button>
                  ))}
                  <button
                    onClick={() => handleNATKeypad("BS")}
                    className="py-3 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-lg border border-slate-700"
                  >
                    Backspace
                  </button>
                  <button
                    onClick={() => handleNATKeypad("C")}
                    className="col-span-2 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-300 font-bold text-xs rounded-lg border border-red-500/30"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkForReviewAndNext}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-colors"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Mark for Review & Next</span>
              </button>
              <button
                onClick={handleClearResponse}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Response</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={currentIndex === 0}
                onClick={() => navigateTo(currentIndex - 1)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 text-xs font-semibold transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <button
                onClick={handleSaveAndNext}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all"
              >
                <span>Save & Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Official GATE Question Palette */}
        <aside className="w-full lg:w-80 bg-slate-900/90 flex flex-col border-t lg:border-t-0 lg:border-l border-slate-800">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Question Palette
            </h3>

            {/* Official Legend Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <div className="cbt-btn cbt-btn-answered scale-75" />
                <span>Answered ({summaryCounts.answered})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="cbt-btn cbt-btn-not-answered scale-75" />
                <span>Not Answered ({summaryCounts.not_answered})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="cbt-btn cbt-btn-not-visited scale-75" />
                <span>Not Visited ({summaryCounts.not_visited})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="cbt-btn cbt-btn-review scale-75" />
                <span>Review ({summaryCounts.review})</span>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <div className="cbt-btn cbt-btn-answered-review scale-75" />
                <span>Answered & Review ({summaryCounts.answered_review})</span>
              </div>
            </div>
          </div>

          {/* Question Palette Buttons Grid */}
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, idx) => {
                const state = getQuestionPaletteState(q.id);
                const isActive = idx === currentIndex;
                let btnClass = "cbt-btn-not-visited";
                if (state === "answered") btnClass = "cbt-btn-answered";
                else if (state === "not-answered") btnClass = "cbt-btn-not-answered";
                else if (state === "review") btnClass = "cbt-btn-review";
                else if (state === "answered-review") btnClass = "cbt-btn-answered-review";

                return (
                  <button
                    key={q.id}
                    onClick={() => navigateTo(idx)}
                    className={`cbt-btn ${btnClass} ${isActive ? "cbt-btn-active ring-2 ring-cyan-400" : ""}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Test Button */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/60">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Submit Examination
            </button>
          </div>
        </aside>
      </div>

      {/* Floating Scientific Calculator Modal */}
      <ScientificCalculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">Exam Submission Summary</h3>
            <p className="text-xs text-slate-400 mb-6">
              Please review your attempt breakdown before final submission. Once submitted, your answers will be evaluated immediately.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-xl font-bold text-emerald-400">{summaryCounts.answered}</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Answered</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-xl font-bold text-rose-400">{summaryCounts.not_answered}</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Not Answered</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-xl font-bold text-purple-400">
                  {summaryCounts.review + summaryCounts.answered_review}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">For Review</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Return to Test
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleSubmitFinal}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <span>Confirm & Submit</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
