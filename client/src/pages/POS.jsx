import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, fmt } from '../api';
import { Icon } from '../components/Icons';
import { useToast, Modal } from '../components/ui';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export default function POS() {
  const navigate = useNavigate();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [company, setCompany] = useState(null);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('amount');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paid, setPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCust, setShowCust] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', phone: '', gstin: '', state_code: '29', state: 'Karnataka' });

  const load = () => {
    api.get('/products').then(setProducts);
    api.get('/customers').then(setCustomers);
    api.get('/company').then(setCompany);
  };
  useEffect(load, []);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(s) || (p.sku || '').toLowerCase().includes(s) || (p.barcode || '').includes(s)).slice(0, 50);
  }, [products, search]);

  const addToCart = (p) => {
    setCart((c) => {
      const existing = c.find((i) => i.product_id === p.id);
      if (existing) return c.map((i) => i.product_id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...c, { product_id: p.id, name: p.name, hsn: p.hsn, unit: p.unit, price: p.selling_price, qty: 1, discount: 0, tax_rate: p.tax_rate, stock: p.stock }];
    });
  };

  const updateQty = (id, qty) => setCart((c) => c.map((i) => i.product_id === id ? { ...i, qty: Math.max(0, qty) } : i).filter((i) => i.qty > 0));
  const updatePrice = (id, price) => setCart((c) => c.map((i) => i.product_id === id ? { ...i, price } : i));
  const updateDiscount = (id, discount) => setCart((c) => c.map((i) => i.product_id === id ? { ...i, discount: Math.max(0, discount) } : i));
  const removeItem = (id) => setCart((c) => c.filter((i) => i.product_id !== id));

  const companyState = company?.state_code || '29';
  const custState = customer?.state_code || companyState;
  const isInterstate = custState !== companyState;

  const totals = useMemo(() => {
    let subtotal = 0, taxable = 0, tax = 0;
    cart.forEach((i) => {
      const gross = round2(i.qty * i.price);
      const t = round2(gross * i.tax_rate / 100);
      subtotal += gross; taxable += gross; tax += t;
    });
    let disc = 0;
    if (discount) disc = discountType === 'percent' ? round2(subtotal * discount / 100) : round2(Number(discount));
    taxable = round2(taxable - disc);
    const raw = taxable + tax;
    const total = Math.round(raw);
    return {
      subtotal: round2(subtotal), discount: disc, taxable, tax: round2(tax),
      cgst: isInterstate ? 0 : round2(tax / 2), sgst: isInterstate ? 0 : round2(tax / 2),
      igst: isInterstate ? round2(tax) : 0, roundOff: round2(total - raw), total,
    };
  }, [cart, discount, discountType, isInterstate]);

  const checkout = async () => {
    if (cart.length === 0) return toast.push('Cart is empty', 'error');
    setSaving(true);
    try {
      const inv = await api.post('/invoices', {
        customer_id: customer?.id || null,
        customer_name: customer?.name || 'Walk-in Customer',
        customer_gstin: customer?.gstin || '',
        customer_state_code: custState,
        items: cart.map((i) => ({ product_id: i.product_id, name: i.name, hsn: i.hsn, qty: i.qty, unit: i.unit, price: i.price, discount: i.discount || 0, tax_rate: i.tax_rate })),
        discount: Number(discount) || 0,
        discount_type: discountType,
        payment_mode: paymentMode,
        paid: paid === '' ? totals.total : Number(paid),
        notes: notes || '',
      });
      toast.push(`Invoice ${inv.invoice_no} created!`);
      navigate(`/invoices/${inv.id}`);
    } catch (e) {
      toast.push(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveCustomer = async () => {
    if (!newCust.name) return toast.push('Name required', 'error');
    const c = await api.post('/customers', newCust);
    setCustomers((cs) => [...cs, c]);
    setCustomer(c);
    setShowCust(false);
    setNewCust({ name: '', phone: '', gstin: '', state_code: '29', state: 'Karnataka' });
    toast.push('Customer added');
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* Product picker */}
      <div className="lg:col-span-3 space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">New Sale</h1>
          <p className="text-sm text-slate-500">Search and click products to add to the bill</p>
        </div>
        <div className="relative">
          <Icon.Search width={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input autoFocus className="input pl-10" placeholder="Search by name, SKU or barcode…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
          {filtered.map((p) => (
            <button key={p.id} onClick={() => addToCart(p)} disabled={p.stock <= 0}
              className="card p-3 text-left transition hover:border-brand-400 hover:shadow-md disabled:opacity-50">
              <div className="flex items-start justify-between">
                <span className={`badge text-[10px] ${p.stock <= p.low_stock_alert ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {p.stock} {p.unit}
                </span>
                <span className="text-[10px] text-slate-400">{p.tax_rate}%</span>
              </div>
              <div className="mt-2 line-clamp-2 text-sm font-semibold text-slate-800 min-h-[40px]">{p.name}</div>
              <div className="mt-1 text-base font-bold text-brand-600">{fmt.money(p.selling_price)}</div>
            </button>
          ))}
          {filtered.length === 0 && <div className="col-span-full py-12 text-center text-sm text-slate-400">No products found</div>}
        </div>
      </div>

      {/* Cart */}
      <div className="lg:col-span-2">
        <div className="card sticky top-20 flex flex-col" style={{ maxHeight: 'calc(100vh - 110px)' }}>
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <select className="input flex-1" value={customer?.id || ''} onChange={(e) => setCustomer(customers.find((c) => c.id === Number(e.target.value)) || null)}>
                <option value="">Walk-in Customer</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.gstin ? ` (${c.gstin})` : ''}</option>)}
              </select>
              <button onClick={() => setShowCust(true)} className="btn btn-ghost ml-2 px-2.5" title="Add customer"><Icon.Plus width={18} /></button>
            </div>
            {isInterstate && <div className="mt-2 text-xs font-medium text-amber-600">Inter-state supply → IGST applicable</div>}
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-slate-300">
                <Icon.Cart width={40} />
                <p className="mt-2 text-sm">Cart is empty</p>
              </div>
            ) : cart.map((i) => (
              <div key={i.product_id} className="rounded-lg p-2.5 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-800">{i.name}</div>
                    <div className="text-xs text-slate-400">GST {i.tax_rate}% · {i.unit}</div>
                  </div>
                  <button onClick={() => removeItem(i.product_id)} className="text-slate-300 hover:text-red-500"><Icon.Trash width={16} /></button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(i.product_id, i.qty - 1)} className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100">−</button>
                    <input className="w-12 rounded-md border border-slate-200 px-1 py-1 text-center text-sm" value={i.qty} onChange={(e) => updateQty(i.product_id, Number(e.target.value) || 0)} />
                    <button onClick={() => updateQty(i.product_id, i.qty + 1)} className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100">+</button>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-slate-400">₹</span>
                    <input className="w-16 rounded-md border border-slate-200 px-1 py-1 text-right text-sm" value={i.price} onChange={(e) => updatePrice(i.product_id, Number(e.target.value) || 0)} />
                    <span className="ml-1 w-20 text-right font-bold text-slate-800">{fmt.money(i.qty * i.price)}</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs">
                  <span className="text-slate-400">Discount:</span>
                  <input className="w-16 rounded-md border border-slate-200 px-1 py-1 text-right text-xs" placeholder="0" value={i.discount || 0} onChange={(e) => updateDiscount(i.product_id, Number(e.target.value) || 0)} />
                  <span className="text-slate-400">₹</span>
                </div>
              </div>
            ))}
          </div>

          {cart.length > 0 && (
            <div className="border-t border-slate-200 p-4 space-y-2 bg-slate-50 rounded-b-xl">
              <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>{fmt.money(totals.subtotal)}</span></div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Discount</span>
                <div className="flex items-center gap-1">
                  <input className="w-20 rounded-md border border-slate-200 px-2 py-1 text-right text-sm" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" />
                  <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="rounded-md border border-slate-200 px-1 py-1 text-sm">
                    <option value="amount">₹</option><option value="percent">%</option>
                  </select>
                </div>
              </div>
              {!isInterstate ? (
                <>
                  <div className="flex justify-between text-sm text-slate-600"><span>CGST</span><span>{fmt.money(totals.cgst)}</span></div>
                  <div className="flex justify-between text-sm text-slate-600"><span>SGST</span><span>{fmt.money(totals.sgst)}</span></div>
                </>
              ) : (
                <div className="flex justify-between text-sm text-slate-600"><span>IGST</span><span>{fmt.money(totals.igst)}</span></div>
              )}
              {totals.roundOff !== 0 && <div className="flex justify-between text-sm text-slate-600"><span>Round Off</span><span>{fmt.money(totals.roundOff)}</span></div>}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-extrabold text-slate-900"><span>Total</span><span>{fmt.money(totals.total)}</span></div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="input">
                  {['Cash', 'UPI', 'Card', 'Credit'].map((m) => <option key={m}>{m}</option>)}
                </select>
                <input className="input" placeholder={`Paid ${fmt.money(totals.total)}`} value={paid} onChange={(e) => setPaid(e.target.value)} />
              </div>
              <textarea className="input" placeholder="Notes (optional)" rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <button onClick={checkout} disabled={saving} className="btn btn-primary w-full py-3 text-base">
                {saving ? 'Processing…' : `Complete Sale · ${fmt.money(totals.total)}`}
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal open={showCust} onClose={() => setShowCust(false)} title="Add Customer">
        <div className="space-y-3">
          <div><label className="label">Name *</label><input className="input" value={newCust.name} onChange={(e) => setNewCust({ ...newCust, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Phone</label><input className="input" value={newCust.phone} onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })} /></div>
            <div><label className="label">GSTIN</label><input className="input" value={newCust.gstin} onChange={(e) => setNewCust({ ...newCust, gstin: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">State</label><input className="input" value={newCust.state} onChange={(e) => setNewCust({ ...newCust, state: e.target.value })} /></div>
            <div><label className="label">State Code</label><input className="input" value={newCust.state_code} onChange={(e) => setNewCust({ ...newCust, state_code: e.target.value })} /></div>
          </div>
          <button onClick={saveCustomer} className="btn btn-primary w-full">Save Customer</button>
        </div>
      </Modal>
    </div>
  );
}
