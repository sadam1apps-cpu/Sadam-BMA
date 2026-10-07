import React, { useState, useEffect } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Supplier } from '../../types';
import { X, Truck, Building2, Phone, Mail } from 'lucide-react';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierToEdit: Supplier | null;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  supplierToEdit,
}) => {
  const { addSupplier, updateSupplier, profile, t, language } = useBusiness();

  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nuit, setNuit] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('Electronics & Audio');
  const [amountOwed, setAmountOwed] = useState<number>(0);

  useEffect(() => {
    if (supplierToEdit) {
      setCompanyName(supplierToEdit.companyName);
      setContactPerson(supplierToEdit.contactPerson);
      setPhone(supplierToEdit.phone);
      setEmail(supplierToEdit.email || '');
      setNuit(supplierToEdit.nuit || '');
      setAddress(supplierToEdit.address || '');
      setCategory(supplierToEdit.category);
      setAmountOwed(supplierToEdit.amountOwed);
    } else {
      setCompanyName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setNuit('');
      setAddress('');
      setCategory('Electronics & Audio');
      setAmountOwed(0);
    }
  }, [supplierToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    if (supplierToEdit) {
      updateSupplier(supplierToEdit.id, {
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        nuit: nuit.trim() || undefined,
        address: address.trim() || undefined,
        category,
        amountOwed,
      });
    } else {
      addSupplier({
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        nuit: nuit.trim() || undefined,
        address: address.trim() || undefined,
        category,
        amountOwed,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden z-10">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">
              {supplierToEdit ? t.editSupplier : t.addNewSupplier}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              {t.supplierName}
            </label>
            <input
              type="text"
              placeholder={language === 'pt' ? 'ex: Distribuidora Central Lda' : 'e.g. Pacific Digital Distributors'}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {t.contactPerson}
              </label>
              <input
                type="text"
                placeholder={language === 'pt' ? 'ex: Carlos Santos' : 'e.g. Jason Wright'}
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {t.category}
              </label>
              <input
                type="text"
                placeholder={language === 'pt' ? 'ex: Papelaria, Bebidas, Eletrónicos' : 'e.g. Office Supplies, Audio'}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {t.phoneLabel}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {t.emailLabel}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {t.supplierNuit}
              </label>
              <input
                type="text"
                placeholder={language === 'pt' ? 'ex: 400987654' : 'e.g. 400987654'}
                value={nuit}
                onChange={(e) => setNuit(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {t.supplierAddress}
              </label>
              <input
                type="text"
                placeholder={language === 'pt' ? 'Rua, Cidade, Armazém' : 'Street, Warehouse, City'}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              {t.outstandingBalance} ({profile.currency})
            </label>
            <input
              type="number"
              min="0"
              value={amountOwed}
              onChange={(e) => setAmountOwed(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:outline-none text-rose-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              {supplierToEdit ? t.saveChanges : t.saveSupplier}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
