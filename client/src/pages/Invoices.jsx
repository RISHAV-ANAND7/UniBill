import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, fmt } from '../api';
import { Icon } from '../components/Icons';
import { StatusBadge, EmptyState, ConfirmDialog, useToast } from '../components/ui';

export default function Invoices() {
  const navigate = useNavigate();
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', from: '', to: '' });
  const [del, setDel] = useState(null);

  const load = () => api.get('/invoices', filters).then(setInvoices);
  useEffect(() => { load(); }, [filters]);

  const remove = async () => {
    await api.del(`/invoices/${del}`);
    toast.push('Invoice deleted; stock restored', 'info');
    load();
  };

  const totalValue = invoices.reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500">{invoices.length} invoices · {fmt.money(totalValue)} total value</p>
        </div>
        <button onClick={() => navigate('/pos')} className="btn btn-primary"><Icon.Plus width={16} /> Create Invoice</button>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Icon.Search width={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search invoice / customer" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          </div>
          <select className="input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Status</option><option value="paid">Paid</option><option value="partial">Partial</option><option value="unpaid">Unpaid</option>
          </select>
          <input type="date" className="input" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          <input type="date" className="input" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        </div>
      </div>

      <div className="card overflow-hidden">
        {invoices.length === 0 ? (
          <EmptyState icon={<Icon.Invoice width={28} />} title="No invoices found" subtitle="Create your first invoice from the POS" action={<button onClick={() => navigate('/pos')} className="btn btn-primary">New Sale</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr><th className="th">Invoice #</th><th className="th">Customer</th><th className="th">Date</th><th className="th text-right">Total</th><th className="th text-right">Due</th><th className="th">Payment</th><th className="th">Status</th><th className="th text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="td font-semibold text-brand-600"><Link to={`/invoices/${inv.id}`}>{inv.invoice_no}</Link></td>
                    <td className="td font-medium text-slate-800">{inv.customer_name}</td>
                    <td className="td text-slate-500">{fmt.date(inv.date)}</td>
                    <td className="td text-right font-bold">{fmt.money(inv.total)}</td>
                    <td className="td text-right">{inv.total - inv.paid > 0 ? <span className="font-semibold text-red-600">{fmt.money(inv.total - inv.paid)}</span> : <span className="text-slate-300">—</span>}</td>
                    <td className="td"><span className="badge bg-slate-100 text-slate-600">{inv.payment_mode}</span></td>
                    <td className="td"><StatusBadge status={inv.status} /></td>
                    <td className="td">
                      <div className="flex justify-end gap-1">
                        <Link to={`/invoices/${inv.id}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600" title="View"><Icon.Print width={16} /></Link>
                        <button onClick={() => setDel(inv.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete"><Icon.Trash width={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove} title="Delete Invoice" message="This will permanently delete the invoice and restore product stock. Continue?" />
    </div>
  );
}
