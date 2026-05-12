/**
 * Toast - Notificaciones de confirmación
 */

'use client';

import { useEffect } from 'react';

interface ToastProps {
  isVisible: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({
  isVisible,
  type,
  title,
  message,
  onClose,
  duration = 5000,
}: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const styles = {
    success: {
      bg: 'bg-success',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    error: {
      bg: 'bg-danger',
      icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    info: {
      bg: 'bg-corporate-primary',
      icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  };

  const style = styles[type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`${style.bg} text-white rounded-lg shadow-2xl p-4 min-w-[320px] max-w-md`}>
        <div className="flex items-start space-x-3">
          <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.icon} />
          </svg>
          
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            {message && <p className="text-sm opacity-90">{message}</p>}
          </div>
          
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
