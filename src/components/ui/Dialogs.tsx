import React, { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="bg-white rounded-2xl border border-neutral-200/80 w-full max-w-lg shadow-2xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="font-display font-medium text-lg text-neutral-900 leading-none">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-600 rounded-lg p-1 hover:bg-neutral-50 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Scrollable */}
            <div className="p-6 overflow-y-auto flex-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/30 backdrop-blur-xs"
          />

          {/* Drawer Card */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="bg-white w-full max-w-md h-full shadow-2xl relative z-10 flex flex-col border-l border-neutral-200/80"
          >
            {/* Header */}
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="font-display font-medium text-lg text-neutral-900 leading-none">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-600 rounded-lg p-1 hover:bg-neutral-50 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Scrollable */}
            <div className="p-6 overflow-y-auto flex-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
