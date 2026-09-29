import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Store, DollarSign, Check, Database, Globe } from 'lucide-react';
import { SheetsDatabasePanel } from '../sheets/SheetsDatabasePanel';
import { Language } from '../../types';

export const SettingsView: React.FC = () => {
  const { profile, updateProfile, currentRole, permissions, language, setLanguage, t } = useBusiness();
  const canAccessDatabase = currentRole === 'owner' || permissions.canManageDatabase;

  const [businessName, setBusinessName] = useState(profile.businessName || profile.name);
  const [ownerName, setOwnerName] = useState(profile.ownerName || 'Alex Mercer');
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [address, setAddress] = useState(profile.address);
  const [currency, setCurrency] = useState(profile.currency);
  const [taxRate, setTaxRate] = useState<number>(profile.taxRate);
  const [invoiceFooter, setInvoiceFooter] = useState(profile.invoiceFooter || 'Thank you for your business!');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'database' | 'store' | 'billing' | 'language'>(
    canAccessDatabase ? 'database' : 'store'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLanguage(selectedLanguage);
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
      language: selectedLanguage,
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
            {canAccessDatabase ? t.settingsTitleDb : t.settingsTitleStore}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500">
            {canAccessDatabase ? t.settingsSubtitleDb : t.settingsSubtitleStore}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap bg-slate-100 p-0.5 rounded-lg shrink-0 border border-slate-200 self-start sm:self-auto gap-0.5">
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
              <Database className="w-3.5 h-3.5" />
              <span>{t.tabCloudDatabase}</span>
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
            <span>{t.tabStoreProfile}</span>
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
            <span>{t.tabCurrencyTax}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('language')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'language'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t.tabLanguage}</span>
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
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">{t.storeContactInfo}</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-0.5">
                    {t.businessName}
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
                    {t.ownerName}
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
                    {t.storePhone}
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
                    {t.storeEmail}
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
                    {t.storeAddress}
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
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">{t.currencyTerms}</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-0.5">
                    {t.currencySymbol}
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold focus:outline-none"
                  >
                    <option value="$">USD ($)</option>
                    <option value="MT ">MZN / Metical - Moçambique (MT)</option>
                    <option value="MZN ">MZN - Metical (MZN)</option>
                    <option value="R$ ">BRL - Real Brasil (R$)</option>
                    <option value="€">EUR (€) - Portugal / Europa</option>
                    <option value="Kz ">AOA - Cuanza Angola (Kz)</option>
                    <option value="£">GBP (£)</option>
                    <option value="¥">JPY / CNY (¥)</option>
                    <option value="₹">INR (₹)</option>
                    <option value="₱">PHP (₱)</option>
                    <option value="₦">NGN (₦)</option>
                    <option value="KSh ">KES (KSh)</option>
                    <option value="GH₵ ">GHS (GH₵)</option>
                    <option value="R ">ZAR (R)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-0.5">
                    {t.salesTax}
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
                    {t.invoiceFooter}
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

            {/* Language Settings Card */}
            <div
              className={`bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs space-y-3 ${
                activeTab !== 'language' ? 'hidden' : 'block'
              }`}
            >
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Globe className="w-4 h-4 text-indigo-600" />
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900">{t.languageSettings}</h2>
                  <p className="text-[11px] text-slate-500">{t.languageSubtitle}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* English option */}
                <div
                  onClick={() => {
                    setSelectedLanguage('en');
                    setLanguage('en');
                  }}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    selectedLanguage === 'en'
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl" role="img" aria-label="English">🇺🇸</span>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-900">{t.english}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{t.englishDesc}</div>
                      </div>
                    </div>
                    {selectedLanguage === 'en' && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Portuguese option */}
                <div
                  onClick={() => {
                    setSelectedLanguage('pt');
                    setLanguage('pt');
                  }}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    selectedLanguage === 'pt'
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl" role="img" aria-label="Portuguese">🇲🇿</span>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-900">{t.portuguese}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{t.portugueseDesc}</div>
                      </div>
                    </div>
                    {selectedLanguage === 'pt' && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="bg-white rounded-xl border border-slate-200 p-2 sm:p-3 shadow-2xs flex items-center justify-end shrink-0">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{t.saved}</span>
                </>
              ) : (
                <span>{t.saveChanges}</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
