"use client";

import React, { useState, useEffect } from "react";
import { Exam, Question, Test, Resource, User } from "../lib/types";
import {
  apiCreateExam,
  apiUploadStudyMaterial,
  apiDeleteResource,
  apiUpdateResource,
  fetchAdminResources,
  apiCreateQuestion,
  QuestionCreatePayload,
  fetchAdminQuestions,
  apiUpdateQuestionStatus,
  apiCreateTest,
  apiPublishTest,
  fetchAdminTests,
  apiFetchAdminMetrics,
  BillingPlan,
  apiCreateBillingPlan,
  fetchAdminBillingPlans,
} from "../lib/api";
import {
  ShieldCheck,
  Layers,
  BookOpen,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  HelpCircle,
  Trash2,
  ExternalLink,
  Upload,
  Check,
  Clock,
  Award,
  Filter,
  BarChart3,
  RefreshCw,
  WalletCards,
} from "lucide-react";

interface AdminDashboardProps {
  currentUser: User | null;
  exams: Exam[];
  onAddExam: (exam: Exam) => void;
  onOpenAuth?: (mode?: "login" | "register") => void;
}

export function AdminDashboard({
  currentUser,
  exams,
  onAddExam,
  onOpenAuth,
}: AdminDashboardProps) {
  const isAuthorized =
    currentUser &&
    (currentUser.role === "ADMIN" || currentUser.role === "CONTENT_MANAGER");

  // Sub-tabs
  const [activeTab, setActiveTab] = useState<
    "overview" | "exams" | "resources" | "questions" | "tests" | "plans"
  >("overview");

  // Selected Exam for sub-views
  const [activeExamId, setActiveExamId] = useState<string>(
    exams[0]?.id || ""
  );

  const selectedAdminExamId = activeExamId || exams[0]?.id || "";

  // Metrics
  const [metrics, setMetrics] = useState<{
    total_exams: number;
    total_tests: number;
    total_questions: number;
    total_attempts: number;
    total_users: number;
  } | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [managementError, setManagementError] = useState<string | null>(null);
  const [billingPlans, setBillingPlans] = useState<BillingPlan[]>([]);
  const [planName, setPlanName] = useState("");
  const [planPrice, setPlanPrice] = useState("");
  const [planInterval, setPlanInterval] = useState<"monthly" | "yearly">("monthly");
  const [planExamIds, setPlanExamIds] = useState<string[]>([]);
  const [planPublished, setPlanPublished] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  useEffect(() => {
    apiFetchAdminMetrics().then((res) => {
      setMetrics(res);
      setMetricsError(null);
    }).catch((error: unknown) => {
      setMetrics(null);
      setMetricsError(error instanceof Error ? error.message : "Unable to load dashboard metrics.");
    });
  }, [exams.length]);

  // --- 1. Examinations Management State ---
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [examName, setExamName] = useState("");
  const [examCode, setExamCode] = useState("");
  const [examDesc, setExamDesc] = useState("");
  const [examDuration, setExamDuration] = useState("10800");
  const [examMarks, setExamMarks] = useState("100");
  const [examInstructions, setExamInstructions] = useState("");

  // --- 2. Resources (Study Materials / Notes) State ---
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceDesc, setResourceDesc] = useState("");
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [resourceError, setResourceError] = useState<string | null>(null);

  const loadResources = async (examId: string) => {
    if (!examId) return;
    setIsLoadingResources(true);
    setManagementError(null);
    try {
      const data = await fetchAdminResources(examId);
      setResources(data);
    } catch (error) {
      setManagementError(error instanceof Error ? error.message : "Unable to load study materials.");
    } finally {
      setIsLoadingResources(false);
    }
  };

  useEffect(() => {
    if (activeTab === "resources" && selectedAdminExamId) {
      void Promise.resolve().then(() => loadResources(selectedAdminExamId));
    }
  }, [activeTab, selectedAdminExamId]);

  // --- 3. Questions Bank State ---
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState<"MCQ" | "MSQ" | "NAT">("MCQ");
  const [qDifficulty, setQDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [qPositiveMarks, setQPositiveMarks] = useState("2.0");
  const [qNegativeMarks, setQNegativeMarks] = useState("0.66");
  const [qExplanation, setQExplanation] = useState("");
  const [qOptions, setQOptions] = useState([
    { label: "A", text: "", is_correct: false },
    { label: "B", text: "", is_correct: false },
    { label: "C", text: "", is_correct: false },
    { label: "D", text: "", is_correct: false },
  ]);
  const [qNatAnswer, setQNatAnswer] = useState("");
  const [qNatTolerance, setQNatTolerance] = useState("0.01");
  const [qError, setQError] = useState<string | null>(null);

  const loadQuestions = async (examId: string) => {
    if (!examId) return;
    setIsLoadingQuestions(true);
    setManagementError(null);
    try {
      const data = await fetchAdminQuestions(examId);
      setQuestions(data);
    } catch (error) {
      setManagementError(error instanceof Error ? error.message : "Unable to load questions.");
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (activeTab === "questions" && selectedAdminExamId) {
      void Promise.resolve().then(() => loadQuestions(selectedAdminExamId));
    }
  }, [activeTab, selectedAdminExamId]);

  // --- 4. Tests State ---
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState(false);
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [testTitle, setTestTitle] = useState("");
  const [testDesc, setTestDesc] = useState("");
  const [testDuration, setTestDuration] = useState("10800");
  const [testMarks, setTestMarks] = useState("100");
  const [testInstructions, setTestInstructions] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  const loadTests = async (examId: string) => {
    if (!examId) return;
    setIsLoadingTests(true);
    setManagementError(null);
    try {
      const data = await fetchAdminTests(examId);
      setTests(data);
    } catch (error) {
      setManagementError(error instanceof Error ? error.message : "Unable to load tests.");
    } finally {
      setIsLoadingTests(false);
    }
  };

  useEffect(() => {
    if (activeTab === "tests" && selectedAdminExamId) {
      void Promise.resolve().then(() => loadTests(selectedAdminExamId));
    }
  }, [activeTab, selectedAdminExamId]);

  const loadBillingPlans = async () => {
    try {
      setBillingPlans(await fetchAdminBillingPlans());
      setManagementError(null);
    } catch (error) {
      setManagementError(error instanceof Error ? error.message : "Unable to load subscription plans.");
    }
  };

  useEffect(() => {
    if (activeTab === "plans" && currentUser?.role === "ADMIN") {
      void Promise.resolve().then(loadBillingPlans);
    }
  }, [activeTab, currentUser?.role]);

  // Unauthorized Guard
  if (!isAuthorized) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="p-8 sm:p-12 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 mx-auto flex items-center justify-center text-slate-700 mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Administrator Authorization Required
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
            Examination curriculum creation, study material publishing, question authoring, and test management are restricted to platform administrators.
          </p>
          <button
            onClick={() => onOpenAuth && onOpenAuth("login")}
            className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
          >
            Authenticate with Administrator Account
          </button>
        </div>
      </div>
    );
  }

  // --- Handlers ---

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName || !examCode) return;
    const examPayload: Partial<Exam> = {
      name: examName.trim(),
      code: examCode.trim().toUpperCase(),
      slug: examCode.trim().toLowerCase().replace(/[^a-z0-9]/g, "-"),
      description: examDesc.trim() || `${examName} examination track.`,
      status: "DRAFT",
      default_duration_seconds: parseInt(examDuration) || 10800,
      default_total_marks: parseFloat(examMarks) || 100.0,
      instructions:
        examInstructions.trim() ||
        "Standard competitive computer-based examination guidelines apply.",
    };

    try {
      const newExam = await apiCreateExam({ ...examPayload, status: "DRAFT" });
      onAddExam(newExam);
      setShowAddExamModal(false);
      setExamName("");
      setExamCode("");
      setExamDesc("");
      setExamInstructions("");
      setManagementError(null);
    } catch (error) {
      setManagementError(error instanceof Error ? error.message : "Unable to create examination.");
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setResourceError(null);
    if (!resourceTitle || !activeExamId || !resourceFile) {
      setResourceError("Choose a PDF file and provide its title.");
      return;
    }

    try {
      await apiUploadStudyMaterial(activeExamId, resourceFile, resourceTitle.trim(), resourceDesc.trim() || undefined);
    } catch (error) {
      setResourceError(error instanceof Error ? error.message : "PDF upload failed.");
      return;
    }

    setShowAddResourceModal(false);
    setResourceTitle("");
    setResourceDesc("");
    setResourceFile(null);
    loadResources(activeExamId);
  };

  const handleDeleteResource = async (id: string) => {
    if (confirm("Are you sure you want to delete this study resource?")) {
      try {
        await apiDeleteResource(id);
        await loadResources(activeExamId);
      } catch (error) {
        setManagementError(error instanceof Error ? error.message : "Unable to delete resource.");
      }
    }
  };

  const handleToggleResourcePublish = async (res: Resource) => {
    try {
      await apiUpdateResource(res.id, { is_published: !res.is_published });
      await loadResources(activeExamId);
    } catch (error) {
      setManagementError(error instanceof Error ? error.message : "Unable to update resource.");
    }
  };

  const handlePublishQuestion = async (questionId: string) => {
    try {
      await apiUpdateQuestionStatus(questionId, "PUBLISHED");
      await loadQuestions(activeExamId);
    } catch (error) {
      setManagementError(error instanceof Error ? error.message : "Unable to publish question.");
    }
  };

  const handlePublishTest = async (testId: string) => {
    try {
      await apiPublishTest(testId);
      await loadTests(activeExamId);
    } catch (error) {
      setManagementError(error instanceof Error ? error.message : "Unable to publish test.");
    }
  };

  const handleCreatePlan = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(planPrice);
    if (!planName.trim() || !Number.isFinite(amount) || amount <= 0 || planExamIds.length === 0) {
      setManagementError("Enter a plan name and valid price, and select at least one examination.");
      return;
    }
    setIsSavingPlan(true);
    setManagementError(null);
    try {
      await apiCreateBillingPlan({
        name: planName.trim(),
        slug: planName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        amount_minor: Math.round(amount * 100),
        currency: "INR",
        interval_unit: planInterval,
        interval_count: 1,
        total_billing_cycles: planInterval === "monthly" ? 12 : 1,
        included_exam_ids: planExamIds,
        is_published: planPublished,
      });
      setPlanName("");
      setPlanPrice("");
      setPlanExamIds([]);
      setPlanPublished(false);
      await loadBillingPlans();
    } catch (error) {
      setManagementError(error instanceof Error ? error.message : "Unable to create plan.");
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setQError(null);

    if (!qText.trim()) {
      setQError("Question text is required.");
      return;
    }

    if (qType === "MCQ") {
      const correct = qOptions.filter((o) => o.is_correct);
      if (correct.length !== 1) {
        setQError("MCQ questions must have exactly one correct option.");
        return;
      }
    } else if (qType === "MSQ") {
      const correct = qOptions.filter((o) => o.is_correct);
      if (correct.length < 1) {
        setQError("MSQ questions must have at least one correct option.");
        return;
      }
    } else if (qType === "NAT") {
      if (!qNatAnswer.trim() || isNaN(parseFloat(qNatAnswer))) {
        setQError("NAT questions must specify a valid numerical answer.");
        return;
      }
    }

    try {
      const payload: QuestionCreatePayload = {
        exam_id: activeExamId,
        question_type: qType,
        difficulty: qDifficulty,
        text: qText.trim(),
        positive_marks: parseFloat(qPositiveMarks) || 2.0,
        negative_marks: qType === "MCQ" ? parseFloat(qNegativeMarks) || 0.66 : 0.0,
        explanation: qExplanation.trim() || undefined,
        partial_credit: false,
        options: [],
      };

      if (qType === "NAT") {
        payload.correct_numerical_answer = parseFloat(qNatAnswer);
        payload.numerical_tolerance = parseFloat(qNatTolerance) || 0.01;
        payload.options = [];
      } else {
        payload.options = qOptions
          .filter((o) => o.text.trim())
          .map((o, idx) => ({
            label: o.label,
            text: o.text.trim(),
            is_correct: o.is_correct,
            display_order: idx + 1,
          }));
      }

      await apiCreateQuestion(payload);
      setShowAddQuestionModal(false);
      setQText("");
      setQExplanation("");
      setQNatAnswer("");
      setQOptions([
        { label: "A", text: "", is_correct: false },
        { label: "B", text: "", is_correct: false },
        { label: "C", text: "", is_correct: false },
        { label: "D", text: "", is_correct: false },
      ]);
      loadQuestions(activeExamId);
    } catch (err: unknown) {
      setQError(err instanceof Error ? err.message : "Failed to create question");
    }
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim() || !activeExamId) return;

    try {
      const payload = {
        title: testTitle.trim(),
        slug: testTitle.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        description: testDesc.trim() || undefined,
        instructions: testInstructions.trim() || "Authentic CBT test rules apply.",
        duration_seconds: parseInt(testDuration) || 10800,
        total_marks: parseFloat(testMarks) || 100.0,
        result_release_policy: "IMMEDIATE" as const,
        explanation_release_policy: "WITH_RESULT" as const,
        is_retakeable: true,
        questions: selectedQuestionIds.map((qid, idx) => ({
          question_id: qid,
          question_number: idx + 1,
        })),
      };

      const created = await apiCreateTest(activeExamId, payload);
      if (!created?.id) throw new Error("The test was not saved. Please try again.");

      setShowAddTestModal(false);
      setTestTitle("");
      setTestDesc("");
      setSelectedQuestionIds([]);
      loadTests(activeExamId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create test");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {managementError && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {managementError}
        </div>
      )}
      {/* Admin Title & Active Exam Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Management Portal
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] font-medium text-slate-600">
              Authenticated as {currentUser.full_name} ({currentUser.role})
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Academic Content & Examination Administration
          </h1>
        </div>

        {/* Exam Context Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600">Managing Track:</label>
          <select
            value={activeExamId}
            onChange={(e) => setActiveExamId(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.code} — {ex.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-medium overflow-x-auto">
        {[
          { id: "overview", label: "Overview Metrics", icon: BarChart3 },
          { id: "exams", label: "Examinations", icon: Layers },
          { id: "resources", label: "Study Materials (Notes / PDF)", icon: FileText },
          { id: "questions", label: "Question Bank", icon: HelpCircle },
          { id: "tests", label: "Mock Tests & Practice", icon: Award },
          ...(currentUser?.role === "ADMIN" ? [{ id: "plans", label: "Subscription Plans", icon: WalletCards }] : []),
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Configured Exams</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{metrics?.total_exams ?? "—"}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Database records</div>
            </div>
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Published Tests</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{metrics?.total_tests ?? "—"}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Available for attempts</div>
            </div>
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Question Bank Items</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{metrics?.total_questions ?? "—"}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Question bank records</div>
            </div>
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Student Attempts</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{metrics?.total_attempts ?? "—"}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Evaluated submissions</div>
            </div>
          </div>
          {metricsError && <p role="alert" className="text-sm text-rose-700">{metricsError}</p>}

          {/* Quick Actions */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Platform Management Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  setActiveTab("exams");
                  setShowAddExamModal(true);
                }}
                className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900">Add Examination</div>
                  <div className="text-[11px] text-slate-500">Configure new exam track</div>
                </div>
                <Plus className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => {
                  setActiveTab("resources");
                  setShowAddResourceModal(true);
                }}
                className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900">Upload Study Notes</div>
                  <div className="text-[11px] text-slate-500">Publish PDF guide or summary</div>
                </div>
                <Upload className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => {
                  setActiveTab("questions");
                  setShowAddQuestionModal(true);
                }}
                className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900">Add Question</div>
                  <div className="text-[11px] text-slate-500">Create MCQ, MSQ, or NAT</div>
                </div>
                <Plus className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXAMINATIONS */}
      {activeTab === "exams" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Configured Examination Tracks ({exams.length})
            </h2>
            <button
              onClick={() => setShowAddExamModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Examination</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((ex) => (
              <div
                key={ex.id}
                className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                      {ex.code}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {ex.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{ex.name}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {ex.description || "No description provided."}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Duration: {Math.round(ex.default_duration_seconds / 60)} mins</span>
                  <span>Marks: {ex.default_total_marks}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STUDY MATERIALS (NOTES / PDF) */}
      {activeTab === "resources" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Study Materials & Downloadable Notes
              </h2>
              <p className="text-xs text-slate-500">
                Manage notes, formula sheets, and chapter summaries visible to students.
              </p>
            </div>
            <button
              onClick={() => setShowAddResourceModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Study Note</span>
            </button>
          </div>

          {isLoadingResources ? (
            <div className="text-center py-10 text-xs text-slate-500">Loading resources...</div>
          ) : resources.length === 0 ? (
            <div className="p-8 rounded-xl bg-white border border-slate-200 text-center text-xs text-slate-500">
              No study materials have been published for this examination yet. Click &quot;Upload Study Note&quot; to publish your first learning resource.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              {resources.map((res) => (
                <div
                  key={res.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">{res.title}</span>
                        <span
                          className={`text-[9px] font-semibold px-2 py-0.2 rounded ${
                            res.is_published
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {res.is_published ? "Published" : "Draft"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{res.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleResourcePublish(res)}
                      className="px-2.5 py-1 text-[11px] font-medium rounded border border-slate-200 text-slate-700 hover:bg-slate-100"
                    >
                      {res.is_published ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => handleDeleteResource(res.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete resource"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: QUESTION BANK */}
      {activeTab === "questions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Examination Question Bank
              </h2>
              <p className="text-xs text-slate-500">
                Author and validate MCQs, MSQs, and NATs with authentic marking rules.
              </p>
            </div>
            <button
              onClick={() => setShowAddQuestionModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Question</span>
            </button>
          </div>

          {isLoadingQuestions ? (
            <div className="text-center py-10 text-xs text-slate-500">Loading question bank...</div>
          ) : questions.length === 0 ? (
            <div className="p-8 rounded-xl bg-white border border-slate-200 text-center text-xs text-slate-500">
              No questions found for this exam. Use &quot;Create New Question&quot; to add content to the question bank.
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">Q{idx + 1}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {q.question_type}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {q.difficulty}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">{q.status}</span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      +{q.positive_marks} / -{q.negative_marks} marks
                    </div>
                  </div>

                  <p className="text-xs text-slate-800 font-medium leading-relaxed">{q.text}</p>

                  {q.question_type !== "NAT" && q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id || opt.label}
                          className={`px-2.5 py-1 rounded border text-[11px] flex items-center justify-between ${
                            opt.is_correct
                              ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-medium"
                              : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <span>
                            <strong>{opt.label}.</strong> {opt.text}
                          </span>
                          {opt.is_correct && <Check className="w-3 h-3 text-emerald-600" />}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.question_type === "NAT" && (
                    <div className="text-xs bg-slate-50 p-2 rounded border border-slate-200 text-slate-700">
                      Correct Answer: <strong>{q.correct_numerical_answer}</strong> (Tolerance: ±{q.numerical_tolerance})
                    </div>
                  )}

                  {q.explanation && (
                    <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100">
                      <strong>Worked Solution:</strong> {q.explanation}
                    </div>
                  )}
                  {q.status !== "PUBLISHED" && currentUser?.role === "ADMIN" && (
                    <button
                      type="button"
                      onClick={() => handlePublishQuestion(q.id)}
                      className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                    >
                      Publish question
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: TESTS & MOCK PAPERS */}
      {activeTab === "tests" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Mock Tests & Examination Papers
              </h2>
              <p className="text-xs text-slate-500">
                Assemble practice sets, sectional tests, and full-length simulated examinations.
              </p>
            </div>
            <button
              onClick={() => {
                loadQuestions(activeExamId);
                setShowAddTestModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assemble Test</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tests.map((t) => (
              <div
                key={t.id}
                className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                      {t.status}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {t.total_questions} Questions
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{t.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {t.description || "Computer-based test simulation."}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Duration: {Math.round(t.duration_seconds / 60)} mins</span>
                  <span>Total Marks: {t.total_marks}</span>
                </div>
                  {t.status === "DRAFT" && currentUser?.role === "ADMIN" && (
                    <button
                      type="button"
                      onClick={() => handlePublishTest(t.id)}
                      className="mt-3 self-start rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                    >
                      Publish after validation
                    </button>
                  )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "plans" && currentUser?.role === "ADMIN" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-bold text-slate-900">Subscription plans</h2>
            <p className="mt-1 text-xs leading-5 text-slate-600">Prices are sent to Razorpay in minor currency units from this server-controlled form. Published plans appear on the pricing page.</p>
            {billingPlans.length === 0 ? (
              <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No subscription plans have been created.</p>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {billingPlans.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{plan.name}</p>
                      <p className="text-xs text-slate-500">{new Intl.NumberFormat("en-IN", { style: "currency", currency: plan.currency, maximumFractionDigits: 0 }).format(plan.amount_minor / 100)} / {plan.interval_unit} · {plan.is_published ? "Published" : "Draft"}</p>
                    </div>
                    <span className="text-[11px] text-slate-500">{plan.included_exam_ids.length} exam(s)</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <form onSubmit={handleCreatePlan} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-bold text-slate-900">Create plan</h3>
            <label className="block text-xs font-medium text-slate-700">Plan name
              <input value={planName} onChange={(event) => setPlanName(event.target.value)} required maxLength={160} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="GATE DA Monthly" />
            </label>
            <label className="block text-xs font-medium text-slate-700">Price (INR)
              <input type="number" min="1" step="0.01" value={planPrice} onChange={(event) => setPlanPrice(event.target.value)} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="999" />
            </label>
            <label className="block text-xs font-medium text-slate-700">Billing interval
              <select value={planInterval} onChange={(event) => setPlanInterval(event.target.value as "monthly" | "yearly")} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </label>
            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-slate-700">Included examinations</legend>
              {exams.map((exam) => (
                <label key={exam.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={planExamIds.includes(exam.id)} onChange={(event) => setPlanExamIds((ids) => event.target.checked ? [...ids, exam.id] : ids.filter((id) => id !== exam.id))} />
                  {exam.code} — {exam.name}
                </label>
              ))}
            </fieldset>
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input type="checkbox" checked={planPublished} onChange={(event) => setPlanPublished(event.target.checked)} />
              Publish after Razorpay plan creation
            </label>
            <button disabled={isSavingPlan} className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {isSavingPlan ? "Creating provider plan…" : "Create Razorpay plan"}
            </button>
          </form>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Modal 1: Add Examination */}
      {showAddExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl p-6 relative">
            <h3 className="text-base font-bold text-slate-900 mb-1">Create New Examination Track</h3>
            <p className="text-xs text-slate-500 mb-4">
              Configure code, title, and standard examination parameters.
            </p>

            <form onSubmit={handleCreateExam} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Exam Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GATE Computer Science & Information Technology"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Exam Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GATE-CS"
                    value={examCode}
                    onChange={(e) => setExamCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Duration (Seconds)</label>
                  <input
                    type="number"
                    value={examDuration}
                    onChange={(e) => setExamDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of examination scope..."
                  value={examDesc}
                  onChange={(e) => setExamDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExamModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium"
                >
                  Create Examination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Study Material (Resource) */}
      {showAddResourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl p-6 relative">
            <h3 className="text-base font-bold text-slate-900 mb-1">Upload Study Material / Notes</h3>
            <p className="text-xs text-slate-500 mb-4">
              Publish revision notes or formula guides for students.
            </p>

            <form onSubmit={handleCreateResource} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Linear Algebra & Eigenvalue Formulations (PDF)"
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">PDF file *</label>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  required
                  onChange={(e) => setResourceFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
              {resourceError && <p role="alert" className="text-red-700">{resourceError}</p>}

              <div>
                <label className="font-medium text-slate-700 block mb-1">Description / Topic Scope</label>
                <textarea
                  rows={2}
                  placeholder="Details on what this material covers..."
                  value={resourceDesc}
                  onChange={(e) => setResourceDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <p className="text-slate-500">New uploads start unpublished. You can review and publish them from the materials list.</p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddResourceModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium"
                >
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add Question */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-xl p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">Author Question</h3>
            <p className="text-xs text-slate-500 mb-3">
              Create a question and configure its evaluation parameters.
            </p>

            {qError && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{qError}</span>
              </div>
            )}

            <form onSubmit={handleCreateQuestion} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Question Type</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as "MCQ" | "MSQ" | "NAT")}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="MCQ">MCQ (Multiple Choice — Single Correct)</option>
                    <option value="MSQ">MSQ (Multiple Select — One or More Correct)</option>
                    <option value="NAT">NAT (Numerical Answer Type)</option>
                  </select>
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Difficulty</label>
                  <select
                    value={qDifficulty}
                    onChange={(e) => setQDifficulty(e.target.value as "EASY" | "MEDIUM" | "HARD")}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Question Statement *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter the complete question with mathematical terms..."
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Options for MCQ / MSQ */}
              {qType !== "NAT" && (
                <div className="space-y-2 border-t border-slate-100 pt-2">
                  <div className="font-semibold text-slate-800">
                    Options ({qType === "MCQ" ? "Check exactly 1 correct" : "Check all correct"})
                  </div>
                  {qOptions.map((opt, i) => (
                    <div key={opt.label} className="flex items-center gap-2">
                      <span className="font-bold w-4 text-slate-700">{opt.label}.</span>
                      <input
                        type="text"
                        placeholder={`Option ${opt.label} text`}
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...qOptions];
                          updated[i].text = e.target.value;
                          setQOptions(updated);
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 text-xs"
                      />
                      <label className="flex items-center gap-1 text-[11px] font-medium text-slate-700 cursor-pointer">
                        <input
                          type={qType === "MCQ" ? "radio" : "checkbox"}
                          name="correct_opt"
                          checked={opt.is_correct}
                          onChange={(e) => {
                            const updated = [...qOptions];
                            if (qType === "MCQ") {
                              updated.forEach((o, idx) => (o.is_correct = idx === i));
                            } else {
                              updated[i].is_correct = e.target.checked;
                            }
                            setQOptions(updated);
                          }}
                        />
                        <span>Correct</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {/* Numerical fields for NAT */}
              {qType === "NAT" && (
                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-2">
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">Correct Numerical Answer *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 0.67"
                      value={qNatAnswer}
                      onChange={(e) => setQNatAnswer(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">Acceptable Tolerance (±)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.01"
                      value={qNatTolerance}
                      onChange={(e) => setQNatTolerance(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Positive Marks</label>
                  <input
                    type="number"
                    step="0.5"
                    value={qPositiveMarks}
                    onChange={(e) => setQPositiveMarks(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    Negative Marks ({qType === "MCQ" ? "Standard GATE deduction" : "Zero for MSQ/NAT"})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={qType !== "MCQ"}
                    value={qType === "MCQ" ? qNegativeMarks : "0"}
                    onChange={(e) => setQNegativeMarks(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Worked Solution & Explanation
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide step-by-step mathematical reasoning..."
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium"
                >
                  Save to Question Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Assemble Test */}
      {showAddTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-xl p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">Assemble Mock Test</h3>
            <p className="text-xs text-slate-500 mb-3">
              Attach questions from the question bank to create a timed test.
            </p>

            <form onSubmit={handleCreateTest} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Test Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Linear Algebra & Probability Sectional Test 1"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Duration (Seconds)</label>
                  <input
                    type="number"
                    value={testDuration}
                    onChange={(e) => setTestDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={testMarks}
                    onChange={(e) => setTestMarks(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Description & Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Test instructions shown to candidates prior to launch..."
                  value={testInstructions}
                  onChange={(e) => setTestInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Select Questions from Bank */}
              <div className="border-t border-slate-100 pt-2">
                <div className="font-semibold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Assign Questions ({selectedQuestionIds.length} selected)</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  {questions.length === 0 ? (
                    <div className="text-slate-500 py-3 text-center">
                      No questions in bank. Create questions first.
                    </div>
                  ) : (
                    questions.map((q) => {
                      const isSelected = selectedQuestionIds.includes(q.id);
                      return (
                        <label
                          key={q.id}
                          className="flex items-start gap-2 p-1.5 rounded hover:bg-white cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedQuestionIds([...selectedQuestionIds, q.id]);
                              } else {
                                setSelectedQuestionIds(
                                  selectedQuestionIds.filter((id) => id !== q.id)
                                );
                              }
                            }}
                            className="mt-0.5"
                          />
                          <div className="flex-1 text-[11px] text-slate-800 leading-tight">
                            <span className="font-bold mr-1">[{q.question_type}]</span>
                            {q.text.slice(0, 80)}...
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTestModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium"
                >
                  Create & Publish Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
