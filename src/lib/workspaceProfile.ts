import { UserRole, type CompanyProfile, type StudentProfile, type UserProfile } from "../types";

type ProfileReader = (collection: "student_profiles" | "company_profiles", uid: string) => Promise<unknown | null>;

/** Missing onboarding details are incomplete, not fabricated verified records. */
export async function loadWorkspaceProfiles(user: UserProfile, read: ProfileReader) {
  let student: StudentProfile | null = null;
  let company: CompanyProfile | null = null;
  if (user.role === UserRole.STUDENT) {
    student = await read("student_profiles", user.uid) as StudentProfile | null;
    student ??= {
      uid: user.uid, name: user.displayName, skills: [], github: "", bio: "",
      trustScore: 0, completedProjects: 0, createdAt: user.createdAt,
      onboardingCompleted: false,
    };
  } else if (user.role === UserRole.COMPANY) {
    company = await read("company_profiles", user.uid) as CompanyProfile | null;
    company ??= {
      uid: user.uid, companyName: user.displayName, website: "", description: "",
      verified: false, verifiedStatus: "Pending", createdAt: user.createdAt,
    };
  }
  return { student, company };
}
