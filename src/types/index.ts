export enum UserRole {
  STUDENT = "student",
  COMPANY = "company",
  ADMIN = "admin",
  AI = "ai",
  UNIVERSITY = "university",
  MENTOR = "mentor",
  PARTNER = "partner",
  SUPPORT = "support"
}

export enum ProjectDifficulty {
  EASY = "Easy",
  MEDIUM = "Medium",
  HARD = "Hard"
}

export enum ProjectStatus {
  OPEN = "open",
  FILLED = "filled",
  COMPLETED = "completed"
}

export enum ApplicationStatus {
  SUBMITTED = "submitted",
  REVIEWED = "reviewed",
  APPROVED = "approved",
  REJECTED = "rejected"
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: number;
}

export interface StudentProfile {
  uid: string;
  name: string;
  preferredName?: string;
  profilePhoto?: string;
  nationality?: string;
  currentCountry?: string;
  university?: string;
  degree?: string;
  major?: string;
  graduationYear?: string;
  studentId?: string;
  languages?: string[];
  englishLevel?: string;
  koreanLevel?: string;
  skills: string[];
  certificates?: string[];
  github: string;
  portfolio?: string;
  linkedin?: string;
  resumeUrl?: string;
  careerInterests?: string[];
  preferredIndustry?: string;
  preferredJob?: string;
  preferredCountry?: string;
  preferredSalary?: string;
  availability?: string;
  workPreference?: "Remote" | "Hybrid" | "Onsite";
  timezone?: string;
  bio: string;
  emergencyContact?: string;
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  privacySettings?: {
    publicProfile: boolean;
    showResume: boolean;
  };
  trustScore: number;
  completedProjects: number;
  createdAt: number;
}

export interface CompanyProfile {
  uid: string;
  companyName: string;
  companyLogo?: string;
  businessRegistrationNumber?: string;
  country?: string;
  industry?: string;
  companySize?: string;
  website: string;
  linkedin?: string;
  contactPerson?: string;
  position?: string;
  corporateEmail?: string;
  phoneNumber?: string;
  companyIntroduction?: string;
  hiringIndustry?: string;
  preferredMajors?: string[];
  requiredSkills?: string[];
  preferredLanguages?: string[];
  companyBenefits?: string[];
  remotePolicy?: string;
  recruitmentStatus?: "Open" | "Closed";
  officeLocation?: string;
  notificationPreferences?: {
    email: boolean;
    system: boolean;
  };
  verified: boolean;
  verifiedStatus?: "Pending" | "Verified" | "Rejected" | "Suspended";
  description: string;
  createdAt: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  companyId: string;
  companyName: string;
  difficulty: ProjectDifficulty;
  reward: string;
  status: ProjectStatus;
  tags: string[];
  createdAt: number;
}

export interface Application {
  id: string;
  projectId: string;
  projectTitle: string;
  studentId: string;
  studentName: string;
  codeSubmission: string;
  feedback: string;
  status: ApplicationStatus;
  score: number; // Evaluated score 0-100
  createdAt: number;
}

export interface SystemLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: number;
}

export interface UserSession {
  id: string;
  userId: string;
  email: string;
  role: UserRole;
  deviceType: string;
  ipAddress: string;
  location: string;
  userAgent: string;
  isActive: boolean;
  isSuspicious: boolean;
  createdAt: number;
  lastActiveAt: number;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: UserRole;
  verificationType: "email" | "university" | "certificate" | "identity" | "business_registration" | "business_license";
  status: "Pending" | "Approved" | "Rejected" | "Suspended";
  documentUrl?: string;
  adminNotes?: string;
  updatedAt: number;
  createdAt: number;
}

export interface SecurityActivity {
  id: string;
  userId: string;
  email: string;
  action: string;
  ipAddress: string;
  device: string;
  location: string;
  status: "Success" | "Failed" | "Blocked" | "Suspicious";
  timestamp: number;
}

export interface RbacPolicy {
  id: string; // role ID (e.g., student, company, university, mentor, admin)
  submit_projects: boolean;
  review_code: boolean;
  compliance_audits: boolean;
  saas_configs: boolean;
}


