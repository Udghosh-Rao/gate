/**
 * Centralized Brand & Platform Configuration
 *
 * Provides a single source of truth for the platform name, positioning,
 * and contact details. Easily replaceable globally when the final
 * brand name is decided.
 */

export const BRAND = {
  name: "ExamPrep",
  legalName: "ExamPrep Learning Technologies Pvt. Ltd.",
  tagline: "Structured Preparation for Competitive Examinations",
  missionStatement:
    "Building India's most dependable, academically rigorous preparation platform for competitive examinations.",
  initialExamFocus: "GATE Data Science & Artificial Intelligence (GATE DA)",
  supportEmail: "support@examprep.in",
  contactEmail: "hello@examprep.in",
  facultyEmail: "academic@examprep.in",
  careersEmail: "careers@examprep.in",
  address: "Bangalore & New Delhi, India",
} as const;
