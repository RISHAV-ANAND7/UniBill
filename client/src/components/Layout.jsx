import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from './Icons';
import { useAuth } from '../auth';

const nav = [
  { to: '/', label: 'Dashboard', icon: Icon.Dashboard, end: true },
  { to: '/pos', label: 'New Sale (POS)', icon: Icon.POS },
  { to: '/invoices', label: 'Invoices', icon: Icon.Invoice },
  { to: '/products', label: 'Products', icon: Icon.Box },
  { to: '/customers', label: 'Customers', icon: Icon.Users },
  { to: '/reports', label: 'Reports & GST', icon: Icon.Chart },
  { to: '/settings', label: 'Settings', icon: Icon.Settings },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white font-extrabold">U</div>
        <div>
          <div className="text-base font-extrabold tracking-tight text-white">UniBill</div>
          <div className="text-[10px] font-medium uppercase tracking-widest text-slate-400">GST Billing Suite</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <n.icon width={18} />
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-500/20 text-sm font-bold text-brand-300">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{user?.name}</div>
            <div className="text-xs capitalize text-slate-400">{user?.role}</div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400" title="Logout">
            <Icon.Logout width={18} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col bg-slate-900 lg:flex no-print fixed inset-y-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden no-print">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-slate-900">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur lg:px-8 no-print">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)}>
            <Icon.Menu />
          </button>
          <div className="hidden text-sm font-medium text-slate-500 lg:block">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <button onClick={() => navigate('/pos')} className="btn btn-primary">
            <Icon.Plus width={16} /> New Sale
          </button>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
