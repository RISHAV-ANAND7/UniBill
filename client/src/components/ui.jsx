import { createContext, useContext, useState, useCallback } from 'react';
import { Icon } from './Icons';

// ---------- Toast ----------
const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 no-print">
        {toasts.map((t) => (
          <div key={t.id} className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg text-white animate-[slidein_.2s_ease] ${t.type === 'error' ? 'bg-red-600' : t.type === 'info' ? 'bg-slate-800' : 'bg-emerald-600'}`}>
            {t.type === 'error' ? <Icon.Alert width={18} /> : <Icon.Check width={18} />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);

// ---------- Modal ----------
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${widths[size]} card max-h-[90vh] overflow-y-auto`}>
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 rounded-t-xl">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <Icon.Close width={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ---------- Confirm ----------
export function ConfirmDialog({ open, onClose, onConfirm, title, message }) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger" onClick={() => { onConfirm(); onClose(); }}>Delete</button>
      </div>
    </Modal>
  );
}

export function StatusBadge({ status }) {
  const map = {
    paid: 'bg-emerald-100 text-emerald-700',
    partial: 'bg-amber-100 text-amber-700',
    unpaid: 'bg-red-100 text-red-700',
  };
  return <span className={`badge ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status?.toUpperCase()}</span>;
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-brand-600" />
    </div>
  );
}

export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 rounded-full bg-slate-100 p-4 text-slate-400">{icon}</div>
      <h3 className="font-semibold text-slate-700">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
