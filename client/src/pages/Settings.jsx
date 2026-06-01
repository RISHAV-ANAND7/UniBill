import { useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../components/ui';
import { useAuth } from '../auth';

export default function Settings() {
  const toast = useToast();
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get('/company').then(setCompany);
    api.get('/auth/users').then(setUsers).catch(() => {});
  }, []);

  const save = async () => {
    await api.put('/company', company);
    toast.push('Settings saved');
  };

  if (!company) return null;

  const field = (key, label, type = 'text') => (
    <div>
      <label className="label">{label}</label>
      {type === 'textarea'
        ? <textarea className="input" rows={2} value={company[key] || ''} onChange={(e) => setCompany({ ...company, [key]: e.target.value })} />
        : <input type={type} className="input" value={company[key] || ''} onChange={(e) => setCompany({ ...company, [key]: e.target.value })} />}
    </div>
  );

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Configure your company & invoice details</p>
      </div>

      <div className="card p-6 space-y-5">
        <h2 className="font-bold text-slate-800">Company Profile</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field('name', 'Company Name')}
          {field('gstin', 'GSTIN')}
          {field('phone', 'Phone')}
          {field('email', 'Email')}
          {field('state', 'State')}
          {field('state_code', 'State Code')}
          <div className="sm:col-span-2">{field('address', 'Address', 'textarea')}</div>
        </div>
      </div>

      <div className="card p-6 space-y-5">
        <h2 className="font-bold text-slate-800">Invoice & Banking</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field('invoice_prefix', 'Invoice Prefix')}
          {field('currency', 'Currency Symbol')}
          {field('bank_name', 'Bank Name')}
          {field('bank_account', 'Account Number')}
          {field('bank_ifsc', 'IFSC Code')}
          <div className="sm:col-span-2">{field('terms', 'Terms & Conditions', 'textarea')}</div>
        </div>
        <div className="flex justify-end"><button onClick={save} className="btn btn-primary">Save Settings</button></div>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 font-bold text-slate-800">Team Members</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50"><tr><th className="th">Name</th><th className="th">Email</th><th className="th">Role</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="td font-semibold">{u.name} {u.id === user?.id && <span className="text-xs text-brand-600">(you)</span>}</td>
                  <td className="td text-slate-500">{u.email}</td>
                  <td className="td"><span className="badge bg-brand-50 text-brand-600 capitalize">{u.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
