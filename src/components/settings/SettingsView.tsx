import React, { useState, useEffect, useRef } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Store, DollarSign, Check, Database, Globe, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { SheetsDatabasePanel } from '../sheets/SheetsDatabasePanel';
import { Language } from '../../types';

export const SettingsView: React.FC = () => {
  const { profile, updateProfile, currentRole, permissions, language, setLanguage, t } = useBusiness();
  const canAccessDatabase = currentRole === 'owner' || permissions.canManageDatabase;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [businessName, setBusinessName] = useState(profile.businessName || profile.name || '');
  const [ownerName, setOwnerName] = useState(profile.ownerName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [email, setEmail] = useState(profile.email || '');
  const [address, setAddress] = useState(profile.address || '');
  const [currency, setCurrency] = useState(profile.currency || '$');
  const [taxRate, setTaxRate] = useState<number>(profile.taxRate ?? 0);
  const [invoiceFooter, setInvoiceFooter] = useState(profile.invoiceFooter || 'Thank you for your business!');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);
  const [logo, setLogo] = useState<string>(profile.logo || '');
  const [logoError, setLogoError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'database' | 'store' | 'billing' | 'language'>(
    canAccessDatabase ? 'database' : 'store'
  );

  useEffect(() => {
    setBusinessName(profile.businessName || profile.name || '');
    setOwnerName(profile.ownerName || '');
    setPhone(profile.phone || '');
    setEmail(profile.email || '');
    setAddress(profile.address || '');
    setCurrency(profile.currency || '$');
    setTaxRate(profile.taxRate ?? 0);
    setInvoiceFooter(profile.invoiceFooter || 'Thank you for your business!');
    setSelectedLanguage(language);
    setLogo(profile.logo || '');
    setLogoError(null);
  }, [profile, language]);

  const handleLogoFile = (file: File) => {
    setLogoError(null);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoError(
        language === 'pt'
          ? 'Por favor, selecione um ficheiro de imagem válido (PNG, JPG, SVG, WebP).'
          : 'Please select a valid image file (PNG, JPG, SVG, WebP).'
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLogoError(
        language === 'pt'
          ? 'O ficheiro excede o tamanho máximo de 5MB.'
          : 'File exceeds maximum 5MB size.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;

      // Rescale high-res images to max 400x400 to keep localStorage & Google Sheets ultra-fast
      const img = new Image();
      img.onload = () => {
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const isPng = file.type === 'image/png' || result.includes('image/png');
          const dataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.9);
          setLogo(dataUrl);
        } else {
          setLogo(result);
        }
      };
      img.onerror = () => {
        setLogo(result);
      };
      img.src = result;
    };
    reader.onerror = () => {
      setLogoError(
        language === 'pt' ? 'Erro ao processar ficheiro de imagem.' : 'Error reading image file.'
      );
    };
    reader.readAsDataURL(file);
  };

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
      logo,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-2">
      {/* Header and Mobile-Optimized Tab Switcher */}
      <div className="bg-white rounded-xl p-2.5 sm:px-4 sm:py-3 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
        <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
          {canAccessDatabase ? t.settingsTitleDb : t.settingsTitleStore}
        </h1>

        {/* Tab Switcher: 4-col segmented bar on mobile, horizontal pills on sm+ */}
        <div className={`grid ${canAccessDatabase ? 'grid-cols-4' : 'grid-cols-3'} sm:flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 w-full sm:w-auto shrink-0`}>
          {canAccessDatabase && (
            <button
              type="button"
              onClick={() => setActiveTab('database')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 px-1 sm:px-2.5 text-[10px] sm:text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'database'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {language === 'pt' ? 'Banco Nuvem' : (
                  <>
                    <span className="hidden sm:inline">{t.tabCloudDatabase}</span>
                    <span className="sm:hidden">Database</span>
                  </>
                )}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('store')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 px-1 sm:px-2.5 text-[10px] sm:text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'store'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {language === 'pt' ? 'Perfil Loja' : (
                <>
                  <span className="hidden sm:inline">{t.tabStoreProfile}</span>
                  <span className="sm:hidden">Profile</span>
                </>
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 px-1 sm:px-2.5 text-[10px] sm:text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'billing'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {language === 'pt' ? 'Moeda/Taxa' : (
                <>
                  <span className="hidden sm:inline">{t.tabCurrencyTax}</span>
                  <span className="sm:hidden">Currency</span>
                </>
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('language')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 px-1 sm:px-2.5 text-[10px] sm:text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'language'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {language === 'pt' ? 'Idioma' : (
                <>
                  <span className="hidden sm:inline">{t.tabLanguage}</span>
                  <span className="sm:hidden">Language</span>
                </>
              )}
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'database' && canAccessDatabase ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <SheetsDatabasePanel />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden gap-2">
          <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-2">
            {/* Store & Contact Information */}
            <div
              className={`bg-white rounded-xl border border-slate-200 p-2.5 sm:p-4 shadow-2xs space-y-3 sm:space-y-3.5 ${
                activeTab !== 'store' ? 'hidden' : 'block'
              }`}
            >
              {/* Business Logo Upload Section */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleLogoFile(file);
                }}
                className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-2.5 sm:p-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Logo Preview or Empty Placeholder */}
                    <div className="relative group shrink-0">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shadow-2xs">
                        {logo ? (
                          <img
                            src={logo}
                            alt="Business Logo Preview"
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 p-1">
                            <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.5]" />
                            <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider mt-0.5 text-slate-400 text-center">
                              {language === 'pt' ? 'Sem Logo' : 'No Logo'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                          {language === 'pt' ? 'Logótipo da Empresa' : 'Business Brand Logo'}
                        </h3>
                        {logo && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {language === 'pt' ? 'Ativo' : 'Active'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {language === 'pt'
                          ? 'Aparece automaticamente nas Faturas, Orçamentos, Ordens de Compra e no canto superior do sistema.'
                          : 'Shown on Invoices, Quotations, Purchase Orders, and the top navigation corner.'}
                      </p>
                      {logoError && (
                        <p className="text-[10px] text-rose-600 font-semibold mt-1 animate-fadeIn">
                          {logoError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions: Upload & Remove */}
                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoFile(file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {logo
                          ? language === 'pt'
                            ? 'Alterar'
                            : 'Change'
                          : language === 'pt'
                          ? 'Carregar Logo'
                          : 'Upload Logo'}
                      </span>
                    </button>
                    {logo && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogo('');
                          setLogoError(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                        title={language === 'pt' ? 'Remover Logótipo' : 'Remove Logo'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">
                          {language === 'pt' ? 'Remover' : 'Remove'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Text Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs">
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-0.5 sm:mb-1">
                    {t.businessName} *
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-0.5 sm:mb-1">
                    {t.ownerName}
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-0.5 sm:mb-1">
                    {t.storePhone}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-0.5 sm:mb-1">
                    {t.storeEmail}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-0.5 sm:mb-1">
                    {t.storeAddress}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Currency & Invoicing Terms */}
            <div
              className={`bg-white rounded-xl border border-slate-200 p-2.5 sm:p-4 shadow-2xs space-y-2 sm:space-y-3 ${
                activeTab !== 'billing' ? 'hidden' : 'block'
              }`}
            >
              <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs">
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-0.5 sm:mb-1">
                    {t.currencySymbol}
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="$">USD ($)</option>
                    <option value="MT ">MZN (MT)</option>
                    <option value="MZN ">MZN (MZN)</option>
                    <option value="R$ ">BRL (R$)</option>
                    <option value="€">EUR (€)</option>
                    <option value="Kz ">AOA (Kz)</option>
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
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-0.5 sm:mb-1">
                    {t.salesTax}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-0.5 sm:mb-1">
                    {t.invoiceFooter}
                  </label>
                  <input
                    type="text"
                    value={invoiceFooter}
                    onChange={(e) => setInvoiceFooter(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Language Settings Card */}
            <div
              className={`bg-white rounded-xl border border-slate-200 p-2.5 sm:p-4 shadow-2xs ${
                activeTab !== 'language' ? 'hidden' : 'block'
              }`}
            >
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {/* English option */}
                <div
                  onClick={() => {
                    setSelectedLanguage('en');
                    setLanguage('en');
                  }}
                  className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    selectedLanguage === 'en'
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <span className="text-xl sm:text-2xl" role="img" aria-label="English">🇺🇸</span>
                    <span className="font-bold text-xs sm:text-sm text-slate-900">{t.english}</span>
                  </div>
                  {selectedLanguage === 'en' && (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </div>
                  )}
                </div>

                {/* Portuguese option */}
                <div
                  onClick={() => {
                    setSelectedLanguage('pt');
                    setLanguage('pt');
                  }}
                  className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    selectedLanguage === 'pt'
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <span className="text-xl sm:text-2xl" role="img" aria-label="Portuguese">🇲🇿</span>
                    <span className="font-bold text-xs sm:text-sm text-slate-900">{t.portuguese}</span>
                  </div>
                  {selectedLanguage === 'pt' && (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="bg-white rounded-xl border border-slate-200 px-3 py-2 sm:px-4 sm:py-2.5 shadow-2xs flex items-center justify-end shrink-0">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
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
