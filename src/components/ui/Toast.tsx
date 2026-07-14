import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, CheckCircle2, Info, X, XCircle } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  description?: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, description?: string, type?: ToastType) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, description?: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, description, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((message: string, description?: string) => {
    toast(message, description, "success");
  }, [toast]);

  const error = useCallback((message: string, description?: string) => {
    toast(message, description, "error");
  }, [toast]);

  const info = useCallback((message: string, description?: string) => {
    toast(message, description, "info");
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      
      {/* Toast Render Portal */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((item) => {
            let Icon = Info;
            let bgColor = "bg-white";
            let borderColor = "border-neutral-200/80";
            let iconColor = "text-neutral-500";
            
            switch (item.type) {
              case "success":
                Icon = CheckCircle2;
                bgColor = "bg-white";
                borderColor = "border-teal-100";
                iconColor = "text-teal-500";
                break;
              case "error":
                Icon = XCircle;
                bgColor = "bg-white";
                borderColor = "border-rose-100";
                iconColor = "text-rose-500";
                break;
              case "warning":
                Icon = AlertCircle;
                bgColor = "bg-white";
                borderColor = "border-amber-100";
                iconColor = "text-amber-500";
                break;
            }

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                className={`p-4 rounded-xl border ${borderColor} ${bgColor} shadow-premium pointer-events-auto flex gap-3 items-start overflow-hidden relative`}
              >
                {/* Visual Accent bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  item.type === "success" ? "bg-teal-500" :
                  item.type === "error" ? "bg-rose-500" :
                  item.type === "warning" ? "bg-amber-500" : "bg-neutral-400"
                }`} />

                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
                
                <div className="flex-1 space-y-1">
                  <h4 className="font-sans font-medium text-sm text-neutral-900 leading-none">
                    {item.message}
                  </h4>
                  {item.description && (
                    <p className="font-sans text-xs text-neutral-500 leading-normal">
                      {item.description}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => removeToast(item.id)}
                  className="text-neutral-400 hover:text-neutral-600 rounded-lg p-0.5 hover:bg-neutral-50 transition-all shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
