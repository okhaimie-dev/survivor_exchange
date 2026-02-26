"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  // Convenience methods
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 5000; // 5 seconds
const MAX_TOASTS = 5;

function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function ToastIcon({ type }: { type: ToastType }) {
  switch (type) {
    case "success":
      return (
        <svg
          className="w-5 h-5 text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      );
    case "error":
      return (
        <svg
          className="w-5 h-5 text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      );
    case "warning":
      return (
        <svg
          className="w-5 h-5 text-yellow-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      );
    case "info":
    default:
      return (
        <svg
          className="w-5 h-5 text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
  }
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration === 0) return; // Don't auto-dismiss if duration is 0

    const duration = toast.duration ?? DEFAULT_DURATION;
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 300); // Start exit animation 300ms before removal

    const removeTimer = setTimeout(() => {
      onRemove(toast.id);
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.id, toast.duration, onRemove]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [toast.id, onRemove]);

  const bgColor = {
    success: "bg-green-900/90 border-green-700",
    error: "bg-red-900/90 border-red-700",
    warning: "bg-yellow-900/90 border-yellow-700",
    info: "bg-blue-900/90 border-blue-700",
  }[toast.type];

  return (
    <div
      role="alert"
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm
        ${bgColor}
        transition-all duration-300 ease-in-out
        ${isExiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"}
      `}
    >
      <div className="flex-shrink-0 mt-0.5">
        <ToastIcon type={toast.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{toast.title}</p>
        {toast.message && (
          <p className="mt-1 text-sm text-gray-300">{toast.message}</p>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-2 text-sm font-medium text-white underline hover:text-gray-200"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
        aria-label="Dismiss notification"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const addToast = useCallback((toast: Omit<Toast, "id">): string => {
    const id = generateId();
    setToasts((prev) => {
      // Keep only the most recent toasts up to MAX_TOASTS
      const newToasts = [...prev, { ...toast, id }];
      if (newToasts.length > MAX_TOASTS) {
        return newToasts.slice(-MAX_TOASTS);
      }
      return newToasts;
    });
    return id;
  }, []);

  const success = useCallback(
    (title: string, message?: string): string => {
      return addToast({ type: "success", title, message });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string): string => {
      return addToast({ type: "error", title, message, duration: 8000 }); // Errors stay longer
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string): string => {
      return addToast({ type: "warning", title, message });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string): string => {
      return addToast({ type: "info", title, message });
    },
    [addToast]
  );

  const contextValue = useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
      clearAllToasts,
      success,
      error,
      warning,
      info,
    }),
    [toasts, addToast, removeToast, clearAllToasts, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
