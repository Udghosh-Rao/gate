"use client";

import React, { useState, useEffect } from "react";
import { User, Exam, Test, Result, AttemptQuestion, AttemptAnswer } from "../lib/types";
import {
  startAttempt,
  fetchExams,
  fetchTests,
  apiGetMe,
} from "../lib/api";
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
import { ArrowRight, BookOpen, ClipboardCheck, Layers3, RefreshCw } from "lucide-react";

export default function Home() {
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examLoadStatus, setExamLoadStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [examLoadError, setExamLoadError] = useState<string | null>(null);

  // CBT State
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [activeAttemptId, setActiveAttemptId] = useState<string>("");
  const [activeQuestions, setActiveQuestions] = useState<AttemptQuestion[]>([]);
  const [activeSavedAnswers, setActiveSavedAnswers] = useState<AttemptAnswer[]>([]);
  const [activeRemainingSeconds, setActiveRemainingSeconds] = useState<number>(0);
  const [activeResult, setActiveResult] = useState<Result | null>(null);

  const handleOpenAuth = (mode?: "login" | "register") => {
    setAuthModalMode(mode || "login");
    setShowAuthModal(true);
  };

  const loadExams = () => {
    setExamLoadStatus("loading");
    setExamLoadError(null);
    fetchExams().then((loadedExams) => {
      setExams(loadedExams);
      setSelectedExam((previous) => loadedExams.find((exam) => exam.id === previous?.id) || loadedExams[0] || null);
      setExamLoadStatus("loaded");
    }).catch((error: unknown) => {
      setExamLoadStatus("error");
      setExamLoadError(error instanceof Error ? error.message : "Could not load examinations.");
    });
  };

  useEffect(() => {
    apiGetMe().then(setCurrentUser);
    fetchExams().then((loadedExams) => {
      setExams(loadedExams);
      setSelectedExam((previous) => loadedExams.find((exam) => exam.id === previous?.id) || loadedExams[0] || null);
      setExamLoadStatus("loaded");
    }).catch((error: unknown) => {
      setExamLoadStatus("error");
      setExamLoadError(error instanceof Error ? error.message : "Could not load examinations.");
    });
  }, []);

  useEffect(() => {
    if (!currentUser || examLoadStatus !== "loaded" || typeof window === "undefined") return;
    const saved = window.sessionStorage.getItem("active_exam_attempt");
    if (!saved) return;
    try {
      const { userId, testId } = JSON.parse(saved) as { userId: string; testId: string };
      if (userId !== currentUser.id || !testId) {
        window.sessionStorage.removeItem("active_exam_attempt");
        return;
      }
      void (async () => {
        try {
          const candidates = await Promise.all(exams.map((exam) => fetchTests(exam.id)));
          const test = candidates.flat().find((item) => item.id === testId);
          if (!test) {
            window.sessionStorage.removeItem("active_exam_attempt");
            return;
          }
          const attempt = await startAttempt(test.id);
          setActiveTest(test);
          setActiveAttemptId(attempt.id);
          setActiveQuestions(attempt.questions);
          setActiveSavedAnswers(attempt.saved_answers || []);
          setActiveRemainingSeconds(attempt.remaining_seconds);
          setCurrentTab("cbt");
        } catch {
          // Keep the session record so a temporary network issue can be retried on reload.
        }
      })();
    } catch {
      window.sessionStorage.removeItem("active_exam_attempt");
    }
  }, [currentUser, examLoadStatus, exams]);

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
      if (currentUser && typeof window !== "undefined") {
        window.sessionStorage.setItem("active_exam_attempt", JSON.stringify({ userId: currentUser.id, testId: testToLaunch.id }));
      }
      const attempt = await startAttempt(testToLaunch.id);
      setActiveAttemptId(attempt.id);
      setActiveQuestions(attempt.questions);
      setActiveSavedAnswers(attempt.saved_answers || []);
      setActiveRemainingSeconds(attempt.remaining_seconds);
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
    if (typeof window !== "undefined") window.sessionStorage.removeItem("active_exam_attempt");
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
        savedAnswers={activeSavedAnswers}
        remainingSeconds={activeRemainingSeconds}
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
            examLoadStatus={examLoadStatus}
            examLoadError={examLoadError}
            onRetryExams={loadExams}
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
  examLoadStatus: "loading" | "loaded" | "error";
  examLoadError: string | null;
  onRetryExams: () => void;
  onNavigate: (tab: string) => void;
  onOpenAuth: (mode?: "login" | "register") => void;
  onLaunchMockTest: () => void;
  currentUser: User | null;
}

function HomePage({ exams, selectedExam, onSelectExam, examLoadStatus, examLoadError, onRetryExams, onNavigate, onOpenAuth, onLaunchMockTest, currentUser }: HomePageProps) {
  const steps = [
    { icon: BookOpen, number: "01", title: "Explore", text: "Review the syllabus and resources published for your exam." },
    { icon: ClipboardCheck, number: "02", title: "Practise", text: "Choose from the tests currently available in the catalog." },
    { icon: Layers3, number: "03", title: "Review", text: "Return to your attempt history and released results." },
  ];

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <div className="home-eyebrow"><span className="home-eyebrow-dot" /> Exam preparation, made structured</div>
          <h1>Make every practice session <span>count.</span></h1>
          <p className="home-intro">Choose an examination, explore its published content, and practise in a focused computer-based test environment.</p>
          <div className="home-actions">
            <button onClick={() => onNavigate("tests")} disabled={!selectedExam || examLoadStatus !== "loaded"} className="home-button home-button-primary">Browse practice tests <ArrowRight size={17} /></button>
            {!currentUser && <button onClick={() => onOpenAuth("register")} className="home-button home-button-secondary">Create an account</button>}
          </div>
          <p className="home-note">Available exams and materials depend on what has been published.</p>
        </div>
        <div className="home-visual" aria-label="Explore, practise, and review your preparation">
          <div className="visual-orbit visual-orbit-one" /><div className="visual-orbit visual-orbit-two" />
          <div className="visual-card">
            <div className="visual-card-top"><span className="visual-dot" /><span>YOUR STUDY SPACE</span><span className="visual-card-menu">•••</span></div>
            <div className="visual-title">A steady path<br />to exam day.</div>
            <div className="visual-path"><span /><span /><span /></div>
            <div className="visual-progress-label"><span>Explore at your pace</span><span>Study · Practise · Review</span></div>
            <div className="visual-card-divider" />
            <div className="visual-current"><div className="visual-book"><BookOpen size={18} /></div><div><strong>{selectedExam?.code || "Choose an exam"}</strong><span>{selectedExam?.name || "Start by browsing available examinations"}</span></div><ArrowRight size={16} /></div>
          </div>
          <span className="visual-float visual-float-top">Focused practice</span>
          <span className="visual-float visual-float-bottom">Your own pace</span>
        </div>
      </section>

      <section className="home-exam-section" aria-labelledby="exam-heading">
        <div className="home-section-heading"><div><p className="home-kicker">START HERE</p><h2 id="exam-heading">Choose your examination</h2><p>Select an exam to see its published syllabus and practice tests.</p></div><span className="home-section-mark">01 / EXAMS</span></div>
        {examLoadStatus === "loading" && <div className="home-state-card"><span className="home-spinner" />Loading available examinations…</div>}
        {examLoadStatus === "error" && <div className="home-state-card home-error" role="alert"><div><strong>Examinations could not be loaded.</strong><span>{examLoadError}</span></div><button onClick={onRetryExams}><RefreshCw size={15} /> Retry</button></div>}
        {examLoadStatus === "loaded" && exams.length === 0 && <div className="home-state-card">No examinations are published yet. Please check again later.</div>}
        {examLoadStatus === "loaded" && exams.length > 0 && <div className="home-exam-grid">{exams.map((exam, index) => <button key={exam.id} onClick={() => onSelectExam(exam)} className={`home-exam-card ${selectedExam?.id === exam.id ? "is-selected" : ""}`}><span className="home-exam-index">0{index + 1}</span><span className="home-exam-code">{exam.code}</span><strong>{exam.name}</strong><span className="home-exam-description">{exam.description || "View the syllabus and published preparation content for this exam."}</span><span className="home-exam-link">Select examination <ArrowRight size={15} /></span></button>)}</div>}
      </section>

      <section className="home-steps-section"><div className="home-section-heading"><div><p className="home-kicker">A SIMPLE WORKFLOW</p><h2>Study with intention.</h2><p>Move from the syllabus to practice and back to your results.</p></div><span className="home-section-mark">02 / PREPARE</span></div><div className="home-steps-grid">{steps.map(({ icon: Icon, number, title, text }) => <article className="home-step-card" key={number}><span className="home-step-number">{number}</span><span className="home-step-icon"><Icon size={20} /></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>

      {selectedExam && <section className="home-selected-banner"><div><p className="home-kicker">CURRENTLY SELECTED</p><h2>{selectedExam.name}</h2><p>Continue with the content available for {selectedExam.code}.</p></div><div className="home-selected-actions"><button onClick={() => onNavigate("syllabus")} className="home-button home-button-light">Explore syllabus</button><button onClick={onLaunchMockTest} className="home-button home-button-outline">View tests <ArrowRight size={16} /></button></div></section>}
    </div>
  );
}
