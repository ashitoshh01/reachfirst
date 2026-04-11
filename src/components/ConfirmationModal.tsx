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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#202c33] rounded-lg max-w-md w-full p-6 text-[#e9edef] shadow-2xl animate-fade-in-up">
        <h2 className="text-xl font-semibold mb-3">{title}</h2>
        <p className="text-[#8696a0] mb-8">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-full font-medium text-[#00a884] hover:bg-white/5 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 rounded-full font-medium text-[#111b21] transition-colors ${
              isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-[#00a884] hover:bg-[#008f6f]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}