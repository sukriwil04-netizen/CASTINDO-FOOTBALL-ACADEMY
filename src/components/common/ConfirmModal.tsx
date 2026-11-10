import React from 'react';
import { AlertTriangle, Trash2, RotateCcw, X, Loader2 } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Lanjutkan',
  cancelText = 'Batal',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-rose-100 text-rose-700 border-rose-200',
          btnBg: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500 text-white',
          Icon: Trash2,
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100 text-amber-700 border-amber-200',
          btnBg: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 text-white',
          Icon: AlertTriangle,
        };
      case 'primary':
      default:
        return {
          iconBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          btnBg: 'bg-emerald-700 hover:bg-emerald-800 focus:ring-emerald-500 text-white',
          Icon: RotateCcw,
        };
    }
  };

  const { iconBg, btnBg, Icon } = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 text-left relative overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-base font-bold text-gray-900 leading-tight">
              {title}
            </h3>
            <div className="mt-2 text-xs text-gray-600 leading-relaxed">
              {message}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-xs focus:ring-2 focus:ring-offset-1 disabled:opacity-60 ${btnBg}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
