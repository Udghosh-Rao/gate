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

export default function Home() {
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

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
          const match = prev && loadedExams.find((e) => e.id === prev.id || e.code === prev.code);
          return match || loadedExams[0];
        });
      }
    }).catch(() => setExams([]));
  }, []);

  const handleLaunchMockTest = async (testToLaunch?: Test) => {
    if (!testToLaunch) {
      try {
        if (!selectedExam) return;
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
        {currentTab === "syllabus" && selectedExam && <SyllabusExplorer exam={selectedExam} />}

        {currentTab === "tests" && selectedExam && (
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

interface HomePageProps {
  exams: Exam[];
  selectedExam: Exam | null;
  onSelectExam: React.Dispatch<React.SetStateAction<Exam | null>>;
  onNavigate: (tab: string) => void;
  onOpenAuth: (mode?: "login" | "register") => void;
  onLaunchMockTest: () => void;
  currentUser: User | null;
}

function HomePage({ exams, selectedExam, onSelectExam, onNavigate, onOpenAuth, onLaunchMockTest, currentUser }: HomePageProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-12">
      <section className="text-center max-w-3xl mx-auto space-y-5">
        <p className="text-sm font-semibold text-blue-700">Competitive examination preparation</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">Prepare with published syllabus, materials, and practice tests</h1>
        <p className="text-slate-600">Explore examinations and use content that has been published by the platform team. Availability depends on the content currently in the database.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={() => onNavigate("tests")} disabled={!selectedExam} className="btn-primary-gradient px-5 py-3 rounded-xl disabled:opacity-50">Browse published tests</button>
          <button onClick={() => onNavigate("syllabus")} disabled={!selectedExam} className="btn-secondary px-5 py-3 rounded-xl disabled:opacity-50">Explore syllabus</button>
          {!currentUser && <button onClick={() => onOpenAuth("register")} className="btn-secondary px-5 py-3 rounded-xl">Create student account</button>}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-4">Available examinations</h2>
        {exams.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-600">No examinations are currently published. Please check back later.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => (
              <button key={exam.id} onClick={() => onSelectExam(exam)} className={`text-left p-5 rounded-2xl border bg-white hover:border-blue-400 ${selectedExam?.id === exam.id ? "border-blue-600 ring-2 ring-blue-100" : "border-slate-200"}`}>
                <div className="text-xs font-semibold text-blue-700">{exam.code}</div>
                <div className="mt-2 font-bold text-slate-900">{exam.name}</div>
                <p className="mt-2 text-sm text-slate-600">{exam.description || "Examination information published by the platform."}</p>
              </button>
            ))}
          </div>
        )}
      </section>
      {selectedExam && <section className="rounded-2xl bg-slate-900 text-white p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div><h2 className="text-xl font-bold">{selectedExam.name}</h2><p className="mt-1 text-sm text-slate-300">View published study content and tests for this examination.</p></div>
        <button onClick={onLaunchMockTest} className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500">Open tests</button>
      </section>}
    </div>
  );
}
