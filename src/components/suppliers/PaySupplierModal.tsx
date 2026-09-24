import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Supplier } from '../../types';
import { X, DollarSign, Truck } from 'lucide-react';

interface PaySupplierModalProps {
  supplier: Supplier | null;
  onClose: () => void;
}

export const PaySupplierModal: React.FC<PaySupplierModalProps> = ({ supplier, onClose }) => {
  const { paySupplier, accounts, profile } = useBusiness();
  const [amount, setAmount] = useState<number>(supplier ? supplier.amountOwed : 0);
  const [accountId, setAccountId] = useState<string>('acc-bank');
  const [notes, setNotes] = useState<string>('Supplier invoice settlement');

  if (!supplier) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    paySupplier(supplier.id, amount, accountId, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden z-10">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Pay Supplier Bill</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Vendor / Supplier
            </div>
            <div className="text-base font-extrabold text-slate-900 mt-0.5">
              {supplier.companyName}
            </div>
            <div className="text-xs text-rose-600 mt-1 font-semibold">
              Current Balance Owed: <strong className="text-base font-black">{profile.currency}{supplier.amountOwed.toLocaleString()}</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Payment Amount ({profile.currency})
            </label>
            <input
              type="number"
              min="1"
              max={supplier.amountOwed}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Remaining balance owed: <strong className="text-slate-800">{profile.currency}{Math.max(0, supplier.amountOwed - amount).toLocaleString()}</strong>
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Pay From Account
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (Available: {profile.currency}{acc.balance.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Notes / Check / Wire Ref
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Confirm Supplier Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
