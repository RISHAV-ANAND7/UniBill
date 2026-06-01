import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api, fmt } from '../api';
import { Spinner, StatusBadge } from '../components/ui';
import { Icon } from '../components/Icons';

const PIE_COLORS = ['#1d40f5', '#3563ff', '#598bff', '#8eb4ff', '#bcd2ff'];

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900">{value}</div>
          {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${accent}`}>{icon}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/reports/dashboard').then(setData); }, []);

  if (!data) return <Spinner />;

  const chartTrend = data.trend.map((t) => ({
    name: new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    Sales: t.total,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Business overview at a glance</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's Sales" value={fmt.money(data.todaySales.v)} sub={`${data.todaySales.c} invoices`} accent="bg-brand-50 text-brand-600" icon={<Icon.Money />} />
        <StatCard label="This Month" value={fmt.money(data.monthSales.v)} sub={`${data.monthSales.c} invoices`} accent="bg-emerald-50 text-emerald-600" icon={<Icon.TrendUp />} />
        <StatCard label="Outstanding Dues" value={fmt.money(data.totalDue.v)} sub="Pending collection" accent="bg-amber-50 text-amber-600" icon={<Icon.Invoice />} />
        <StatCard label="Stock Value" value={fmt.money(data.stockValue)} sub={`${data.products} products`} accent="bg-purple-50 text-purple-600" icon={<Icon.Box />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Sales — Last 7 Days</h2>
            <span className="badge bg-brand-50 text-brand-600">Weekly</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartTrend} margin={{ left: -10, right: 10, top: 10 }}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1d40f5" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#1d40f5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => '₹' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)} />
              <Tooltip formatter={(v) => fmt.money(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Area type="monotone" dataKey="Sales" stroke="#1d40f5" strokeWidth={2.5} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-bold text-slate-800">Payment Modes</h2>
          {data.paymentModes.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">No data</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={data.paymentModes} dataKey="total" nameKey="payment_mode" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {data.paymentModes.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt.money(v)} contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-2">
                {data.paymentModes.map((p, i) => (
                  <div key={p.payment_mode} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-600">{p.payment_mode}</span>
                    </div>
                    <span className="font-semibold text-slate-800">{fmt.money(p.total)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-bold text-slate-800">Top Selling Products</h2>
          {data.topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No sales yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.topProducts} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={130} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => fmt.money(v)} contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                <Bar dataKey="revenue" fill="#1d40f5" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Recent Invoices</h2>
            <Link to="/invoices" className="text-sm font-semibold text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-1">
            {data.recentInvoices.map((inv) => (
              <Link key={inv.id} to={`/invoices/${inv.id}`} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-slate-50">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-800">{inv.customer_name}</div>
                  <div className="text-xs text-slate-400">{inv.invoice_no} · {fmt.date(inv.date)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-800">{fmt.money(inv.total)}</span>
                  <StatusBadge status={inv.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {data.lowStock > 0 && (
        <Link to="/products?lowstock=1" className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 hover:bg-amber-100">
          <Icon.Alert />
          <span className="text-sm font-semibold">{data.lowStock} product(s) are running low on stock. Click to review.</span>
        </Link>
      )}
    </div>
  );
}
