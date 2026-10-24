"use client";

import React, { useState, useEffect } from "react";
import { User, Result } from "../lib/types";
import { fetchStudentAttemptsList } from "../lib/api";
import {
  Clock,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Award,
  Layers,
  FileText,
  AlertCircle,
  PlayCircle,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Target,
  BarChart3,
} from "lucide-react";

interface StudentDashboardProps {
  currentUser: User | null;
  onNavigate: (tab: string) => void;
  onLaunchMockTest: () => void;
  onOpenAuth?: (mode?: "login" | "register") => void;
}

export function StudentDashboard({
  currentUser,
  onNavigate,
  onLaunchMockTest,
  onOpenAuth,
}: StudentDashboardProps) {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setIsLoadingAttempts(true);
      fetchStudentAttemptsList()
        .then((data) => setAttempts(data || []))
        .catch(() => setAttempts([]))
        .finally(() => setIsLoadingAttempts(false));
    }
  }, [currentUser]);

  // Unauthenticated Gate
  if (!currentUser) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="startup-card p-8 sm:p-14 bg-white border border-slate-200 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 mx-auto flex items-center justify-center text-blue-700 mb-5 shadow-xs">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
            Sign In to Access Your Candidate Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
            Your personal attempt history, question evaluations, accuracy trends, and syllabus bookmarks are saved to your verified candidate account.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onOpenAuth && onOpenAuth("login")}
              className="w-full sm:w-auto px-6 py-3 rounded-xl btn-primary-gradient text-xs font-semibold shadow-md cursor-pointer"
            >
              Sign In to Candidate Portal
            </button>
            <button
              onClick={() => onOpenAuth && onOpenAuth("register")}
              className="w-full sm:w-auto px-6 py-3 rounded-xl btn-secondary text-xs font-semibold cursor-pointer"
            >
              Register Candidate Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate real metrics from authentic attempts
  const completedAttempts = attempts.filter(
    (a) => a.status === "EVALUATED" || a.status === "SUBMITTED"
  );
  const totalScoreSum = completedAttempts.reduce((acc, a) => acc + (a.score || 0), 0);
  const avgScore =
    completedAttempts.length > 0
      ? Math.round((totalScoreSum / completedAttempts.length) * 10) / 10
      : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Candidate Profile Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-pill-pulse text-[11px] py-0.5 px-2.5">
              Candidate Portal
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] font-semibold text-emerald-700">Active Aspirant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {currentUser.full_name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verified Account: {currentUser.email} • Role: {currentUser.role}
          </p>
        </div>

        <button
          onClick={onLaunchMockTest}
          className="btn-primary-gradient px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 cursor-pointer"
        >
          <PlayCircle className="w-4 h-4 text-blue-100" />
          <span>Launch CBT Exam</span>
        </button>
      </div>

      {/* Genuine Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="startup-card p-6 bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tests Attempted
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {completedAttempts.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {completedAttempts.length === 0 ? "No completed tests yet" : "Authentic CBT evaluations"}
            </div>
          </div>
        </div>

        <div className="startup-card p-6 bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Average Score
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {avgScore !== null ? `${avgScore} marks` : "—"}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {avgScore !== null ? "Across submitted attempts" : "Calculated upon test completion"}
            </div>
          </div>
        </div>

        <div className="startup-card p-6 bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Target Examination
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              GATE DA
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Data Science &amp; Artificial Intelligence
            </div>
          </div>
        </div>
      </div>

      {/* Historical Attempts Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Test Attempts</h2>
          <button
            onClick={() => onNavigate("tests")}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Browse Available Tests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoadingAttempts ? (
          <div className="text-center py-10 text-xs text-slate-500">
            Loading your examination history...
          </div>
        ) : attempts.length === 0 ? (
          <div className="startup-card p-10 bg-white border border-slate-200 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-900">
                No Previous Test Attempts Recorded
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mt-1">
                You haven&apos;t attempted any tests yet. Launch an official mock test to assess your readiness, timing, and view mathematical worked solutions.
              </p>
            </div>
            <button
              onClick={onLaunchMockTest}
              className="px-6 py-2.5 rounded-xl btn-primary-gradient text-xs font-semibold cursor-pointer shadow-xs inline-flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4 text-blue-100" />
              <span>Take Free Mock Test</span>
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100">
            {attempts.map((att, idx) => (
              <div
                key={att.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-slate-900">
                      Attempt #{attempts.length - idx}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        att.status === "EVALUATED"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {att.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span>Date: {new Date(att.started_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Score: {att.score !== null ? `${att.score} Marks` : "Pending"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate("tests")}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
