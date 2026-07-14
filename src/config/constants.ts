/**
 * KONEXA Global Enterprise Constants
 * 
 * Centralized settings, metadata options, routes, and limits for the platform.
 */

export const PLATFORM_INFO = {
  name: "KONEXA",
  tagline: "The Project-Based Global Hiring Operating System",
  version: "1.0.0-fndtn",
  philosophy: "Project -> Trust -> Employment",
};

export const ROUTES = {
  landing: "/",
  about: "/about",
  features: "/features",
  pricing: "/pricing",
  faq: "/faq",
  blog: "/blog",
  contact: "/contact",
  legal: "/legal",
  auth: {
    student: "/auth/student",
    company: "/auth/company",
    admin: "/auth/admin",
  },
  dashboard: {
    student: "/dashboard/student",
    company: "/dashboard/company",
    admin: "/dashboard/admin",
  },
};

export const PLATFORM_LIMITS = {
  maxCodeUploadBytes: 10 * 1024 * 1024, // 10MB
  maxSkillsPerStudent: 30,
  maxProjectsPerCompany: 50,
  maxTagsPerProject: 10,
  trustScoreMin: 0,
  trustScoreMax: 100,
  defaultTrustScore: 80,
};

export const SKILL_CATEGORIES = [
  "Frontend",
  "Backend",
  "Database",
  "AI/ML",
  "DevOps",
  "Mobile",
  "Design/UX",
];

export const STUDENT_ONBOARDING_STEPS = {
  WELCOME: 1,
  PROFILE_DETAILS: 2,
  SKILLS_ASSESSMENT: 3,
  GITHUB_VERIFICATION: 4,
  READY: 5,
};

export const COMPANY_ONBOARDING_STEPS = {
  WELCOME: 1,
  ORGANIZATION_DETAILS: 2,
  VERIFICATION: 3,
  READY: 4,
};
