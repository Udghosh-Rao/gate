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
  AttemptStartResponse,
  Result,
  AdminDashboardMetrics,
  StudentAttemptSummary,
} from "./types";

const CONFIGURED_API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const API_BASE = CONFIGURED_API_BASE || (process.env.NODE_ENV === "development" ? "http://localhost:8000/api/v1" : "");

function getApiBase(): string {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured for this deployment.");
  }
  return API_BASE;
}

export const resourceDownloadUrl = (resourceId: string) => `${getApiBase()}/resources/${resourceId}/download`;

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
  const res = await fetch(`${getApiBase()}/auth/login`, {
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
  const meRes = await fetch(`${getApiBase()}/auth/me`, {
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
  const res = await fetch(`${getApiBase()}/auth/register`, {
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
        ? errorData.detail.map((d: { msg?: string }) => d.msg || "Invalid input").join(", ")
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
    const res = await fetch(`${getApiBase()}/auth/me`, {
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
    return null;
  }
}

export async function apiLogout(): Promise<void> {
  const token = getAuthToken();
  try {
    if (token) {
      await fetch(`${getApiBase()}/auth/logout`, {
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
  const res = await fetch(`${getApiBase()}/exams`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Unable to load examinations (${res.status})`);
  const data: unknown = await res.json();
  if (!Array.isArray(data)) throw new Error("Invalid examination response");
  return data as Exam[];
}

export async function fetchExamBySlug(slug: string): Promise<Exam | undefined> {
  try {
    const res = await fetch(`${getApiBase()}/exams/${slug}`);
    if (!res.ok) return undefined;
    return await res.json();
  } catch {
    return undefined;
  }
}

export async function fetchSubjects(examId: string): Promise<Subject[]> {
  if (!examId) return [];
  const res = await fetch(`${getApiBase()}/exams/${examId}/subjects`);
  if (!res.ok) throw new Error(`Unable to load subjects (${res.status})`);
  const data: unknown = await res.json();
  if (!Array.isArray(data)) throw new Error("Invalid subject response");
  return data as Subject[];
}

export async function fetchTopics(subjectId: string): Promise<Topic[]> {
  if (!subjectId) return [];
  const res = await fetch(`${getApiBase()}/subjects/${subjectId}/topics`);
  if (!res.ok) throw new Error(`Unable to load syllabus topics (${res.status})`);
  const data: unknown = await res.json();
  if (!Array.isArray(data)) throw new Error("Invalid topic response");
  return data as Topic[];
}

export async function fetchTests(examId: string): Promise<Test[]> {
  if (!examId) return [];
  const res = await fetch(`${getApiBase()}/exams/${examId}/tests`);
  if (!res.ok) throw new Error(`Unable to load tests (${res.status})`);
  const data: unknown = await res.json();
  if (!Array.isArray(data)) throw new Error("Invalid test response");
  return data as Test[];
}

export async function fetchTestById(testId: string): Promise<Test | undefined> {
  if (!testId) return undefined;
  try {
    const res = await fetch(`${getApiBase()}/tests/${testId}`);
    if (!res.ok) return undefined;
    return await res.json();
  } catch {
    return undefined;
  }
}

export async function startAttempt(
  testId: string,
  token?: string
): Promise<AttemptStartResponse> {
  const authToken = token || getAuthToken();
  if (!authToken) {
    throw new Error("You must be logged in to start a test.");
  }

  const res = await fetch(`${getApiBase()}/tests/${testId}/attempts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (res.status === 401) {
    throw new Error("Your session has expired. Please log in again.");
  }
  if (res.status === 403) {
    throw new Error("You do not have permission to start this test.");
  }
  if (res.status === 400) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Cannot start this test. It may be unavailable or you have reached the attempt limit.");
  }
  if (!res.ok) {
    throw new Error("Failed to start test. Please try again.");
  }

  const data = await res.json();
  if (!data.id || !data.questions) {
    throw new Error("Invalid response from server. Please try again.");
  }

  return data as AttemptStartResponse;
}

export async function saveAttemptAnswer(
  attemptId: string,
  questionId: string,
  answer: Partial<AttemptAnswer>,
  token?: string
): Promise<boolean> {
  const authToken = token || getAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const res = await fetch(`${getApiBase()}/attempts/${attemptId}/answers/${questionId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(answer),
  });

  if (!res.ok) {
    throw new Error(`Failed to save answer for question ${questionId}`);
  }
  return true;
}

export async function submitAttempt(
  attemptId: string,
  token?: string
): Promise<Result> {
  const authToken = token || getAuthToken();
  if (!authToken) {
    throw new Error("You must be logged in to submit a test.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken}`,
  };

  const submitRes = await fetch(`${getApiBase()}/attempts/${attemptId}/submit`, {
    method: "POST",
    headers,
  });

  if (submitRes.status === 401) {
    throw new Error("Your session has expired. Please log in again.");
  }
  if (submitRes.status === 403) {
    throw new Error("You are not authorized to submit this attempt.");
  }
  if (!submitRes.ok) {
    const err = await submitRes.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to submit test. Please try again.");
  }

  // Fetch the evaluated result (may need a brief retry if evaluation is async)
  for (let attempt = 0; attempt < 3; attempt++) {
    const resultRes = await fetch(`${getApiBase()}/attempts/${attemptId}/result`, { headers });
    if (resultRes.ok) {
      return await resultRes.json();
    }
    if (resultRes.status === 403) {
      throw new Error("Result has not been released yet.");
    }
    // Wait 500ms before retry (evaluation may be in progress)
    await new Promise((r) => setTimeout(r, 500));
  }

  throw new Error("Result is not yet available. Please check your attempt history.");
}




export async function apiCreateExam(examData: Partial<Exam>, token?: string): Promise<Exam> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${getApiBase()}/admin/exams`, {
      method: "POST",
      headers,
      body: JSON.stringify(examData),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || `Unable to create examination (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    throw error instanceof Error ? error : new Error("Unable to create examination");
  }
}

export async function apiFetchAdminMetrics(token?: string): Promise<AdminDashboardMetrics | null> {
  const authToken = token || getAuthToken();
  const headers: Record<string, string> = {};
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  const res = await fetch(`${getApiBase()}/admin/dashboard`, { headers });
  if (!res.ok) throw new Error(`Unable to load admin metrics (${res.status})`);
  return await res.json();
}

// Resource / Study Material Management
export async function fetchPublishedResources(examId: string, topicId?: string): Promise<Resource[]> {
  let url = `${getApiBase()}/exams/${examId}/resources`;
  if (topicId) url += `?topic_id=${topicId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Unable to load study materials (${res.status})`);
  return await res.json();
}

export async function fetchAdminResources(examId: string, token?: string): Promise<Resource[]> {
  try {
    const authToken = token || getAuthToken();
    const headers: Record<string, string> = {};
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    const res = await fetch(`${getApiBase()}/admin/exams/${examId}/resources`, { headers });
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
    const res = await fetch(`${getApiBase()}/admin/exams/${examId}/resources`, {
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
    const res = await fetch(`${getApiBase()}/admin/resources/${resourceId}`, {
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
    const res = await fetch(`${getApiBase()}/admin/resources/${resourceId}`, {
      method: "DELETE",
      headers,
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiUploadStudyMaterial(
  examId: string,
  file: File,
  title: string,
  description?: string,
  token?: string
): Promise<Resource | null> {
  const authToken = token || getAuthToken();
  const headers: Record<string, string> = {};
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const formData = new FormData();
  formData.append("file", file);
  // title and description are query params on the upload endpoint
  const params = new URLSearchParams({ title });
  if (description) params.append("description", description);

  const res = await fetch(
    `${getApiBase()}/admin/exams/${examId}/resources/upload?${params.toString()}`,
    {
      method: "POST",
      headers,
      body: formData,
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "File upload failed");
  }
  return await res.json();
}

// Question Bank Management
export async function fetchAdminQuestions(examId: string, token?: string): Promise<Question[]> {
  try {
    const authToken = token || getAuthToken();
    const headers: Record<string, string> = {};
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    const res = await fetch(`${getApiBase()}/admin/questions?exam_id=${examId}&limit=100`, { headers });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export interface QuestionCreatePayload {
  exam_id: string;
  subject_id?: string | null;
  topic_id?: string | null;
  question_type: Question["question_type"];
  difficulty: Question["difficulty"];
  text: string;
  image_url?: string | null;
  explanation?: string;
  positive_marks: number;
  negative_marks: number;
  correct_numerical_answer?: number;
  numerical_tolerance?: number;
  partial_credit: boolean;
  options: { label: string; text: string; image_url?: string; is_correct: boolean; display_order: number }[];
}
export interface TestCreatePayload {
  test_series_id?: string | null;
  title: string;
  slug: string;
  description?: string;
  instructions?: string;
  duration_seconds: number;
  total_marks: number;
  result_release_policy: Test["result_release_policy"];
  explanation_release_policy: Test["explanation_release_policy"];
  is_retakeable: boolean;
  max_attempts?: number | null;
  marking_scheme?: Record<string, string | number | boolean> | null;
  display_order?: number;
  questions: { question_id: string; question_number: number; section_id?: string; positive_marks?: number; negative_marks?: number }[];
}

export async function apiCreateQuestion(data: QuestionCreatePayload, token?: string): Promise<Question> {
  const authToken = token || getAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  const res = await fetch(`${getApiBase()}/admin/questions`, {
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
export async function apiCreateTest(examId: string, data: TestCreatePayload, token?: string): Promise<Test> {
  const authToken = token || getAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  const res = await fetch(`${getApiBase()}/admin/exams/${examId}/tests`, {
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
    const res = await fetch(`${getApiBase()}/admin/tests/${testId}/publish`, {
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
export async function fetchStudentAttemptsList(token?: string): Promise<StudentAttemptSummary[]> {
  try {
    const authToken = token || getAuthToken();
    if (!authToken) return [];
    const res = await fetch(`${getApiBase()}/student/attempts`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}


