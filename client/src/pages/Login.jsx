import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { useToast } from '../components/ui';

export default function Login() {
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: 'admin@unibill.com', password: 'admin123' });
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form);
      toast.push('Welcome to UniBill!');
      navigate('/');
    } catch (err) {
      toast.push(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-xl font-extrabold">U</div>
          <div className="text-2xl font-extrabold">UniBill</div>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-extrabold leading-tight">GST Billing & Inventory,<br />done the easy way.</h1>
          <p className="mt-4 max-w-md text-slate-300">Fast POS billing, GST-compliant invoices, smart inventory, customer ledgers, and powerful reports — all in one industry-grade platform.</p>
          <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
            {[['⚡', 'Lightning POS'], ['🧾', 'GST Invoices'], ['📦', 'Inventory'], ['📊', 'Live Reports']].map(([e, t]) => (
              <div key={t} className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 backdrop-blur">
                <span className="text-2xl">{e}</span>
                <span className="text-sm font-semibold">{t}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} EzyBill Pro. Industry-grade billing software.</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-600 text-white">E</span>
              EzyBill Pro
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="mt-1 text-sm text-slate-500">{mode === 'login' ? 'Sign in to continue to your dashboard' : 'Set up your billing workspace'}</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" required />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required />
            </div>
            <button className="btn btn-primary w-full py-2.5" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="font-semibold text-brand-600 hover:underline">
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          {mode === 'login' && (
            <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-500">
              <div className="font-semibold text-slate-600">Demo credentials</div>
              <div className="mt-1">Admin: admin@ezybill.com / admin123</div>
              <div>Cashier: cashier@ezybill.com / cashier123</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
