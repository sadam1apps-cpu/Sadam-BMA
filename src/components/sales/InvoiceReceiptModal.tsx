import React from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Sale } from '../../types';
import { Printer, X, CheckCircle2, AlertCircle, Building2, Phone, Mail } from 'lucide-react';

interface InvoiceReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({ sale, onClose }) => {
  const { profile } = useBusiness();

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const saleDateFormatted = new Date(sale.timestamp).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white">
      <div
        className="fixed inset-0 print:hidden"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden z-10 print:shadow-none print:border-none print:w-full print:max-w-none">
        
        {/* Modal Top Actions (Hidden when printing) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Official Sales Receipt / Invoice
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Receipt Body (Formatted like an official business POS receipt) */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-900 text-sm">
          
          {/* Header */}
          <div className="text-center border-b border-slate-200 pb-5">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 uppercase tracking-tight">
              {profile.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{profile.tagline}</p>
            <div className="text-xs text-slate-500 mt-2 space-y-0.5">
              <p>{profile.address}</p>
              <p>Phone: {profile.phone} • Email: {profile.email}</p>
            </div>
          </div>

          {/* Invoice Meta Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-slate-500">Invoice No:</span>
              <p className="font-mono font-bold text-slate-900">{sale.invoiceNumber}</p>
            </div>
            <div>
              <span className="text-slate-500">Date & Time:</span>
              <p className="font-medium text-slate-800">{saleDateFormatted}</p>
            </div>
            <div>
              <span className="text-slate-500">Customer:</span>
              <p className="font-bold text-slate-900">{sale.customerName}</p>
              {sale.customerPhone && (
                <p className="text-slate-500">{sale.customerPhone}</p>
              )}
            </div>
            <div>
              <span className="text-slate-500">Issued by (Cashier):</span>
              <p className="font-medium text-slate-800">{sale.cashierName}</p>
            </div>
          </div>

          {/* Itemized Table */}
          <div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-slate-300 text-slate-600 font-bold uppercase text-[11px]">
                  <th className="text-left py-2">Item</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.items.map((item, idx) => (
                  <tr key={idx} className="py-2">
                    <td className="py-2.5 font-medium text-slate-900">
                      {item.productName}
                    </td>
                    <td className="py-2.5 text-center text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 text-right text-slate-700">
                      {profile.currency}{item.unitPrice.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-900">
                      {profile.currency}{item.subtotal.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Breakdown */}
          <div className="border-t-2 border-slate-200 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>{profile.currency}{sale.subtotal.toLocaleString()}</span>
            </div>

            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span>-{profile.currency}{sale.discountAmount.toLocaleString()}</span>
              </div>
            )}

            {sale.taxAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax:</span>
                <span>+{profile.currency}{sale.taxAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2">
              <span>Grand Total:</span>
              <span className="text-indigo-600">
                {profile.currency}{sale.total.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between text-xs text-slate-700 pt-1">
              <span>Payment Method:</span>
              <span className="font-semibold uppercase tracking-wider">
                {sale.paymentMethod.replace('_', ' ')}
              </span>
            </div>

            <div className="flex justify-between text-xs font-semibold text-slate-800">
              <span>Amount Paid:</span>
              <span>{profile.currency}{sale.amountPaid.toLocaleString()}</span>
            </div>

            {sale.balanceDue > 0 ? (
              <div className="flex justify-between text-xs font-bold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                <span>Balance Due (Debt/Credit):</span>
                <span>{profile.currency}{sale.balanceDue.toLocaleString()}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Full Payment Received
                </span>
                <span>PAID IN FULL</span>
              </div>
            )}
          </div>

          {/* Notes & Footer */}
          {sale.notes && (
            <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-700">Notes: </span>
              {sale.notes}
            </div>
          )}

          <div className="text-center pt-2 text-xs text-slate-600 border-t border-dashed border-slate-300">
            <p className="font-semibold text-slate-800">Thank you for your business!</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Goods purchased in good condition. Please keep this receipt.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
