/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'info',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [isConfirming, setIsConfirming] = React.useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onCancel(); // Close the modal after action completes
    } catch (error) {
      console.error('Error in ConfirmModal handleConfirm:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  // Determine styles and icon based on variant
  let headerBg = 'bg-teal-50 dark:bg-teal-950/25 text-teal-800 dark:text-teal-300 border-teal-100 dark:border-teal-900/40';
  let iconBg = 'bg-teal-100/80 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400';
  let confirmBtnBg = 'bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white';
  let Icon = Info;

  if (variant === 'danger') {
    headerBg = 'bg-rose-50 dark:bg-rose-950/25 text-rose-800 dark:text-rose-300 border-rose-100 dark:border-rose-900/40';
    iconBg = 'bg-rose-100/80 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400';
    confirmBtnBg = 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white';
    Icon = AlertTriangle;
  } else if (variant === 'warning') {
    headerBg = 'bg-amber-50 dark:bg-amber-950/25 text-amber-800 dark:text-amber-300 border-amber-100 dark:border-amber-900/40';
    iconBg = 'bg-amber-100/80 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400';
    confirmBtnBg = 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white';
    Icon = AlertTriangle;
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200/60 dark:border-slate-800/60">
        
        {/* Header */}
        <div className={`p-5 border-b flex items-center gap-3 ${headerBg}`}>
          <div className={`p-2 rounded-xl ${iconBg}`}>
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm">{title}</h3>
          </div>
        </div>

        {/* Message */}
        <div className="p-5">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">{message}</p>
        </div>

        {/* Actions Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950 flex justify-end gap-2.5">
          <button 
            type="button"
            disabled={isConfirming}
            onClick={onCancel}
            className="bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button 
            type="button"
            disabled={isConfirming}
            onClick={handleConfirm}
            className={`font-bold text-xs py-2 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${confirmBtnBg}`}
          >
            {isConfirming ? 'Memproses...' : confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}
