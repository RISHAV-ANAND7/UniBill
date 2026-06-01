import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, fmt } from '../api';
import { Icon } from '../components/Icons';
import { Spinner, StatusBadge, useToast } from '../components/ui';

// Number to words (Indian)
function numToWords(num) {
  num = Math.round(num);
  if (num === 0) return 'Zero';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const fn = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + fn(n % 100) : '');
    if (n < 100000) return fn(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + fn(n % 1000) : '');
    if (n < 10000000) return fn(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + fn(n % 100000) : '');
    return fn(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + fn(n % 10000000) : '');
  };
  return fn(num);
}

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [invoice, setInvoice] = useState(null);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    api.get(`/invoices/${id}`).then(setInvoice);
    api.get('/company').then(setCompany);
  }, [id]);

  if (!invoice || !company) return <Spinner />;

  const due = invoice.total - invoice.paid;
  // group items by tax rate for HSN summary
  const hsnSummary = {};
  invoice.items.forEach((it) => {
    const key = it.tax_rate;
    if (!hsnSummary[key]) hsnSummary[key] = { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    hsnSummary[key].taxable += it.taxable;
    if (invoice.is_interstate) hsnSummary[key].igst += it.tax_amount;
    else { hsnSummary[key].cgst += it.tax_amount / 2; hsnSummary[key].sgst += it.tax_amount / 2; }
  });

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <button onClick={() => navigate('/invoices')} className="btn btn-ghost">← Back</button>
        <div className="flex items-center gap-2">
          <StatusBadge status={invoice.status} />
          <button onClick={() => window.print()} className="btn btn-primary"><Icon.Print width={16} /> Print / PDF</button>
        </div>
      </div>

      {/* Invoice document */}
      <div className="card print-area overflow-hidden p-8 print:p-4" id="invoice">
        <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-600 text-lg font-extrabold text-white">{company.name?.[0]}</div>
              <h1 className="text-2xl font-extrabold text-slate-900">{company.name}</h1>
            </div>
            <div className="mt-2 whitespace-pre-line text-xs text-slate-500">{company.address}</div>
            <div className="mt-1 text-xs text-slate-500">
              {company.phone && <>📞 {company.phone} · </>}{company.email}
            </div>
            {company.gstin && <div className="mt-1 text-xs font-semibold text-slate-700">GSTIN: {company.gstin}</div>}
          </div>
          <div className="text-right">
            <div className="text-xl font-extrabold uppercase tracking-wide text-slate-800">Tax Invoice</div>
            <div className="mt-2 text-sm"><span className="text-slate-400">Invoice No:</span> <span className="font-bold text-slate-800">{invoice.invoice_no}</span></div>
            <div className="text-sm"><span className="text-slate-400">Date:</span> <span className="font-semibold text-slate-700">{fmt.date(invoice.date)}</span></div>
            <div className="mt-1"><StatusBadge status={invoice.status} /></div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Bill To</div>
            <div className="mt-1 text-sm font-bold text-slate-800">{invoice.customer_name}</div>
            {invoice.customer_gstin && <div className="text-xs text-slate-500">GSTIN: {invoice.customer_gstin}</div>}
            <div className="text-xs text-slate-500">State Code: {invoice.customer_state_code}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-right">
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Supply Type</div>
            <div className="mt-1 text-sm font-bold text-slate-800">{invoice.is_interstate ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}</div>
            <div className="text-xs text-slate-500">Payment: {invoice.payment_mode}</div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border border-slate-200 text-sm">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-2 py-2 text-left text-xs">#</th>
                <th className="px-2 py-2 text-left text-xs">Item</th>
                <th className="px-2 py-2 text-center text-xs">HSN</th>
                <th className="px-2 py-2 text-center text-xs">Qty</th>
                <th className="px-2 py-2 text-right text-xs">Rate</th>
                <th className="px-2 py-2 text-right text-xs">Taxable</th>
                <th className="px-2 py-2 text-center text-xs">GST%</th>
                <th className="px-2 py-2 text-right text-xs">Tax</th>
                <th className="px-2 py-2 text-right text-xs">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((it, idx) => (
                <tr key={it.id} className="border-b border-slate-100">
                  <td className="px-2 py-2 text-slate-400">{idx + 1}</td>
                  <td className="px-2 py-2 font-medium text-slate-800">{it.name}</td>
                  <td className="px-2 py-2 text-center text-slate-500">{it.hsn || '—'}</td>
                  <td className="px-2 py-2 text-center">{it.qty} {it.unit}</td>
                  <td className="px-2 py-2 text-right">{fmt.money(it.price)}</td>
                  <td className="px-2 py-2 text-right">{fmt.money(it.taxable)}</td>
                  <td className="px-2 py-2 text-center">{it.tax_rate}%</td>
                  <td className="px-2 py-2 text-right">{fmt.money(it.tax_amount)}</td>
                  <td className="px-2 py-2 text-right font-semibold">{fmt.money(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* HSN / Tax summary */}
          <div>
            <table className="w-full border border-slate-200 text-xs">
              <thead className="bg-slate-100"><tr><th className="px-2 py-1.5 text-left">GST%</th><th className="px-2 py-1.5 text-right">Taxable</th>{invoice.is_interstate ? <th className="px-2 py-1.5 text-right">IGST</th> : <><th className="px-2 py-1.5 text-right">CGST</th><th className="px-2 py-1.5 text-right">SGST</th></>}</tr></thead>
              <tbody>
                {Object.entries(hsnSummary).map(([rate, v]) => (
                  <tr key={rate} className="border-t border-slate-100">
                    <td className="px-2 py-1.5">{rate}%</td>
                    <td className="px-2 py-1.5 text-right">{fmt.money(v.taxable)}</td>
                    {invoice.is_interstate ? <td className="px-2 py-1.5 text-right">{fmt.money(v.igst)}</td> : <><td className="px-2 py-1.5 text-right">{fmt.money(v.cgst)}</td><td className="px-2 py-1.5 text-right">{fmt.money(v.sgst)}</td></>}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs">
              <span className="font-semibold text-slate-600">Amount in words: </span>
              <span className="text-slate-700">{numToWords(invoice.total)} Rupees Only</span>
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{fmt.money(invoice.subtotal)}</span></div>
            {invoice.discount > 0 && <div className="flex justify-between text-slate-600"><span>Discount</span><span>− {fmt.money(invoice.discount_type === 'percent' ? invoice.subtotal * invoice.discount / 100 : invoice.discount)}</span></div>}
            <div className="flex justify-between text-slate-600"><span>Taxable Amount</span><span>{fmt.money(invoice.taxable_amount)}</span></div>
            {invoice.is_interstate ? (
              <div className="flex justify-between text-slate-600"><span>IGST</span><span>{fmt.money(invoice.igst)}</span></div>
            ) : (
              <>
                <div className="flex justify-between text-slate-600"><span>CGST</span><span>{fmt.money(invoice.cgst)}</span></div>
                <div className="flex justify-between text-slate-600"><span>SGST</span><span>{fmt.money(invoice.sgst)}</span></div>
              </>
            )}
            {invoice.round_off !== 0 && <div className="flex justify-between text-slate-600"><span>Round Off</span><span>{fmt.money(invoice.round_off)}</span></div>}
            <div className="flex justify-between border-t-2 border-slate-800 pt-2 text-lg font-extrabold text-slate-900"><span>Grand Total</span><span>{fmt.money(invoice.total)}</span></div>
            <div className="flex justify-between text-emerald-600"><span>Paid</span><span>{fmt.money(invoice.paid)}</span></div>
            {due > 0 && <div className="flex justify-between font-bold text-red-600"><span>Balance Due</span><span>{fmt.money(due)}</span></div>}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-200 pt-4">
          <div className="text-xs text-slate-500">
            {company.bank_name && (
              <>
                <div className="font-semibold text-slate-600">Bank Details</div>
                <div>{company.bank_name} · A/C: {company.bank_account}</div>
                <div>IFSC: {company.bank_ifsc}</div>
              </>
            )}
            {company.terms && <div className="mt-2"><span className="font-semibold text-slate-600">Terms: </span>{company.terms}</div>}
          </div>
          <div className="text-right text-xs text-slate-500">
            <div className="mt-8 border-t border-slate-300 pt-1 inline-block">Authorised Signatory</div>
            <div className="mt-1 font-semibold text-slate-700">for {company.name}</div>
          </div>
        </div>
        <div className="mt-4 text-center text-[10px] text-slate-400">This is a computer-generated invoice · Powered by EzyBill Pro</div>
      </div>
    </div>
  );
}
