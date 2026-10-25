"use client";

import React, { useState, useEffect } from "react";
import { User, Exam, Test, Result, AttemptQuestion, AttemptAnswer, Subject, Resource } from "../lib/types";
import {
  startAttempt,
  fetchExams,
  fetchTests,
  fetchSubjects,
  fetchPublishedResources,
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
  const [currentTab, setCurrentTabState] = useState<string>("home");
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

  const setCurrentTab = (tab: string) => {
    setCurrentTabState(tab);
    if (typeof window === "undefined") return;
    const pathByTab: Record<string, string> = {
      home: "/", syllabus: "/syllabus", tests: "/mock-tests", pricing: "/pricing",
      dashboard: "/dashboard", about: "/about", admin: "/admin", cbt: "/test-session", result: "/results",
    };
    const target = pathByTab[tab] || "/";
    if (window.location.pathname !== target) window.history.pushState({ tab }, "", target);
  };

  useEffect(() => {
    const tabByPath: Record<string, string> = {
      "/": "home", "/exams": "home", "/syllabus": "syllabus", "/mock-tests": "tests",
      "/pricing": "pricing", "/dashboard": "dashboard", "/about": "about", "/admin": "admin",
      "/test-session": "cbt", "/results": "result",
    };
    const syncPath = () => setCurrentTabState(tabByPath[window.location.pathname] || "home");
    syncPath();
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, []);

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
        onOpenAuth={handleOpenAuth}
      />

      <main className="flex-1">
        {(currentTab === "syllabus" || currentTab === "tests") && !selectedExam && (
          <section className="mx-auto my-16 max-w-2xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">Choose an available examination</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Select an examination from the catalogue before opening its syllabus or mock tests.</p>
            <button onClick={() => setCurrentTab("home")} className="mt-5 rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white">Browse examinations</button>
          </section>
        )}
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
            selectedExam={selectedExam}
            onNavigate={setCurrentTab}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentTab === "pricing" && <PricingPage onNavigate={setCurrentTab} onOpenAuth={handleOpenAuth} />}

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
  currentUser: User | null;
}

function HomePage({ exams, selectedExam, onSelectExam, examLoadStatus, examLoadError, onRetryExams, onNavigate, onOpenAuth, currentUser }: HomePageProps) {
  const [preview, setPreview] = useState<{
    examId: string;
    subjects: Subject[] | null;
    resources: Resource[] | null;
    tests: Test[] | null;
  } | null>(null);
  const selectedExamId = selectedExam?.id;

  useEffect(() => {
    if (!selectedExamId) return;
    let ignore = false;
    const loadPreview = async () => {
      const [subjectsResult, resourcesResult, testsResult] = await Promise.allSettled([
        fetchSubjects(selectedExamId),
        fetchPublishedResources(selectedExamId),
        fetchTests(selectedExamId),
      ]);
      if (ignore) return;
      setPreview({
        examId: selectedExamId,
        subjects: subjectsResult.status === "fulfilled" ? subjectsResult.value.filter((subject) => subject.is_active) : null,
        resources: resourcesResult.status === "fulfilled" ? resourcesResult.value : null,
        tests: testsResult.status === "fulfilled" ? testsResult.value.filter((test) => test.status === "PUBLISHED") : null,
      });
    };
    void loadPreview();
    return () => { ignore = true; };
  }, [selectedExamId]);

  const livePreview = preview?.examId === selectedExam?.id ? preview : null;
  const steps = [
    { icon: Layers3, number: "01", title: "Choose an examination", text: "Start with an exam currently published in the catalogue." },
    { icon: BookOpen, number: "02", title: "Explore the syllabus", text: "Browse subjects and topics configured for your examination." },
    { icon: BookOpen, number: "03", title: "Check available notes", text: "See which study materials have been published for the exam." },
    { icon: ClipboardCheck, number: "04", title: "Take a mock test", text: "Choose a published timed test when one is available." },
    { icon: Layers3, number: "05", title: "Review your result", text: "Return to your attempts and view results after release." },
  ];

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <div className="home-eyebrow"><span className="home-eyebrow-dot" /> GATE DA · Competitive exam preparation</div>
          <h1>Prepare for your next exam with a <span>clearer plan.</span></h1>
          <p className="home-intro">Explore a published examination and its syllabus, browse available study material, take mock tests, and review results when they are released.</p>
          <div className="home-actions">
            <button onClick={() => document.getElementById("exam-catalog")?.scrollIntoView({ behavior: "smooth" })} className="home-button home-button-primary">Explore examinations <ArrowRight size={16} /></button>
            {livePreview?.tests && livePreview.tests.length > 0 && <button onClick={() => onNavigate("tests")} className="home-button home-button-secondary">Explore mock tests</button>}
            {!currentUser && <button onClick={() => onOpenAuth("register")} className="home-button home-button-secondary">Create an account</button>}
          </div>
          <p className="home-note">GATE Data Science and Artificial Intelligence is the initial focus. The catalogue can expand as more exams are configured.</p>
        </div>
        <div className="home-visual" aria-label="Live preview of the selected examination workspace">
          <div className="product-preview">
            <div className="preview-topbar"><span className="preview-brand"><span className="preview-brand-mark"><BookOpen size={13} /></span> ExamPrep workspace</span><span className="preview-context">EXAM OVERVIEW</span></div>
            <div className="preview-body">
              <aside className="preview-sidebar" aria-label="Workspace sections"><span className="preview-overline">Workspace</span><span className="preview-side-link active"><Layers3 size={12} /> Overview</span><span className="preview-side-link"><BookOpen size={12} /> Syllabus</span><span className="preview-side-link"><ClipboardCheck size={12} /> Mock tests</span></aside>
              <div className="preview-main">
                <div className="preview-heading-row"><div><h2>{selectedExam?.code || "Choose an exam"}</h2><p>{selectedExam?.name || "Browse the catalogue to see available examinations."}</p></div><span className="preview-chip">Published content</span></div>
                <p className="preview-section-label">Syllabus subjects</p>
                {!selectedExam ? <div className="preview-subject-empty">Select a published examination to preview its available content.</div> : !livePreview ? <div className="preview-subject-empty">Loading the published syllabus and materials…</div> : livePreview.subjects === null ? <div className="preview-subject-empty">Syllabus subjects could not be loaded. Retry from the syllabus page.</div> : livePreview.subjects.length === 0 ? <div className="preview-subject-empty">No subjects are published for this examination yet.</div> : <div className="preview-subject-list">{livePreview.subjects.slice(0, 3).map((subject) => <div className="preview-subject" key={subject.id}><span>{subject.name}</span><span>{subject.code}</span></div>)}</div>}
              </div>
            </div>
            <div className="preview-footer"><div className="preview-metric"><strong>{livePreview?.subjects?.length ?? "—"}</strong><span>Subjects</span></div><div className="preview-metric"><strong>{livePreview?.resources?.length ?? "—"}</strong><span>Published notes</span></div><div className="preview-metric"><strong>{livePreview?.tests?.length ?? "—"}</strong><span>Mock tests</span></div></div>
          </div>
        </div>
      </section>

      <section className="home-exam-section" id="exam-catalog" aria-labelledby="exam-heading">
        <div className="home-section-heading"><div><p className="home-kicker">START HERE</p><h2 id="exam-heading">Choose your examination</h2><p>Select an exam to see its published syllabus and practice tests.</p></div><span className="home-section-mark">01 / EXAMS</span></div>
        {examLoadStatus === "loading" && <div className="home-state-card"><span className="home-spinner" />Loading available examinations…</div>}
        {examLoadStatus === "error" && <div className="home-state-card home-error" role="alert"><div><strong>Examinations could not be loaded.</strong><span>{examLoadError}</span></div><button onClick={onRetryExams}><RefreshCw size={15} /> Retry</button></div>}
        {examLoadStatus === "loaded" && exams.length === 0 && <div className="home-state-card">No examinations are published yet. Please check again later.</div>}
        {examLoadStatus === "loaded" && exams.length > 0 && <div className="home-exam-grid">{exams.map((exam, index) => <button key={exam.id} onClick={() => onSelectExam(exam)} className={`home-exam-card ${selectedExam?.id === exam.id ? "is-selected" : ""}`}><span className="home-exam-index">0{index + 1}</span><span className="home-exam-code">{exam.code}</span><strong>{exam.name}</strong><span className="home-exam-description">{exam.description || "View the syllabus and published preparation content for this exam."}</span><span className="home-exam-link">Select examination <ArrowRight size={15} /></span></button>)}</div>}
      </section>

      <section className="home-steps-section"><div className="home-section-heading"><div><p className="home-kicker">FROM DISCOVERY TO REVIEW</p><h2>A preparation flow that stays clear.</h2><p>Move through the content and practice actually published for each exam.</p></div><span className="home-section-mark">02 / PREPARE</span></div><div className="home-steps-grid">{steps.map(({ icon: Icon, number, title, text }, index) => <button className="home-step-card" key={number} onClick={() => onNavigate(["home", "syllabus", "syllabus", "tests", "dashboard"][index])}><span className="home-step-number">{number}</span><span className="home-step-icon"><Icon size={18} /></span><h3>{title}</h3><p>{text}</p></button>)}</div></section>

      {selectedExam && <section className="home-selected-banner"><div><p className="home-kicker">CURRENTLY SELECTED</p><h2>{selectedExam.name}</h2><p>Continue with the content available for {selectedExam.code}.</p></div><div className="home-selected-actions"><button onClick={() => onNavigate("syllabus")} className="home-button home-button-light">Explore syllabus</button><button onClick={() => onNavigate("tests")} className="home-button home-button-outline">View tests <ArrowRight size={16} /></button></div></section>}
    </div>
  );
}
