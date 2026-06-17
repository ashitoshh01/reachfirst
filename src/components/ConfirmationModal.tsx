import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-bg/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-elevated rounded-xl max-w-md w-full p-6 text-text-primary shadow-2xl border border-border animate-fade-in-up">
        <h2 className="text-xl font-semibold mb-3">{title}</h2>
        <p className="text-text-secondary mb-8">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-full font-medium text-primary hover:bg-white/5 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 rounded-full font-medium transition-colors ${
              isDestructive
                ? 'bg-error hover:bg-error/90 text-white'
                : 'bg-primary hover:bg-primary-hover text-on-primary'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
