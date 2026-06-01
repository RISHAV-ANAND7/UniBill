import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmt } from '../api';
import { Icon } from '../components/Icons';
import { Modal, ConfirmDialog, EmptyState, useToast } from '../components/ui';

const blank = { name: '', phone: '', email: '', gstin: '', address: '', state: 'Karnataka', state_code: '29', opening_balance: 0 };

export default function Customers() {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [del, setDel] = useState(null);
  const [view, setView] = useState(null);

  const load = () => api.get('/customers', { search }).then(setCustomers);
  useEffect(() => { load(); }, [search]);

  const save = async () => {
    if (!form.name) return toast.push('Name required', 'error');
    if (form.id) await api.put(`/customers/${form.id}`, form);
    else await api.post('/customers', form);
    toast.push('Customer saved'); setModal(false); load();
  };
  const remove = async () => { await api.del(`/customers/${del}`); toast.push('Customer deleted', 'info'); load(); };
  const openView = async (id) => setView(await api.get(`/customers/${id}`));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500">{customers.length} customers</p>
        </div>
        <button onClick={() => { setForm(blank); setModal(true); }} className="btn btn-primary"><Icon.Plus width={16} /> Add Customer</button>
      </div>

      <div className="card p-4">
        <div className="relative max-w-md">
          <Icon.Search width={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search name, phone, GSTIN" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden">
        {customers.length === 0 ? (
          <EmptyState icon={<Icon.Users width={28} />} title="No customers" action={<button onClick={() => { setForm(blank); setModal(true); }} className="btn btn-primary">Add Customer</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr><th className="th">Name</th><th className="th">Contact</th><th className="th">GSTIN</th><th className="th text-center">Invoices</th><th className="th text-right">Business</th><th className="th text-right">Due</th><th className="th text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="td"><button onClick={() => openView(c.id)} className="font-semibold text-brand-600 hover:underline">{c.name}</button><div className="text-xs text-slate-400">{c.state}</div></td>
                    <td className="td text-slate-600">{c.phone || '—'}<div className="text-xs text-slate-400">{c.email}</div></td>
                    <td className="td text-slate-500">{c.gstin || '—'}</td>
                    <td className="td text-center">{c.invoice_count}</td>
                    <td className="td text-right font-semibold">{fmt.money(c.total_business)}</td>
                    <td className="td text-right">{c.due_amount > 0 ? <span className="font-semibold text-red-600">{fmt.money(c.due_amount)}</span> : <span className="text-slate-300">—</span>}</td>
                    <td className="td">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setForm(c); setModal(true); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600"><Icon.Edit width={16} /></button>
                        <button onClick={() => setDel(c.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Icon.Trash width={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={form.id ? 'Edit Customer' : 'Add Customer'} size="lg">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">Name *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label">Email</label><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">GSTIN</label><input className="input" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} /></div>
          <div><label className="label">Opening Balance</label><input type="number" className="input" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: Number(e.target.value) })} /></div>
          <div><label className="label">State</label><input className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
          <div><label className="label">State Code</label><input className="input" value={form.state_code} onChange={(e) => setForm({ ...form, state_code: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Address</label><textarea className="input" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        </div>
        <div className="mt-4 flex justify-end"><button onClick={save} className="btn btn-primary">Save Customer</button></div>
      </Modal>

      {/* Customer ledger */}
      <Modal open={!!view} onClose={() => setView(null)} title={view?.name || ''} size="lg">
        {view && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-400">Phone</div><div className="font-semibold">{view.phone || '—'}</div></div>
              <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-400">GSTIN</div><div className="font-semibold">{view.gstin || '—'}</div></div>
              <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-400">State</div><div className="font-semibold">{view.state}</div></div>
              <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-400">Invoices</div><div className="font-semibold">{view.invoices.length}</div></div>
            </div>
            <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50"><tr><th className="th">Invoice</th><th className="th">Date</th><th className="th text-right">Total</th><th className="th">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {view.invoices.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="td"><Link to={`/invoices/${i.id}`} onClick={() => setView(null)} className="font-semibold text-brand-600">{i.invoice_no}</Link></td>
                      <td className="td text-slate-500">{fmt.date(i.date)}</td>
                      <td className="td text-right font-semibold">{fmt.money(i.total)}</td>
                      <td className="td"><span className={`badge ${i.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{i.status}</span></td>
                    </tr>
                  ))}
                  {view.invoices.length === 0 && <tr><td colSpan={4} className="td text-center text-slate-400">No invoices yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove} title="Delete Customer" message="This customer will be permanently deleted. All their invoices will remain but linked to this customer will be removed. Continue?" />
    </div>
  );
}
