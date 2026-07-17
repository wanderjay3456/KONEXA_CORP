import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../../context/AppContext";
import { UserRole } from "../../types";
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  X
} from "lucide-react";
import { useToast } from "../ui/Toast";
import { updatePassword } from "../../lib/supabaseAuth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialTab?: "login" | "register" | "forgot" | "recovery";
  onSwitchToRegister: (role: UserRole) => void;
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialTab = "login",
  onSwitchToRegister 
}: AuthModalProps) {
  const { loginUser, googleLogin, resetPassword } = useApp();
  const { success, info, error } = useToast();
  
  const recoveryLink = typeof window !== "undefined" && (window.location.hash.includes("type=recovery") || window.location.search.includes("type=recovery"));
  const [activeTab, setActiveTab] = useState<"login" | "forgot" | "recovery">(recoveryLink ? "recovery" : initialTab === "forgot" ? "forgot" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      error("Missing fields", "Please enter both your email and password.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await loginUser(email, role, password);
      setIsSubmitting(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      error("Authentication Failed", err.message || "Unknown credentials error");
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      error("Email required", "Please enter your email to receive recovery instructions.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setIsSubmitting(false);
      setActiveTab("login");
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8 || password !== confirmPassword) {
      error("Invalid password", "Use at least 8 characters and make sure both passwords match.");
      return;
    }
    setIsSubmitting(true);
    try {
      await updatePassword(password);
      success("Password updated", "Your new password is active. You can continue securely.");
      window.history.replaceState({}, document.title, window.location.pathname);
      setActiveTab("login");
    } catch (err: any) {
      error("Password update failed", err.message || "The recovery link may have expired.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleGoogleLogin = async () => {
    info("Connecting Google Account...", "Initiating Google Secure Single-Sign-On handshake.");
    setIsSubmitting(true);
    try {
      await googleLogin(role);
      setIsSubmitting(false);
      onSuccess();
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      // error is already shown by googleLogin function
    }
  };

  return (
    <div id="auth-modal-overlay" data-auto-translate className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay with premium blur */}
      <motion.div 
        className="absolute inset-0 bg-neutral-950/45 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div 
        className="bg-white rounded-3xl border border-neutral-200/80 w-full max-w-md overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-1.5 rounded-full hover:bg-neutral-50 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content Wrapper */}
        <div className="p-8 overflow-y-auto scrollbar">
          {/* Top Logo */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center mb-3 shadow-md">
              <span className="font-display font-black text-white text-base">K</span>
            </div>
            <h3 className="font-display font-extrabold text-xl text-neutral-900 tracking-tight">
              {activeTab === "login" && "Welcome back to KONEXA"}
              {activeTab === "forgot" && "Reset your password"}
              {activeTab === "recovery" && "Choose a new password"}
            </h3>
            <p className="font-sans text-xs text-neutral-400 mt-1 max-w-[280px]">
              {activeTab === "login" && "The secure standard for global technical talent and corporate matching."}
              {activeTab === "forgot" && "We will email you a secure recovery link."}
              {activeTab === "recovery" && "Set a new password for your verified KONEXA account."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "login" && (
              <motion.div
                key="login-view"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {role !== UserRole.ADMIN ? (
                  <>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
                      Google 계정 또는 이메일·비밀번호로 로그인할 수 있습니다.
                    </div>
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isSubmitting}
                      className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-800 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-neutral-200 font-black text-blue-600">G</span>
                      <span>Google로 로그인</span>
                    </button>
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-neutral-300">
                      <span className="h-px flex-1 bg-neutral-200" />
                      <span>또는 이메일</span>
                      <span className="h-px flex-1 bg-neutral-200" />
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-900">
                    관리자 계정은 사전에 승인된 이메일과 비밀번호로만 로그인할 수 있습니다.
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  {/* Role selection */}
                  <div className="grid grid-cols-3 gap-1 bg-neutral-100 p-1 rounded-xl border border-neutral-200/50">
                    <button
                      type="button"
                      onClick={() => setRole(UserRole.STUDENT)}
                      className={`py-1.5 rounded-lg text-[11px] font-sans font-bold transition-all cursor-pointer ${
                        role === UserRole.STUDENT 
                          ? "bg-white text-neutral-900 shadow-sm" 
                          : "text-neutral-500 hover:text-neutral-900"
                      }`}
                    >
                      Student Portal
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole(UserRole.COMPANY)}
                      className={`py-1.5 rounded-lg text-[11px] font-sans font-bold transition-all cursor-pointer ${
                        role === UserRole.COMPANY 
                          ? "bg-white text-neutral-900 shadow-sm" 
                          : "text-neutral-500 hover:text-neutral-900"
                      }`}
                    >
                      Company Partner
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole(UserRole.ADMIN)}
                      className={`py-1.5 rounded-lg text-[11px] font-sans font-bold transition-all cursor-pointer ${
                        role === UserRole.ADMIN
                          ? "bg-white text-neutral-900 shadow-sm"
                          : "text-neutral-500 hover:text-neutral-900"
                      }`}
                    >
                      Admin
                    </button>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Corporate / University Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@university.edu or partner@company.com"
                        className="w-full h-11 pl-10 pr-4 bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200/80 rounded-xl text-xs font-sans focus:outline-hidden focus:border-black transition-colors"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Access Password</label>
                      <button
                        type="button"
                        onClick={() => setActiveTab("forgot")}
                        className="text-[10px] font-sans font-semibold text-neutral-400 hover:text-black transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter secure account password"
                        className="w-full h-11 pl-10 pr-4 bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200/80 rounded-xl text-xs font-sans focus:outline-hidden focus:border-black transition-colors"
                      />
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center pt-1">
                    <label className="flex items-center gap-2 text-xs font-sans text-neutral-500 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
                      />
                      <span>Keep me authenticated</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 rounded-xl bg-black hover:bg-neutral-800 disabled:bg-neutral-200 text-white font-sans text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer mt-4"
                  >
                    <span>{isSubmitting ? "Signing in..." : "Sign in securely"}</span>
                    {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>

                {/* Switch to Register */}
                {role !== UserRole.ADMIN && <div className="text-center pt-3 border-t border-neutral-100 mt-4">
                  <span className="text-xs text-neutral-400">First time here? </span>
                  <button
                    onClick={() => {
                      onClose();
                      onSwitchToRegister(role);
                    }}
                    className="text-xs font-sans font-bold text-neutral-900 hover:underline transition-all cursor-pointer"
                  >
                    Join {role === UserRole.STUDENT ? "as Student" : "as Corporate Partner"}
                  </button>
                </div>}
              </motion.div>
            )}

            {activeTab === "forgot" && (
              <motion.form
                key="forgot-view"
                onSubmit={handleForgotSubmit}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Registered Account Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@university.edu"
                      className="w-full h-11 pl-10 pr-4 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-sans focus:outline-hidden focus:border-black"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className="flex-1 h-11 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 font-sans text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-11 rounded-xl bg-black hover:bg-neutral-800 disabled:bg-neutral-200 text-white font-sans text-xs font-semibold cursor-pointer transition-colors"
                  >
                    {isSubmitting ? "Dispatching..." : "Send Reset Token"}
                  </button>
                </div>
              </motion.form>
            )}

            {activeTab === "recovery" && (
              <motion.form
                key="recovery-view"
                onSubmit={handleRecoverySubmit}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">New Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} autoComplete="new-password" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-hidden focus:border-black" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Confirm New Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} autoComplete="new-password" className="w-full h-11 px-4 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-hidden focus:border-black" />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full h-11 rounded-xl bg-black disabled:bg-neutral-200 text-white text-xs font-semibold">
                  {isSubmitting ? "Updating..." : "Update Password"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </div>
  );
}
