"use client";

import React, { useState, useEffect } from "react";
import { User, Exam, Test, Result, AttemptQuestion } from "../lib/types";
import {
  getStoredUser,
  startAttempt,
  fetchExams,
  fetchTests,
  apiGetMe,
} from "../lib/api";
import { BRAND } from "../lib/brand";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { CBTExamInterface } from "../components/CBTExamInterface";
import { ResultAnalyticsView } from "../components/ResultAnalyticsView";
import { SyllabusExplorer } from "../components/SyllabusExplorer";
import { TestCatalog } from "../components/TestCatalog";
import { AdminDashboard } from "../components/AdminDashboard";
import { StudentDashboard } from "../components/StudentDashboard";
import { PricingPage } from "../components/PricingPage";
import { AboutPage } from "../components/AboutPage";
import { AuthModal } from "../components/AuthModal";
import {
  BookOpen,
  FileText,
  BarChart2,
  ArrowRight,
  ChevronRight,
  Monitor,
  Clock,
  Shield,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Zap,
  Target,
  Trophy,
  Calculator,
  Award,
  Layers,
  GraduationCap,
  Star,
  Users,
  PlayCircle,
  Sliders,
  ChevronDown,
} from "lucide-react";

// ─── Fallback exam list when API is unavailable ───────────────────────────────
const FALLBACK_EXAMS: Exam[] = [
  {
    id: "gate-da",
    name: "GATE Data Science & Artificial Intelligence",
    code: "GATE-DA",
    slug: "gate-da",
    description: "Probability, Linear Algebra, Machine Learning, Deep Learning, and AI algorithms.",
    status: "ACTIVE" as const,
    default_duration_seconds: 10800,
    default_total_marks: 100,
  },
  {
    id: "gate-cs",
    name: "GATE Computer Science & Information Technology",
    code: "GATE-CS",
    slug: "gate-cs",
    description: "Algorithms, Data Structures, Operating Systems, Computer Networks, and DBMS.",
    status: "ACTIVE" as const,
    default_duration_seconds: 10800,
    default_total_marks: 100,
  },
];

export default function Home() {
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [exams, setExams] = useState<Exam[]>(FALLBACK_EXAMS);
  const [selectedExam, setSelectedExam] = useState<Exam>(FALLBACK_EXAMS[0]);

  // CBT State
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [activeAttemptId, setActiveAttemptId] = useState<string>("");
  const [activeQuestions, setActiveQuestions] = useState<AttemptQuestion[]>([]);
  const [activeResult, setActiveResult] = useState<Result | null>(null);

  const handleOpenAuth = (mode?: "login" | "register") => {
    setAuthModalMode(mode || "login");
    setShowAuthModal(true);
  };

  useEffect(() => {
    apiGetMe().then((user) => {
      if (user) setCurrentUser(user);
    });
    fetchExams().then((loadedExams) => {
      if (loadedExams && loadedExams.length > 0) {
        setExams(loadedExams);
        setSelectedExam((prev) => {
          const match = loadedExams.find((e) => e.id === prev.id || e.code === prev.code);
          return match || loadedExams[0];
        });
      }
    });
  }, []);

  const handleLaunchMockTest = async (testToLaunch?: Test) => {
    if (!testToLaunch) {
      try {
        const tests = await fetchTests(selectedExam.id);
        if (tests && tests.length > 0) {
          testToLaunch = tests[0];
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (!testToLaunch) {
      setCurrentTab("tests");
      return;
    }

    try {
      setActiveTest(testToLaunch);
      const attempt = await startAttempt(testToLaunch.id);
      setActiveAttemptId(attempt.id);
      setActiveQuestions(attempt.questions);
      setCurrentTab("cbt");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start test attempt.";
      alert(msg);
      if (msg.includes("logged in")) {
        handleOpenAuth("login");
      }
      setCurrentTab("tests");
    }
  };

  const handleFinishTest = (result: Result) => {
    setActiveResult(result);
    setCurrentTab("result");
  };

  const handleRetake = () => {
    if (activeTest) handleLaunchMockTest(activeTest);
  };

  const handleAddExam = (newExam: Exam) => {
    setExams((prev) => [newExam, ...prev]);
    setSelectedExam(newExam);
  };

  // Full-screen CBT mode
  if (currentTab === "cbt" && activeTest) {
    return (
      <CBTExamInterface
        test={activeTest}
        attemptId={activeAttemptId}
        questions={activeQuestions}
        currentUser={currentUser}
        onFinishTest={handleFinishTest}
        onExitTest={() => setCurrentTab("tests")}
      />
    );
  }

  // Result view
  if (currentTab === "result" && activeResult) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          exams={exams}
          selectedExam={selectedExam}
          setSelectedExam={setSelectedExam}
          onLaunchMockTest={() => handleLaunchMockTest()}
          onOpenAuth={handleOpenAuth}
        />
        <main className="flex-1">
          <ResultAnalyticsView
            result={activeResult}
            onRetake={handleRetake}
            onBackToDashboard={() => setCurrentTab("home")}
          />
        </main>
        <Footer onNavigate={setCurrentTab} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        exams={exams}
        selectedExam={selectedExam}
        setSelectedExam={setSelectedExam}
        onLaunchMockTest={() => handleLaunchMockTest()}
        onOpenAuth={handleOpenAuth}
      />

      <main className="flex-1">
        {currentTab === "syllabus" && <SyllabusExplorer exam={selectedExam} />}

        {currentTab === "tests" && (
          <TestCatalog exam={selectedExam} onSelectTest={(t) => handleLaunchMockTest(t)} />
        )}

        {currentTab === "admin" && (
          <AdminDashboard
            currentUser={currentUser}
            exams={exams}
            onAddExam={handleAddExam}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentTab === "dashboard" && (
          <StudentDashboard
            currentUser={currentUser}
            onNavigate={setCurrentTab}
            onLaunchMockTest={() => handleLaunchMockTest()}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentTab === "pricing" && <PricingPage onNavigate={setCurrentTab} />}

        {currentTab === "about" && <AboutPage onNavigate={setCurrentTab} />}

        {/* ── HOME ──────────────────────────────────────────────────────── */}
        {currentTab === "home" && (
          <HomePage
            exams={exams}
            selectedExam={selectedExam}
            onSelectExam={setSelectedExam}
            onNavigate={setCurrentTab}
            onOpenAuth={handleOpenAuth}
            onLaunchMockTest={handleLaunchMockTest}
            currentUser={currentUser}
          />
        )}
      </main>

      <Footer onNavigate={setCurrentTab} />

      <AuthModal
        isOpen={showAuthModal}
        initialMode={authModalMode}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setShowAuthModal(false);
        }}
      />
    </div>
  );
}

// ─── High-Impact Modern Startup Homepage ─────────────────────────────────────
interface HomePageProps {
  exams: Exam[];
  selectedExam: Exam;
  onSelectExam: (exam: Exam) => void;
  onNavigate: (tab: string) => void;
  onOpenAuth: (mode?: "login" | "register") => void;
  onLaunchMockTest: () => void;
  currentUser: User | null;
}

function HomePage({
  exams,
  selectedExam,
  onSelectExam,
  onNavigate,
  onOpenAuth,
  onLaunchMockTest,
  currentUser,
}: HomePageProps) {
  // Interactive Demo Question State
  const [selectedDemoAnswer, setSelectedDemoAnswer] = useState<number | null>(null);
  const [showDemoExplanation, setShowDemoExplanation] = useState(false);

  // Interactive GATE Score Estimator State
  const [estimatedMarks, setEstimatedMarks] = useState<number>(68);

  // Calculate projected GATE Score & AIR
  const projectedScore = Math.min(
    1000,
    Math.round(350 + (estimatedMarks / 100) * 650)
  );
  const projectedAir =
    estimatedMarks >= 80
      ? "Top 25 (AIR 1 - 25)"
      : estimatedMarks >= 70
      ? "Top 120 (AIR 26 - 120)"
      : estimatedMarks >= 60
      ? "Top 450 (AIR 121 - 450)"
      : estimatedMarks >= 50
      ? "Top 1200 (AIR 451 - 1200)"
      : "Top 3500";

  // Demo Question data
  const demoQuestion = {
    subject: "Machine Learning & Probability (GATE DA)",
    type: "MCQ (1 Mark, Negative 0.33)",
    text: "Consider a binary classification model evaluated on 100 test samples. The confusion matrix shows 40 True Positives (TP), 10 False Positives (FP), 10 False Negatives (FN), and 40 True Negatives (TN). What is the Precision of this classifier?",
    options: [
      { id: 0, text: "0.80 (80%)", isCorrect: true },
      { id: 1, text: "0.67 (67%)", isCorrect: false },
      { id: 2, text: "0.75 (75%)", isCorrect: false },
      { id: 3, text: "0.50 (50%)", isCorrect: false },
    ],
    explanation:
      "Precision is defined as the proportion of true positive predictions among all positive predictions made by the model:\n\nPrecision = TP / (TP + FP) = 40 / (40 + 10) = 40 / 50 = 0.80 (80%).\n\nNotice that Recall is also TP / (TP + FN) = 40 / (40 + 10) = 0.80.",
  };

  const subjectsPreview = [
    {
      title: "Probability & Statistics",
      weightage: "18% Weightage",
      topics: "Bayes Theorem, Random Variables, Joint Distributions, Central Limit Theorem",
      difficulty: "High Scoring",
    },
    {
      title: "Linear Algebra",
      weightage: "14% Weightage",
      topics: "Eigenvalues & Eigenvectors, SVD, PCA, Rank-Nullity, Vector Spaces",
      difficulty: "Concept-Heavy",
    },
    {
      title: "Machine Learning",
      weightage: "22% Weightage",
      topics: "SVM, Decision Trees, Ridge/Lasso Regularization, Gradient Boosting, Clustering",
      difficulty: "High Weightage",
    },
    {
      title: "Artificial Intelligence",
      weightage: "16% Weightage",
      topics: "A* Search, Minimax, Alpha-Beta Pruning, Propositional & First-Order Logic",
      difficulty: "Algorithmic",
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* ── 1. HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative pt-12 sm:pt-20 pb-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Value Proposition & CTAs (7 cols) */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Pulsing Announcement Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>GATE 2025/2026 Academic Series</span>
                <span className="text-blue-300">•</span>
                <span className="text-blue-700">Early Access — Free for Aspirants</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.18]">
                Crack Competitive Exams<br />
                <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-700 bg-clip-text text-transparent">
                  with Deterministic Precision.
                </span>
              </h1>

              {/* High-conversion Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                India&apos;s dedicated preparation platform for{" "}
                <strong className="text-slate-900 font-semibold">GATE DA &amp; GATE CS</strong>.
                Authentic full-length CBT tests with virtual scientific calculator, official IISc/IIT question formats (MCQ, MSQ, NAT), and step-by-step mathematical solutions.
              </p>

              {/* Key Value Checks */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs font-semibold text-slate-700">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Exact Exam Interface
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Virtual Scientific Calc
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  Server-Timed Scoring
                </span>
              </div>

              {/* Primary Call to Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <button
                  onClick={() => onLaunchMockTest()}
                  className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <PlayCircle className="w-5 h-5 text-blue-100" />
                  <span>Launch Free Mock Test</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate("syllabus")}
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-xs flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-slate-600" />
                  <span>Explore 2025/26 Syllabus</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3.5 pt-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Free early access — no credit card required
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Question Sandbox Widget (5 cols) */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-300 bg-white shadow-xl overflow-hidden">
                {/* Dark Mac/Terminal Header */}
                <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between text-white border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    </div>
                    <span className="text-xs font-bold text-slate-200 tracking-wide uppercase ml-2">
                      Live Problem Sandbox
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-700/60">
                    Try Now • 30 Sec
                  </span>
                </div>

                {/* Question Body */}
                <div className="p-5 space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {demoQuestion.subject}
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-2.5 leading-snug">
                      {demoQuestion.text}
                    </p>
                  </div>

                  {/* Options List */}
                  <div className="space-y-2">
                    {demoQuestion.options.map((opt) => {
                      const isSelected = selectedDemoAnswer === opt.id;
                      const isCorrect = opt.isCorrect;
                      let style =
                        "border-slate-200 hover:border-blue-400 bg-slate-50/70 text-slate-800 hover:bg-slate-100";
                      if (showDemoExplanation) {
                        if (isCorrect) {
                          style =
                            "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20";
                        } else if (isSelected) {
                          style = "border-rose-400 bg-rose-50 text-rose-900";
                        }
                      } else if (isSelected) {
                        style =
                          "border-blue-600 bg-blue-50 text-blue-900 font-bold ring-2 ring-blue-600/20";
                      }

                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setSelectedDemoAnswer(opt.id);
                            setShowDemoExplanation(true);
                          }}
                          className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${style}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-md border border-slate-300 flex items-center justify-center font-bold text-[10px] bg-white text-slate-700 shrink-0">
                              {String.fromCharCode(65 + opt.id)}
                            </span>
                            <span className="font-medium">{opt.text}</span>
                          </div>
                          {showDemoExplanation && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation Card */}
                  {showDemoExplanation && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5 animate-fadeIn">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span>Mathematical Derivation:</span>
                      </div>
                      <p className="whitespace-pre-line text-slate-600 leading-relaxed font-mono text-[11px]">
                        {demoQuestion.explanation}
                      </p>
                    </div>
                  )}

                  {/* Bottom Action inside Widget */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">
                      65 full questions in official paper
                    </span>
                    <button
                      onClick={() => onLaunchMockTest()}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Take Full CBT Test</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. TRUST & STATS STRIP (With Generous Margin) ───────────────── */}
          <div className="mt-14 sm:mt-18 pt-10 border-t border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                {
                  label: "Authentic CBT Layout",
                  value: "100%",
                  sub: "Exact TCS iON Exam Replica",
                  icon: Monitor,
                  color: "text-blue-600 bg-blue-50 border-blue-200",
                },
                {
                  label: "Full Exam Duration",
                  value: "180 Min",
                  sub: "65 Questions • 100 Marks",
                  icon: Clock,
                  color: "text-violet-600 bg-violet-50 border-violet-200",
                },
                {
                  label: "Exam Formats",
                  value: "MCQ + MSQ + NAT",
                  sub: "Official Negative Marking",
                  icon: Shield,
                  color: "text-emerald-600 bg-emerald-50 border-emerald-200",
                },
                {
                  label: "Instant Solutions",
                  value: "Immediate",
                  sub: "Step-by-Step Proofs",
                  icon: Zap,
                  color: "text-amber-600 bg-amber-50 border-amber-200",
                },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={i}
                    className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {stat.label}
                      </span>
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${stat.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {stat.value}
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-1">{stat.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. FOUR PILLARS OF HIGH-YIELD PREPARATION ──────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-3">
            Academic Excellence
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Built for Serious Examination Ranks
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            No video distractions. No bloated lectures. Just laser-focused curriculum mastering, authentic mock tests, and rigorous diagnostics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: BookOpen,
              color: "text-blue-600 bg-blue-50 border-blue-200",
              title: "Verified Syllabus Map",
              desc: "Structured chapter outlines, topic breakdowns, and downloadable formula cheatsheets mapped precisely to official IIT/IISc syllabus.",
              linkText: "View Syllabus",
              tab: "syllabus",
            },
            {
              icon: Monitor,
              color: "text-indigo-600 bg-indigo-50 border-indigo-200",
              title: "TCS iON CBT Simulator",
              desc: "Experience the real computer-based test interface with official question palette, scientific calculator, review flags, and section jumping.",
              linkText: "Take Mock Test",
              tab: "tests",
            },
            {
              icon: Target,
              color: "text-emerald-600 bg-emerald-50 border-emerald-200",
              title: "MCQ, MSQ & NAT Drills",
              desc: "Complete fidelity to GATE formats. Learn how to tackle Multiple Select Questions with zero partial marking and NAT numeric accuracy.",
              linkText: "Practise Questions",
              tab: "tests",
            },
            {
              icon: BarChart2,
              color: "text-purple-600 bg-purple-50 border-purple-200",
              title: "Diagnostic Score Analytics",
              desc: "Pinpoint accuracy percentages, negative marks lost, time spent per problem, and subject-wise weak areas with worked solutions.",
              linkText: "View Candidate Portal",
              tab: "dashboard",
            },
          ].map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between group cursor-pointer hover:border-slate-300 hover:shadow-md transition-all hover:-translate-y-1"
                onClick={() => onNavigate(pillar.tab)}
              >
                <div>
                  <div
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-4 transition-transform group-hover:scale-105 ${pillar.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    {pillar.desc}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-800">
                  <span>{pillar.linkText}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 4. INTERACTIVE MARKS & SCORE ESTIMATOR ──────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
                <Sliders className="w-3.5 h-3.5" />
                <span>Historical Projection Model</span>
              </span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                Estimate Your Projected GATE Score &amp; AIR
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
                Use our calibrated historical model for GATE Data Science &amp; CS to project your normalized score and qualifying tier based on raw marks.
              </p>

              {/* Slider Component */}
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">Target Raw Marks (out of 100):</span>
                  <span className="text-2xl font-black text-blue-400 font-mono">
                    {estimatedMarks} / 100
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="95"
                  value={estimatedMarks}
                  onChange={(e) => setEstimatedMarks(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>20 Marks (Qualifying)</span>
                  <span>50 Marks (NIT Cutoff)</span>
                  <span>75+ Marks (Top IITs)</span>
                </div>
              </div>
            </div>

            {/* Projected Score Card */}
            <div className="lg:col-span-5">
              <div className="p-6 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-5 shadow-xl">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">
                    Estimated GATE Score
                  </div>
                  <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
                    <span>{projectedScore}</span>
                    <span className="text-xs text-slate-400 font-normal">/ 1000</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 space-y-1">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    Expected All India Standing
                  </div>
                  <div className="text-sm font-bold text-emerald-400">{projectedAir}</div>
                </div>

                <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Target Institution:</span>
                  <span className="font-bold text-white">
                    {estimatedMarks >= 70
                      ? "IISc Bangalore / IIT Bombay"
                      : estimatedMarks >= 55
                      ? "IIT Delhi / IIT Madras / IIT Roorkee"
                      : "Top NITs / IIITs"}
                  </span>
                </div>

                <button
                  onClick={() => onLaunchMockTest()}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30"
                >
                  <span>Test Your Preparation in Mock Test</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. SYLLABUS & CORE DISCIPLINE DRILL DOWN ────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                Curriculum Deep Dive
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              GATE DA &amp; CS Core Subjects
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Explore syllabus breakdown, weightage percentages, and topic-wise revision sheets.
            </p>
          </div>

          <button
            onClick={() => onNavigate("syllabus")}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Full Syllabus Explorer</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {subjectsPreview.map((subj, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    {subj.weightage}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {subj.difficulty}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 mb-2 leading-snug">
                  {subj.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {subj.topics}
                </p>
              </div>

              <button
                onClick={() => onNavigate("syllabus")}
                className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>View Study Material</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. REALISTIC TCS iON CBT SIMULATOR PREVIEW ─────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-300 bg-white p-6 sm:p-10 shadow-lg">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1 block">
              Examination Authenticity
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Zero Surprise on Exam Day
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              The real exam doesn&apos;t look like a mobile quiz app. We simulate the exact computer-based test screen used by IITs and TCS iON.
            </p>
          </div>

          {/* Mini Interactive Preview Container */}
          <div className="rounded-2xl border border-slate-300 overflow-hidden shadow-inner bg-slate-900 text-white">
            {/* Header Simulator */}
            <div className="bg-slate-800 px-5 py-3 border-b border-slate-700 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>GATE DA 2026 : Mock Examination (Computer-Based Test)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono bg-slate-950 px-2.5 py-1 rounded text-emerald-400 font-bold border border-slate-700">
                  Time Left: 02:54:18
                </span>
                <span className="hidden sm:inline text-slate-400 font-mono">Candidate ID: DA-240981</span>
              </div>
            </div>

            {/* Inner Simulator Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/80">
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-200">Question No. 14</span>
                  <span className="text-slate-400">Multiple Select Question (MSQ) • 2 Marks</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Let A be a 3x3 real symmetric matrix with distinct eigenvalues λ1, λ2, λ3. Which of the following statements are TRUE?
                </p>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-700 flex items-center gap-2">
                    <span className="w-4 h-4 rounded border border-slate-500 flex items-center justify-center text-[10px]">A</span>
                    <span>Eigenvectors corresponding to distinct eigenvalues are mutually orthogonal.</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-700 flex items-center gap-2">
                    <span className="w-4 h-4 rounded border border-slate-500 flex items-center justify-center text-[10px]">B</span>
                    <span>Matrix A is always diagonalizable.</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-700 flex items-center gap-2">
                    <span className="w-4 h-4 rounded border border-slate-500 flex items-center justify-center text-[10px]">C</span>
                    <span>The determinant of A is equal to λ1 + λ2 + λ3.</span>
                  </div>
                </div>
              </div>

              {/* Palette Simulator */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-3">
                <div className="font-bold text-slate-200">Question Palette</div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { num: 1, c: "bg-emerald-600 text-white" },
                    { num: 2, c: "bg-emerald-600 text-white" },
                    { num: 3, c: "bg-rose-600 text-white" },
                    { num: 4, c: "bg-purple-600 text-white" },
                    { num: 5, c: "bg-slate-700 text-slate-300" },
                    { num: 6, c: "bg-emerald-600 text-white" },
                    { num: 7, c: "bg-slate-700 text-slate-300" },
                    { num: 8, c: "bg-purple-600 text-white" },
                    { num: 9, c: "bg-slate-700 text-slate-300" },
                    { num: 10, c: "bg-slate-700 text-slate-300" },
                  ].map((p) => (
                    <div
                      key={p.num}
                      className={`h-7 rounded flex items-center justify-center font-bold text-[10px] ${p.c}`}
                    >
                      {p.num}
                    </div>
                  ))}
                </div>
                <div className="text-[10px] space-y-1 text-slate-400 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                    <span>Marked for Review</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                    <span>Not Answered</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar in Simulator */}
            <div className="bg-slate-900 px-6 py-3.5 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Virtual Scientific Calculator Accessible</span>
              <button
                onClick={() => onLaunchMockTest()}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition-colors"
              >
                Experience Live Simulator Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. CANDIDATE FEEDBACK ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-2">
            Early Feedback
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            What Beta Testers Are Saying
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Collected from our private beta. Testimonials will be updated as the platform grows.
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-blue-50 border border-blue-200 text-center">
          <p className="text-sm text-blue-800 font-medium">
            We are in early access. Verified testimonials from real candidates will appear here as they complete full mock tests and share feedback.
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Be among the first — try the free sample test and share your experience.
          </p>
        </div>
      </section>

      {/* ── 8. FREQUENTLY ASKED QUESTIONS (FAQ) ─────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-2">
            Questions &amp; Answers
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Everything you need to know about preparing for GATE DA &amp; CS.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "Does ExamPrep replicate the official GATE CBT exam screen?",
              a: "Our Computer-Based Test interface is designed to closely follow the GATE CBT format, including MCQ, MSQ, and NAT question types, a question palette showing attempt status, and section navigation. We are actively improving fidelity based on beta tester feedback.",
            },
            {
              q: "How does marking work for MSQ and NAT questions?",
              a: "In accordance with official GATE regulations: Multiple Choice Questions (MCQ) have standard negative marking (1/3 mark deducted for 1-mark questions, 2/3 for 2-mark questions). Multiple Select Questions (MSQ) and Numerical Answer Type (NAT) carry ZERO negative marking. Partial marks are not awarded for MSQ.",
            },
            {
              q: "Can I take mock tests without signing up immediately?",
              a: "Yes! You can explore the complete syllabus, read topic notes, and launch free simulated mock tests right away. To track your attempt history, accuracy percentiles, and saved questions, you can register a free candidate account anytime.",
            },
            {
              q: "Are the questions verified against the updated GATE DA syllabus?",
              a: "Every question in our question bank is curated to strictly adhere to the official IISc/IIT syllabus for Probability, Linear Algebra, Machine Learning, Deep Learning, and AI algorithms.",
            },
          ].map((faq, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 mb-1 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{faq.q}</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 9. BOTTOM CONVERTING CTA BANNER ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 p-8 sm:p-14 text-white text-center shadow-xl border border-slate-800">
          <div className="max-w-2xl mx-auto space-y-5">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
              Start Your Preparation Today
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Ready to Secure a Top GATE Rank?
            </h2>
            <p className="text-slate-300 text-xs sm:text-base leading-relaxed">
              Step into the authentic exam simulation now. Free access to official syllabus breakdowns, full-length mock tests, and deterministic question analytics.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <button
                onClick={() => onLaunchMockTest()}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-slate-900 font-bold text-sm shadow-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Launch Simulated CBT Exam
              </button>
              {!currentUser && (
                <button
                  onClick={() => onOpenAuth("register")}
                  className="w-full sm:w-auto px-6 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors cursor-pointer"
                >
                  Create Free Aspirant Account
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
