
import React from 'react';
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export type ModalType = 'success' | 'warning' | 'error' | 'info' | 'confirm';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: ModalType;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onConfirm, title, message, type = 'info' }) => {
  if (!isOpen) return null;

  const themes = {
    success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', btn: 'bg-emerald-600 hover:bg-emerald-700' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', btn: 'bg-amber-600 hover:bg-amber-700' },
    error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', btn: 'bg-red-600 hover:bg-red-700' },
    info: { icon: Info, color: 'text-indigo-500', bg: 'bg-indigo-50', btn: 'bg-indigo-600 hover:bg-indigo-700' },
    confirm: { icon: AlertTriangle, color: 'text-indigo-500', bg: 'bg-indigo-50', btn: 'bg-indigo-600 hover:bg-indigo-700' },
  };

  const theme = themes[type];
  const Icon = theme.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100">
        <div className={`p-8 flex flex-col items-center text-center ${theme.bg}`}>
          <div className={`p-4 rounded-full bg-white shadow-sm mb-4 ${theme.color}`}>
            <Icon size={40} strokeWidth={2.5} />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 font-medium leading-relaxed">{message}</p>
        </div>
        
        <div className="p-6 bg-white flex gap-3">
          {type === 'confirm' ? (
            <>
              <button 
                onClick={onClose}
                className="flex-1 px-6 py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all"
              >
                ยกเลิก
              </button>
              <button 
                onClick={() => { onConfirm?.(); onClose(); }}
                className={`flex-1 px-6 py-4 rounded-2xl text-white font-bold shadow-lg transition-all ${theme.btn}`}
              >
                ตกลง
              </button>
            </>
          ) : (
            <button 
              onClick={onClose}
              className={`w-full px-6 py-4 rounded-2xl text-white font-bold shadow-lg transition-all ${theme.btn}`}
            >
              ตกลง
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
