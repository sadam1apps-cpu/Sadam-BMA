import React, { useState, useEffect } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Account } from '../../types';
import {
  X,
  Building2,
  Wallet,
  Smartphone,
  ShieldCheck,
  CreditCard,
  FileText,
  Trash2,
  Info,
} from 'lucide-react';

interface AccountRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountToEdit?: Account | null;
}

export const AccountRecordModal: React.FC<AccountRecordModalProps> = ({
  isOpen,
  onClose,
  accountToEdit,
}) => {
  const { addAccount, updateAccount, deleteAccount, profile, accounts } = useBusiness();

  const isEditing = Boolean(accountToEdit);

  const [name, setName] = useState('');
  const [type, setType] = useState<'bank' | 'cash' | 'mobile_money'>('bank');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ibanOrNib, setIbanOrNib] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [branchName, setBranchName] = useState('');
  const [balance, setBalance] = useState<number>(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name || '');
      setType(accountToEdit.type || 'bank');
      setBankName(accountToEdit.bankName || '');
      setAccountHolder(accountToEdit.accountHolder || '');
      setAccountNumber(accountToEdit.accountNumber || '');
      setIbanOrNib(accountToEdit.ibanOrNib || '');
      setSwiftCode(accountToEdit.swiftCode || '');
      setBranchName(accountToEdit.branchName || '');
      setBalance(accountToEdit.balance || 0);
      setNotes(accountToEdit.notes || '');
    } else {
      setName('');
      setType('bank');
      setBankName('');
      setAccountHolder(profile.businessName || profile.ownerName || '');
      setAccountNumber('');
      setIbanOrNib('');
      setSwiftCode('');
      setBranchName('');
      setBalance(0);
      setNotes('');
    }
  }, [accountToEdit, profile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing && accountToEdit) {
      updateAccount(accountToEdit.id, {
        name: name.trim(),
        type,
        bankName: bankName.trim(),
        accountHolder: accountHolder.trim(),
        accountNumber: accountNumber.trim(),
        ibanOrNib: ibanOrNib.trim(),
        swiftCode: swiftCode.trim(),
        branchName: branchName.trim(),
        balance: Number(balance) || 0,
        notes: notes.trim(),
      });
    } else {
      addAccount({
        name: name.trim(),
        type,
        bankName: bankName.trim(),
        accountHolder: accountHolder.trim(),
        accountNumber: accountNumber.trim(),
        ibanOrNib: ibanOrNib.trim(),
        swiftCode: swiftCode.trim(),
        branchName: branchName.trim(),
        balance: Number(balance) || 0,
        currency: profile.currency || '$',
        notes: notes.trim(),
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (!accountToEdit) return;
    if (accounts.length <= 1) {
      alert('You must keep at least one active cash or bank account in the ledger.');
      return;
    }
    if (
      confirm(
        `Are you sure you want to remove the record for "${accountToEdit.name}"? This will not erase historical completed sales.`
      )
    ) {
      deleteAccount(accountToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden z-10 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            {type === 'cash' ? (
              <Wallet className="w-5 h-5 text-amber-400" />
            ) : type === 'mobile_money' ? (
              <Smartphone className="w-5 h-5 text-emerald-400" />
            ) : (
              <Building2 className="w-5 h-5 text-blue-400" />
            )}
            <h2 className="text-sm sm:text-base font-bold text-white">
              {isEditing ? 'Edit Account Record' : 'Add Bank / Cash Record'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3 text-xs">
          {/* Account Type Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Account Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('bank');
                  if (!name || name === 'Main Cash Drawer Till') setName('Company Bank Account');
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  type === 'bank'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-900 ring-1 ring-blue-500 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4 mb-1 text-blue-600" />
                <span>Bank Account</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('cash');
                  if (!name || name === 'Company Bank Account') setName('Main Cash Drawer Till');
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  type === 'cash'
                    ? 'border-amber-600 bg-amber-50/60 text-amber-900 ring-1 ring-amber-500 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Wallet className="w-4 h-4 mb-1 text-amber-600" />
                <span>Cash Register Till</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('mobile_money');
                  if (!name) setName('M-Pesa / Mobile Wallet');
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  type === 'mobile_money'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 ring-1 ring-emerald-500 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-4 h-4 mb-1 text-emerald-600" />
                <span>Mobile Money</span>
              </button>
            </div>
          </div>

          {/* Account Display Label */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Internal Account Label *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard Bank Operating, Millennium BIM Checking, Register Till #1"
              required
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Bank / Institution Specific Fields */}
          {(type === 'bank' || type === 'mobile_money') && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200/80 pb-1">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                <span>Official Institution &amp; Wire Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-0.5">
                    {type === 'mobile_money' ? 'Provider / Network' : 'Bank Name'}
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder={
                      type === 'mobile_money'
                        ? 'e.g. M-Pesa (Vodacom), E-Mola (Movitel)'
                        : 'e.g. Millennium BIM, Standard Bank, BCI, Moza Banco'
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-0.5">
                    Account Holder / Beneficiary
                  </label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="e.g. Company Legal Name / Store Owner"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-0.5">
                    Account / Phone Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={type === 'mobile_money' ? 'e.g. +258 84 000 0000' : 'e.g. 1029384756'}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-0.5">
                    NIB / IBAN (Interbank Transfer)
                  </label>
                  <input
                    type="text"
                    value={ibanOrNib}
                    onChange={(e) => setIbanOrNib(e.target.value)}
                    placeholder="e.g. 0001 0000 1234 5678 9012 3 (NIB / IBAN)"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-0.5">
                    SWIFT / BIC Code
                  </label>
                  <input
                    type="text"
                    value={swiftCode}
                    onChange={(e) => setSwiftCode(e.target.value)}
                    placeholder="e.g. BIMMMZM / SBICMZM"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono uppercase focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-0.5">
                    Branch / Agency
                  </label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g. Agência Central Maputo"
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Balance and Internal Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Current Balance ({profile.currency})
              </label>
              <input
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Internal Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes or instructions..."
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            {isEditing && accountToEdit && accounts.length > 1 ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1 px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors font-semibold cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {isEditing ? 'Save Account Record' : 'Add Account Record'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
