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
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  getPendingGoogleAuthIntent,
  clearPendingGoogleAuthIntent,
  getGoogleRegistrationId,
  clearGoogleRegistrationId,
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
  ApplicationStatus,
  NotificationRecord,
} from "../types";
import { useToast } from "../components/ui/Toast";
import { firstValidationMessage, getCompanyCompletionErrors, getStudentCompletionErrors } from "../lib/profileCompletion";

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
  console.warn('[KONEXA] Supabase operation failed. No fallback records were generated:', JSON.stringify(errInfo));
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
  notifications: NotificationRecord[];
  unreadNotificationCount: number;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { success, error, info } = useToast();
  
  // App state
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.STUDENT);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // 1 & 2. Persistent Supabase Authentication Synchronization Hook
  useEffect(() => {
    let authCallbackInFlight = false;
    let rejectedGoogleUid: string | null = null;
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (authCallbackInFlight) return;
      authCallbackInFlight = true;
      try {
      if (user) {
        console.log("[KONEXA] Active Auth State Detected. UID:", user.uid, "Anonymous:", user.isAnonymous);
        
        if (user.isAnonymous) {
          await signOut(auth);
          setCurrentUser(null);
          setStudentProfile(null);
          setCompanyProfile(null);
          setIsAuthReady(true);
        } else {
          // Real Registered User:
          // Fetch user doc and profile from Supabase!
          try {
            const userDocRef = doc(db, "users", user.uid);
            let userSnapshot = await getDoc(userDocRef);
            
            if (userSnapshot.exists()) {
              const pendingIntent = getPendingGoogleAuthIntent();
              const registrationId = getGoogleRegistrationId();
              const initialProfile = userSnapshot.data() as UserProfile & { onboardingStatus?: string };
              if (registrationId) {
                const { error: registrationError } = await supabase.rpc("complete_google_registration", {
                  registration_id: registrationId,
                });
                clearGoogleRegistrationId();
                clearPendingGoogleAuthIntent();
                if (registrationError) {
                  const registrationMessage = String(registrationError.message || registrationError);
                  if (rejectedGoogleUid !== user.uid) {
                    rejectedGoogleUid = user.uid;
                    await signOut(auth);
                  }
                  setCurrentUser(null);
                  setStudentProfile(null);
                  setCompanyProfile(null);
                  error(
                    registrationMessage.includes("KONEXA_ROLE_CONFLICT") ? "계정 유형이 이미 등록되어 있습니다" : "Google 가입을 완료하지 못했습니다",
                    registrationMessage.includes("KONEXA_ROLE_CONFLICT")
                      ? "이 Google 이메일은 이미 다른 유형의 KONEXA 계정으로 등록되어 있습니다. 기존 계정으로 로그인하거나 다른 Google 계정을 사용해 주세요."
                      : "가입 세션이 만료되었거나 필수 동의 확인에 실패했습니다. 가입 화면에서 다시 시작해 주세요."
                  );
                  setIsAuthReady(true);
                  return;
                }
                userSnapshot = await getDoc(userDocRef);
              } else if (initialProfile.onboardingStatus === "pending_google") {
                clearPendingGoogleAuthIntent();
                if (rejectedGoogleUid !== user.uid) {
                  rejectedGoogleUid = user.uid;
                  await signOut(auth);
                }
                error("Google 가입 세션이 만료되었습니다", "가입 화면에서 Google 회원가입을 다시 시작해 주세요.");
                setIsAuthReady(true);
                return;
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
                    skills: [],
                    github: "",
                    bio: "",
                    trustScore: 0,
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
                    companyName: uProfile.displayName,
                    website: "",
                    description: "",
                    verified: false,
                    verifiedStatus: "Pending",
                    createdAt: Date.now()
                  });
                }
                setStudentProfile(null);
              }
            } else {
              setCurrentUser(null);
              setStudentProfile(null);
              setCompanyProfile(null);
              await signOut(auth);
              error("계정 설정을 완료할 수 없습니다", "인증 계정과 KONEXA 회원 기록이 일치하지 않습니다. 회원가입을 다시 진행하거나 관리자에게 문의해 주세요.");
            }
          } catch (err) {
            console.error("Error loading user Supabase data:", err);
          } finally {
            setIsAuthReady(true);
          }
        }
      } else {
        rejectedGoogleUid = null;
        setCurrentUser(null);
        setStudentProfile(null);
        setCompanyProfile(null);
        setProjects([]);
        setApplications([]);
        setLogs([]);
        setNotifications([]);
        setIsAuthReady(true);
      }
      } finally {
        authCallbackInFlight = false;
      }
    });

    return () => unsubscribe();
  }, [activeRole]);

  // 3. Real-time Supabase listeners
  useEffect(() => {
    // Only subscribe to listeners when authentication is fully loaded
    if (!isAuthReady || !currentUser) return;

    // Listen for Projects
    const projectsCol = collection(db, "projects");
    const unsubProjects = onSnapshot(projectsCol, (snapshot) => {
      const items: Project[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        items.push({ id: doc.id, ...d } as Project);
      });

      items.sort((a, b) => b.createdAt - a.createdAt);
      setProjects(items);
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

    const notificationsQuery = query(collection(db, "notifications"), where("recipientId", "==", currentUser.uid));
    const unsubNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const items: NotificationRecord[] = [];
      snapshot.forEach((notificationDoc) => {
        items.push({ id: notificationDoc.id, ...notificationDoc.data() } as NotificationRecord);
      });
      items.sort((a, b) => b.createdAt - a.createdAt);
      setNotifications(items.slice(0, 100));
    }, (err) => {
      handleSupabaseError(err, OperationType.GET, "notifications");
    });

    return () => {
      unsubProjects();
      unsubApplications();
      unsubLogs();
      unsubNotifications();
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
      if (!currentUser || !studentProfile) throw new Error("학생 계정으로 로그인한 뒤 지원해 주세요.");
      const proj = projects.find((p) => p.id === projectId);
      if (!proj) throw new Error("Project not found");

      const applicationsCol = collection(db, "applications");
      const appDocRef = await addDoc(applicationsCol, {
        projectId,
        projectTitle: proj.title,
        companyId: proj.companyId,
        studentId: currentUser.uid,
        studentName: studentProfile.name || currentUser.displayName,
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
        `Submitted application for project "${proj.title}"`
      );

      success("지원서가 제출되었습니다", "프로젝트 수행 계획이 안전하게 저장되었습니다.");
      
      info("검토를 시작합니다", "AI 분석을 사용할 수 있으면 보조 검토를 진행하며, 실패 시 수동 검토 대기 상태를 유지합니다.");
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
      if (!currentUser || !companyProfile) throw new Error("기업 계정으로 로그인한 뒤 프로젝트를 등록해 주세요.");
      const projectsCol = collection(db, "projects");
      await addDoc(projectsCol, {
        title,
        description,
        requirements,
        companyId: currentUser.uid,
        companyName: companyProfile.companyName,
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
      if (profile.onboardingCompleted === true) {
        const validationErrors = getStudentCompletionErrors(updated);
        if (Object.keys(validationErrors).length > 0) throw new Error(firstValidationMessage(validationErrors));
      }
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
      if (profile.onboardingCompleted === true) {
        const validationErrors = getCompanyCompletionErrors(updated);
        if (Object.keys(validationErrors).length > 0) throw new Error(firstValidationMessage(validationErrors));
      }
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
      const registrationErrors = role === UserRole.STUDENT
        ? getStudentCompletionErrors({ ...studentData, identityDocumentPath: "required-after-verification", resumeUrl: "required-after-verification" })
        : getCompanyCompletionErrors({ ...companyData, businessRegistrationDocumentPath: "required-after-verification" });
      if (Object.keys(registrationErrors).length > 0) throw new Error(firstValidationMessage(registrationErrors));
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
          skills: studentData?.skills || [],
          github: studentData?.github || "",
          bio: studentData?.bio || "",
          trustScore: 0,
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
          companyName: companyData?.companyName || displayName,
          website: companyData?.website || "",
          description: companyData?.description || "",
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
        if (!studentSnapshot.exists()) throw new Error("학생 프로필을 찾을 수 없습니다. 관리자에게 문의해 주세요.");
        const sProfile = studentSnapshot.data() as StudentProfile;
        setStudentProfile(sProfile);
        setCompanyProfile(null);
      } else if (effectiveRole === UserRole.COMPANY) {
        const companyDocRef = doc(db, "company_profiles", authUid);
        const companySnapshot = await getDoc(companyDocRef);
        if (!companySnapshot.exists()) throw new Error("기업 프로필을 찾을 수 없습니다. 관리자에게 문의해 주세요.");
        const cProfile = companySnapshot.data() as CompanyProfile;
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
      setNotifications([]);
      
      success("Signed Out", "You have successfully exited your authenticated session.");
    } catch (err: any) {
      error("Sign out failed", err.message);
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    const target = notifications.find((item) => item.id === notificationId);
    if (!target || target.readAt) return;
    await setDoc(doc(db, "notifications", notificationId), { readAt: Date.now() }, { merge: true });
  };

  const markAllNotificationsRead = async () => {
    const unread = notifications.filter((item) => !item.readAt);
    await Promise.all(unread.map((item) => setDoc(doc(db, "notifications", item.id), { readAt: Date.now() }, { merge: true })));
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
        notifications,
        unreadNotificationCount: notifications.filter((item) => !item.readAt).length,
        markNotificationRead,
        markAllNotificationsRead,
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

