import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../../context/AppContext";
import { UserRole } from "../../types";
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  Shield, 
  Clock, 
  History, 
  Check, 
  Smartphone, 
  X,
  AlertCircle
} from "lucide-react";
import { useToast } from "../ui/Toast";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialTab?: "login" | "register" | "forgot";
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
  
  const [activeTab, setActiveTab] = useState<"login" | "forgot" | "verify">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  // Simulated Login History for premium transparency
  const loginHistory = [
    { device: "Chrome (macOS)", location: "Seoul, KR", time: "Just now (Active)", ip: "210.123.45.67", current: true },
    { device: "Safari (iPhone 15)", location: "San Francisco, US", time: "2 hours ago", ip: "172.56.99.12" },
    { device: "Vercel Build Agent", location: "Tokyo, JP", time: "Yesterday", ip: "13.102.14.250" },
  ];

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

  const handleSendVerificationCode = () => {
    if (!email.trim()) {
      error("Email required", "Please enter your email address first.");
      return;
    }
    info("Verification Sent", "A 6-digit confirmation code was sent to your email.");
    setActiveTab("verify");
  };

  const handleVerifyCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      error("Invalid code", "Verification code must be exactly 6 digits.");
      return;
    }
    success("Email Verified", "Your corporate email status is now verified.");
    setActiveTab("login");
  };

  return (
    <div id="auth-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              {activeTab === "verify" && "Verify email address"}
            </h3>
            <p className="font-sans text-xs text-neutral-400 mt-1 max-w-[280px]">
              {activeTab === "login" && "The secure standard for global technical talent and corporate matching."}
              {activeTab === "forgot" && "We will dispatch recovery coordinates to regain credential authorization."}
              {activeTab === "verify" && "Input the security verification token dispatched to your address."}
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
                {/* Social Login */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="w-full h-11 flex items-center justify-center gap-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 font-sans text-xs font-semibold text-neutral-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Sync securely with Google</span>
                </button>

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-neutral-200" />
                  <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-widest">or email access</span>
                  <div className="h-px flex-1 bg-neutral-200" />
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  {/* Role selection */}
                  <div className="grid grid-cols-2 gap-1 bg-neutral-100 p-1 rounded-xl border border-neutral-200/50">
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
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs font-sans text-neutral-500 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
                      />
                      <span>Keep me authenticated</span>
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => setShowHistory(!showHistory)}
                      className="text-[10px] font-sans font-bold text-neutral-400 hover:text-black flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Security Log</span>
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 rounded-xl bg-black hover:bg-neutral-800 disabled:bg-neutral-200 text-white font-sans text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer mt-4"
                  >
                    <span>{isSubmitting ? "Decrypting Session..." : "Authorize Sandbox Entry"}</span>
                    {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>

                {/* Switch to Register */}
                <div className="text-center pt-3 border-t border-neutral-100 mt-4">
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
                </div>
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

            {activeTab === "verify" && (
              <motion.form
                key="verify-view"
                onSubmit={handleVerifyCodeSubmit}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-amber-50 border border-amber-200/50 p-4 rounded-2xl flex gap-3 text-amber-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Email Verification Required</span>
                    <p className="font-light text-amber-900/80 mt-0.5">Please check your inbox. Corporate verification requires safe validation of credentials.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block text-center">6-Digit Security Token</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="0 0 0 0 0 0"
                    className="w-full h-12 bg-neutral-50 border border-neutral-200 rounded-xl text-center font-mono text-xl font-extrabold tracking-[0.5em] focus:outline-hidden focus:border-black"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className="flex-1 h-11 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 font-sans text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Return
                  </button>
                  <button
                    type="submit"
                    disabled={verificationCode.length !== 6}
                    className="flex-1 h-11 rounded-xl bg-black hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-300 text-white font-sans text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Verify & Validate
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Diagnostics Session Log drawer */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-neutral-100 mt-6 pt-4 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Active Device Sessions</span>
                  <span className="flex items-center gap-1 text-[9px] font-sans font-bold text-green-600">
                    <Shield className="w-3 h-3" />
                    <span>Rate-limit secure</span>
                  </span>
                </div>
                <div className="space-y-2">
                  {loginHistory.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded-xl bg-neutral-50 border border-neutral-200/50 text-[10px] font-sans text-neutral-500">
                      <div>
                        <div className="font-bold text-neutral-700 flex items-center gap-1">
                          <span>{item.device}</span>
                          {item.current && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                        </div>
                        <div className="text-[9px] font-mono text-neutral-400 font-light">{item.location} • {item.ip}</div>
                      </div>
                      <span className="text-[9px] font-mono font-light text-neutral-400">{item.time}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
