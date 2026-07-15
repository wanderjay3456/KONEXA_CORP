import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  setDoc, 
  getDoc,
  doc,
  query,
  where,
} from "../lib/supabaseStore";
import { 
  signInAnonymously, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  getPendingGoogleAuthIntent,
  clearPendingGoogleAuthIntent,
} from "../lib/supabaseAuth";
import { db, auth, supabase } from "../lib/supabaseAuth";
import { 
  UserRole, 
  UserProfile, 
  StudentProfile, 
  CompanyProfile, 
  Project, 
  Application, 
  SystemLog, 
  ProjectDifficulty, 
  ProjectStatus,
  ApplicationStatus
} from "../types";
import { useToast } from "../components/ui/Toast";

// --- START FIRESTORE ERROR HANDLING PROTOCOL ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface SupabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleSupabaseError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: SupabaseErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('[KONEXA] Supabase operation warning (degrading gracefully to secure client-side sandbox states):', JSON.stringify(errInfo));
}
// --- END FIRESTORE ERROR HANDLING PROTOCOL ---

interface AppContextType {
  currentUser: UserProfile | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  studentProfile: StudentProfile | null;
  setStudentProfile: React.Dispatch<React.SetStateAction<StudentProfile | null>>;
  companyProfile: CompanyProfile | null;
  setCompanyProfile: React.Dispatch<React.SetStateAction<CompanyProfile | null>>;
  projects: Project[];
  applications: Application[];
  logs: SystemLog[];
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  applyToProject: (projectId: string, codeSubmission: string) => Promise<void>;
  createProject: (title: string, description: string, requirements: string[], difficulty: ProjectDifficulty, reward: string, tags: string[]) => Promise<void>;
  updateStudentProfile: (profile: Partial<StudentProfile>) => Promise<void>;
  updateCompanyProfile: (profile: Partial<CompanyProfile>) => Promise<void>;
  registerUser: (email: string, displayName: string, role: UserRole, studentData?: Partial<StudentProfile>, companyData?: Partial<CompanyProfile>, password?: string, consentBundle?: Record<string, unknown>) => Promise<{ emailConfirmationRequired: boolean }>;
  loginUser: (email: string, role: UserRole, password?: string) => Promise<{ emailConfirmationRequired: boolean }>;
  googleLogin: (role: UserRole, options?: GoogleLoginOptions) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  reviewApplication: (applicationId: string, status: ApplicationStatus, feedback: string, score: number) => Promise<void>;
  triggerEvaluation: (applicationId: string, code: string, requirements: string[]) => Promise<any>;
}

interface GoogleLoginOptions {
  mode?: "login" | "register";
  consentBundle?: Record<string, unknown>;
  profileData?: Record<string, unknown>;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

// Seed Data helper
const SEED_PROJECTS = [
  {
    title: "Vite + React Core Performance Optimizer",
    description: "Build an elegant, lightweight profiling hook for Vite-based SPAs to measure and record component rendering metrics directly to a diagnostic panel.",
    requirements: ["Implement a custom React hook `usePerformanceProfiler`", "Generate beautiful visual SVG rendering trees", "Zero bundle overhead in production environments"],
    companyName: "Vercel Core Technologies",
    difficulty: ProjectDifficulty.HARD,
    reward: "$2,800 + Fast-Track Offer",
    tags: ["React 19", "Vite", "SVG Canvas", "Web Vitals"],
    status: ProjectStatus.OPEN
  },
  {
    title: "Google Workspace Sidebar Add-on Extension",
    description: "Implement a Google Chat and Calendar companion component that analyzes text contexts dynamically and suggests smart action items directly in the sidebar.",
    requirements: ["Design smooth collaborative viewports", "Implement strict Google OAuth credentials handling", "Write modular, responsive list components"],
    companyName: "Google Cloud Platform Group",
    difficulty: ProjectDifficulty.MEDIUM,
    reward: "$1,500 + Internship Interview",
    tags: ["OAuth 2.0", "Google Workspace", "Typescript", "SaaS Layer"],
    status: ProjectStatus.OPEN
  },
  {
    title: "Sub-millisecond State Syncer for Collaborative Canvas",
    description: "Architect a custom React state synchronization manager utilizing lightweight frames and a localized WebSocket simulation engine to sync graphic vectors.",
    requirements: ["Implement fluid drag-and-drop vector math", "Handle multi-client collision resolutions gracefully", "Design a timeline-based undo/redo ring buffer"],
    companyName: "Framer Design Engine Team",
    difficulty: ProjectDifficulty.HARD,
    reward: "$3,200 Contract + Full-time Hiring Option",
    tags: ["Framer Motion", "WebSockets", "Data Structures", "Canvas API"],
    status: ProjectStatus.OPEN
  },
  {
    title: "Lightweight Markdown Parser and Code Renderer",
    description: "Build a modular markdown content preview component with fully reactive code syntax highlighting and quick-copy tabs.",
    requirements: ["No external heavy library dependencies", "Implement safe HTML sanitization guards", "Responsive, typography-optimized margins"],
    companyName: "Linear Inc.",
    difficulty: ProjectDifficulty.EASY,
    reward: "$800 Task Reward",
    tags: ["TailwindCSS", "Markdown", "TS Core", "Refactoring"],
    status: ProjectStatus.OPEN
  }
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { success, error, info } = useToast();
  
  // App state
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.STUDENT);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  
  const [projects, setProjects] = useState<Project[]>(() => 
    SEED_PROJECTS.map((p, idx) => ({
      id: `proj_seed_${idx}`,
      companyId: "comp_seed_vercel_88",
      createdAt: Date.now() - idx * 86400000,
      ...p
    }))
  );
  const [applications, setApplications] = useState<Application[]>(() => [
    {
      id: "app_seed_1",
      projectId: "proj_seed_0",
      projectTitle: "Vite + React Core Performance Optimizer",
      studentId: "usr_fndtn_konexa_99",
      studentName: "Alex Rivera",
      codeSubmission: `// usePerformanceProfiler.ts\nimport { useEffect, useRef } from 'react';\n\nexport function usePerformanceProfiler(componentName: string) {\n  const renderCount = useRef(0);\n  const startTime = useRef(performance.now());\n\n  useEffect(() => {\n    renderCount.current += 1;\n    const duration = performance.now() - startTime.current;\n    console.log(\`[Profiler] \${componentName} render #\${renderCount.current} took \${duration.toFixed(2)}ms\`);\n    startTime.current = performance.now();\n  });\n}`,
      feedback: "Exceptional custom profiling hook. Low-overhead, well-commented and clean TS type structures.",
      status: ApplicationStatus.APPROVED,
      score: 95,
      createdAt: Date.now() - 172800000
    },
    {
      id: "app_seed_2",
      projectId: "proj_seed_3",
      projectTitle: "Lightweight Markdown Parser and Code Renderer",
      studentId: "usr_fndtn_konexa_99",
      studentName: "Alex Rivera",
      codeSubmission: `// markdownParser.ts\nexport function parseMarkdown(text: string): string {\n  // Safe, fast sanitization and basic regex conversion\n  return text\n    .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')\n    .replace(/\\*(.*?)\\*/g, '<em>$1</em>')\n    .replace(/\\\`(.*?)\\\`/g, '<code class="bg-neutral-100 p-1 rounded font-mono">$1</code>');\n}`,
      feedback: "",
      status: ApplicationStatus.SUBMITTED,
      score: 0,
      createdAt: Date.now() - 86400000
    }
  ]);
  const [logs, setLogs] = useState<SystemLog[]>(() => [
    {
      id: "log_seed_1",
      userId: "usr_fndtn_konexa_99",
      userName: "Alex Rivera",
      action: "Code Verification",
      details: "Performance Optimizer challenge compiled with 100% test coverage.",
      timestamp: Date.now() - 3600000
    },
    {
      id: "log_seed_2",
      userId: "system",
      userName: "Gemini Sandbox Supervisor",
      action: "Inference Engine",
      details: "Matched student profile Rivera to Horizon Labs requirements.",
      timestamp: Date.now() - 7200000
    }
  ]);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // 1 & 2. Persistent Supabase Authentication Synchronization Hook
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log("[KONEXA] Active Auth State Detected. UID:", user.uid, "Anonymous:", user.isAnonymous);
        
        if (user.isAnonymous) {
          // Anonymous visitor session:
          // We set the default simulated profiles so they can explore immediately
          const now = Date.now();
          const profile: UserProfile = {
            uid: user.uid,
            email: "guest@konexa.dev",
            displayName: "Guest Explorer",
            role: activeRole,
            createdAt: now
          };
          setCurrentUser(profile);

          setStudentProfile({
            uid: user.uid,
            name: "Alex Rivera",
            skills: ["React", "TypeScript", "TailwindCSS", "Framer Motion", "Node.js"],
            github: "https://github.com/alexrivera-dev",
            bio: "Full-stack enthusiast focused on building high-performance interactive interfaces and clean software architectures.",
            trustScore: 82,
            completedProjects: 3,
            createdAt: now
          });

          setCompanyProfile({
            uid: user.uid,
            companyName: "Horizon Labs",
            website: "https://horizonlabs.io",
            description: "Horizon Labs designs the future of software infrastructure, high-fidelity design tools, and AI systems.",
            verified: true,
            verifiedStatus: "Verified",
            createdAt: now
          });
          setIsAuthReady(true);
        } else {
          // Real Registered User:
          // Fetch user doc and profile from Supabase!
          try {
            const userDocRef = doc(db, "users", user.uid);
            let userSnapshot = await getDoc(userDocRef);
            
            if (userSnapshot.exists()) {
              const pendingIntent = getPendingGoogleAuthIntent();
              const initialProfile = userSnapshot.data() as UserProfile & { onboardingStatus?: string };
              if (initialProfile.onboardingStatus === "pending_google") {
                if (!pendingIntent || pendingIntent.mode !== "register") {
                  clearPendingGoogleAuthIntent();
                  await signOut(auth);
                  error("Google 회원가입이 필요합니다", "신규 Google 계정은 학생 또는 기업 회원가입 화면에서 필수 약관에 동의한 후 가입해 주세요.");
                  setIsAuthReady(true);
                  return;
                }
                const { error: onboardingError } = await (supabase as any).rpc("complete_google_onboarding", {
                  requested_role: pendingIntent.role,
                  consent_payload: pendingIntent.consentBundle || {},
                  profile_payload: pendingIntent.profileData || {},
                });
                if (onboardingError) throw onboardingError;
                clearPendingGoogleAuthIntent();
                userSnapshot = await getDoc(userDocRef);
              } else if (pendingIntent) {
                clearPendingGoogleAuthIntent();
              }

              const uProfile = userSnapshot.data() as UserProfile;
              setCurrentUser(uProfile);
              
              if (uProfile.role === UserRole.STUDENT) {
                const sRef = doc(db, "student_profiles", user.uid);
                const sSnap = await getDoc(sRef);
                if (sSnap.exists()) {
                  setStudentProfile(sSnap.data() as StudentProfile);
                } else {
                  setStudentProfile({
                    uid: user.uid,
                    name: uProfile.displayName,
                    skills: ["React", "TypeScript", "TailwindCSS"],
                    github: "https://github.com",
                    bio: "New registered student profile. Click Edit to customize.",
                    trustScore: 80,
                    completedProjects: 0,
                    createdAt: Date.now()
                  });
                }
                setCompanyProfile(null);
              } else if (uProfile.role === UserRole.COMPANY) {
                const cRef = doc(db, "company_profiles", user.uid);
                const cSnap = await getDoc(cRef);
                if (cSnap.exists()) {
                  setCompanyProfile(cSnap.data() as CompanyProfile);
                } else {
                  setCompanyProfile({
                    uid: user.uid,
                    companyName: "Corporate Partner",
                    website: "https://company.com",
                    description: "Partner company workspace.",
                    verified: false,
                    verifiedStatus: "Pending",
                    createdAt: Date.now()
                  });
                }
                setStudentProfile(null);
              }
            } else {
              // User has an auth account but no Supabase users document yet
              const fallbackProfile: UserProfile = {
                uid: user.uid,
                email: user.email || "wanderjay3456@gmail.com",
                displayName: user.displayName || user.email?.split("@")[0] || "Student Builder",
                role: activeRole,
                createdAt: Date.now()
              };
              setCurrentUser(fallbackProfile);
            }
          } catch (err) {
            console.error("Error loading user Supabase data:", err);
          } finally {
            setIsAuthReady(true);
          }
        }
      } else {
        // No user found, sign in anonymously to keep database rules happy!
        console.log("[KONEXA] No user session. Signing in anonymously...");
        try {
          await signInAnonymously(auth);
        } catch (err: any) {
          console.warn("[KONEXA] Failed anonymous authentication fallback", err.message);
          setIsAuthReady(true);
        }
      }
    });

    return () => unsubscribe();
  }, [activeRole]);

  // 3. Real-time Supabase Listeners and Seeding
  useEffect(() => {
    // Only subscribe to listeners when authentication is fully loaded
    if (!isAuthReady || !currentUser) return;

    // Listen for Projects
    const projectsCol = collection(db, "projects");
    const unsubProjects = onSnapshot(projectsCol, async (snapshot) => {
      const items: Project[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        items.push({ id: doc.id, ...d } as Project);
      });

      // Seeding: If Supabase is empty, auto-seed with standard projects
      if (snapshot.empty) {
        console.log("[KONEXA Core] Pre-seeding projects collection in Supabase...");
        try {
          for (const sp of SEED_PROJECTS) {
            await addDoc(projectsCol, {
              ...sp,
              companyId: "comp_seed_vercel_88",
              createdAt: Date.now()
            });
          }
        } catch (err) {
          console.error("Failed to seed projects:", err);
        }
      } else {
        // Sort projects by newest first
        items.sort((a, b) => b.createdAt - a.createdAt);
        setProjects(items);
      }
    }, (err) => {
      handleSupabaseError(err, OperationType.GET, "projects");
    });

    // Listen for Applications
    const applicationsCol = collection(db, "applications");
    const applicationsQuery = currentUser.role === UserRole.ADMIN
      ? applicationsCol
      : currentUser.role === UserRole.COMPANY
        ? query(applicationsCol, where("companyId", "==", currentUser.uid))
        : query(applicationsCol, where("studentId", "==", currentUser.uid));
    const unsubApplications = onSnapshot(applicationsQuery, (snapshot) => {
      const items: Application[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        items.push({ id: doc.id, ...d } as Application);
      });
      items.sort((a, b) => b.createdAt - a.createdAt);
      setApplications(items);
    }, (err) => {
      handleSupabaseError(err, OperationType.GET, "applications");
    });

    // Listen for Logs
    const logsCol = collection(db, "logs");
    const logsQuery = currentUser.role === UserRole.ADMIN
      ? logsCol
      : query(logsCol, where("userId", "==", currentUser.uid));
    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      const items: SystemLog[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        items.push({ id: doc.id, ...d } as SystemLog);
      });
      items.sort((a, b) => b.timestamp - a.timestamp);
      // Keep only last 50 logs for UI efficiency
      setLogs(items.slice(0, 50));
    }, (err) => {
      handleSupabaseError(err, OperationType.GET, "logs");
    });

    return () => {
      unsubProjects();
      unsubApplications();
      unsubLogs();
    };
  }, [isAuthReady, currentUser]);

  // Write System Log helper
  const logSystemAction = async (action: string, details: string) => {
    try {
      const logsCol = collection(db, "logs");
      await addDoc(logsCol, {
        userId: currentUser?.uid || "system",
        userName: currentUser?.displayName || "System Agent",
        action,
        details,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("Failed to write system log:", err);
      try {
        handleSupabaseError(err, OperationType.WRITE, "logs");
      } catch (logErr) {
        // Keep logs robust so they don't break the parent flow if logs fail
      }
    }
  };

  // 4. User operations
  const applyToProject = async (projectId: string, codeSubmission: string) => {
    try {
      const proj = projects.find((p) => p.id === projectId);
      if (!proj) throw new Error("Project not found");

      const applicationsCol = collection(db, "applications");
      const appDocRef = await addDoc(applicationsCol, {
        projectId,
        projectTitle: proj.title,
        companyId: proj.companyId,
        studentId: currentUser?.uid || "usr_fndtn_konexa_99",
        studentName: currentUser?.displayName || "Alex Rivera",
        codeSubmission,
        feedback: "Pending AI analysis...",
        status: ApplicationStatus.SUBMITTED,
        score: 0,
        createdAt: Date.now()
      });

      try {
        const emailResponse = await fetch("/api/email/notify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Idempotency-Key": appDocRef.id,
          },
          body: JSON.stringify({
            template: "application_received",
            data: { project: proj.title },
          }),
        });
        if (!emailResponse.ok) console.warn("Application confirmation email was not accepted");
      } catch (emailError) {
        console.warn("Application confirmation email failed:", emailError);
      }

      await logSystemAction(
        "PROJECT_APPLY",
        `Submitted code application for project "${proj.title}"`
      );

      success("Application Submitted!", "Your solution was successfully saved to Supabase.");
      
      // Trigger AI evaluation immediately in background to demonstrate full-stack flow
      info("Triggering AI Copilot...", "AI Evaluator is reviewing your code submission in real-time.");
      triggerEvaluation(appDocRef.id);

    } catch (err: any) {
      handleSupabaseError(err, OperationType.WRITE, "applications");
    }
  };

  const createProject = async (
    title: string,
    description: string,
    requirements: string[],
    difficulty: ProjectDifficulty,
    reward: string,
    tags: string[]
  ) => {
    try {
      const projectsCol = collection(db, "projects");
      await addDoc(projectsCol, {
        title,
        description,
        requirements,
        companyId: currentUser?.uid || "usr_fndtn_konexa_99",
        companyName: companyProfile?.companyName || "Horizon Labs",
        difficulty,
        reward,
        status: ProjectStatus.OPEN,
        tags,
        createdAt: Date.now()
      });

      await logSystemAction(
        "PROJECT_CREATE",
        `Created new challenge project: "${title}"`
      );

      success("Project Created!", "Your project challenge is now live on the platform.");
    } catch (err: any) {
      handleSupabaseError(err, OperationType.WRITE, "projects");
    }
  };

  const updateStudentProfile = async (
    profile: Partial<StudentProfile>
  ) => {
    try {
      if (!studentProfile) return;
      const updated = {
        ...studentProfile,
        ...profile
      };
      setStudentProfile(updated);
      await setDoc(doc(db, "student_profiles", updated.uid), updated, { merge: true });
      await setDoc(doc(db, "protected_contacts", updated.uid), {
        userId: updated.uid,
        talentId: updated.uid,
        email: currentUser?.email || "",
        github: updated.github || "",
        linkedin: updated.linkedin || "",
        portfolio: updated.portfolio || "",
        updatedAt: Date.now(),
      }, { merge: true });
      
      await logSystemAction(
        "STUDENT_PROFILE_UPDATE",
        `Updated student profile metrics and onboarding parameters`
      );

      success("Profile Saved", "Your student portfolio was updated successfully.");
    } catch (err: any) {
      error("Profile Save Failed", err.message);
    }
  };

  const updateCompanyProfile = async (
    profile: Partial<CompanyProfile>
  ) => {
    try {
      if (!companyProfile) return;
      const updated = {
        ...companyProfile,
        ...profile
      };
      setCompanyProfile(updated);
      await setDoc(doc(db, "company_profiles", updated.uid), updated, { merge: true });

      await logSystemAction(
        "COMPANY_PROFILE_UPDATE",
        `Updated organization profile: ${updated.companyName}`
      );

      success("Company Saved", "Your company details have been updated.");
    } catch (err: any) {
      error("Company Save Failed", err.message);
    }
  };

  const registerUser = async (
    email: string,
    displayName: string,
    role: UserRole,
    studentData?: Partial<StudentProfile>,
    companyData?: Partial<CompanyProfile>,
    password?: string,
    consentBundle?: Record<string, unknown>
  ) => {
    try {
      if (![UserRole.STUDENT, UserRole.COMPANY].includes(role)) {
        throw new Error("Only student and company self-registration is supported.");
      }
      if (!password) throw new Error("A password is required for registration.");
      const credential = await createUserWithEmailAndPassword(auth, email, password, {
        display_name: displayName,
        role,
        student_profile: studentData || undefined,
        company_profile: companyData || undefined,
        consent_bundle: consentBundle || undefined,
      });
      const authUid = credential.user.uid;
      
      const now = Date.now();

      const profile: UserProfile = {
        uid: authUid,
        email,
        displayName,
        role,
        createdAt: now
      };

      if (!credential.session) {
        success("Verify your email", "Your account is ready. Open the confirmation link sent to your email, then sign in.");
        return { emailConfirmationRequired: true };
      }

      await setDoc(doc(db, "users", authUid), profile);

      setCurrentUser(profile);
      setActiveRole(role);

      if (role === UserRole.STUDENT) {
        const sProfile = {
          uid: authUid,
          name: displayName,
          skills: studentData?.skills || ["React", "TypeScript", "TailwindCSS"],
          github: studentData?.github || "https://github.com",
          bio: studentData?.bio || "A brilliant mind ready to solve global challenges.",
          trustScore: 80,
          completedProjects: 0,
          createdAt: now,
          ...studentData
        };
        await setDoc(doc(db, "student_profiles", authUid), sProfile);
        await setDoc(doc(db, "protected_contacts", authUid), {
          userId: authUid,
          talentId: authUid,
          email,
          github: sProfile.github || "",
          linkedin: sProfile.linkedin || "",
          portfolio: sProfile.portfolio || "",
          updatedAt: now,
        });
        setStudentProfile(sProfile);
        setCompanyProfile(null);
      } else if (role === UserRole.COMPANY) {
        const cProfile = {
          uid: authUid,
          companyName: companyData?.companyName || "Horizon Partner",
          website: companyData?.website || "https://horizon.io",
          description: companyData?.description || "Empowering tech ecosystems globally.",
          verified: false,
          verifiedStatus: "Pending",
          createdAt: now,
          ...companyData
        };
        await setDoc(doc(db, "company_profiles", authUid), cProfile);
        setCompanyProfile(cProfile);
        setStudentProfile(null);
      }

      await logSystemAction(
        "AUTH_REGISTER",
        `Registered new user (${role}): ${displayName} (${email})`
      );
      success("Welcome to KONEXA!", `Account created successfully as a ${role}.`);
      return { emailConfirmationRequired: false };
    } catch (err: any) {
      error("Registration failed", err.message);
      throw err;
    }
  };

  const loginUser = async (email: string, role: UserRole, password?: string) => {
    try {
      if (![UserRole.STUDENT, UserRole.COMPANY].includes(role)) {
        throw new Error("This account type cannot use self-service login.");
      }
      if (!password) throw new Error("A password is required for login.");
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const authUid = credential.user.uid;

      const now = Date.now();

      // Check if user profile exists in Supabase
      const userDocRef = doc(db, "users", authUid);
      const userSnapshot = await getDoc(userDocRef);
      
      let profile: UserProfile;
      if (userSnapshot.exists()) {
        profile = userSnapshot.data() as UserProfile;
      } else {
        profile = {
          uid: authUid,
          email,
          displayName: email.split("@")[0].split(".").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "),
          role,
          createdAt: now
        };
        await setDoc(userDocRef, profile);
      }

      setCurrentUser(profile);
      const effectiveRole = profile.role;
      setActiveRole(effectiveRole);

      if (effectiveRole === UserRole.STUDENT) {
        const studentDocRef = doc(db, "student_profiles", authUid);
        const studentSnapshot = await getDoc(studentDocRef);
        let sProfile: StudentProfile;
        if (studentSnapshot.exists()) {
          sProfile = studentSnapshot.data() as StudentProfile;
        } else {
          sProfile = {
            uid: authUid,
            name: profile.displayName,
            skills: ["React", "TypeScript", "TailwindCSS", "Framer Motion"],
            github: "https://github.com",
            bio: "Experienced developer eager to solve challenges and build high-quality web software.",
            trustScore: 82,
            completedProjects: 1,
            createdAt: now
          };
          await setDoc(studentDocRef, sProfile);
        }
        setStudentProfile(sProfile);
        setCompanyProfile(null);
      } else if (effectiveRole === UserRole.COMPANY) {
        const companyDocRef = doc(db, "company_profiles", authUid);
        const companySnapshot = await getDoc(companyDocRef);
        let cProfile: CompanyProfile;
        if (companySnapshot.exists()) {
          cProfile = companySnapshot.data() as CompanyProfile;
        } else {
          cProfile = {
            uid: authUid,
            companyName: "Vercel Enterprise Partner",
            website: "https://vercel.com",
            description: "Leading deployment platforms and developer tools.",
            verified: true,
            verifiedStatus: "Verified",
            createdAt: now
          };
          await setDoc(companyDocRef, cProfile);
        }
        setCompanyProfile(cProfile);
        setStudentProfile(null);
      }

      await logSystemAction(
        "AUTH_LOGIN",
        `Authenticated user (${effectiveRole}): ${profile.displayName} (${email})`
      );
      success("Welcome Back", `Successfully signed in to your dashboard.`);
    } catch (err: any) {
      error("Login failed", err.message);
      throw err;
    }
  };

  const googleLogin = async (role: UserRole, options: GoogleLoginOptions = {}) => {
    try {
      if (![UserRole.STUDENT, UserRole.COMPANY].includes(role)) {
        throw new Error("This account type cannot use self-service login.");
      }
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider, {
        mode: options.mode || "login",
        role: role === UserRole.COMPANY ? "company" : "student",
        consentBundle: options.consentBundle,
        profileData: options.profileData,
      });
    } catch (err: any) {
      error("Google Login failed", err.message);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      success("Password Reset Sent", "Check your email inbox for instructions to reset your password.");
    } catch (err: any) {
      error("Reset Failed", err.message);
      throw err;
    }
  };

  const logoutUser = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setStudentProfile(null);
      setCompanyProfile(null);
      
      console.log("[KONEXA] Signed out of corporate session. Reloading guest...");
      await signInAnonymously(auth);
      
      success("Signed Out", "You have successfully exited your authenticated session.");
    } catch (err: any) {
      error("Sign out failed", err.message);
    }
  };

  const reviewApplication = async (
    applicationId: string,
    status: ApplicationStatus,
    feedback: string,
    score: number
  ) => {
    try {
      // Find and update document in Supabase
      const appRef = doc(db, "applications", applicationId);
      await setDoc(appRef, { status, feedback, score }, { merge: true });

      const app = applications.find((a) => a.id === applicationId);
      await logSystemAction(
        "APPLICATION_REVIEW",
        `Reviewed application for "${app?.projectTitle || "Project"}" - Status: ${status}`
      );

      success("Review Completed", `Application status set to ${status}.`);
    } catch (err: any) {
      handleSupabaseError(err, OperationType.WRITE, `applications/${applicationId}`);
    }
  };

  const triggerEvaluation = async (applicationId: string) => {
    try {
      // Make real-time POST call to Express Gemini Proxy
      const response = await fetch("/api/gemini/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId })
      });

      if (!response.ok) {
        throw new Error("Proxy server error during AI code evaluation");
      }

      const evalData = await response.json();
      
      await logSystemAction(
        "AI_EVALUATION_COMPLETED",
        `Gemini completed code analysis for Application ID ${applicationId}. Score: ${evalData.score}`
      );

      success("AI Evaluation Completed", "Gemini successfully completed code verification and updated your Trust Score.");
      return evalData;
    } catch (err: any) {
      console.error("AI Evaluation error:", err);
      error("AI Evaluator Offline", "Could not reach Gemini service. The application remains pending for manual review.");
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        studentProfile,
        setStudentProfile,
        companyProfile,
        setCompanyProfile,
        projects,
        applications,
        logs,
        activeRole,
        setActiveRole,
        applyToProject,
        createProject,
        updateStudentProfile,
        updateCompanyProfile,
        registerUser,
        loginUser,
        googleLogin,
        resetPassword,
        logoutUser,
        reviewApplication,
        triggerEvaluation
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

