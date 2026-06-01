import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, fmt } from '../api';
import { Icon } from '../components/Icons';
import { Modal, ConfirmDialog, EmptyState, useToast } from '../components/ui';

const blank = { name: '', sku: '', hsn: '', category_id: '', unit: 'PCS', purchase_price: 0, selling_price: 0, tax_rate: 18, stock: 0, low_stock_alert: 5, barcode: '' };

export default function Products() {
  const toast = useToast();
  const [params] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [lowOnly, setLowOnly] = useState(params.get('lowstock') === '1');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(blank);
  const [del, setDel] = useState(null);
  const [stockModal, setStockModal] = useState(null);
  const [stockForm, setStockForm] = useState({ qty: 0, type: 'in', reference: '' });
  const [newCat, setNewCat] = useState('');

  const load = () => {
    api.get('/products', { search, lowstock: lowOnly ? '1' : '' }).then(setProducts);
    api.get('/products/categories').then(setCategories);
  };
  useEffect(() => { load(); }, [search, lowOnly]);

  const openNew = () => { setForm(blank); setModal('new'); };
  const openEdit = (p) => { setForm({ ...p, category_id: p.category_id || '' }); setModal('edit'); };

  const save = async () => {
    if (!form.name) return toast.push('Name required', 'error');
    const payload = { ...form, category_id: form.category_id || null };
    if (modal === 'new') await api.post('/products', payload);
    else await api.put(`/products/${form.id}`, payload);
    toast.push('Product saved');
    setModal(null); load();
  };

  const remove = async () => { await api.del(`/products/${del}`); toast.push('Product removed', 'info'); load(); };

  const adjustStock = async () => {
    await api.post(`/products/${stockModal.id}/stock`, stockForm);
    toast.push('Stock updated');
    setStockModal(null); setStockForm({ qty: 0, type: 'in', reference: '' }); load();
  };

  const addCategory = async () => {
    if (!newCat) return;
    const c = await api.post('/products/categories', { name: newCat });
    setCategories((cs) => [...cs, c]); setNewCat(''); toast.push('Category added');
  };

  const totalStockValue = products.reduce((s, p) => s + p.stock * p.purchase_price, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Products & Inventory</h1>
          <p className="text-sm text-slate-500">{products.length} products · Stock value {fmt.money(totalStockValue)}</p>
        </div>
        <button onClick={openNew} className="btn btn-primary"><Icon.Plus width={16} /> Add Product</button>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Icon.Search width={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search name, SKU, HSN, barcode" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} className="h-4 w-4 rounded accent-brand-600" />
          Low stock only
        </label>
      </div>

      <div className="card overflow-hidden">
        {products.length === 0 ? (
          <EmptyState icon={<Icon.Box width={28} />} title="No products" subtitle="Add your first product to start billing" action={<button onClick={openNew} className="btn btn-primary">Add Product</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr><th className="th">Product</th><th className="th">Category</th><th className="th">HSN</th><th className="th text-right">Purchase</th><th className="th text-right">Selling</th><th className="th text-center">GST</th><th className="th text-center">Stock</th><th className="th text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="td"><div className="font-semibold text-slate-800">{p.name}</div><div className="text-xs text-slate-400">{p.sku}</div></td>
                    <td className="td text-slate-500">{p.category_name || '—'}</td>
                    <td className="td text-slate-500">{p.hsn || '—'}</td>
                    <td className="td text-right text-slate-600">{fmt.money(p.purchase_price)}</td>
                    <td className="td text-right font-semibold">{fmt.money(p.selling_price)}</td>
                    <td className="td text-center">{p.tax_rate}%</td>
                    <td className="td text-center">
                      <span className={`badge ${p.stock <= p.low_stock_alert ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{p.stock} {p.unit}</span>
                    </td>
                    <td className="td">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setStockModal(p); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-purple-50 hover:text-purple-600" title="Adjust stock"><Icon.Box width={16} /></button>
                        <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600" title="Edit"><Icon.Edit width={16} /></button>
                        <button onClick={() => setDel(p.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete"><Icon.Trash width={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product modal */}
      <Modal open={modal === 'new' || modal === 'edit'} onClose={() => setModal(null)} title={modal === 'new' ? 'Add Product' : 'Edit Product'} size="lg">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">Product Name *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">SKU</label><input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
          <div><label className="label">HSN/SAC Code</label><input className="input" value={form.hsn} onChange={(e) => setForm({ ...form, hsn: e.target.value })} /></div>
          <div>
            <label className="label">Category</label>
            <div className="flex gap-2">
              <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">None</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Unit</label><select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>{['PCS', 'KG', 'GM', 'LTR', 'BOX', 'SET', 'MTR', 'DOZ'].map((u) => <option key={u}>{u}</option>)}</select></div>
          <div><label className="label">Purchase Price</label><input type="number" className="input" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: Number(e.target.value) })} /></div>
          <div><label className="label">Selling Price</label><input type="number" className="input" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: Number(e.target.value) })} /></div>
          <div><label className="label">GST Rate (%)</label><select className="input" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })}>{[0, 5, 12, 18, 28].map((t) => <option key={t} value={t}>{t}%</option>)}</select></div>
          <div><label className="label">Opening Stock</label><input type="number" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} disabled={modal === 'edit'} /></div>
          <div><label className="label">Low Stock Alert</label><input type="number" className="input" value={form.low_stock_alert} onChange={(e) => setForm({ ...form, low_stock_alert: Number(e.target.value) })} /></div>
          <div><label className="label">Barcode</label><input className="input" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <input className="input w-40" placeholder="New category" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
            <button onClick={addCategory} className="btn btn-ghost">+ Category</button>
          </div>
          <button onClick={save} className="btn btn-primary">Save Product</button>
        </div>
      </Modal>

      {/* Stock modal */}
      <Modal open={!!stockModal} onClose={() => setStockModal(null)} title={`Adjust Stock · ${stockModal?.name || ''}`}>
        <div className="space-y-3">
          <div className="rounded-lg bg-slate-50 p-3 text-sm">Current stock: <span className="font-bold">{stockModal?.stock} {stockModal?.unit}</span></div>
          <div><label className="label">Type</label><select className="input" value={stockForm.type} onChange={(e) => setStockForm({ ...stockForm, type: e.target.value })}><option value="in">Stock In (+)</option><option value="out">Stock Out (−)</option></select></div>
          <div><label className="label">Quantity</label><input type="number" className="input" value={stockForm.qty} onChange={(e) => setStockForm({ ...stockForm, qty: Number(e.target.value) })} /></div>
          <div><label className="label">Reference / Note</label><input className="input" value={stockForm.reference} onChange={(e) => setStockForm({ ...stockForm, reference: e.target.value })} placeholder="e.g. Purchase from supplier" /></div>
          <button onClick={adjustStock} className="btn btn-primary w-full">Update Stock</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove} title="Delete Product" message="This product will be removed from your catalog. Continue?" />
    </div>
  );
}
