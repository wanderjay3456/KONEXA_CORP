import React, { useState } from "react";
import { motion } from "motion/react";
import { useApp } from "../../context/AppContext";
import { StudentProfile, UserRole } from "../../types";
import { 
  User, 
  Shield, 
  Eye, 
  Bell, 
  GraduationCap, 
  Settings, 
  LogOut, 
  Trash2, 
  Lock, 
  Key, 
  Database, 
  CheckCircle,
  Globe,
  Clock,
  AlertTriangle,
  RefreshCw,
  FileCheck2
} from "lucide-react";
import { useToast } from "../ui/Toast";

export default function ProfileSettingsView() {
  const { studentProfile, updateStudentProfile, companyProfile, updateCompanyProfile, logoutUser } = useApp();
  const { success, error, info } = useToast();
  
  const [activeSubTab, setActiveSubTab] = useState<"profile" | "security" | "privacy" | "notifications" | "languages" | "account">("profile");
  const [isSaving, setIsSaving] = useState(false);
  
  // Student Profile Data State
  const [studentForm, setStudentForm] = useState<Partial<StudentProfile>>({
    name: studentProfile?.name || "",
    preferredName: studentProfile?.preferredName || "",
    nationality: studentProfile?.nationality || "South Korea",
    currentCountry: studentProfile?.currentCountry || "South Korea",
    university: studentProfile?.university || "",
    degree: studentProfile?.degree || "",
    major: studentProfile?.major || "",
    graduationYear: studentProfile?.graduationYear || "",
    studentId: studentProfile?.studentId || "",
    languages: studentProfile?.languages || [],
    englishLevel: studentProfile?.englishLevel || "",
    koreanLevel: studentProfile?.koreanLevel || "",
    skills: studentProfile?.skills || [],
    github: studentProfile?.github || "",
    portfolio: studentProfile?.portfolio || "",
    linkedin: studentProfile?.linkedin || "",
    resumeUrl: studentProfile?.resumeUrl || "",
    timezone: studentProfile?.timezone || "GMT+9 (Seoul)",
    bio: studentProfile?.bio || "",
    emergencyContact: studentProfile?.emergencyContact || "",
    notificationPreferences: studentProfile?.notificationPreferences || { email: true, push: true, marketing: false },
    privacySettings: studentProfile?.privacySettings || { publicProfile: true, showResume: true }
  });

  const handleSaveStudent = async () => {
    setIsSaving(true);
    try {
      await updateStudentProfile(studentForm as any);
      
      success("프로필 저장 완료", "Supabase 프로필 정보가 업데이트되었습니다.");
    } catch (err: any) {
      error("Synchronization Failed", err.message || "Failed to sync updates.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto font-sans p-6 text-black">
      
      {/* Sidebar Selector (3/12 Columns) */}
      <div className="lg:col-span-3 space-y-2">
        <div className="p-4 border border-neutral-200 rounded-2xl bg-white shadow-xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Settings System</span>
          <h3 className="font-display font-bold text-base text-neutral-800">Control Panel</h3>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => setActiveSubTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeSubTab === "profile" 
                ? "bg-black text-white shadow-xs" 
                : "text-neutral-500 hover:text-black hover:bg-neutral-100"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Identity</span>
          </button>

          <button
            onClick={() => setActiveSubTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeSubTab === "security" 
                ? "bg-black text-white shadow-xs" 
                : "text-neutral-500 hover:text-black hover:bg-neutral-100"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Security & API Keys</span>
          </button>

          <button
            onClick={() => setActiveSubTab("privacy")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeSubTab === "privacy" 
                ? "bg-black text-white shadow-xs" 
                : "text-neutral-500 hover:text-black hover:bg-neutral-100"
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Privacy Controls</span>
          </button>

          <button
            onClick={() => setActiveSubTab("notifications")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeSubTab === "notifications" 
                ? "bg-black text-white shadow-xs" 
                : "text-neutral-500 hover:text-black hover:bg-neutral-100"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>

          <button
            onClick={() => setActiveSubTab("languages")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeSubTab === "languages" 
                ? "bg-black text-white shadow-xs" 
                : "text-neutral-500 hover:text-black hover:bg-neutral-100"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Languages & Academics</span>
          </button>

          <button
            onClick={() => setActiveSubTab("account")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeSubTab === "account" 
                ? "bg-black text-white shadow-xs" 
                : "text-neutral-500 hover:text-black hover:bg-neutral-100"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Account Actions</span>
          </button>
        </div>
      </div>

      {/* Main Form Area (9/12 Columns) */}
      <div className="lg:col-span-9 bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm space-y-6">
        
        {/* TAB 1: BASIC PROFILE */}
        {activeSubTab === "profile" && (
          <div className="space-y-6">
            <div className="border-b border-neutral-100 pb-4">
              <h4 className="font-display font-bold text-lg text-neutral-900">Profile Identity Anchors</h4>
              <p className="text-neutral-400 text-xs mt-0.5">Maintain basic personal details, country location coordinates, and timezone alignments.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-600">Full Legal Name</label>
                <input
                  type="text"
                  value={studentForm.name || ""}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-600">Preferred Name / Alias</label>
                <input
                  type="text"
                  value={studentForm.preferredName || ""}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, preferredName: e.target.value }))}
                  className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden focus:border-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-600">Nationality</label>
                <input
                  type="text"
                  value={studentForm.nationality || ""}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, nationality: e.target.value }))}
                  className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-600">Current Country</label>
                <input
                  type="text"
                  value={studentForm.currentCountry || ""}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, currentCountry: e.target.value }))}
                  className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-600">Time Zone Standard</label>
                <input
                  type="text"
                  value={studentForm.timezone || ""}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-600">Emergency Contact</label>
              <input
                type="text"
                value={studentForm.emergencyContact || ""}
                onChange={(e) => setStudentForm(prev => ({ ...prev, emergencyContact: e.target.value }))}
                placeholder="Name (Relationship) / Phone"
                className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-600">Self Pitch biography</label>
              <textarea
                value={studentForm.bio || ""}
                onChange={(e) => setStudentForm(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-xs font-sans focus:outline-hidden focus:border-black"
              />
            </div>

            <div className="pt-4 border-t border-neutral-100 flex justify-end">
              <button
                onClick={handleSaveStudent}
                disabled={isSaving}
                className="px-6 h-11 rounded-xl bg-black hover:bg-neutral-800 text-white font-sans text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                {isSaving ? "Synchronizing Engines..." : "Save Identity Settings"}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SECURITY */}
        {activeSubTab === "security" && (
          <div className="space-y-6">
            <div className="border-b border-neutral-100 pb-4">
              <h4 className="font-display font-bold text-lg text-neutral-900">Account Security</h4>
              <p className="text-neutral-400 text-xs mt-0.5">KONEXA never exposes service API keys or fabricated activity records in your browser.</p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-xs leading-6 text-emerald-900">
              <div className="flex items-center gap-2 font-bold"><Shield className="h-4 w-4" />Supabase authenticated session</div>
              <p className="mt-2 text-emerald-800">Password changes use a verified recovery email. Sign out below if this is a shared device.</p>
            </div>
          </div>
        )}

        {/* TAB 3: PRIVACY */}
        {activeSubTab === "privacy" && (
          <div className="space-y-6">
            <div className="border-b border-neutral-100 pb-4">
              <h4 className="font-display font-bold text-lg text-neutral-900">Privacy & Document Lock Controls</h4>
              <p className="text-neutral-400 text-xs mt-0.5">Govern how your verification files and resume profiles are cataloged by recruiter searches.</p>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-4 p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer bg-neutral-50/50">
                <input
                  type="checkbox"
                  checked={studentForm.privacySettings?.publicProfile}
                  onChange={(e) => setStudentForm(prev => ({ 
                    ...prev, 
                    privacySettings: { ...prev.privacySettings!, publicProfile: e.target.checked } 
                  }))}
                  className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer mt-1"
                />
                <div className="text-xs">
                  <span className="font-bold text-neutral-800 block">Public Sourcing Search Indexing</span>
                  <p className="text-neutral-400 mt-0.5">Let company hiring managers locate your profile based on academic major match percentages.</p>
                </div>
              </label>

              <label className="flex items-start gap-4 p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer bg-neutral-50/50">
                <input
                  type="checkbox"
                  checked={studentForm.privacySettings?.showResume}
                  onChange={(e) => setStudentForm(prev => ({ 
                    ...prev, 
                    privacySettings: { ...prev.privacySettings!, showResume: e.target.checked } 
                  }))}
                  className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer mt-1"
                />
                <div className="text-xs">
                  <span className="font-bold text-neutral-800 block">Open Sponsor Resume Lock</span>
                  <p className="text-neutral-400 mt-0.5">Allow corporate challenge hosts to instantly download your attached verification files.</p>
                </div>
              </label>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 text-xs text-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-amber-950">Anonymous Safety Guarantee</span>
                  <p className="leading-relaxed font-light text-amber-900">KONEXA will never leak, trade, or distribute your sandbox code repositories to unapproved corporate brokers.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 flex justify-end">
              <button
                onClick={handleSaveStudent}
                className="px-6 h-11 rounded-xl bg-black hover:bg-neutral-800 text-white font-sans text-xs font-bold transition-all cursor-pointer"
              >
                Save Privacy Settings
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: NOTIFICATIONS */}
        {activeSubTab === "notifications" && (
          <div className="space-y-6">
            <div className="border-b border-neutral-100 pb-4">
              <h4 className="font-display font-bold text-lg text-neutral-900">Notification Channels & Prefs</h4>
              <p className="text-neutral-400 text-xs mt-0.5">Select preferred alert intervals for new matching challenges, vector updates, and system pings.</p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 cursor-pointer">
                <div className="text-xs">
                  <span className="font-bold text-neutral-800 block">Email Digest Summary Notifications</span>
                  <p className="text-neutral-400 mt-0.5">Weekly summaries of matched corporate sponsors and escrow deposits.</p>
                </div>
                <input
                  type="checkbox"
                  checked={studentForm.notificationPreferences?.email}
                  onChange={(e) => setStudentForm(prev => ({
                    ...prev,
                    notificationPreferences: { ...prev.notificationPreferences!, email: e.target.checked }
                  }))}
                  className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 cursor-pointer">
                <div className="text-xs">
                  <span className="font-bold text-neutral-800 block">Real-time Push Alerts & Pings</span>
                  <p className="text-neutral-400 mt-0.5">Receive browser notifications immediately when a sandbox review is processed by Gemini.</p>
                </div>
                <input
                  type="checkbox"
                  checked={studentForm.notificationPreferences?.push}
                  onChange={(e) => setStudentForm(prev => ({
                    ...prev,
                    notificationPreferences: { ...prev.notificationPreferences!, push: e.target.checked }
                  }))}
                  className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 cursor-pointer">
                <div className="text-xs">
                  <span className="font-bold text-neutral-800 block">Marketing & Platform updates</span>
                  <p className="text-neutral-400 mt-0.5">Occasional system announcements and hiring challenge highlights.</p>
                </div>
                <input
                  type="checkbox"
                  checked={studentForm.notificationPreferences?.marketing}
                  onChange={(e) => setStudentForm(prev => ({
                    ...prev,
                    notificationPreferences: { ...prev.notificationPreferences!, marketing: e.target.checked }
                  }))}
                  className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
                />
              </label>
            </div>

            <div className="pt-4 border-t border-neutral-100 flex justify-end">
              <button
                onClick={handleSaveStudent}
                className="px-6 h-11 rounded-xl bg-black hover:bg-neutral-800 text-white font-sans text-xs font-bold transition-all cursor-pointer"
              >
                Save Notification Prefs
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: LANGUAGES & ACADEMICS */}
        {activeSubTab === "languages" && (
          <div className="space-y-6">
            <div className="border-b border-neutral-100 pb-4">
              <h4 className="font-display font-bold text-lg text-neutral-900">Language & Academic Credentials</h4>
              <p className="text-neutral-400 text-xs mt-0.5">Verify language fluency levels, current academic degree status, and university anchors.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-600">English Fluency Level</label>
                <select
                  value={studentForm.englishLevel || "Fluent"}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, englishLevel: e.target.value }))}
                  className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-3 text-xs text-neutral-700"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Fluent">Fluent</option>
                  <option value="Native">Native</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-600">Korean Fluency Level</label>
                <select
                  value={studentForm.koreanLevel || "Fluent"}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, koreanLevel: e.target.value }))}
                  className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-3 text-xs text-neutral-700"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Fluent">Fluent</option>
                  <option value="Native">Native</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-neutral-100 pt-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-600">University Institution</label>
                <input
                  type="text"
                  value={studentForm.university || ""}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, university: e.target.value }))}
                  className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-600">Specialization Major</label>
                <input
                  type="text"
                  value={studentForm.major || ""}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, major: e.target.value }))}
                  className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-600">Target Graduation Year</label>
                <input
                  type="text"
                  value={studentForm.graduationYear || ""}
                  onChange={(e) => setStudentForm(prev => ({ ...prev, graduationYear: e.target.value }))}
                  className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 flex justify-end">
              <button
                onClick={handleSaveStudent}
                className="px-6 h-11 rounded-xl bg-black hover:bg-neutral-800 text-white font-sans text-xs font-bold transition-all cursor-pointer"
              >
                Save Language & Academic Settings
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: ACCOUNT ACTIONS */}
        {activeSubTab === "account" && (
          <div className="space-y-6">
            <div className="border-b border-neutral-100 pb-4">
              <h4 className="font-display font-bold text-lg text-neutral-900">Account Actions</h4>
              <p className="text-neutral-400 text-xs mt-0.5">Manage this authenticated session and account requests.</p>
            </div>

            <div className="space-y-4">
              {/* Logout Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-neutral-200 rounded-2xl gap-4">
                <div className="text-xs">
                  <span className="font-bold text-neutral-800 block">Terminate Active Session</span>
                  <p className="text-neutral-400 mt-0.5">Securely end the current browser session.</p>
                </div>
                <button
                  onClick={() => {
                    logoutUser();
                    success("Logged Out", "Active terminal session ended securely.");
                  }}
                  className="px-4 h-10 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Secure Sign-Out</span>
                </button>
              </div>

              {/* Reset Account Data */}
              <div className="p-4 border border-rose-200 bg-rose-50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-rose-800">
                <div className="text-xs">
                  <span className="font-bold block text-rose-950">Request account deletion</span>
                  <p className="leading-relaxed font-light text-rose-900 mt-0.5">Automated deletion is not enabled yet. Contact KONEXA support so identity and settlement records can be handled safely.</p>
                </div>
                <button
                  onClick={() => info("Deletion request", "Please contact KONEXA support from your registered email. No account data was deleted.")}
                  className="px-4 h-10 bg-white border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>View instructions</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
