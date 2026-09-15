import React, { createContext, useContext, useState, useEffect } from "react";
import { submitGoogleRegistration } from "../lib/googleRegistration";
import { collection, onSnapshot, addDoc, setDoc, updateDoc, getDoc, doc, query, where, } from "../lib/supabaseStore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail, getPendingGoogleAuthIntent, clearPendingGoogleAuthIntent, getGoogleRegistrationId, clearGoogleRegistrationId, } from "../lib/supabaseAuth";
import { db, auth, supabase } from "../lib/supabaseAuth";
import { UserRole, UserProfile, StudentProfile, CompanyProfile, Project, Application, SystemLog, ProjectDifficulty, ApplicationStatus, NotificationRecord, } from "../types";
import { useToast } from "../components/ui/Toast";
import { firstValidationMessage, getCompanyCompletionErrors, getStudentCompletionErrors, profileSaveErrorMessage } from "../lib/profileCompletion";
import { isEarlyBirdOpen } from "../config/earlyBird";
import { useLocale } from "../i18n/LocaleContext";
import { authCopy, authErrorMessage } from "../i18n/authCopy";
import { loadWorkspaceProfiles } from "../lib/workspaceProfile";
import { persistCompletedProfile } from "../lib/profilePersistence";
// --- START FIRESTORE ERROR HANDLING PROTOCOL ---
enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write'
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
    isAuthReady: boolean;
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
    markNotificationRead: (notificationId: string) => Promise<boolean>;
    markAllNotificationsRead: () => Promise<boolean>;
    activeRole: UserRole;
    setActiveRole: (role: UserRole) => void;
    applyToProject: (projectId: string, codeSubmission: string) => Promise<boolean>;
    createProject: (title: string, description: string, requirements: string[], difficulty: ProjectDifficulty, reward: string, tags: string[], details?: Partial<Project>) => Promise<boolean>;
    updateStudentProfile: (profile: Partial<StudentProfile>) => Promise<boolean>;
    updateCompanyProfile: (profile: Partial<CompanyProfile>) => Promise<boolean>;
    registerUser: (email: string, displayName: string, role: UserRole, studentData?: Partial<StudentProfile>, companyData?: Partial<CompanyProfile>, password?: string, consentBundle?: Record<string, unknown>) => Promise<{
        emailConfirmationRequired: boolean;
    }>;
    loginUser: (email: string, role: UserRole, password?: string) => Promise<{
        emailConfirmationRequired: boolean;
    }>;
    googleLogin: (role: UserRole, options?: GoogleLoginOptions) => Promise<void>;
    completeGoogleRegistration: (role: UserRole, consentBundle: Record<string, unknown>) => Promise<void>;
    refreshWorkspaceProfile: () => Promise<void>;
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
export function AppProvider({ children }: {
    children: React.ReactNode;
}) {
    const { success, error, info } = useToast();
    const { locale } = useLocale();
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
        let authVersion = 0;
        let rejectedGoogleUid: string | null = null;
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            const version = ++authVersion;
            const isCurrent = () => version === authVersion;
            try {
                if (user) {
                    console.log("[KONEXA] Active Auth State Detected. UID:", user.uid, "Anonymous:", user.isAnonymous);
                    if (user.isAnonymous) {
                        await signOut(auth);
                        setCurrentUser(null);
                        setStudentProfile(null);
                        setCompanyProfile(null);
                        setIsAuthReady(true);
                    }
                    else {
                        // Real Registered User:
                        // Fetch user doc and profile from Supabase!
                        try {
                            const userDocRef = doc(db, "users", user.uid);
                            let userSnapshot = await getDoc(userDocRef);
                            if (!isCurrent())
                                return;
                            if (userSnapshot.exists()) {
                                const pendingIntent = getPendingGoogleAuthIntent();
                                const registrationId = getGoogleRegistrationId();
                                const initialProfile = userSnapshot.data() as UserProfile & {
                                    onboardingStatus?: string;
                                };
                                if (registrationId) {
                                    const registrationResponse = await fetch("/api/auth/google-registration-complete", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ registrationId }),
                                    });
                                    const registrationPayload = await registrationResponse.json().catch(() => null);
                                    if (!isCurrent())
                                        return;
                                    clearGoogleRegistrationId();
                                    clearPendingGoogleAuthIntent();
                                    if (!registrationResponse.ok) {
                                        const registrationMessage = String(registrationPayload?.error?.message
                                            || "Google registration could not be completed");
                                        error(registrationMessage.includes("KONEXA_ROLE_CONFLICT") ? "계정 유형이 이미 등록되어 있습니다" : "Google 가입을 완료하지 못했습니다", registrationMessage.includes("KONEXA_ROLE_CONFLICT")
                                            ? "이미 등록된 계정 유형으로 로그인합니다."
                                            : "Google 로그인은 유지됩니다. 계정 유형과 필수 동의를 다시 확인해 주세요.");
                                    }
                                    userSnapshot = await getDoc(userDocRef);
                                    if (!isCurrent())
                                        return;
                                }
                                if (pendingIntent?.role === "admin" && initialProfile.role !== UserRole.ADMIN) {
                                    clearPendingGoogleAuthIntent();
                                    if (rejectedGoogleUid !== user.uid) {
                                        rejectedGoogleUid = user.uid;
                                        await signOut(auth);
                                    }
                                    setCurrentUser(null);
                                    setStudentProfile(null);
                                    setCompanyProfile(null);
                                    error("Admin access denied", "This Google account is not an approved KONEXA administrator.");
                                    setIsAuthReady(true);
                                    return;
                                }
                                else if (initialProfile.onboardingStatus === "pending_google") {
                                    // This is a valid Google session whose KONEXA role/consent setup
                                    // has not finished yet. Keep the session and render the secure
                                    // completion gate instead of falsely labelling it as expired.
                                }
                                else if (pendingIntent) {
                                    clearPendingGoogleAuthIntent();
                                }
                                const uProfile = userSnapshot.data() as UserProfile;
                                if (uProfile.accountStatus === "Suspended") {
                                    await signOut(auth);
                                    setCurrentUser(null);
                                    setStudentProfile(null);
                                    setCompanyProfile(null);
                                    error("계정 이용이 제한되었습니다", "관리자 검토가 필요한 계정입니다. KONEXA 운영팀에 문의해 주세요.");
                                    setIsAuthReady(true);
                                    return;
                                }
                                const workspace = await loadWorkspaceProfiles(uProfile, async (collectionName, uid) => {
                                    const snapshot = await getDoc(doc(db, collectionName, uid));
                                    return snapshot.exists() ? snapshot.data() : null;
                                });
                                if (!isCurrent())
                                    return;
                                setStudentProfile(workspace.student);
                                setCompanyProfile(workspace.company);
                                setActiveRole(uProfile.role);
                                setCurrentUser(uProfile);
                            }
                            else {
                                setCurrentUser(null);
                                setStudentProfile(null);
                                setCompanyProfile(null);
                                await signOut(auth);
                                error("계정 설정을 완료할 수 없습니다", "인증 계정과 KONEXA 회원 기록이 일치하지 않습니다. 회원가입을 다시 진행하거나 관리자에게 문의해 주세요.");
                            }
                        }
                        catch (err) {
                            if (isCurrent()) {
                                setCurrentUser(null);
                                setStudentProfile(null);
                                setCompanyProfile(null);
                                console.error("Error loading user Supabase data:", err);
                                error("Workspace unavailable", "Please reload to try again. Your saved account has not been deleted.");
                            }
                        }
                        finally {
                            if (isCurrent())
                                setIsAuthReady(true);
                        }
                    }
                }
                else {
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
            }
            finally {
                if (isCurrent())
                    setIsAuthReady(true);
            }
        });
        return () => { authVersion += 1; unsubscribe(); };
    }, []);
    // 3. Real-time Supabase listeners
    useEffect(() => {
        // Only subscribe to listeners when authentication is fully loaded
        if (!isAuthReady || !currentUser)
            return;
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
        let lastEmailDispatch = 0;
        const unsubNotifications = onSnapshot(notificationsQuery, (snapshot) => {
            const items: NotificationRecord[] = [];
            snapshot.forEach((notificationDoc) => {
                items.push({ id: notificationDoc.id, ...notificationDoc.data() } as NotificationRecord);
            });
            items.sort((a, b) => b.createdAt - a.createdAt);
            setNotifications(items.slice(0, 100));
            if (Date.now() - lastEmailDispatch > 60000 && items.length) {
                lastEmailDispatch = Date.now();
                // Best-effort wake-up of this account's durable outbox; in-app delivery is independent.
                void fetch('/api/v2/notifications/dispatch', { method: 'POST' }).catch(() => { });
            }
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
        }
        catch (err) {
            console.error("Failed to write system log:", err);
            try {
                handleSupabaseError(err, OperationType.WRITE, "logs");
            }
            catch (logErr) {
                // Keep logs robust so they don't break the parent flow if logs fail
            }
        }
    };
    // 4. User operations
    const applyToProject = async (projectId: string, codeSubmission: string) => {
        try {
            if (!currentUser || !studentProfile)
                throw new Error("학생 계정으로 로그인한 뒤 지원해 주세요.");
            const proj = projects.find((p) => p.id === projectId);
            if (!proj)
                throw new Error("Project not found");
            const response = await fetch(`/api/v2/projects/${encodeURIComponent(projectId)}/applications`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Idempotency-Key": `application-${projectId}-${crypto.randomUUID()}`,
                },
                body: JSON.stringify({ submission: codeSubmission }),
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok || !payload?.data?.id) {
                throw new Error(payload?.error?.message || "지원서를 저장하지 못했습니다.");
            }
            await logSystemAction("PROJECT_APPLY", `Submitted application for project "${proj.title}"`);
            success("지원서 제출 완료", "지원서와 활동 기록이 안전하게 저장되었습니다.");
            info("AI 보조 검토 시작", "AI 평가는 참고자료로만 저장되며 실제 프로젝트 완료 경력에는 포함되지 않습니다.");
            void triggerEvaluation(payload.data.id);
            return true;
        }
        catch (err: any) {
            error("지원서 제출 실패", err?.message || "입력 내용을 확인하고 다시 시도해 주세요.");
            return false;
        }
    };
    const createProject = async (title: string, description: string, requirements: string[], difficulty: ProjectDifficulty, reward: string, tags: string[], details: Partial<Project> = {}) => {
        try {
            if (!currentUser || !companyProfile)
                throw new Error("기업 계정으로 로그인한 뒤 프로젝트를 등록해 주세요.");
            const createdAt = Date.now();
            const earlyBirdQualified = isEarlyBirdOpen(createdAt);
            const response = await fetch("/api/v2/projects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Idempotency-Key": `project-${crypto.randomUUID()}`,
                },
                body: JSON.stringify({
                    title,
                    description,
                    requirements,
                    difficulty,
                    reward,
                    tags,
                    workType: details.workType,
                    durationWeeks: details.durationWeeks,
                    hoursPerWeek: details.hoursPerWeek,
                    weeklyPayKrw: details.weeklyPayKrw,
                    requiredLanguage: details.requiredLanguage,
                    applicationDeadline: details.applicationDeadline,
                    hiringOpportunity: details.hiringOpportunity,
                    contactPolicyAccepted: details.contactPolicyAccepted === true,
                    contactPolicyVersion: "signup-v1",
                }),
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok || !payload?.data?.id) {
                throw new Error(payload?.error?.message || "공고를 등록하지 못했습니다.");
            }
            if (earlyBirdQualified && !companyProfile.earlyBirdEligible) {
                const earlyBirdProfile: CompanyProfile = {
                    ...companyProfile,
                    earlyBirdEligible: true,
                    earlyBirdQualifiedAt: createdAt,
                    subscriptionDiscountPercent: 30,
                    subscriptionDiscountMonths: 5,
                    premiumTalentViewCredits: 1,
                };
                await setDoc(doc(db, "company_profiles", companyProfile.uid), earlyBirdProfile, { merge: true });
                setCompanyProfile(earlyBirdProfile);
            }
            await logSystemAction("PROJECT_CREATE", `Created new challenge project: "${title}"`);
            success("공고 등록 완료", "검증된 기업 공고가 학생 페이지에 공개되었습니다.");
            return true;
        }
        catch (err: any) {
            handleSupabaseError(err, OperationType.WRITE, "projects");
            error("공고 등록 실패", err?.message || "입력 내용과 기업 인증 상태를 확인해 주세요.");
            return false;
        }
    };
    const updateStudentProfile = async (profile: Partial<StudentProfile>) => {
        try {
            if (!studentProfile)
                throw new Error("학생 프로필을 불러오지 못했습니다. 다시 로그인해 주세요.");
            const updated: StudentProfile = {
                ...studentProfile,
                ...profile,
            };
            if (isEarlyBirdOpen() && updated.onboardingCompleted === true && updated.resumeUrl && updated.introVideoPath && !updated.earlyPioneerEligible) {
                updated.earlyPioneerEligible = true;
                updated.earlyPioneerQualifiedAt = Date.now();
                updated.resumeConsultingCredits = 1;
                updated.withdrawalFeePaybackWeeks = 4;
            }
            if (profile.onboardingCompleted === true) {
                const validationErrors = getStudentCompletionErrors(updated);
                if (Object.keys(validationErrors).length > 0)
                    throw new Error(firstValidationMessage(validationErrors));
            }
            const contacts = {
                userId: updated.uid,
                talentId: updated.uid,
                email: currentUser?.email || "",
                github: updated.github || "",
                linkedin: updated.linkedin || "",
                portfolio: updated.portfolio || "",
                updatedAt: Date.now(),
            };
            if (profile.onboardingCompleted === true && (!studentProfile.onboardingCompleted || updated.identityDocumentPath !== studentProfile.identityDocumentPath)) {
                await persistCompletedProfile(supabase, "student", updated, currentUser?.email || "", contacts);
            }
            else {
                await setDoc(doc(db, "student_profiles", updated.uid), updated, { merge: true });
                await setDoc(doc(db, "protected_contacts", updated.uid), contacts, { merge: true });
            }
            const savedProfile = await getDoc(doc(db, "student_profiles", updated.uid));
            setStudentProfile(savedProfile.data() as StudentProfile);
            await logSystemAction("STUDENT_PROFILE_UPDATE", `Updated student profile metrics and onboarding parameters`);
            success("Profile Saved", "Your student portfolio was updated successfully.");
            return true;
        }
        catch (err: any) {
            error(locale === "ko" ? "프로필 저장을 완료하지 못했습니다" : "Profile not saved", profileSaveErrorMessage(err, locale));
            return false;
        }
    };
    const updateCompanyProfile = async (profile: Partial<CompanyProfile>) => {
        try {
            if (!companyProfile)
                throw new Error("기업 프로필을 불러오지 못했습니다. 다시 로그인해 주세요.");
            const updated = {
                ...companyProfile,
                ...profile
            };
            if (profile.onboardingCompleted === true) {
                const validationErrors = getCompanyCompletionErrors(updated);
                if (Object.keys(validationErrors).length > 0)
                    throw new Error(firstValidationMessage(validationErrors));
            }
            if (profile.onboardingCompleted === true && (!companyProfile.onboardingCompleted || updated.businessRegistrationDocumentPath !== companyProfile.businessRegistrationDocumentPath)) {
                await persistCompletedProfile(supabase, "company", updated, currentUser?.email || "");
            }
            else {
                await setDoc(doc(db, "company_profiles", updated.uid), updated, { merge: true });
            }
            const savedProfile = await getDoc(doc(db, "company_profiles", updated.uid));
            setCompanyProfile(savedProfile.data() as CompanyProfile);
            await logSystemAction("COMPANY_PROFILE_UPDATE", `Updated organization profile: ${updated.companyName}`);
            success("Company Saved", "Your company details have been updated.");
            return true;
        }
        catch (err: any) {
            error(locale === "ko" ? "기업 정보 저장을 완료하지 못했습니다" : "Company profile not saved", profileSaveErrorMessage(err, locale));
            return false;
        }
    };
    const registerUser = async (email: string, displayName: string, role: UserRole, studentData?: Partial<StudentProfile>, companyData?: Partial<CompanyProfile>, password?: string, consentBundle?: Record<string, unknown>) => {
        try {
            if (![UserRole.STUDENT, UserRole.COMPANY].includes(role)) {
                throw new Error("Only student and company self-registration is supported.");
            }
            if (!password)
                throw new Error("A password is required for registration.");
            if (!displayName.trim())
                throw new Error("이름 또는 기업명을 입력해 주세요.");
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
                throw new Error("올바른 이메일 주소를 입력해 주세요.");
            if (password.length < 8)
                throw new Error("비밀번호는 8자 이상이어야 합니다.");
            const requiredConsents = ["terms", "nonCircumvention", "messageAnalysis", "crossBorderPrivacy"];
            if (requiredConsents.some((key) => consentBundle?.[key] !== true)) {
                throw new Error("필수 약관과 개인정보 고지에 모두 동의해 주세요.");
            }
            if (role === UserRole.STUDENT && !studentData?.name?.trim()) {
                throw new Error("이름을 입력해 주세요.");
            }
            if (role === UserRole.COMPANY && !companyData?.companyName?.trim()) {
                throw new Error("기업명을 입력해 주세요.");
            }
            const credential = await createUserWithEmailAndPassword(auth, email, password, {
                display_name: displayName,
                role,
                student_profile: studentData || undefined,
                company_profile: companyData || undefined,
                consent_bundle: consentBundle || undefined,
            });
            if (!credential.session) {
                success("Verify your email", "Your account is ready. Open the confirmation link sent to your email, then sign in.");
                return { emailConfirmationRequired: true };
            }
            // The auth trigger creates the account, consent receipt and profile in
            // one database transaction. Never overwrite its server-owned fields.
            const userSnapshot = await getDoc(doc(db, "users", credential.user.uid));
            if (!userSnapshot.exists())
                throw new Error("Account setup is unavailable. Please sign in again.");
            const profile = userSnapshot.data() as UserProfile;
            const workspace = await loadWorkspaceProfiles(profile, async (collectionName, uid) => {
                const snapshot = await getDoc(doc(db, collectionName, uid));
                return snapshot.exists() ? snapshot.data() : null;
            });
            setStudentProfile(workspace.student);
            setCompanyProfile(workspace.company);
            setActiveRole(profile.role);
            setCurrentUser(profile);
            success("Welcome to KONEXA!", `Account created successfully as a ${role}.`);
            return { emailConfirmationRequired: false };
        }
        catch (err: any) {
            error("Registration failed", err.message);
            throw err;
        }
    };
    const loginUser = async (email: string, role: UserRole, password?: string) => {
        try {
            if (![UserRole.STUDENT, UserRole.COMPANY, UserRole.ADMIN].includes(role)) {
                throw new Error("This account type cannot use self-service login.");
            }
            if (!password)
                throw new Error("A password is required for login.");
            const credential = await signInWithEmailAndPassword(auth, email, password);
            const authUid = credential.user.uid;
            // Check if user profile exists in Supabase
            const userDocRef = doc(db, "users", authUid);
            const userSnapshot = await getDoc(userDocRef);
            let profile: UserProfile;
            if (userSnapshot.exists()) {
                profile = userSnapshot.data() as UserProfile;
            }
            else {
                await signOut(auth);
                throw new Error("KONEXA account setup is incomplete. Please register or contact support.");
            }
            if (role === UserRole.ADMIN && profile.role !== UserRole.ADMIN) {
                await signOut(auth);
                throw new Error("이 계정에는 관리자 권한이 없습니다.");
            }
            if (profile.accountStatus === "Suspended") {
                await signOut(auth);
                throw new Error("관리자 검토로 이용이 제한된 계정입니다. KONEXA 운영팀에 문의해 주세요.");
            }
            const effectiveRole = profile.role;
            const workspace = await loadWorkspaceProfiles(profile, async (collectionName, uid) => {
                const snapshot = await getDoc(doc(db, collectionName, uid));
                return snapshot.exists() ? snapshot.data() : null;
            });
            setStudentProfile(workspace.student);
            setCompanyProfile(workspace.company);
            setActiveRole(effectiveRole);
            setCurrentUser(profile);
            // Audit delivery must not turn a completed sign-in into a reported failure.
            await logSystemAction("AUTH_LOGIN", `Authenticated user (${effectiveRole}): ${authUid}`).catch(() => console.warn("Sign-in audit could not be recorded"));
            success(authCopy[locale].loginSuccess, authCopy[locale].loginSuccessBody);
        }
        catch (err: any) {
            // AuthModal renders one localized, actionable error without provider details.
            throw err;
        }
    };
    const googleLogin = async (role: UserRole, options: GoogleLoginOptions = {}) => {
        try {
            if (![UserRole.STUDENT, UserRole.COMPANY, UserRole.ADMIN].includes(role)) {
                throw new Error("This account type cannot use self-service login.");
            }
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider, {
                mode: options.mode || "login",
                role: role === UserRole.COMPANY ? "company" : role === UserRole.ADMIN ? "admin" : "student",
                consentBundle: options.consentBundle,
                profileData: options.profileData,
            });
        }
        catch (err: any) {
            error(authCopy[locale].googleError, authErrorMessage(err, locale));
            throw err;
        }
    };
    const completeGoogleRegistration = async (role: UserRole, consentBundle: Record<string, unknown>) => {
        if (![UserRole.STUDENT, UserRole.COMPANY].includes(role)) {
            throw new Error("Only student and company self-registration is supported.");
        }
        const authenticatedUser = auth.currentUser;
        if (!authenticatedUser?.uid) {
            throw new Error("Your Google session is unavailable. Please sign in again.");
        }
        const displayName = authenticatedUser.displayName || currentUser?.displayName || "KONEXA Member";
        const profileData = role === UserRole.STUDENT
            ? {
                name: displayName,
                skills: [],
                github: "",
                bio: "",
                onboardingCompleted: false,
                notificationPreferences: { email: true, push: true, marketing: consentBundle.marketing === true },
                privacySettings: { publicProfile: true, showResume: false },
            }
            : {
                companyName: displayName,
                website: "",
                description: "",
                onboardingCompleted: false,
                notificationPreferences: { email: true, system: true },
            };
        await submitGoogleRegistration(role === UserRole.COMPANY ? "company" : "student", consentBundle, profileData);
        const userSnapshot = await getDoc(doc(db, "users", authenticatedUser.uid));
        if (!userSnapshot.exists()) {
            throw new Error("KONEXA account setup could not be loaded.");
        }
        const profile = userSnapshot.data() as UserProfile;
        const workspace = await loadWorkspaceProfiles(profile, async (collectionName, uid) => {
            const snapshot = await getDoc(doc(db, collectionName, uid));
            return snapshot.exists() ? snapshot.data() : null;
        });
        clearPendingGoogleAuthIntent();
        clearGoogleRegistrationId();
        setStudentProfile(workspace.student);
        setCompanyProfile(workspace.company);
        setActiveRole(profile.role);
        setCurrentUser(profile);
        success(locale === "ko" ? "Google 가입이 완료되었습니다" : "Google registration complete", locale === "ko" ? "이제 필수 프로필을 작성해 주세요." : "Now complete your required profile.");
    };
    const refreshWorkspaceProfile = async () => {
        if (!currentUser || auth.currentUser?.uid !== currentUser.uid)
            return;
        const workspace = await loadWorkspaceProfiles(currentUser, async (collectionName, uid) => {
            const snapshot = await getDoc(doc(db, collectionName, uid));
            return snapshot.exists() ? snapshot.data() : null;
        });
        if (auth.currentUser?.uid !== currentUser.uid)
            return;
        setStudentProfile(workspace.student);
        setCompanyProfile(workspace.company);
    };
    const resetPassword = async (email: string) => {
        try {
            await sendPasswordResetEmail(auth, email);
            // AuthModal confirms the request without revealing whether an account exists.
        }
        catch (err: any) {
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
        }
        catch (err: any) {
            error("Sign out failed", err.message);
        }
    };
    const markNotificationRead = async (notificationId: string) => {
        const target = notifications.find((item) => item.id === notificationId);
        if (!target || target.readAt)
            return true;
        try {
            const readAt = Date.now();
            await updateDoc(doc(db, "notifications", notificationId), { readAt });
            setNotifications((items) => items.map((item) => item.id === notificationId ? { ...item, readAt } : item));
            return true;
        }
        catch {
            error(locale === 'ko' ? '알림 상태를 저장하지 못했습니다.' : 'Could not save notification status.', locale === 'ko' ? '연결을 확인한 뒤 다시 시도해 주세요.' : 'Check your connection and try again.');
            return false;
        }
    };
    const markAllNotificationsRead = async () => {
        const unread = notifications.filter((item) => !item.readAt);
        const results = await Promise.all(unread.map((item) => markNotificationRead(item.id)));
        return results.every(Boolean);
    };
    const reviewApplication = async (applicationId: string, status: ApplicationStatus, feedback: string, score: number) => {
        try {
            const response = await fetch(`/api/v2/applications/${encodeURIComponent(applicationId)}/review`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Idempotency-Key": `application-review-${applicationId}-${status}-${crypto.randomUUID()}`,
                },
                body: JSON.stringify({ status, feedback, score }),
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(payload?.error?.message || "지원 상태를 변경하지 못했습니다.");
            }
            const app = applications.find((a) => a.id === applicationId);
            await logSystemAction("APPLICATION_REVIEW", `Reviewed application for "${app?.projectTitle || "Project"}" - Status: ${status}`);
            success("검토 저장 완료", `지원 상태를 ${status}(으)로 변경했습니다.`);
        }
        catch (err: any) {
            handleSupabaseError(err, OperationType.WRITE, `applications/${applicationId}`);
            error("지원서 검토 실패", err?.message || "권한과 상태 변경 순서를 확인해 주세요.");
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
            await logSystemAction("AI_EVALUATION_COMPLETED", `Gemini completed code analysis for Application ID ${applicationId}. Score: ${evalData.score}`);
            success("AI Evaluation Completed", "Gemini successfully completed code verification and updated your Trust Score.");
            return evalData;
        }
        catch (err: any) {
            console.error("AI Evaluation error:", err);
            error("AI Evaluator Offline", "Could not reach Gemini service. The application remains pending for manual review.");
        }
    };
    return (<AppContext.Provider value={{
            isAuthReady,
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
            completeGoogleRegistration,
            refreshWorkspaceProfile,
            resetPassword,
            logoutUser,
            reviewApplication,
            triggerEvaluation
        }}>
      {children}
    </AppContext.Provider>);
}
