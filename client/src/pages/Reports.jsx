import { useEffect, useState } from 'react';
import { api, fmt } from '../api';
import { Icon } from '../components/Icons';

function toCsv(rows, headers) {
  const head = headers.map((h) => h.label).join(',');
  const body = rows.map((r) => headers.map((h) => `"${String(h.get(r) ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  return head + '\n' + body;
}
function download(name, content) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const [tab, setTab] = useState('sales');
  const [range, setRange] = useState({ from: monthAgo, to: today });
  const [sales, setSales] = useState(null);
  const [gst, setGst] = useState(null);
  const [inv, setInv] = useState(null);

  useEffect(() => {
    api.get('/reports/sales', range).then(setSales);
    api.get('/reports/gst', range).then(setGst);
    api.get('/reports/inventory').then(setInv);
  }, [range]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Reports & GST</h1>
          <p className="text-sm text-slate-500">Sales, tax and inventory analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className="input" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
          <span className="text-slate-400">to</span>
          <input type="date" className="input" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
        </div>
      </div>

      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {[['sales', 'Sales Report'], ['gst', 'GST Summary'], ['inventory', 'Inventory']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`rounded-md px-4 py-2 text-sm font-semibold transition ${tab === id ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{label}</button>
        ))}
      </div>

      {tab === 'sales' && sales && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[['Total Sales', fmt.money(sales.summary.total), 'bg-brand-50 text-brand-600'], ['Taxable Value', fmt.money(sales.summary.taxable), 'bg-emerald-50 text-emerald-600'], ['Total Tax', fmt.money(sales.summary.cgst + sales.summary.sgst + sales.summary.igst), 'bg-purple-50 text-purple-600'], ['Invoices', sales.summary.count, 'bg-amber-50 text-amber-600']].map(([l, v, c]) => (
              <div key={l} className="card p-5"><div className="text-sm text-slate-500">{l}</div><div className="mt-1 text-2xl font-extrabold text-slate-900">{v}</div></div>
            ))}
          </div>
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <h2 className="font-bold text-slate-800">Sales Detail</h2>
              <button onClick={() => download('sales-report.csv', toCsv(sales.invoices, [
                { label: 'Invoice', get: (r) => r.invoice_no }, { label: 'Date', get: (r) => r.date }, { label: 'Customer', get: (r) => r.customer_name },
                { label: 'Taxable', get: (r) => r.taxable_amount }, { label: 'CGST', get: (r) => r.cgst }, { label: 'SGST', get: (r) => r.sgst }, { label: 'IGST', get: (r) => r.igst }, { label: 'Total', get: (r) => r.total },
              ]))} className="btn btn-ghost"><Icon.Download width={16} /> Export CSV</button>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-50"><tr><th className="th">Invoice</th><th className="th">Date</th><th className="th">Customer</th><th className="th text-right">Taxable</th><th className="th text-right">Tax</th><th className="th text-right">Total</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {sales.invoices.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className="td font-semibold text-brand-600">{i.invoice_no}</td><td className="td text-slate-500">{fmt.date(i.date)}</td><td className="td">{i.customer_name}</td>
                      <td className="td text-right">{fmt.money(i.taxable_amount)}</td><td className="td text-right">{fmt.money(i.cgst + i.sgst + i.igst)}</td><td className="td text-right font-bold">{fmt.money(i.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'gst' && gst && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div><h2 className="font-bold text-slate-800">GST Summary (GSTR-1 style)</h2><p className="text-xs text-slate-400">Tax collected by rate slab</p></div>
            <button onClick={() => download('gst-summary.csv', toCsv(gst.byRate, [
              { label: 'Rate', get: (r) => r.tax_rate + '%' }, { label: 'Taxable', get: (r) => r.taxable }, { label: 'CGST', get: (r) => r.cgst }, { label: 'SGST', get: (r) => r.sgst }, { label: 'IGST', get: (r) => r.igst }, { label: 'Total Tax', get: (r) => r.total_tax },
            ]))} className="btn btn-ghost"><Icon.Download width={16} /> Export</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50"><tr><th className="th">GST Rate</th><th className="th text-right">Taxable Value</th><th className="th text-right">CGST</th><th className="th text-right">SGST</th><th className="th text-right">IGST</th><th className="th text-right">Total Tax</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {gst.byRate.map((r) => (
                  <tr key={r.tax_rate} className="hover:bg-slate-50">
                    <td className="td font-semibold">{r.tax_rate}%</td><td className="td text-right">{fmt.money(r.taxable)}</td><td className="td text-right">{fmt.money(r.cgst)}</td><td className="td text-right">{fmt.money(r.sgst)}</td><td className="td text-right">{fmt.money(r.igst)}</td><td className="td text-right font-bold">{fmt.money(r.total_tax)}</td>
                  </tr>
                ))}
                {gst.byRate.length === 0 && <tr><td colSpan={6} className="td text-center text-slate-400 py-8">No data for selected period</td></tr>}
              </tbody>
              {gst.byRate.length > 0 && (
                <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                  <tr>
                    <td className="td">Total</td>
                    <td className="td text-right">{fmt.money(gst.byRate.reduce((s, r) => s + r.taxable, 0))}</td>
                    <td className="td text-right">{fmt.money(gst.byRate.reduce((s, r) => s + r.cgst, 0))}</td>
                    <td className="td text-right">{fmt.money(gst.byRate.reduce((s, r) => s + r.sgst, 0))}</td>
                    <td className="td text-right">{fmt.money(gst.byRate.reduce((s, r) => s + r.igst, 0))}</td>
                    <td className="td text-right">{fmt.money(gst.byRate.reduce((s, r) => s + r.total_tax, 0))}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {tab === 'inventory' && inv && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="card p-5"><div className="text-sm text-slate-500">Stock Value (at cost)</div><div className="mt-1 text-2xl font-extrabold text-slate-900">{fmt.money(inv.totalValue)}</div></div>
            <div className="card p-5"><div className="text-sm text-slate-500">Stock Value (at retail)</div><div className="mt-1 text-2xl font-extrabold text-emerald-600">{fmt.money(inv.totalRetail)}</div></div>
          </div>
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <h2 className="font-bold text-slate-800">Inventory Valuation</h2>
              <button onClick={() => download('inventory.csv', toCsv(inv.products, [
                { label: 'Product', get: (r) => r.name }, { label: 'Category', get: (r) => r.category_name }, { label: 'Stock', get: (r) => r.stock }, { label: 'Cost', get: (r) => r.purchase_price }, { label: 'Value', get: (r) => (r.stock * r.purchase_price).toFixed(2) },
              ]))} className="btn btn-ghost"><Icon.Download width={16} /> Export</button>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-50"><tr><th className="th">Product</th><th className="th">Category</th><th className="th text-center">Stock</th><th className="th text-right">Cost</th><th className="th text-right">Stock Value</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {inv.products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="td font-semibold text-slate-800">{p.name}</td><td className="td text-slate-500">{p.category_name || '—'}</td>
                      <td className="td text-center"><span className={`badge ${p.stock <= p.low_stock_alert ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>{p.stock} {p.unit}</span></td>
                      <td className="td text-right">{fmt.money(p.purchase_price)}</td><td className="td text-right font-bold">{fmt.money(p.stock * p.purchase_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
