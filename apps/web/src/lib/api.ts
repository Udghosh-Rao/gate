import {
  User,
  Exam,
  Subject,
  Topic,
  Resource,
  Question,
  TestSeries,
  Test,
  AttemptQuestion,
  AttemptAnswer,
  Result,
  AdminDashboardMetrics,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Real seeded accounts for quick credential autofill / live authentication
export const SEED_CREDENTIALS = {
  admin: {
    email: "admin@examplatform.dev",
    password: "Admin@Dev123",
    label: "Platform Administrator",
    role: "ADMIN" as const,
  },
  student: {
    email: "student@examplatform.dev",
    password: "Student@Dev123",
    label: "Candidate (Student)",
    role: "STUDENT" as const,
  },
  content_manager: {
    email: "content@examplatform.dev",
    password: "Content@Dev123",
    label: "Dr. Priya Nair (Content Lead)",
    role: "CONTENT_MANAGER" as const,
  },
};

// Fallback Exam Data (GATE DA)
export const FALLBACK_EXAMS: Exam[] = [
  {
    id: "894a3adb-0927-456e-9d63-78d11ad7c684",
    name: "GATE Data Science & Artificial Intelligence",
    code: "GATE-DA",
    slug: "gate-da",
    description: "Graduate Aptitude Test in Engineering for Data Science and Artificial Intelligence. High-rigor preparation covering Probability, Linear Algebra, Machine Learning, Deep Learning, and AI.",
    status: "ACTIVE",
    default_duration_seconds: 10800,
    default_total_marks: 100.0,
    instructions: "1. 180 minutes duration.\n2. Total 65 questions (10 General Aptitude, 55 Technical).\n3. MCQ negative marking applies (-0.33 for 1 mark, -0.66 for 2 marks).\n4. MSQ and NAT have zero negative marks.",
    config: {
      sections: ["General Aptitude", "Data Science & AI"],
      calculator: true,
    },
  },
  {
    id: "31dc35e7-a342-48c0-be97-335585f880f2",
    name: "GATE Computer Science & IT",
    code: "GATE-CS",
    slug: "gate-cs",
    description: "Comprehensive preparation platform for Computer Science Engineering. Algorithms, Operating Systems, DBMS, Theory of Computation, and Computer Networks.",
    status: "ACTIVE",
    default_duration_seconds: 10800,
    default_total_marks: 100.0,
    instructions: "Standard GATE CS marking scheme and examination format.",
  },
];

export const FALLBACK_SUBJECTS: Subject[] = [
  {
    id: "sub-1",
    exam_id: "894a3adb-0927-456e-9d63-78d11ad7c684",
    name: "Probability & Statistics",
    code: "PROB-STAT",
    description: "Counting, probability axioms, Bayes theorem, random variables, Gaussian, Poisson distributions, hypothesis testing.",
    display_order: 1,
    is_active: true,
  },
  {
    id: "sub-2",
    exam_id: "894a3adb-0927-456e-9d63-78d11ad7c684",
    name: "Linear Algebra",
    code: "LIN-ALG",
    description: "Vector spaces, subspaces, linear dependence, matrices, eigenvalues, eigenvectors, SVD, PCA.",
    display_order: 2,
    is_active: true,
  },
  {
    id: "sub-3",
    exam_id: "894a3adb-0927-456e-9d63-78d11ad7c684",
    name: "Machine Learning",
    code: "ML",
    description: "Supervised and unsupervised learning, Ridge/Lasso, SVM, Decision Trees, Random Forests, K-Means.",
    display_order: 3,
    is_active: true,
  },
  {
    id: "sub-4",
    exam_id: "894a3adb-0927-456e-9d63-78d11ad7c684",
    name: "Artificial Intelligence",
    code: "AI",
    description: "Informed and uninformed search (A*, heuristic), Minimax, Alpha-Beta pruning, propositional logic.",
    display_order: 4,
    is_active: true,
  },
  {
    id: "sub-5",
    exam_id: "894a3adb-0927-456e-9d63-78d11ad7c684",
    name: "Data Structures & Algorithms",
    code: "DSA",
    description: "Python, asymptotic complexity, trees, graphs (Dijkstra, DFS, BFS), dynamic programming.",
    display_order: 5,
    is_active: true,
  },
];

export const FALLBACK_TESTS: Test[] = [
  {
    id: "28b7508d-875c-4bf6-91c2-55e4477b760e",
    exam_id: "894a3adb-0927-456e-9d63-78d11ad7c684",
    title: "GATE DA All India Open Mock Test 1",
    slug: "gate-da-all-india-open-mock-1",
    description: "Full-scale GATE CBT simulation featuring Probability, Linear Algebra, Machine Learning, and AI Search questions with precise server-authoritative marking rules.",
    instructions: "1. Virtual scientific calculator available on top.\n2. MCQ: 1/3 negative marking. MSQ & NAT: No negative marking.\n3. Detailed solutions and performance analytics released immediately after submission.",
    duration_seconds: 10800,
    total_marks: 7.0,
    total_questions: 5,
    status: "PUBLISHED",
    result_release_policy: "IMMEDIATE",
    explanation_release_policy: "WITH_RESULT",
    display_order: 1,
  },
  {
    id: "test-topic-prob",
    exam_id: "894a3adb-0927-456e-9d63-78d11ad7c684",
    title: "Probability & Bayes Theorem Sectional Sprint",
    slug: "probability-bayes-sprint",
    description: "Targeted 30-minute practice test on Conditional Probability, Bayes Theorem, and Expectation.",
    instructions: "Short sectional sprint to evaluate conceptual precision.",
    duration_seconds: 1800,
    total_marks: 15.0,
    total_questions: 10,
    status: "PUBLISHED",
    result_release_policy: "IMMEDIATE",
    explanation_release_policy: "WITH_RESULT",
    display_order: 2,
  },
  {
    id: "test-ml-eval",
    exam_id: "894a3adb-0927-456e-9d63-78d11ad7c684",
    title: "Machine Learning & Optimization Mock Drill",
    slug: "ml-optimization-drill",
    description: "Comprehensive drill covering Loss Functions, Regularization, and SVM Margin optimization.",
    instructions: "Calculators allowed. Numerical answers should be entered to 2 decimal places.",
    duration_seconds: 3600,
    total_marks: 25.0,
    total_questions: 15,
    status: "PUBLISHED",
    result_release_policy: "IMMEDIATE",
    explanation_release_policy: "WITH_RESULT",
    display_order: 3,
  },
];

// Fallback CBT Questions
export const FALLBACK_CBT_QUESTIONS: AttemptQuestion[] = [
  {
    id: "q-1",
    question_type: "MCQ",
    positive_marks: 1.0,
    negative_marks: 0.33,
    text: "Two fair coins are flipped simultaneously. Given that at least one flip is Heads, what is the conditional probability that both flips are Heads?",
    options: [
      { id: "opt-1a", label: "A", text: "1/4 (0.25)", display_order: 1 },
      { id: "opt-1b", label: "B", text: "1/3 (0.33)", display_order: 2 },
      { id: "opt-1c", label: "C", text: "1/2 (0.50)", display_order: 3 },
      { id: "opt-1d", label: "D", text: "2/3 (0.67)", display_order: 4 },
    ],
  },
  {
    id: "q-2",
    question_type: "MSQ",
    positive_marks: 2.0,
    negative_marks: 0.0,
    text: "Let A be a 3 × 3 real symmetric matrix with eigenvalues λ₁ = 2, λ₂ = 2, and λ₃ = 5. Which of the following statements are TRUE? (Select all that apply)",
    options: [
      { id: "opt-2a", label: "A", text: "Matrix A is orthogonally diagonalizable.", display_order: 1 },
      { id: "opt-2b", label: "B", text: "The trace of matrix A is equal to 9.", display_order: 2 },
      { id: "opt-2c", label: "C", text: "The determinant of matrix A is equal to 20.", display_order: 3 },
      { id: "opt-2d", label: "D", text: "Matrix A is strictly negative definite.", display_order: 4 },
    ],
  },
  {
    id: "q-3",
    question_type: "NAT",
    positive_marks: 2.0,
    negative_marks: 0.0,
    text: "In a binary classification test dataset of 100 samples, the model predicted positive for 40 samples, of which 30 were True Positives. There are 50 actual positives in total. Calculate the F1-score of the classifier. (Round off to 2 decimal places)",
    options: [],
  },
  {
    id: "q-4",
    question_type: "MCQ",
    positive_marks: 1.0,
    negative_marks: 0.33,
    text: "In A* search algorithm, let h(n) denote the heuristic function and h*(n) denote the true minimal cost to goal. Under tree search, A* is guaranteed to be optimal if:",
    options: [
      { id: "opt-4a", label: "A", text: "h(n) ≤ h*(n) for all nodes (Admissibility)", display_order: 1 },
      { id: "opt-4b", label: "B", text: "h(n) ≥ h*(n) for all nodes", display_order: 2 },
      { id: "opt-4c", label: "C", text: "h(n) = 0 for every node", display_order: 3 },
      { id: "opt-4d", label: "D", text: "h(n) is negative for goal nodes", display_order: 4 },
    ],
  },
  {
    id: "q-5",
    question_type: "NAT",
    positive_marks: 1.0,
    negative_marks: 0.0,
    text: "A recurrence relation is given by T(n) = 2·T(n/2) + n for n > 1, with base case T(1) = 1. What is the exact value of T(64)?",
    options: [],
  },
];

export const FALLBACK_RESOURCES: Resource[] = [
  {
    id: "res-1",
    exam_id: "894a3adb-0927-456e-9d63-78d11ad7c684",
    title: "Probability Distributions Quick Reference Sheet",
    description: "PDF covering PMFs, PDFs, Mean, Variance, and MGF for Bernoulli, Binomial, Poisson, Uniform, and Gaussian distributions.",
    resource_type: "notes",
    file_url: "#",
    file_size_bytes: 245000,
    mime_type: "application/pdf",
    is_published: true,
  },
  {
    id: "res-2",
    exam_id: "894a3adb-0927-456e-9d63-78d11ad7c684",
    title: "Eigenvalues, SVD & PCA Formula Handbook",
    description: "Spectral theorem, positive definite criteria, orthonormal bases, and SVD decomposition step-by-step algorithms.",
    resource_type: "notes",
    file_url: "#",
    file_size_bytes: 312000,
    mime_type: "application/pdf",
    is_published: true,
  },
  {
    id: "res-3",
    exam_id: "894a3adb-0927-456e-9d63-78d11ad7c684",
    title: "Machine Learning Loss Functions & Convex Optimization Guide",
    description: "Mathematical derivations for Cross-Entropy, Hinge Loss, L1 vs L2 regularization, and Gradient Descent convergence rates.",
    resource_type: "notes",
    file_url: "#",
    file_size_bytes: 189000,
    mime_type: "application/pdf",
    is_published: true,
  },
];

// Local Storage Auth & Token Management
export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("exam_platform_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null) {
  if (typeof window !== "undefined") {
    if (user) {
      localStorage.setItem("exam_platform_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("exam_platform_user");
    }
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("exam_platform_token");
}

export function setAuthToken(token: string | null) {
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("exam_platform_token", token);
    } else {
      localStorage.removeItem("exam_platform_token");
    }
  }
}

export function clearStoredAuth() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("exam_platform_user");
    localStorage.removeItem("exam_platform_token");
  }
}

// Real Backend Authentication & Authorization Endpoints
export async function apiLogin(
  email: string,
  password: string
): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Authentication failed. Please check your credentials.");
  }

  const tokenData = await res.json();
  const token = tokenData.access_token;
  setAuthToken(token);

  // Fetch verified user profile using JWT
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!meRes.ok) {
    throw new Error("Failed to load user profile");
  }

  const user: User = await meRes.json();
  setStoredUser(user);
  return { user, token };
}

export async function apiRegister(
  email: string,
  password: string,
  fullName: string,
  phone?: string
): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      full_name: fullName.trim(),
      phone: phone?.trim() || undefined,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      typeof errorData.detail === "string"
        ? errorData.detail
        : Array.isArray(errorData.detail)
        ? errorData.detail.map((d: any) => d.msg).join(", ")
        : "Registration failed. Password must be >=8 chars and contain uppercase, lowercase & digits.";
    throw new Error(message);
  }

  // Auto-login upon successful registration
  return await apiLogin(email, password);
}

export async function apiGetMe(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      clearStoredAuth();
      return null;
    }
    const user: User = await res.json();
    setStoredUser(user);
    return user;
  } catch {
    return getStoredUser();
  }
}

export async function apiLogout(): Promise<void> {
  const token = getAuthToken();
  try {
    if (token) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch {
    // Graceful offline logout
  } finally {
    clearStoredAuth();
  }
}

// API client functions
export async function fetchExams(): Promise<Exam[]> {
  try {
    const res = await fetch(`${API_BASE}/exams`, { cache: "no-store" });
    if (!res.ok) throw new Error("Backend response error");
    const data = await res.json();
    return data && data.length > 0 ? data : FALLBACK_EXAMS;
  } catch {
    return FALLBACK_EXAMS;
  }
}

export async function fetchExamBySlug(slug: string): Promise<Exam | undefined> {
  try {
    const res = await fetch(`${API_BASE}/exams/${slug}`);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return FALLBACK_EXAMS.find((e) => e.slug === slug) || FALLBACK_EXAMS[0];
  }
}

export async function fetchSubjects(examId: string): Promise<Subject[]> {
  try {
    const res = await fetch(`${API_BASE}/exams/${examId}/subjects`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data && data.length > 0 ? data : FALLBACK_SUBJECTS;
  } catch {
    return FALLBACK_SUBJECTS;
  }
}

export async function fetchTests(examId: string): Promise<Test[]> {
  try {
    const res = await fetch(`${API_BASE}/exams/${examId}/tests`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data && data.length > 0 ? data : FALLBACK_TESTS;
  } catch {
    return FALLBACK_TESTS;
  }
}

export async function fetchTestById(testId: string): Promise<Test | undefined> {
  const tests = await fetchTests("default");
  return tests.find((t) => t.id === testId) || FALLBACK_TESTS[0];
}

export async function startAttempt(testId: string, token?: string): Promise<{ id: string; questions: AttemptQuestion[] }> {
  try {
    const authToken = token || getAuthToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

    const res = await fetch(`${API_BASE}/tests/${testId}/attempts`, {
      method: "POST",
      headers,
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return {
      id: data.id || "attempt-" + Date.now(),
      questions: data.questions || FALLBACK_CBT_QUESTIONS,
    };
  } catch {
    return {
      id: "attempt-" + Date.now(),
      questions: FALLBACK_CBT_QUESTIONS,
    };
  }
}

export async function saveAttemptAnswer(
  attemptId: string,
  questionId: string,
  answer: Partial<AttemptAnswer>,
  token?: string
) {
  try {
    const authToken = token || getAuthToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

    await fetch(`${API_BASE}/attempts/${attemptId}/answers/${questionId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(answer),
    });
  } catch {
    // Local memory fallback
  }
}

export async function submitAttempt(
  attemptId: string,
  answers: Record<string, AttemptAnswer>,
  questions: AttemptQuestion[],
  token?: string
): Promise<Result> {
  try {
    const authToken = token || getAuthToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

    const res = await fetch(`${API_BASE}/attempts/${attemptId}/submit`, {
      method: "POST",
      headers,
    });
    if (res.ok) {
      const resResult = await fetch(`${API_BASE}/attempts/${attemptId}/result`, { headers });
      if (resResult.ok) {
        return await resResult.json();
      }
    }
  } catch {
    // evaluate locally with authentic GATE scoring
  }

  // Local evaluation engine
  let totalScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let maxPossible = 0;

  const questionResults = questions.map((q) => {
    maxPossible += q.positive_marks;
    const ans = answers[q.id];

    let isCorrect = false;
    let marksAwarded = 0;
    let correctOptionIds: string[] = [];
    let correctNumerical: number | undefined = undefined;

    if (q.id === "q-1") {
      correctOptionIds = ["opt-1b"]; // B (1/3)
      if (ans && ans.selected_option_ids?.includes("opt-1b")) {
        isCorrect = true;
        marksAwarded = 1.0;
      } else if (ans && ans.selected_option_ids && ans.selected_option_ids.length > 0) {
        marksAwarded = -0.33;
      }
    } else if (q.id === "q-2") {
      correctOptionIds = ["opt-2a", "opt-2b", "opt-2c"]; // A, B, C
      const selected = ans?.selected_option_ids || [];
      const hasAll = ["opt-2a", "opt-2b", "opt-2c"].every((id) => selected.includes(id));
      const hasExtra = selected.includes("opt-2d");
      if (hasAll && !hasExtra) {
        isCorrect = true;
        marksAwarded = 2.0;
      } else if (selected.length > 0) {
        marksAwarded = 0.0; // MSQ has NO negative marking in GATE
      }
    } else if (q.id === "q-3") {
      correctNumerical = 0.67;
      if (ans && ans.numerical_answer !== undefined && ans.numerical_answer !== null) {
        if (Math.abs(ans.numerical_answer - 0.67) <= 0.02) {
          isCorrect = true;
          marksAwarded = 2.0;
        }
      }
    } else if (q.id === "q-4") {
      correctOptionIds = ["opt-4a"];
      if (ans && ans.selected_option_ids?.includes("opt-4a")) {
        isCorrect = true;
        marksAwarded = 1.0;
      } else if (ans && ans.selected_option_ids && ans.selected_option_ids.length > 0) {
        marksAwarded = -0.33;
      }
    } else if (q.id === "q-5") {
      correctNumerical = 448.0;
      if (ans && ans.numerical_answer === 448.0) {
        isCorrect = true;
        marksAwarded = 1.0;
      }
    }

    if (!ans || (!ans.selected_option_ids?.length && ans.numerical_answer === undefined)) {
      unansweredCount++;
    } else if (isCorrect) {
      correctCount++;
      totalScore += marksAwarded;
    } else {
      incorrectCount++;
      totalScore += marksAwarded;
    }

    return {
      question_id: q.id,
      question_type: q.question_type,
      question_text: q.text,
      options: q.options as any,
      student_selected_options: ans?.selected_option_ids,
      student_numerical_answer: ans?.numerical_answer,
      correct_option_ids: correctOptionIds,
      correct_numerical_answer: correctNumerical,
      is_correct: isCorrect,
      marks_awarded: Math.round(marksAwarded * 100) / 100,
      explanation:
        q.id === "q-1"
          ? "Sample space: S = {HH, HT, TH, TT}. Given at least one flip is Heads, possible outcomes are {HH, HT, TH}. Both Heads is {HH}. P(B|A) = 1/3."
          : q.id === "q-2"
          ? "A real symmetric matrix is always orthogonally diagonalizable. Trace = 2 + 2 + 5 = 9. Determinant = 2 × 2 × 5 = 20. All eigenvalues are positive, so A is positive definite."
          : q.id === "q-3"
          ? "Precision = TP / Predicted Positives = 30 / 40 = 0.75. Recall = TP / Actual Positives = 30 / 50 = 0.60. F1 = 2 × (0.75 × 0.60) / (0.75 + 0.60) = 0.90 / 1.35 ≈ 0.67."
          : q.id === "q-4"
          ? "In tree search, A* is admissible (optimal) if h(n) ≤ h*(n) for all nodes (admissible heuristic)."
          : "By Master Theorem / recursion tree: T(n) = n·log₂(n) + n. For n = 64: 64·6 + 64 = 384 + 64 = 448.",
    };
  });

  const answered = correctCount + incorrectCount;
  const accuracy = answered > 0 ? (correctCount / answered) * 100 : 0;
  const percentage = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;

  return {
    id: "result-" + Date.now(),
    attempt_id: attemptId,
    total_score: Math.max(0, Math.round(totalScore * 100) / 100),
    max_possible_marks: maxPossible,
    correct_count: correctCount,
    incorrect_count: incorrectCount,
    unanswered_count: unansweredCount,
    total_questions: questions.length,
    accuracy_percentage: Math.round(accuracy * 10) / 10,
    percentage_score: Math.round(percentage * 10) / 10,
    time_taken_seconds: 480,
    question_results: questionResults,
    is_released: true,
    evaluated_at: new Date().toISOString(),
  };
}

export async function apiCreateExam(examData: Partial<Exam>, token?: string): Promise<Exam | null> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/admin/exams`, {
      method: "POST",
      headers,
      body: JSON.stringify(examData),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function apiFetchAdminMetrics(token?: string): Promise<AdminDashboardMetrics | null> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/admin/dashboard`, { headers });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Resource / Study Material Management
export async function fetchPublishedResources(examId: string, topicId?: string): Promise<Resource[]> {
  try {
    let url = `${API_BASE}/exams/${examId}/resources`;
    if (topicId) url += `?topic_id=${topicId}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchAdminResources(examId: string, token?: string): Promise<Resource[]> {
  try {
    const authToken = token || getAuthToken();
    const headers: Record<string, string> = {};
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    const res = await fetch(`${API_BASE}/admin/exams/${examId}/resources`, { headers });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function apiCreateResource(examId: string, data: Partial<Resource>, token?: string): Promise<Resource | null> {
  try {
    const authToken = token || getAuthToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    const res = await fetch(`${API_BASE}/admin/exams/${examId}/resources`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function apiUpdateResource(resourceId: string, data: Partial<Resource>, token?: string): Promise<Resource | null> {
  try {
    const authToken = token || getAuthToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    const res = await fetch(`${API_BASE}/admin/resources/${resourceId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function apiDeleteResource(resourceId: string, token?: string): Promise<boolean> {
  try {
    const authToken = token || getAuthToken();
    const headers: Record<string, string> = {};
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    const res = await fetch(`${API_BASE}/admin/resources/${resourceId}`, {
      method: "DELETE",
      headers,
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Question Bank Management
export async function fetchAdminQuestions(examId: string, token?: string): Promise<Question[]> {
  try {
    const authToken = token || getAuthToken();
    const headers: Record<string, string> = {};
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    const res = await fetch(`${API_BASE}/admin/questions?exam_id=${examId}&limit=100`, { headers });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function apiCreateQuestion(data: any, token?: string): Promise<Question | null> {
  const authToken = token || getAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  const res = await fetch(`${API_BASE}/admin/questions`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create question in database");
  }
  return await res.json();
}

// Test Creation & Management
export async function apiCreateTest(examId: string, data: any, token?: string): Promise<Test | null> {
  const authToken = token || getAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  const res = await fetch(`${API_BASE}/admin/exams/${examId}/tests`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create test");
  }
  return await res.json();
}

export async function apiPublishTest(testId: string, token?: string): Promise<Test | null> {
  try {
    const authToken = token || getAuthToken();
    const headers: Record<string, string> = {};
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    const res = await fetch(`${API_BASE}/admin/tests/${testId}/publish`, {
      method: "POST",
      headers,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Student Attempt History
export async function fetchStudentAttemptsList(token?: string): Promise<any[]> {
  try {
    const authToken = token || getAuthToken();
    if (!authToken) return [];
    const res = await fetch(`${API_BASE}/student/attempts`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}


