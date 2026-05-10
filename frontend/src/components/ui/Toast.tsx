'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { X } from 'lucide-react';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastContextType {
  show: (message: string, action?: ToastAction) => void;
  dismiss: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; action?: ToastAction } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => setToast(null), 150);
  }, []);

  const show = useCallback((message: string, action?: ToastAction) => {
    setToast({ message, action });
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(dismiss, 8000);
      return () => clearTimeout(timer);
    }
  }, [toast, dismiss]);

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      {toast && (
        <div 
          className={`fixed bottom-6 left-6 z-[9999] bg-[#131318] border border-[#1E1E26] p-4 flex items-center gap-4 min-w-[300px] transition-all duration-150 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
          style={{ borderRadius: '2px' }}
        >
          <div className="flex-1 font-mono text-[12px] text-[#F0EEE9]">
            {toast.message}
          </div>
          
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                dismiss();
              }}
              className="bg-[#00D4FF] text-[#0C0C0F] px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider hover:bg-[#00D4FF]/90 transition-colors"
              style={{ borderRadius: '1px' }}
            >
              {toast.action.label}
            </button>
          )}

          <button 
            onClick={dismiss}
            className="text-[#6B6A72] hover:text-[#F0EEE9] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
