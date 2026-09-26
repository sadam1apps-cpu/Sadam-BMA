import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Store, DollarSign, RotateCcw, Check, FileSpreadsheet } from 'lucide-react';
import { SheetsDatabasePanel } from '../sheets/SheetsDatabasePanel';

export const SettingsView: React.FC = () => {
  const { profile, updateProfile, resetToDemoData, currentRole, permissions } = useBusiness();
  const canAccessDatabase = currentRole === 'owner' || permissions.canManageDatabase;

  const [businessName, setBusinessName] = useState(profile.businessName || profile.name);
  const [ownerName, setOwnerName] = useState(profile.ownerName || 'Alex Mercer');
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [address, setAddress] = useState(profile.address);
  const [currency, setCurrency] = useState(profile.currency);
  const [taxRate, setTaxRate] = useState<number>(profile.taxRate);
  const [invoiceFooter, setInvoiceFooter] = useState(profile.invoiceFooter || 'Thank you for your business!');
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'database' | 'store' | 'billing'>(
    canAccessDatabase ? 'database' : 'store'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: businessName,
      businessName,
      ownerName,
      phone,
      email,
      address,
      currency,
      taxRate,
      invoiceFooter,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-2 sm:space-y-3">
      {/* Header */}
      <div className="bg-white rounded-xl p-2.5 sm:p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
        <div>
          <h1 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight">
            {canAccessDatabase ? 'Settings & Database Integration' : 'Store Settings & Profile'}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500">
            {canAccessDatabase
              ? 'Self-healing Google Sheets database, store profile, and currency setup'
              : 'Manage store contact details, tax rate, and receipt currency setup'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg shrink-0 border border-slate-200 self-start sm:self-auto">
          {canAccessDatabase && (
            <button
              type="button"
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'database'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Sheets Database</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('store')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'store'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Store Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'billing'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Currency &amp; Tax</span>
          </button>
        </div>
      </div>

      {activeTab === 'database' && canAccessDatabase ? (
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-3">
          <SheetsDatabasePanel />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden gap-2">
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-2 sm:space-y-3">
            {/* Store & Contact Information */}
            <div
              className={`bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs space-y-2.5 ${
                activeTab !== 'store' ? 'hidden' : 'block'
              }`}
            >
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Store className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">Store &amp; Contact Information</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-0.5">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-0.5">
                    Owner / Director Name
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-0.5">
                    Store Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-0.5">
                    Store Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-0.5">
                    Physical Store Address (Printed on Invoices)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Currency & Invoicing Terms */}
            <div
              className={`bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs space-y-2.5 ${
                activeTab !== 'billing' ? 'hidden' : 'block'
              }`}
            >
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">Currency &amp; Invoicing Terms</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-0.5">
                    Currency Symbol
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold focus:outline-none"
                  >
                    <option value="$">USD ($)</option>
                    <option value="€">EUR (€)</option>
                    <option value="£">GBP (£)</option>
                    <option value="¥">JPY / CNY (¥)</option>
                    <option value="₹">INR (₹)</option>
                    <option value="₱">PHP (₱)</option>
                    <option value="₦">NGN (₦)</option>
                    <option value="KSh ">KES (KSh)</option>
                    <option value="GH₵ ">GHS (GH₵)</option>
                    <option value="R ">ZAR (R)</option>
                    <option value="MT ">MZN / Metical - Mozambique (MT)</option>
                    <option value="MZN ">MZN - Mozambique Metical (MZN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-0.5">
                    Default Sales Tax (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-semibold focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-0.5">
                    Receipt Footer Disclaimer
                  </label>
                  <input
                    type="text"
                    value={invoiceFooter}
                    onChange={(e) => setInvoiceFooter(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="bg-white rounded-xl border border-slate-200 p-2 sm:p-3 shadow-2xs flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    'Restore fresh demonstration data? This resets products, sample sales, customers, and accounts.'
                  )
                ) {
                  resetToDemoData();
                }
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Reset Demo Store Data</span>
              <span className="sm:hidden">Reset Demo</span>
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
