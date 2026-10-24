export type UserRole = "ADMIN" | "STUDENT" | "CONTENT_MANAGER";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  avatar_url?: string | null;
}

export interface Exam {
  id: string;
  name: string;
  code: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  default_duration_seconds: number;
  default_total_marks: number;
  instructions?: string | null;
  config?: Record<string, any> | null;
}

export interface Subject {
  id: string;
  exam_id: string;
  name: string;
  code: string;
  description?: string | null;
  display_order: number;
  is_active: boolean;
}

export interface Topic {
  id: string;
  subject_id: string;
  syllabus_version_id?: string | null;
  parent_id?: string | null;
  name: string;
  description?: string | null;
  display_order: number;
  is_active: boolean;
}

export interface Resource {
  id: string;
  exam_id: string;
  topic_id?: string | null;
  title: string;
  description?: string | null;
  resource_type: string;
  file_url?: string | null;
  file_size_bytes?: number | null;
  mime_type?: string | null;
  is_published: boolean;
}

export type QuestionType = "MCQ" | "MSQ" | "NAT";
export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";
export type QuestionStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "ARCHIVED";

export interface QuestionOption {
  id: string;
  question_id?: string;
  label: string;
  text: string;
  image_url?: string | null;
  is_correct?: boolean;
  display_order: number;
}

export interface Question {
  id: string;
  exam_id: string;
  subject_id?: string | null;
  topic_id?: string | null;
  question_type: QuestionType;
  difficulty: QuestionDifficulty;
  status: QuestionStatus;
  text: string;
  image_url?: string | null;
  explanation?: string | null;
  positive_marks: number;
  negative_marks: number;
  correct_numerical_answer?: number | null;
  numerical_tolerance?: number | null;
  partial_credit: boolean;
  options: QuestionOption[];
}

export interface TestSeries {
  id: string;
  exam_id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  display_order: number;
}

export interface TestSection {
  id: string;
  test_id: string;
  name: string;
  description?: string | null;
  display_order: number;
}

export interface Test {
  id: string;
  test_series_id?: string | null;
  exam_id: string;
  title: string;
  slug: string;
  description?: string | null;
  instructions?: string | null;
  duration_seconds: number;
  total_marks: number;
  total_questions: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  result_release_policy: "IMMEDIATE" | "AFTER_DEADLINE" | "MANUAL";
  explanation_release_policy: "WITH_RESULT" | "AFTER_DEADLINE" | "MANUAL" | "NEVER";
  display_order: number;
}

export interface AttemptQuestion {
  id: string;
  question_type: QuestionType;
  text: string;
  image_url?: string | null;
  positive_marks: number;
  negative_marks: number;
  section_id?: string;
  options: {
    id: string;
    label: string;
    text: string;
    image_url?: string | null;
    display_order: number;
  }[];
}

export interface AttemptAnswer {
  question_id: string;
  selected_option_ids?: string[] | null;
  numerical_answer?: number | null;
  is_marked_for_review: boolean;
  is_visited: boolean;
  time_spent_seconds: number;
}

export interface QuestionResultDetail {
  question_id: string;
  question_type: QuestionType;
  question_text: string;
  options: QuestionOption[];
  student_selected_options?: string[] | null;
  student_numerical_answer?: number | null;
  correct_option_ids?: string[] | null;
  correct_numerical_answer?: number | null;
  is_correct: boolean;
  marks_awarded: number;
  explanation?: string | null;
}

export interface Result {
  id: string;
  attempt_id: string;
  total_score: number;
  max_possible_marks: number;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  total_questions: number;
  accuracy_percentage: number;
  percentage_score: number;
  time_taken_seconds: number;
  section_wise_scores?: Record<string, any> | null;
  subject_wise_scores?: Record<string, any> | null;
  topic_wise_scores?: Record<string, any> | null;
  question_results?: QuestionResultDetail[] | null;
  is_released: boolean;
  evaluated_at: string;
}

export interface AdminDashboardMetrics {
  total_users: number;
  users_by_role: Record<string, number>;
  total_exams: number;
  total_tests: number;
  total_questions: number;
  total_attempts: number;
}
