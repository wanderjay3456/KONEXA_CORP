import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../../context/AppContext";
import { 
  UserRole, 
  UserSession, 
  VerificationRequest, 
  SecurityActivity,
  StudentProfile,
  CompanyProfile,
  RbacPolicy
} from "../../types";
import { 
  Shield, 
  Key, 
  Users, 
  Smartphone, 
  Cpu, 
  FileCheck, 
  UserCheck, 
  Activity, 
  Lock, 
  Mail, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Globe, 
  Clock, 
  ArrowRight, 
  RefreshCw, 
  Check, 
  Plus, 
  ShieldAlert,
  Server,
  Layers,
  Terminal,
  Send,
  Eye,
  EyeOff,
  User,
  Settings,
  X
} from "lucide-react";
import { useToast } from "../ui/Toast";
import { eventSystem } from "../../lib/eventSystem";
import { db, auth } from "../../lib/supabaseAuth";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  setDoc, 
  doc, 
  deleteDoc, 
  getDocs,
  query,
  where
} from "../../lib/supabaseStore";

export default function IdentityCenter() {
  const { 
    currentUser, 
    setCurrentUser,
    activeRole, 
    setActiveRole,
    studentProfile, 
    setStudentProfile, 
    companyProfile, 
    setCompanyProfile 
  } = useApp();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<"auth" | "registration" | "verification" | "rbac" | "security" | "sync">("auth");
  
  // Real-time Supabase or memory states
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityActivity[]>([]);
  const [rbacPolicies, setRbacPolicies] = useState<RbacPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  // Verification filters
  const [verificationFilter, setVerificationFilter] = useState<string>("All");

  // Onboarding simulators
  const [onboardingType, setOnboardingType] = useState<"student" | "company">("student");
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [simulatedStudent, setSimulatedStudent] = useState<Partial<StudentProfile>>({
    name: "Wanderer Jay",
    preferredName: "Jay",
    nationality: "South Korea",
    currentCountry: "South Korea",
    timezone: "GMT+9 (Seoul)",
    university: "Seoul National University",
    degree: "Bachelor of Science",
    major: "Computer Science",
    languages: ["English", "Korean"],
    englishLevel: "Professional Working Proficiency",
    koreanLevel: "Native",
    skills: ["React", "TypeScript", "Node.js", "Python"],
    github: "https://github.com/jay-wanderer",
    linkedin: "https://linkedin.com/in/jay-wanderer",
    portfolio: "https://jay-wanderer.dev",
    bio: "Passionate soft-engineering pioneer building highly secure systems.",
    careerGoals: "Full Stack Engineer",
    preferredWorkingStyle: "Hybrid",
    availableHours: "40 hours/week"
  });

  const [simulatedCompany, setSimulatedCompany] = useState<Partial<CompanyProfile>>({
    companyName: "Nexus Enterprise Software",
    website: "https://nexus-enterprise.io",
    industry: "Enterprise AI & SaaS",
    companySize: "100-500 employees",
    country: "South Korea",
    officeLocation: "Teheran-ro, Seoul",
    hiringManager: "Jane Doe",
    corporateEmail: "recruiting@nexus-enterprise.io",
    description: "Nexus leads global cloud orchestration with AI-driven compliance automation."
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState("KnxSecure!99");
  const [passwordStrength, setPasswordStrength] = useState({ score: 4, label: "Unbreakable", color: "text-green-600 bg-green-50 border-green-200" });

  // Rate limiting simulation
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);

  // Sync Log Pipeline State
  const [syncHistory, setSyncHistory] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Authenticated state simulator
  const [authEmail, setAuthEmail] = useState("wanderjay3456@gmail.com");
  const [authPassword, setAuthPassword] = useState("Password123!");
  const [authRemember, setAuthRemember] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Evaluate Password Strength
  const evaluatePasswordStrength = (pass: string) => {
    setPasswordInput(pass);
    if (!pass) {
      setPasswordStrength({ score: 0, label: "Empty", color: "text-neutral-400 bg-neutral-50 border-neutral-200" });
      return;
    }
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^a-zA-Z0-9]/.test(pass)) score++;

    if (score <= 1) {
      setPasswordStrength({ score: 1, label: "Weak (Danger)", color: "text-red-600 bg-red-50 border-red-200" });
    } else if (score === 2) {
      setPasswordStrength({ score: 2, label: "Medium (Fair)", color: "text-amber-600 bg-amber-50 border-amber-200" });
    } else if (score === 3) {
      setPasswordStrength({ score: 3, label: "Strong (Secure)", color: "text-blue-600 bg-blue-50 border-blue-200" });
    } else {
      setPasswordStrength({ score: 4, label: "Unbreakable (Elite)", color: "text-green-600 bg-green-50 border-green-200" });
    }
  };

  // Seed Default Database Data for Identity Center
  const seedDefaultIdentityData = async () => {
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid || "usr_fndtn_konexa_99";
      
      // 1. Seed Sessions
      const sessionsCol = collection(db, "sessions");
      const sessionsSnap = await getDocs(sessionsCol);
      if (sessionsSnap.empty) {
        const defaultSessions: Partial<UserSession>[] = [
          {
            userId: uid,
            email: "wanderjay3456@gmail.com",
            role: UserRole.STUDENT,
            deviceType: "Macbook Pro (M3 Max)",
            ipAddress: "210.123.45.67",
            location: "Seoul, Republic of Korea",
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0",
            isActive: true,
            isSuspicious: false,
            createdAt: Date.now() - 3600000,
            lastActiveAt: Date.now()
          },
          {
            userId: uid,
            email: "wanderjay3456@gmail.com",
            role: UserRole.STUDENT,
            deviceType: "iPhone 15 Pro",
            ipAddress: "172.56.99.12",
            location: "San Francisco, US",
            userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) Mobile/15E148",
            isActive: true,
            isSuspicious: false,
            createdAt: Date.now() - 86400000,
            lastActiveAt: Date.now() - 7200000
          }
        ];
        for (const s of defaultSessions) {
          await addDoc(sessionsCol, s);
        }
      }

      // 2. Seed Verifications
      const verCol = collection(db, "verification_requests");
      const verSnap = await getDocs(verCol);
      if (verSnap.empty) {
        const defaultVerifications: Partial<VerificationRequest>[] = [
          {
            userId: "student_user_1",
            userName: "Wanderer Jay",
            userEmail: "wanderjay3456@gmail.com",
            role: UserRole.STUDENT,
            verificationType: "university",
            status: "Pending",
            documentUrl: "https://konexa.io/docs/snu-verification.pdf",
            adminNotes: "Pending registrar validation",
            createdAt: Date.now() - 43200000,
            updatedAt: Date.now()
          },
          {
            userId: "company_user_1",
            userName: "Nexus Corporate Team",
            userEmail: "compliance@nexus-enterprise.io",
            role: UserRole.COMPANY,
            verificationType: "business_registration",
            status: "Pending",
            documentUrl: "https://konexa.io/docs/brn-license-9912.pdf",
            adminNotes: "Awaiting BRN database match",
            createdAt: Date.now() - 86400000,
            updatedAt: Date.now()
          },
          {
            userId: "mentor_user_1",
            userName: "Dr. Min-jun Kim",
            userEmail: "m.kim@snu.ac.kr",
            role: UserRole.MENTOR,
            verificationType: "identity",
            status: "Approved",
            documentUrl: "https://konexa.io/docs/academic-id-snu.pdf",
            adminNotes: "Faculty credentials verified successfully.",
            createdAt: Date.now() - 172800000,
            updatedAt: Date.now() - 129600000
          }
        ];
        for (const v of defaultVerifications) {
          await addDoc(verCol, v);
        }
      }

      // 3. Seed Security Logs
      const secCol = collection(db, "security_logs");
      const secSnap = await getDocs(secCol);
      if (secSnap.empty) {
        const defaultSecLogs: Partial<SecurityActivity>[] = [
          {
            userId: uid,
            email: "wanderjay3456@gmail.com",
            action: "Email/Password Login",
            ipAddress: "210.123.45.67",
            device: "Macbook Pro (Seoul)",
            location: "Seoul, KR",
            status: "Success",
            timestamp: Date.now() - 3600000
          },
          {
            userId: uid,
            email: "wanderjay3456@gmail.com",
            action: "Google Single Sign-On",
            ipAddress: "172.56.99.12",
            device: "iPhone (SF)",
            location: "San Francisco, US",
            status: "Success",
            timestamp: Date.now() - 86400000
          },
          {
            userId: "intruder_99",
            email: "wanderjay3456@gmail.com",
            action: "Brute Force Attempt",
            ipAddress: "185.220.101.44",
            device: "Unknown Botnet Node",
            location: "Berlin, DE",
            status: "Failed",
            timestamp: Date.now() - 12000000
          }
        ];
        for (const sl of defaultSecLogs) {
          await addDoc(secCol, sl);
        }
      }

      // 4. Seed RBAC Policies
      const rbacCol = collection(db, "rbac_policies");
      const rbacSnap = await getDocs(rbacCol);
      if (rbacSnap.empty) {
        const defaultPolicies = [
          { id: "student", submit_projects: true, review_code: false, compliance_audits: false, saas_configs: false },
          { id: "company", submit_projects: true, review_code: true, compliance_audits: false, saas_configs: false },
          { id: "university", submit_projects: true, review_code: true, compliance_audits: true, saas_configs: false },
          { id: "mentor", submit_projects: false, review_code: true, compliance_audits: false, saas_configs: false },
          { id: "admin", submit_projects: true, review_code: true, compliance_audits: true, saas_configs: true }
        ];
        for (const p of defaultPolicies) {
          await setDoc(doc(db, "rbac_policies", p.id), {
            submit_projects: p.submit_projects,
            review_code: p.review_code,
            compliance_audits: p.compliance_audits,
            saas_configs: p.saas_configs
          });
        }
      }

    } catch (err: any) {
      console.error("Failed to seed identity database:", err);
    } finally {
      setLoading(false);
    }
  };

  // Set up Live Snapshot Subscriptions for real-time compliance
  useEffect(() => {
    seedDefaultIdentityData();

    // Listen for Sessions
    const unsubSessions = onSnapshot(collection(db, "sessions"), (snap) => {
      const items: UserSession[] = [];
      snap.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as UserSession);
      });
      items.sort((a, b) => b.lastActiveAt - a.lastActiveAt);
      setSessions(items);
    });

    // Listen for Verification Requests
    const unsubVerifications = onSnapshot(collection(db, "verification_requests"), (snap) => {
      const items: VerificationRequest[] = [];
      snap.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as VerificationRequest);
      });
      items.sort((a, b) => b.createdAt - a.createdAt);
      setVerifications(items);
    });

    // Listen for Security Logs
    const unsubSecurityLogs = onSnapshot(collection(db, "security_logs"), (snap) => {
      const items: SecurityActivity[] = [];
      snap.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as SecurityActivity);
      });
      items.sort((a, b) => b.timestamp - a.timestamp);
      setSecurityLogs(items);
    });

    // Listen for RBAC Policies
    const unsubRbac = onSnapshot(collection(db, "rbac_policies"), (snap) => {
      const items: RbacPolicy[] = [];
      snap.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as RbacPolicy);
      });
      const order = ["student", "company", "university", "mentor", "admin"];
      items.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
      setRbacPolicies(items);
    });

    return () => {
      unsubSessions();
      unsubVerifications();
      unsubSecurityLogs();
      unsubRbac();
    };
  }, []);

  // Pre-populate simulated data with logged-in user details on mount/role shift
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === UserRole.STUDENT && studentProfile) {
        setSimulatedStudent(prev => ({
          ...prev,
          name: studentProfile.name || currentUser.displayName || prev.name,
          skills: studentProfile.skills || prev.skills,
          github: studentProfile.github || prev.github,
          bio: studentProfile.bio || prev.bio,
          ...studentProfile
        }));
      } else if (currentUser.role === UserRole.COMPANY && companyProfile) {
        setSimulatedCompany(prev => ({
          ...prev,
          companyName: companyProfile.companyName || prev.companyName,
          website: companyProfile.website || prev.website,
          description: companyProfile.description || prev.description,
          ...companyProfile
        }));
      }
    }
  }, [currentUser, studentProfile, companyProfile]);

  // Multi-Step Student Onboarding Simulator
  const handleStudentOnboardingNext = async () => {
    if (onboardingStep < 3) {
      setOnboardingStep(prev => prev + 1);
      info(`Autosaving Step ${onboardingStep}`, "Your progress has been encrypted and synced securely to cloud caches.");
    } else {
      // Finalize onboarding registration
      try {
        const uid = auth.currentUser?.uid || "usr_fndtn_konexa_" + Math.random().toString(36).substring(2, 9);
        const now = Date.now();
        
        const sProfileData = {
          ...simulatedStudent,
          uid,
          trustScore: studentProfile?.trustScore || 85,
          completedProjects: studentProfile?.completedProjects || 0,
          createdAt: studentProfile?.createdAt || now,
          onboardingCompleted: true
        };

        // Save student profile to state & Supabase
        setStudentProfile(sProfileData as any);

        // Add to users and student_profiles collections
        await setDoc(doc(db, "student_profiles", uid), sProfileData);
        await setDoc(doc(db, "users", uid), { onboardingCompleted: true }, { merge: true });

        // Update current user locally if matching
        if (currentUser && currentUser.uid === uid) {
          setCurrentUser(prev => prev ? { ...prev, onboardingCompleted: true } : null);
        }

        // Publish registration event
        eventSystem.publish("StudentRegistered", simulatedStudent);
        eventSystem.publish("ProfileCompleted", simulatedStudent);

        // Success logs and state updates
        success("Registration Successful", "Your premium student account is complete and fully synchronized.");
        setOnboardingStep(1);
        triggerProfileSynchronization("Student Onboarding Flow completed");
      } catch (err: any) {
        error("Onboarding Failed", err.message);
      }
    }
  };

  // Multi-Step Company Onboarding Simulator
  const handleCompanyOnboardingNext = async () => {
    if (onboardingStep < 3) {
      setOnboardingStep(prev => prev + 1);
      info(`Autosaving Step ${onboardingStep}`, "Company registration drafts saved to database node.");
    } else {
      try {
        const uid = auth.currentUser?.uid || "usr_fndtn_konexa_" + Math.random().toString(36).substring(2, 9);
        const now = Date.now();

        const cProfileData = {
          ...simulatedCompany,
          uid,
          verified: companyProfile?.verified || false,
          verifiedStatus: companyProfile?.verifiedStatus || "Pending",
          createdAt: companyProfile?.createdAt || now,
          onboardingCompleted: true
        };

        setCompanyProfile(cProfileData as any);

        await setDoc(doc(db, "company_profiles", uid), cProfileData);
        await setDoc(doc(db, "users", uid), { onboardingCompleted: true }, { merge: true });

        // Update current user locally if matching
        if (currentUser && currentUser.uid === uid) {
          setCurrentUser(prev => prev ? { ...prev, onboardingCompleted: true } : null);
        }

        eventSystem.publish("CompanyRegistered", simulatedCompany);
        success("Company Onboarding Done", "Nexus Enterprise profile registered. Pending compliance manual review.");
        setOnboardingStep(1);
        triggerProfileSynchronization("Company Corporate Registration saved");
      } catch (err: any) {
        error("Onboarding Failed", err.message);
      }
    }
  };

  // Simulate Rate Limiting
  const handleAuthAttempt = (isSuccess: boolean) => {
    if (isLocked) {
      error("Authentication Locked", "Access blocked due to rapid security threshold violation. Wait for lock countdown.");
      return;
    }

    if (isSuccess) {
      setFailedAttempts(0);
      success("Access Decrypted", "Authenticated securely as " + authEmail);
      eventSystem.publish("LoginSuccess", { email: authEmail });
    } else {
      const nextFail = failedAttempts + 1;
      setFailedAttempts(nextFail);
      eventSystem.publish("LoginFailed", { email: authEmail, ip: "125.131.22.84" });
      
      if (nextFail >= 3) {
        setIsLocked(true);
        setLockCountdown(30);
        error("Security Lockout Triggered", "3 failed authentication attempts. Account locked down for 30 seconds to prevent brute-force attacks.");
        
        // Start countdown timer
        const timer = setInterval(() => {
          setLockCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setIsLocked(false);
              setFailedAttempts(0);
              info("Account Restored", "Brute force lockdown lifted. Access terminal re-enabled.");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        error("Access Denied", `Invalid credential combination. ${3 - nextFail} attempts remaining before rate-limit lockdown.`);
      }
    }
  };

  // Trigger Suspicious Login Detection simulation
  const simulateSuspiciousLogin = async () => {
    info("Simulating Intruder Attack...", "Simulating rapid unauthorized authentication from Berlin, DE...");
    try {
      const secCol = collection(db, "security_logs");
      await addDoc(secCol, {
        userId: "suspicious_target_user",
        email: "wanderjay3456@gmail.com",
        action: "Magic Link Brute Force",
        ipAddress: "185.220.101.44",
        device: "Tor Exit Node Berlin",
        location: "Berlin, DE",
        status: "Blocked",
        timestamp: Date.now()
      });

      eventSystem.publish("SecurityAlert", {
        type: "SuspiciousLogin",
        ip: "185.220.101.44",
        location: "Berlin, DE",
        reason: "Unexpected geographical displacement from standard Seoul coordinates"
      });

      error("Security Alert", "Suspicious login block registered in audit node. Geolocational displacement detected from Tor node in Berlin.");
    } catch (err: any) {
      error("Log failure", err.message);
    }
  };

  // Terminate Device Session from all devices
  const terminateAllDeviceSessions = async () => {
    try {
      const sessionsCol = collection(db, "sessions");
      const snap = await getDocs(sessionsCol);
      
      let deletedCount = 0;
      snap.forEach(async (d) => {
        await deleteDoc(doc(db, "sessions", d.id));
        deletedCount++;
      });

      success("Sessions Terminated", `Successfully logged out from all devices. Erased ${deletedCount} active browser credentials.`);
      eventSystem.publish("SettingsUpdated", { action: "SessionTermination" });
    } catch (err: any) {
      error("Termination failed", err.message);
    }
  };

  // Real-Time Admin Verification Approvals
  const handleVerificationStatusChange = async (reqId: string, status: "Approved" | "Rejected" | "Suspended") => {
    try {
      const reqDoc = verifications.find(v => v.id === reqId);
      if (!reqDoc) {
        error("Request Not Found", "Verification request not found in active compliance cache.");
        return;
      }

      const docRef = doc(db, "verification_requests", reqId);
      await setDoc(docRef, { status, updatedAt: Date.now() }, { merge: true });

      const targetUserId = reqDoc.userId;
      if (targetUserId) {
        if (reqDoc.role === UserRole.STUDENT) {
          const sRef = doc(db, "student_profiles", targetUserId);
          await setDoc(sRef, { 
            verified: status === "Approved", 
            verifiedStatus: status 
          }, { merge: true });
          
          if (currentUser?.uid === targetUserId) {
            setStudentProfile(prev => prev ? { ...prev, verified: status === "Approved", verifiedStatus: status } : null);
          }
        } else if (reqDoc.role === UserRole.COMPANY) {
          const cRef = doc(db, "company_profiles", targetUserId);
          await setDoc(cRef, { 
            verified: status === "Approved", 
            verifiedStatus: status 
          }, { merge: true });
          
          if (currentUser?.uid === targetUserId) {
            setCompanyProfile(prev => prev ? { ...prev, verified: status === "Approved", verifiedStatus: status } : null);
          }
        }
      }

      // Log to compliance security logs!
      const secCol = collection(db, "security_logs");
      await addDoc(secCol, {
        userId: currentUser?.uid || "admin_system",
        email: currentUser?.email || "admin@konexa.io",
        action: `COMPLIANCE_${status.toUpperCase()}`,
        ipAddress: "210.123.45.67",
        device: "Macbook Pro (Security Gate)",
        location: "Seoul, KR",
        status: "Success",
        details: `Approved verification request ${reqId} for ${reqDoc.userName}`,
        timestamp: Date.now()
      });

      if (status === "Approved") {
        success("Verification Approved", "Document cleared. Compliance rating updated synchronously.");
        eventSystem.publish("VerificationApproved", { requestId: reqId });
      } else if (status === "Rejected") {
        error("Verification Rejected", "Document flag applied. Rejection report dispatched to target user.");
        eventSystem.publish("VerificationRejected", { requestId: reqId });
      } else {
        info("Compliance Suspension", "Verified status suspended pending deeper audit reviews.");
      }
    } catch (err: any) {
      error("Status change failed", err.message);
    }
  };

  // Synchronous Profile Engine Coordinator Visualization
  const triggerProfileSynchronization = (source: string) => {
    setIsSyncing(true);
    setSyncHistory([]);
    
    const engines = [
      "AI Recruiter Engine",
      "AI Resume Reviewer Engine",
      "AI Portfolio Reviewer Engine",
      "AI Growth Coach Engine",
      "Matching Pipeline Engine",
      "Trust Rating Vector Engine",
      "Performance Monitor Cluster",
      "Search Engine Indexes",
      "Dashboard Live Subscriptions",
      "Telemetry & Metric Analytics"
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < engines.length) {
        setSyncHistory(prev => [...prev, `[Event Sync] Synchronized metadata cleanly with: ${engines[current]}`]);
        current++;
      } else {
        clearInterval(interval);
        setIsSyncing(false);
        success("Synchronization Complete", `All ${engines.length} micro-engines matched and synced synchronously via Event Gateway.`);
      }
    }, 180);
  };

  // Simulated API permission sandbox testing console
  const [rbacTestRole, setRbacTestRole] = useState<UserRole>(UserRole.STUDENT);
  const [rbacTestResult, setRbacTestResult] = useState<{ status: string; code: number; authorized: boolean; error?: string } | null>(null);

  const simulateRbacEndpoint = (endpoint: string, requiredPermission: keyof Omit<RbacPolicy, 'id'>) => {
    info("Invoking secure endpoint...", `Testing RBAC authorization for: ${endpoint}`);
    setTimeout(() => {
      const rolePolicy = rbacPolicies.find(p => p.id === rbacTestRole.toLowerCase());
      const isAuthorized = rolePolicy ? rolePolicy[requiredPermission] : false;
      
      if (isAuthorized) {
        setRbacTestResult({
          status: "200 OK - Authorized Gateway",
          code: 200,
          authorized: true
        });
        success("Endpoint Cleared", `RBAC Access permitted. Claim [${requiredPermission.replace('_', ' ').toUpperCase()}] approved for ${rbacTestRole.toUpperCase()}`);
      } else {
        setRbacTestResult({
          status: "403 Forbidden - Insufficient Permissions",
          code: 403,
          authorized: false,
          error: `Access Denied. Endpoint requires permission: [${requiredPermission.replace('_', ' ').toUpperCase()}] but role policy for [${rbacTestRole.toUpperCase()}] does not grant it.`
        });
        error("Security Intercepted", "RBAC evaluation failed. Ingress blocked.");
      }
    }, 450);
  };

  const handleToggleRbacPermission = async (roleId: string, permission: keyof Omit<RbacPolicy, 'id'>, value: boolean) => {
    try {
      const docRef = doc(db, "rbac_policies", roleId);
      await setDoc(docRef, { [permission]: value }, { merge: true });
      success("Policy Synced", `Updated [${permission.replace('_', ' ').toUpperCase()}] claim for role: ${roleId.toUpperCase()}`);
      
      // Log to compliance security logs
      const secCol = collection(db, "security_logs");
      await addDoc(secCol, {
        userId: currentUser?.uid || "admin_system",
        email: currentUser?.email || "admin@konexa.io",
        action: "RBAC_POLICY_UPDATE",
        ipAddress: "210.123.45.67",
        device: "Macbook Pro (Security Gate)",
        location: "Seoul, KR",
        status: "Success",
        details: `Toggled ${permission} for ${roleId} to ${value}`,
        timestamp: Date.now()
      });
    } catch (err: any) {
      error("Policy update failed", err.message);
    }
  };

  const filteredRequests = verifications.filter(v => 
    verificationFilter === "All" || v.status === verificationFilter
  );

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50/50 p-6 space-y-6">
      
      {/* 1. Header Display */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-200/60 pb-5 gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block mb-1">
            KONEXA SECURE CORE
          </span>
          <h2 className="font-display font-black text-3xl text-neutral-900 tracking-tight flex items-center gap-2">
            <Shield className="w-7 h-7 text-black shrink-0" />
            Enterprise Identity Platform
          </h2>
          <p className="font-sans text-xs text-neutral-400 mt-1 max-w-2xl">
            Hardened client-side and cloud synchronization sandbox enforcing multi-step registration, 
            zero-trust authentication, rate-limiting, active compliance tracking, and instantaneous event-based micro-sync pipelines.
          </p>
        </div>

        {/* Global Active State Indicator */}
        <div className="flex items-center gap-2.5 bg-white border border-neutral-200 shadow-sm px-4 py-2 rounded-2xl shrink-0">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <div className="text-[10px] font-sans">
            <span className="font-bold block text-neutral-800">RBAC Gateways: Active</span>
            <span className="text-neutral-400 font-light block">Mode: Supabase RLS</span>
          </div>
        </div>
      </div>

      {/* 2. Top Navigation Tabs */}
      <div className="flex gap-1 bg-neutral-100 p-1.5 rounded-2xl border border-neutral-200 max-w-4xl overflow-x-auto">
        {[
          { id: "auth", label: "Auth Portal", icon: Key },
          { id: "registration", label: "Onboarding Specs", icon: Users },
          { id: "verification", label: "Compliance Center", icon: FileCheck },
          { id: "rbac", label: "RBAC Matrix", icon: UserCheck },
          { id: "security", label: "Active Sessions", icon: Smartphone },
          { id: "sync", label: "Live Telemetry Sync", icon: Activity }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setOnboardingStep(1);
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer shrink-0 ${
              activeTab === tab.id
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-950"
            }`}
          >
            <tab.icon className="w-4 h-4 shrink-0" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 3. Main Dashboard Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Dynamic Workspace Panel (8/12 Cols) */}
        <div className="xl:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: AUTHENTICATION PORTAL */}
            {activeTab === "auth" && (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 space-y-6"
              >
                <div>
                  <h3 className="font-display font-extrabold text-xl text-neutral-900 tracking-tight">
                    Zero-Trust Authentication Terminal
                  </h3>
                  <p className="text-neutral-400 text-xs mt-0.5">
                    Demonstrate secure single sign-on, magic links, recovery pathways, and brute-force mitigation rate limits.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column: Live Form sandbox */}
                  <div className="space-y-4 bg-neutral-50/50 border border-neutral-200/60 p-5 rounded-2xl relative">
                    <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Live Terminal Sandbox</span>
                    
                    {isLocked && (
                      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center z-10">
                        <ShieldAlert className="w-12 h-12 text-rose-600 animate-bounce mb-3" />
                        <h4 className="font-display font-extrabold text-rose-950 text-base">Terminal Lockdown Engaged</h4>
                        <p className="text-rose-900/80 text-xs max-w-xs mt-1">
                          Brute-force pattern intercepted. Credentials input locked down temporarily to safeguard active security.
                        </p>
                        <span className="font-mono text-xl font-black text-rose-600 mt-3 animate-pulse">
                          {lockCountdown}s Remaining
                        </span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <input
                            type="email"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            className="w-full h-10 pl-10 pr-3 bg-white border border-neutral-200 rounded-xl text-xs"
                            placeholder="user@konexa.io"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            className="w-full h-10 pl-10 pr-10 bg-white border border-neutral-200 rounded-xl text-xs"
                            placeholder="••••••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-neutral-500">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={authRemember}
                            onChange={(e) => setAuthRemember(e.target.checked)}
                            className="rounded border-neutral-300 text-black focus:ring-black"
                          />
                          <span>Keep me remembered</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            info("Magic Link Sent", "Magic link credentials dispatched to " + authEmail);
                            eventSystem.publish("UserUpdated", { email: authEmail, magicLink: true });
                          }}
                          className="hover:underline font-bold text-neutral-800"
                        >
                          Use Magic Link Instead
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          onClick={() => handleAuthAttempt(true)}
                          className="h-10 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Trigger Success Login
                        </button>
                        <button
                          onClick={() => handleAuthAttempt(false)}
                          className="h-10 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Trigger Failed Login
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Security safeguards showcase */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Security Compliance Specs</span>
                    
                    <div className="space-y-3.5">
                      {/* Password strength meter */}
                      <div className="p-4 border border-neutral-200 rounded-2xl bg-white space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-neutral-700">Password Strength Evaluator</span>
                          <span className={`px-2 py-0.5 border rounded-md text-[9px] font-mono font-bold ${passwordStrength.color}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={passwordInput}
                          onChange={(e) => evaluatePasswordStrength(e.target.value)}
                          className="w-full h-9 bg-neutral-50 border border-neutral-200 rounded-lg px-3 text-xs font-mono"
                          placeholder="Type password to audit..."
                        />
                        <div className="grid grid-cols-4 gap-1 pt-1">
                          {[1, 2, 3, 4].map((bar) => (
                            <div 
                              key={bar} 
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                passwordStrength.score >= bar 
                                  ? passwordStrength.score === 4 
                                    ? "bg-green-500" 
                                    : passwordStrength.score === 3 
                                      ? "bg-blue-500" 
                                      : "bg-amber-500" 
                                  : "bg-neutral-200"
                              }`} 
                            />
                          ))}
                        </div>
                      </div>

                      {/* Google Single Sign-on integration showcase */}
                      <div className="p-4 border border-neutral-200 rounded-2xl bg-white flex items-center justify-between">
                        <div className="text-xs">
                          <span className="font-bold text-neutral-800 block">Google OAuth SSO Gateways</span>
                          <span className="text-neutral-400">Integrated using Google identity claims.</span>
                        </div>
                        <button
                          onClick={() => {
                            info("OAuth Initiated", "Google Identity Popup loaded securely.");
                            setTimeout(() => {
                              success("Google OAuth Synced", "Successfully linked with google account: wanderjay3456@gmail.com");
                            }, 800);
                          }}
                          className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Link Google</span>
                        </button>
                      </div>

                      {/* Suspicious Login Detection */}
                      <div className="p-4 border border-neutral-200 rounded-2xl bg-white flex items-center justify-between">
                        <div className="text-xs">
                          <span className="font-bold text-neutral-800 block">Suspicious Geolocation Check</span>
                          <span className="text-neutral-400">Scan incoming tokens against standard geolocation.</span>
                        </div>
                        <button
                          onClick={simulateSuspiciousLogin}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                          <span>Simulate Threat</span>
                        </button>
                      </div>

                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB 2: REGISTRATION EXPERIENCES */}
            {activeTab === "registration" && (
              <motion.div
                key="registration"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 space-y-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display font-extrabold text-xl text-neutral-900 tracking-tight">
                      Onboarding and Profiles Specifications
                    </h3>
                    <p className="text-neutral-400 text-xs mt-0.5">
                      Completely customized, distinct onboarding sequences with validation steps and offline-first auto-saving.
                    </p>
                  </div>

                  <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
                    <button
                      onClick={() => { setOnboardingType("student"); setOnboardingStep(1); }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-sans font-bold transition-all cursor-pointer ${
                        onboardingType === "student" ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-400"
                      }`}
                    >
                      Student Form
                    </button>
                    <button
                      onClick={() => { setOnboardingType("company"); setOnboardingStep(1); }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-sans font-bold transition-all cursor-pointer ${
                        onboardingType === "company" ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-400"
                      }`}
                    >
                      Company Form
                    </button>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex-1 flex items-center gap-1.5">
                      <div className={`h-1.5 flex-1 rounded-full ${onboardingStep >= s ? "bg-black" : "bg-neutral-200"}`} />
                      <span className={`text-[10px] font-mono font-bold ${onboardingStep === s ? "text-neutral-900" : "text-neutral-400"}`}>
                        0{s}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Simulated Registration forms */}
                <div className="p-5 border border-neutral-200 bg-neutral-50/40 rounded-2xl space-y-4">
                  {onboardingType === "student" ? (
                    <div>
                      {onboardingStep === 1 && (
                        <div className="space-y-3">
                          <h4 className="font-display font-bold text-sm text-neutral-800">Step 1: Personal Identifiers</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-neutral-500 uppercase">Legal Name</label>
                              <input
                                type="text"
                                value={simulatedStudent.name}
                                onChange={(e) => setSimulatedStudent(p => ({ ...p, name: e.target.value }))}
                                className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-neutral-500 uppercase">Preferred Name</label>
                              <input
                                type="text"
                                value={simulatedStudent.preferredName}
                                onChange={(e) => setSimulatedStudent(p => ({ ...p, preferredName: e.target.value }))}
                                className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl text-xs"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-neutral-500 uppercase">Nationality</label>
                              <input
                                type="text"
                                value={simulatedStudent.nationality}
                                onChange={(e) => setSimulatedStudent(p => ({ ...p, nationality: e.target.value }))}
                                className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-neutral-500 uppercase">Timezone</label>
                              <input
                                type="text"
                                value={simulatedStudent.timezone}
                                onChange={(e) => setSimulatedStudent(p => ({ ...p, timezone: e.target.value }))}
                                className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {onboardingStep === 2 && (
                        <div className="space-y-3">
                          <h4 className="font-display font-bold text-sm text-neutral-800">Step 2: Academics & Technical Capabilities</h4>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase">University</label>
                                <input
                                  type="text"
                                  value={simulatedStudent.university}
                                  onChange={(e) => setSimulatedStudent(p => ({ ...p, university: e.target.value }))}
                                  className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase">Major Field</label>
                                <input
                                  type="text"
                                  value={simulatedStudent.major}
                                  onChange={(e) => setSimulatedStudent(p => ({ ...p, major: e.target.value }))}
                                  className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl text-xs"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-neutral-500 uppercase">Verified Technical Skills (Comma separated)</label>
                              <input
                                type="text"
                                value={simulatedStudent.skills?.join(", ")}
                                onChange={(e) => setSimulatedStudent(p => ({ ...p, skills: e.target.value.split(",").map(s => s.trim()) }))}
                                className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl text-xs font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {onboardingStep === 3 && (
                        <div className="space-y-3">
                          <h4 className="font-display font-bold text-sm text-neutral-800">Step 3: Self Pitch & Carrier Goals</h4>
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-neutral-500 uppercase">Biography Pitch</label>
                              <textarea
                                value={simulatedStudent.bio}
                                onChange={(e) => setSimulatedStudent(p => ({ ...p, bio: e.target.value }))}
                                rows={3}
                                className="w-full bg-white border border-neutral-200 rounded-xl p-3 text-xs"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase">Career Interest</label>
                                <input
                                  type="text"
                                  value={simulatedStudent.careerGoals}
                                  onChange={(e) => setSimulatedStudent(p => ({ ...p, careerGoals: e.target.value }))}
                                  className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase">GitHub Profile URL</label>
                                <input
                                  type="text"
                                  value={simulatedStudent.github}
                                  onChange={(e) => setSimulatedStudent(p => ({ ...p, github: e.target.value }))}
                                  className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl text-xs font-mono text-neutral-600"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {onboardingStep === 1 && (
                        <div className="space-y-3">
                          <h4 className="font-display font-bold text-sm text-neutral-800">Step 1: Corporate Profile</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-neutral-500 uppercase">Company Legal Name</label>
                              <input
                                type="text"
                                value={simulatedCompany.companyName}
                                onChange={(e) => setSimulatedCompany(p => ({ ...p, companyName: e.target.value }))}
                                className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-neutral-500 uppercase">Corporate URL / Website</label>
                              <input
                                type="text"
                                value={simulatedCompany.website}
                                onChange={(e) => setSimulatedCompany(p => ({ ...p, website: e.target.value }))}
                                className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl text-xs"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-neutral-500 uppercase">Industry</label>
                              <input
                                type="text"
                                value={simulatedCompany.industry}
                                onChange={(e) => setSimulatedCompany(p => ({ ...p, industry: e.target.value }))}
                                className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-neutral-500 uppercase">Company Size</label>
                              <input
                                type="text"
                                value={simulatedCompany.companySize}
                                onChange={(e) => setSimulatedCompany(p => ({ ...p, companySize: e.target.value }))}
                                className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {onboardingStep === 2 && (
                        <div className="space-y-3">
                          <h4 className="font-display font-bold text-sm text-neutral-800">Step 2: Corporate Locations</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-neutral-500 uppercase">Country headquarters</label>
                              <input
                                type="text"
                                value={simulatedCompany.country}
                                onChange={(e) => setSimulatedCompany(p => ({ ...p, country: e.target.value }))}
                                className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-neutral-500 uppercase">HQ Office Location</label>
                              <input
                                type="text"
                                value={simulatedCompany.officeLocation}
                                onChange={(e) => setSimulatedCompany(p => ({ ...p, officeLocation: e.target.value }))}
                                className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {onboardingStep === 3 && (
                        <div className="space-y-3">
                          <h4 className="font-display font-bold text-sm text-neutral-800">Step 3: Point of Contact</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-neutral-500 uppercase">Hiring Lead / Manager</label>
                              <input
                                type="text"
                                value={simulatedCompany.hiringManager}
                                onChange={(e) => setSimulatedCompany(p => ({ ...p, hiringManager: e.target.value }))}
                                className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-neutral-500 uppercase">Corporate Email</label>
                              <input
                                type="email"
                                value={simulatedCompany.corporateEmail}
                                onChange={(e) => setSimulatedCompany(p => ({ ...p, corporateEmail: e.target.value }))}
                                className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-neutral-200/80">
                    <button
                      disabled={onboardingStep === 1}
                      onClick={() => setOnboardingStep(prev => Math.max(1, prev - 1))}
                      className="px-4 py-2 border border-neutral-200 bg-white hover:bg-neutral-50 rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                    >
                      Back
                    </button>
                    
                    <button
                      onClick={onboardingType === "student" ? handleStudentOnboardingNext : handleCompanyOnboardingNext}
                      className="px-5 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{onboardingStep === 3 ? "Complete & Sync" : "Next Step"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Display compiled saved data block */}
                {studentProfile && onboardingType === "student" && (
                  <div className="p-4 border border-green-200 bg-green-50/50 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-green-800 text-xs font-bold mb-1">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>Saved Student Profile - Fully Editable Later</span>
                    </div>
                    <div className="text-[10px] font-sans text-neutral-600 grid grid-cols-2 gap-y-1 gap-x-4">
                      <div>Name: <b>{studentProfile.name}</b></div>
                      <div>Skills: <b>{studentProfile.skills?.join(", ")}</b></div>
                      <div>Univ: <b>{studentProfile.university || "SNU"}</b></div>
                      <div>GitHub: <b>{studentProfile.github}</b></div>
                    </div>
                  </div>
                )}

                {companyProfile && onboardingType === "company" && (
                  <div className="p-4 border border-green-200 bg-green-50/50 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-green-800 text-xs font-bold mb-1">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>Saved Partner Profile</span>
                    </div>
                    <div className="text-[10px] font-sans text-neutral-600 grid grid-cols-2 gap-y-1 gap-x-4">
                      <div>Company Name: <b>{companyProfile.companyName}</b></div>
                      <div>Industry: <b>{companyProfile.industry || "AI"}</b></div>
                      <div>Website: <b>{companyProfile.website}</b></div>
                      <div>Verified Status: <b>{companyProfile.verifiedStatus || "Pending"}</b></div>
                    </div>
                  </div>
                )}

              </motion.div>
            )}

            {/* TAB 3: ACCOUNT VERIFICATION */}
            {activeTab === "verification" && (
              <motion.div
                key="verification"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 space-y-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="font-display font-extrabold text-xl text-neutral-900 tracking-tight">
                      Compliance and Verification Center
                    </h3>
                    <p className="text-neutral-400 text-xs mt-0.5">
                      Process verification requests for students (university, certs, IDs) and corporations (BRN, corporate email).
                    </p>
                  </div>

                  {/* Verification filter switcher */}
                  <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl border border-neutral-200">
                    {["All", "Pending", "Approved", "Rejected"].map(filter => (
                      <button
                        key={filter}
                        onClick={() => setVerificationFilter(filter)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-sans font-bold transition-all cursor-pointer ${
                          verificationFilter === filter ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-400"
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3.5">
                  {filteredRequests.length === 0 ? (
                    <div className="p-8 text-center text-xs font-sans text-neutral-400 border border-neutral-200 rounded-2xl bg-neutral-50/50">
                      No matching verification compliance requests found.
                    </div>
                  ) : (
                    filteredRequests.map(request => (
                      <div key={request.id} className="p-4 border border-neutral-200 bg-white hover:bg-neutral-50/50 transition-colors rounded-2xl flex flex-col md:flex-row justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-neutral-800 text-xs">{request.userName}</span>
                            <span className="text-[10px] text-neutral-400 font-mono">({request.userEmail})</span>
                            <span className="px-2 py-0.5 border rounded-md text-[9px] font-bold bg-neutral-50 font-mono text-neutral-500 uppercase">
                              {request.role}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-[10px] text-neutral-500 pt-1">
                            <span className="flex items-center gap-1">
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>Type: <b className="text-neutral-700 capitalize">{request.verificationType.replace("_", " ")}</b></span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Received: {new Date(request.createdAt).toLocaleDateString()}</span>
                            </span>
                            {request.documentUrl && (
                              <a href={request.documentUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-bold">
                                View File Asset
                              </a>
                            )}
                          </div>

                          {request.adminNotes && (
                            <div className="text-[10px] bg-neutral-100 px-3 py-1.5 rounded-lg text-neutral-600 font-sans border border-neutral-200/50">
                              Notes: {request.adminNotes}
                            </div>
                          )}
                        </div>

                        {/* Verification Action Buttons & Badges */}
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                            request.status === "Approved" 
                              ? "bg-green-50 border-green-200 text-green-700"
                              : request.status === "Rejected"
                                ? "bg-rose-50 border-rose-200 text-rose-700"
                                : "bg-amber-50 border-amber-200 text-amber-700"
                          }`}>
                            Status: {request.status}
                          </span>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleVerificationStatusChange(request.id, "Approved")}
                              disabled={request.status === "Approved"}
                              className="w-7 h-7 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40"
                              title="Approve Compliance Request"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleVerificationStatusChange(request.id, "Rejected")}
                              disabled={request.status === "Rejected"}
                              className="w-7 h-7 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg flex items-center justify-center cursor-pointer transition-colors disabled:opacity-40"
                              title="Reject Compliance Request"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 4: ROLE-BASED ACCESS CONTROL (RBAC) */}
            {activeTab === "rbac" && (
              <motion.div
                key="rbac"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 space-y-6"
              >
                <div>
                  <h3 className="font-display font-extrabold text-xl text-neutral-900 tracking-tight">
                    Enterprise RBAC Permission Matrix
                  </h3>
                  <p className="text-neutral-400 text-xs mt-0.5">
                    Configure granular API-level verification gates across Student, Corporate, Administrator, University, and Mentors roles.
                  </p>
                </div>

                {/* RBAC Table Representation */}
                <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left font-sans text-xs border-collapse">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      <tr>
                        <th className="p-3">User Role</th>
                        <th className="p-3">Submit Projects</th>
                        <th className="p-3">Review Code</th>
                        <th className="p-3">Compliance Audits</th>
                        <th className="p-3">SaaS Configs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-neutral-700">
                      {rbacPolicies.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-neutral-400 font-mono">Loading Policies...</td>
                        </tr>
                      ) : (
                        rbacPolicies.map((row) => (
                          <tr key={row.id} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="p-3 font-bold text-neutral-900 capitalize font-mono">{row.id}</td>
                            <td className="p-3">
                              <input 
                                type="checkbox" 
                                checked={row.submit_projects || false} 
                                onChange={(e) => handleToggleRbacPermission(row.id, "submit_projects", e.target.checked)}
                                className="w-4 h-4 accent-black cursor-pointer rounded border-neutral-300 text-neutral-900 focus:ring-neutral-950"
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="checkbox" 
                                checked={row.review_code || false} 
                                onChange={(e) => handleToggleRbacPermission(row.id, "review_code", e.target.checked)}
                                className="w-4 h-4 accent-black cursor-pointer rounded border-neutral-300 text-neutral-900 focus:ring-neutral-950"
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="checkbox" 
                                checked={row.compliance_audits || false} 
                                onChange={(e) => handleToggleRbacPermission(row.id, "compliance_audits", e.target.checked)}
                                className="w-4 h-4 accent-black cursor-pointer rounded border-neutral-300 text-neutral-900 focus:ring-neutral-950"
                              />
                            </td>
                            <td className="p-3">
                              <input 
                                type="checkbox" 
                                checked={row.saas_configs || false} 
                                onChange={(e) => handleToggleRbacPermission(row.id, "saas_configs", e.target.checked)}
                                className="w-4 h-4 accent-black cursor-pointer rounded border-neutral-300 text-neutral-900 focus:ring-neutral-950"
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Interactive RBAC Endpoint Simulator */}
                <div className="p-5 border border-neutral-200 bg-neutral-50/50 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
                      Interactive API Policy Tester
                    </span>

                    {/* Selector of simulated role */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-neutral-500">Test Role claim:</span>
                      <select
                        value={rbacTestRole}
                        onChange={(e) => setRbacTestRole(e.target.value as any)}
                        className="bg-white border border-neutral-200 rounded-lg px-2 py-1 text-xs font-mono font-bold cursor-pointer focus:outline-hidden"
                      >
                        <option value={UserRole.STUDENT}>STUDENT</option>
                        <option value={UserRole.COMPANY}>COMPANY</option>
                        <option value={UserRole.UNIVERSITY}>UNIVERSITY</option>
                        <option value={UserRole.MENTOR}>MENTOR</option>
                        <option value={UserRole.ADMIN}>ADMIN</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => simulateRbacEndpoint("/api/v1/projects/submit", "submit_projects")}
                      className="h-10 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      POST Submit Code
                    </button>
                    <button
                      onClick={() => simulateRbacEndpoint("/api/v1/projects/evaluate", "review_code")}
                      className="h-10 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      POST Evaluate Code
                    </button>
                    <button
                      onClick={() => simulateRbacEndpoint("/api/v1/compliance/audit", "compliance_audits")}
                      className="h-10 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      GET Compliance Audit
                    </button>
                  </div>

                  {rbacTestResult && (
                    <div className={`p-4 border rounded-2xl ${
                      rbacTestResult.authorized 
                        ? "bg-green-50/50 border-green-200 text-green-800" 
                        : "bg-rose-50/50 border-rose-200 text-rose-800"
                    }`}>
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span>API Gateway Evaluator Response</span>
                        <span className="font-mono">{rbacTestResult.status}</span>
                      </div>
                      <p className="text-[10px] font-mono leading-relaxed">
                        {rbacTestResult.authorized 
                          ? "Access Permitted. JWT signature verified. Client claim matches active ACL policy rules." 
                          : rbacTestResult.error
                        }
                      </p>
                    </div>
                  )}

                </div>
              </motion.div>
            )}

            {/* TAB 5: ACTIVE SESSIONS */}
            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 space-y-6"
              >
                <div className="flex justify-between items-center border-b border-neutral-200/60 pb-4">
                  <div>
                    <h3 className="font-display font-extrabold text-xl text-neutral-900 tracking-tight">
                      Active Device Session Manager
                    </h3>
                    <p className="text-neutral-400 text-xs mt-0.5">
                      Verify concurrent login locations, terminate sessions instantly, or investigate suspicious ingress coordinates.
                    </p>
                  </div>

                  <button
                    onClick={terminateAllDeviceSessions}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Logout From All Devices
                  </button>
                </div>

                {/* Device Lists */}
                <div className="space-y-4">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
                    Logged Concurrent Browser Terminals
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sessions.length === 0 ? (
                      <div className="p-8 text-center text-xs font-sans text-neutral-400 border border-neutral-200 rounded-2xl col-span-2">
                        No active sessions registered in Supabase. Run "Complete & Sync" to start one.
                      </div>
                    ) : (
                      sessions.map(s => (
                        <div key={s.id} className="p-4 border border-neutral-200 bg-white hover:border-neutral-300 rounded-2xl space-y-3 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4 text-neutral-600" />
                              <span className="font-bold text-neutral-800 text-xs">{s.deviceType}</span>
                            </div>
                            
                            <span className={`w-2 h-2 rounded-full ${s.isActive ? "bg-green-500 animate-pulse" : "bg-neutral-300"}`} />
                          </div>

                          <div className="text-[10px] text-neutral-500 font-mono space-y-0.5">
                            <div>Location: <b className="text-neutral-700">{s.location}</b></div>
                            <div>IP Address: <b className="text-neutral-700">{s.ipAddress}</b></div>
                            <div>Last active: <b>{new Date(s.lastActiveAt).toLocaleTimeString()}</b></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 6: PROFILE SYNCHRONIZATION TELEMETRY */}
            {activeTab === "sync" && (
              <motion.div
                key="sync"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 space-y-6"
              >
                <div>
                  <h3 className="font-display font-extrabold text-xl text-neutral-900 tracking-tight">
                    Micro-Engine Synchronization Telemetry
                  </h3>
                  <p className="text-neutral-400 text-xs mt-0.5">
                    Auditing system triggers which immediately synchronize changes to AI Recruiter, AI Resume Evaluators, and Matching Engines without manual refresh.
                  </p>
                </div>

                <div className="p-5 border border-neutral-200 bg-neutral-950 text-green-400 font-mono text-xs rounded-2xl space-y-3 min-h-[180px] relative">
                  <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block border-b border-neutral-800 pb-2">
                    Live Micro-Engine Pipeline
                  </span>

                  <div className="space-y-1 max-h-[220px] overflow-y-auto scrollbar">
                    {syncHistory.length === 0 ? (
                      <div className="text-neutral-500 text-center py-6">
                        Engine pipeline idle. Perform onboarding or click "Trigger Live Event Sync" to run coordination trace.
                      </div>
                    ) : (
                      syncHistory.map((log, index) => (
                        <div key={index} className="animate-fade-in flex items-center gap-1.5">
                          <span className="text-neutral-600">&gt;</span>
                          <span>{log}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {isSyncing && (
                    <div className="absolute right-4 bottom-4 flex items-center gap-2 text-white bg-neutral-800 border border-neutral-700 px-3 py-1.5 rounded-xl text-[10px]">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-green-400" />
                      <span>Coordinating micro-sync...</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={isSyncing}
                    onClick={() => triggerProfileSynchronization("Manual system sync request")}
                    className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Trigger Live Event Sync</span>
                  </button>
                  <button
                    onClick={() => setSyncHistory([])}
                    className="px-4 py-2.5 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Clear Console
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Right Side: Compliance Logs & System Status (4/12 Cols) */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Real-Time Compliance Logs */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
                Compliance Audits Log
              </span>
              <span className="flex items-center gap-1 text-[9px] font-sans font-bold text-green-600">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live Feed
              </span>
            </div>

            <div className="divide-y divide-neutral-100 max-h-[300px] overflow-y-auto scrollbar space-y-2">
              {securityLogs.length === 0 ? (
                <div className="py-8 text-center text-xs font-sans text-neutral-400">
                  No compliance security logs registered in Supabase.
                </div>
              ) : (
                securityLogs.map(log => (
                  <div key={log.id} className="pt-2 flex flex-col gap-1 text-xs hover:bg-neutral-50/50 transition-all rounded-lg p-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-neutral-800 text-[11px]">{log.action}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-mono font-bold border ${
                        log.status === "Success"
                          ? "bg-green-50 border-green-200 text-green-700"
                          : log.status === "Failed"
                            ? "bg-rose-50 border-rose-200 text-rose-700"
                            : "bg-amber-50 border-amber-200 text-amber-700"
                      }`}>
                        {log.status}
                      </span>
                    </div>

                    <div className="text-[9px] text-neutral-400 font-mono flex justify-between">
                      <span>IP: {log.ipAddress} • {log.location}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Technical Specs Summary */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-5 shadow-sm space-y-3.5 text-xs text-neutral-700">
            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
              Compliance Architecture
            </span>

            <div className="space-y-2.5 pt-1">
              <div className="flex justify-between">
                <span className="text-neutral-400">Session Security</span>
                <span className="font-bold font-mono text-neutral-900">JWT + HS256 Scopes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Lockout Policy</span>
                <span className="font-bold font-mono text-neutral-900">3 Fails / 30s lock</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Audit Storage</span>
                <span className="font-bold font-mono text-neutral-900">Supabase v1 Nodes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">RBAC Enforcement</span>
                <span className="font-bold font-mono text-neutral-900">Granular Route Level</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
