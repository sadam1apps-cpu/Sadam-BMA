import React, { useState, useMemo } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Quotation, Sale } from '../../types';
import {
  X,
  Plus,
  Minus,
  Trash2,
  FileText,
  Printer,
  Download,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Barcode,
  Camera,
  Search,
  ShoppingCart,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Layers,
  User,
} from 'lucide-react';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import { jsPDF } from 'jspdf';

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationToView?: Quotation | null;
  onQuotationConverted?: (sale: Sale) => void;
}

export const QuotationModal: React.FC<QuotationModalProps> = ({
  isOpen,
  onClose,
  quotationToView,
  onQuotationConverted,
}) => {
  const {
    profile,
    products,
    customers,
    addQuotation,
    convertQuotationToSale,
    currentRole,
    language,
    t,
  } = useBusiness();

  const isViewMode = Boolean(quotationToView);

  // Mobile navigation tab to prevent any awkward scrolling on small screens
  const [activeMobileTab, setActiveMobileTab] = useState<'items' | 'summary'>('items');

  // Form State
  const [customerId, setCustomerId] = useState<string>('walk-in');
  const [customCustomerName, setCustomCustomerName] = useState<string>('');
  const [customCustomerPhone, setCustomCustomerPhone] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<
    Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
    }>
  >([]);

  // Search, Scanner & Catalog - matching NewSaleModal standard
  const [productSearchTerm, setProductSearchTerm] = useState<string>('');
  const [isCatalogExpanded, setIsCatalogExpanded] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [quickBarcodeInput, setQuickBarcodeInput] = useState('');
  const [scanNotification, setScanNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Financials & Validity
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(profile.taxRate || 0);
  const [validDays, setValidDays] = useState<number>(15);
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return ['All', ...Array.from(cats)];
  }, [products]);

  // Filtered products following NewSaleModal standard
  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategory !== 'All') {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (productSearchTerm.trim()) {
      const term = productSearchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          String(p.name || '').toLowerCase().includes(term) ||
          String(p.sku || '').toLowerCase().includes(term) ||
          (p.barcode != null && String(p.barcode).toLowerCase().includes(term)) ||
          String(p.category || '').toLowerCase().includes(term)
      );
    }
    return list;
  }, [products, productSearchTerm, selectedCategory]);

  if (!isOpen) return null;

  // Add Item to Quotation
  const handleAddItem = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const existingIndex = selectedItems.findIndex((i) => i.productId === productId);
    if (existingIndex > -1) {
      setSelectedItems((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setSelectedItems((prev) => [
        ...prev,
        {
          productId: prod.id,
          quantity: 1,
          unitPrice: prod.sellingPrice,
        },
      ]);
    }
  };

  // Barcode / SKU scan matching NewSaleModal standard
  const handleBarcodeScannedOrEntered = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    const found = products.find(
      (p) =>
        (p.barcode != null && String(p.barcode).trim().toLowerCase() === cleanCode.toLowerCase()) ||
        String(p.sku || '').toLowerCase() === cleanCode.toLowerCase() ||
        String(p.id || '').toLowerCase() === cleanCode.toLowerCase()
    );

    if (found) {
      handleAddItem(found.id);
      setScanNotification({
        message: `Added: "${found.name}" (${found.sku}) to quotation!`,
        type: 'success',
      });
      setQuickBarcodeInput('');
      setTimeout(() => setScanNotification(null), 3000);
    } else {
      setScanNotification({
        message: `No product found matching code "${cleanCode}". Check SKU or Barcode.`,
        type: 'error',
      });
      setTimeout(() => setScanNotification(null), 3500);
    }
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(index);
      return;
    }
    setSelectedItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, quantity } : item))
    );
  };

  const handleUpdatePrice = (index: number, unitPrice: number) => {
    setSelectedItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, unitPrice } : item))
    );
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleClearAll = () => {
    setSelectedItems([]);
  };

  // Calculations
  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * taxPercent) / 100;
  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);

  // Submit Quotation
  const handleSaveQuotation = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItems.length === 0) {
      setErrorMsg(language === 'pt' ? 'Adicione pelo menos um item ao orçamento.' : 'Please add at least one item to quotation.');
      return;
    }

    let finalCustomerName = 'Walk-in Customer';
    let finalCustomerId = '';
    let customerPhone: string | undefined = undefined;

    if (customerId === 'new') {
      if (!customCustomerName.trim()) {
        setErrorMsg(language === 'pt' ? 'Informe o nome do cliente.' : 'Please enter customer name.');
        return;
      }
      finalCustomerName = customCustomerName.trim();
      customerPhone = customCustomerPhone.trim() || undefined;
    } else if (customerId !== 'walk-in') {
      const existing = customers.find((c) => c.id === customerId);
      if (existing) {
        finalCustomerId = existing.id;
        finalCustomerName = existing.name;
        customerPhone = existing.phone;
      }
    }

    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + validDays);
    const validUntil = validUntilDate.toISOString().slice(0, 10);

    const quoteItems = selectedItems.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        productName: prod?.name || 'Product',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.quantity * item.unitPrice,
      };
    });

    addQuotation({
      customerId: finalCustomerId,
      customerName: finalCustomerName,
      customerPhone,
      items: quoteItems,
      subtotal,
      discountAmount,
      taxAmount,
      total: grandTotal,
      status: 'sent',
      validUntil,
      cashierName: currentRole === 'owner' ? 'Alex Mercer (Owner)' : 'Staff Member',
      notes: notes.trim() || undefined,
    });

    handleClose();
  };

  const handleClose = () => {
    setCustomerId('walk-in');
    setCustomCustomerName('');
    setCustomCustomerPhone('');
    setSelectedItems([]);
    setProductSearchTerm('');
    setErrorMsg('');
    setActiveMobileTab('items');
    onClose();
  };

  const handleConvert = (quoteId: string) => {
    const createdSale = convertQuotationToSale(quoteId);
    if (createdSale && onQuotationConverted) {
      onQuotationConverted(createdSale);
    }
    onClose();
  };

  // PDF Generation for View Mode
  const handleDownloadPdf = () => {
    if (!quotationToView) return;
    try {
      setIsGeneratingPdf(true);
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 18;
      let y = profile.logo ? 14 : 22;

      // Business Logo
      if (profile.logo) {
        try {
          const logoW = 20;
          const logoH = 20;
          doc.addImage(profile.logo, (pageWidth - logoW) / 2, y, logoW, logoH);
          y += logoH + 3;
        } catch (e) {
          console.warn('PDF logo render error:', e);
        }
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      const storeName = (profile.name || profile.businessName || 'Business Store').toUpperCase();
      doc.text(storeName, pageWidth / 2, y, { align: 'center' });
      y += 6;

      if (profile.address) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(profile.address, pageWidth / 2, y, { align: 'center' });
        y += 5;
      }

      if (profile.phone || profile.email) {
        doc.setFontSize(8.5);
        const contact = [profile.phone, profile.email].filter(Boolean).join(' • ');
        doc.text(contact, pageWidth / 2, y, { align: 'center' });
        y += 8;
      }

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(79, 70, 229);
      doc.text(language === 'pt' ? 'ORÇAMENTO COMERCIAL' : 'PRICE QUOTATION', margin, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `${language === 'pt' ? 'Nº' : 'Quote #'}: ${quotationToView.quotationNumber}`,
        pageWidth - margin,
        y,
        { align: 'right' }
      );
      y += 6;

      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const createdDate = new Date(quotationToView.timestamp).toLocaleDateString(
        language === 'pt' ? 'pt-PT' : 'en-US'
      );
      doc.text(`${language === 'pt' ? 'Data Emissão' : 'Date'}: ${createdDate}`, margin, y);
      doc.text(
        `${language === 'pt' ? 'Válido até' : 'Valid Until'}: ${quotationToView.validUntil}`,
        pageWidth - margin,
        y,
        { align: 'right' }
      );
      y += 5;

      doc.text(
        `${language === 'pt' ? 'Cliente' : 'Customer'}: ${quotationToView.customerName}`,
        margin,
        y
      );
      if (quotationToView.customerPhone) {
        doc.text(
          `${language === 'pt' ? 'Telefone' : 'Tel'}: ${quotationToView.customerPhone}`,
          pageWidth - margin,
          y,
          { align: 'right' }
        );
      }
      y += 8;

      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(language === 'pt' ? 'ARTIGO' : 'DESCRIPTION', margin + 3, y + 5);
      doc.text(language === 'pt' ? 'QTD' : 'QTY', margin + 90, y + 5, { align: 'right' });
      doc.text(language === 'pt' ? 'PREÇO' : 'PRICE', margin + 125, y + 5, { align: 'right' });
      doc.text(language === 'pt' ? 'TOTAL' : 'TOTAL', pageWidth - margin - 3, y + 5, { align: 'right' });
      y += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);

      quotationToView.items.forEach((item) => {
        doc.text(item.productName, margin + 3, y);
        doc.text(String(item.quantity), margin + 90, y, { align: 'right' });
        doc.text(`${profile.currency}${item.unitPrice.toLocaleString()}`, margin + 125, y, {
          align: 'right',
        });
        doc.text(`${profile.currency}${item.subtotal.toLocaleString()}`, pageWidth - margin - 3, y, {
          align: 'right',
        });
        y += 6;
      });

      y += 4;
      doc.line(margin, y, pageWidth - margin, y);
      y += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`${language === 'pt' ? 'Subtotal' : 'Subtotal'}:`, margin + 110, y);
      doc.text(`${profile.currency}${quotationToView.subtotal.toLocaleString()}`, pageWidth - margin - 3, y, {
        align: 'right',
      });
      y += 5;

      if (quotationToView.discountAmount > 0) {
        doc.text(`${language === 'pt' ? 'Desconto' : 'Discount'}:`, margin + 110, y);
        doc.text(`-${profile.currency}${quotationToView.discountAmount.toLocaleString()}`, pageWidth - margin - 3, y, {
          align: 'right',
        });
        y += 5;
      }

      if (quotationToView.taxAmount > 0) {
        doc.text(`${language === 'pt' ? 'Imposto' : 'Tax'}:`, margin + 110, y);
        doc.text(`${profile.currency}${quotationToView.taxAmount.toLocaleString()}`, pageWidth - margin - 3, y, {
          align: 'right',
        });
        y += 5;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${language === 'pt' ? 'TOTAL GERAL' : 'TOTAL'}:`, margin + 110, y + 1);
      doc.text(`${profile.currency}${quotationToView.total.toLocaleString()}`, pageWidth - margin - 3, y + 1, {
        align: 'right',
      });
      y += 12;

      if (quotationToView.notes) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`${language === 'pt' ? 'Observações' : 'Notes'}: ${quotationToView.notes}`, margin, y);
        y += 6;
      }

      doc.save(`Quotation_${quotationToView.quotationNumber}.pdf`);
      setIsGeneratingPdf(false);
    } catch (err) {
      console.error(err);
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-3 md:p-6 bg-slate-950/80 backdrop-blur-sm overflow-hidden select-none">
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[94vh] max-h-[850px] flex flex-col overflow-hidden z-10 animate-fadeIn">
        
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3.5 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs shrink-0">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-base font-bold text-white truncate">
                  {isViewMode
                    ? `${language === 'pt' ? 'Orçamento' : 'Quotation'} ${quotationToView?.quotationNumber}`
                    : language === 'pt'
                    ? 'Novo Orçamento Comercial'
                    : 'New Quotation / Estimate'}
                </h2>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {isViewMode ? 'Preview & Print' : 'Estimate Draft'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isViewMode && (
              <div className="text-right hidden sm:block">
                <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Live Total</span>
                <span className="text-sm font-black text-indigo-400">
                  {profile.currency}{grandTotal.toLocaleString()}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="px-4 py-2 bg-rose-50 border-b border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2 shrink-0 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="truncate">{errorMsg}</span>
          </div>
        )}

        {/* VIEW MODE: High-density preview */}
        {isViewMode && quotationToView ? (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-3.5 text-xs sm:text-sm print:p-0 no-scrollbar">
              {/* Store & Quote Meta Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  {profile.logo && (
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                      <img
                        src={profile.logo}
                        alt={profile.name || 'Store Logo'}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      {profile.name || 'Store'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {profile.address || ''} {profile.phone ? `• ${profile.phone}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="flex items-center sm:justify-end gap-1.5">
                    <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg text-xs font-mono">
                      {quotationToView.quotationNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        quotationToView.status === 'converted'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : quotationToView.status === 'accepted'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {quotationToView.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {language === 'pt' ? 'Válido até' : 'Valid Until'}:{' '}
                    <strong className="text-slate-700">{quotationToView.validUntil}</strong>
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {quotationToView.customerName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {quotationToView.customerPhone || (language === 'pt' ? 'Sem telefone' : 'No phone')}
                    </div>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  {language === 'pt' ? 'Preparado por' : 'Prepared by'}:{' '}
                  <span className="font-bold text-slate-700">{quotationToView.cashierName}</span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Price</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {quotationToView.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-semibold text-slate-900">{it.productName}</td>
                        <td className="px-3 py-2 text-right text-slate-600">{it.quantity}</td>
                        <td className="px-3 py-2 text-right text-slate-600">
                          {profile.currency}
                          {it.unitPrice.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900">
                          {profile.currency}
                          {it.subtotal.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Box */}
              <div className="flex justify-end">
                <div className="w-full sm:w-64 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs shadow-2xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold">
                      {profile.currency}
                      {quotationToView.subtotal.toLocaleString()}
                    </span>
                  </div>
                  {quotationToView.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Discount:</span>
                      <span className="font-semibold">
                        -{profile.currency}
                        {quotationToView.discountAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {quotationToView.taxAmount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax:</span>
                      <span className="font-semibold">
                        {profile.currency}
                        {quotationToView.taxAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-1.5 flex justify-between text-sm font-black text-slate-900">
                    <span>Total Quoted:</span>
                    <span className="text-indigo-600">
                      {profile.currency}
                      {quotationToView.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {quotationToView.notes && (
                <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  <span className="font-bold text-slate-700">Notes:</span> {quotationToView.notes}
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isGeneratingPdf ? 'Generating...' : 'PDF'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {quotationToView.status !== 'converted' ? (
                  <button
                    type="button"
                    onClick={() => handleConvert(quotationToView.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{language === 'pt' ? 'Converter em Venda' : 'Convert to Sale'}</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                    {language === 'pt' ? 'Convertido em Venda' : 'Converted to Invoice'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* CREATE MODE FORM: ZERO-SCROLL RESPONSIVE VIEW WITH MOBILE TABS */
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            
            {/* Mobile Tab Selector (only visible on mobile/tablets < lg) */}
            <div className="lg:hidden flex border-b border-slate-200 bg-slate-100 p-1 shrink-0">
              <button
                type="button"
                onClick={() => setActiveMobileTab('items')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeMobileTab === 'items'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{language === 'pt' ? 'Itens & Produtos' : 'Items & Scan'}</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-indigo-100 text-indigo-700 font-bold">
                  {selectedItems.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMobileTab('summary')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeMobileTab === 'summary'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{language === 'pt' ? 'Resumo & Salvar' : 'Summary & Save'}</span>
                <span className="text-[11px] font-black text-indigo-600">
                  {profile.currency}{grandTotal.toLocaleString()}
                </span>
              </button>
            </div>

            <form onSubmit={handleSaveQuotation} className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 overflow-hidden">
              
              {/* ======================================================== */}
              {/* LEFT PANE: Customer, Barcode, Search/Catalog, Line Items */}
              {/* ======================================================== */}
              <div
                className={`lg:col-span-7 flex flex-col min-h-0 h-full border-b lg:border-b-0 lg:border-r border-slate-200 bg-white p-2.5 sm:p-4 space-y-2.5 overflow-hidden ${
                  activeMobileTab === 'items' ? 'flex' : 'hidden lg:flex'
                }`}
              >
                {/* Customer & Barcode Quick Section (Following NewSaleModal standard) */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 shrink-0">
                  
                  {/* Customer Selector */}
                  <div className="sm:col-span-6 bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-200">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      {t.customerAccount}
                    </label>
                    <select
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="walk-in">{t.walkInCustomer}</option>
                      {customers
                        .filter((c) => c.id !== 'walk-in' && !c.name.toLowerCase().includes('walk-in'))
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.phone ? `(${c.phone})` : ''}
                          </option>
                        ))}
                      <option value="new">+ {language === 'pt' ? 'Novo Cliente' : 'New Customer Account'}</option>
                    </select>

                    {customerId === 'new' && (
                      <div className="mt-1.5 grid grid-cols-2 gap-1 animate-fadeIn">
                        <input
                          type="text"
                          placeholder="Client Name *"
                          value={customCustomerName}
                          onChange={(e) => setCustomCustomerName(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-1"
                          required
                        />
                        <input
                          type="tel"
                          placeholder="Phone"
                          value={customCustomerPhone}
                          onChange={(e) => setCustomCustomerPhone(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-1"
                        />
                      </div>
                    )}
                  </div>

                  {/* Barcode / SKU Scan Bar (Standard from NewSaleModal) */}
                  <div className="sm:col-span-6 bg-indigo-50/60 p-2 sm:p-2.5 rounded-xl border border-indigo-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                        <Barcode className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{t.barcode} / SKU</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsBarcodeScannerOpen(true)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
                      >
                        <Camera className="w-3 h-3" />
                        <span>{language === 'pt' ? 'Câmera' : 'Camera'}</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder={t.barcodePrompt}
                        value={quickBarcodeInput}
                        onChange={(e) => setQuickBarcodeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleBarcodeScannedOrEntered(quickBarcodeInput);
                          }
                        }}
                        className="flex-1 bg-white border border-indigo-200 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleBarcodeScannedOrEntered(quickBarcodeInput)}
                        disabled={!quickBarcodeInput.trim()}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                      >
                        {language === 'pt' ? '+ Adicionar' : '+ Add'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scan Notification Alert */}
                {scanNotification && (
                  <div
                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 animate-fadeIn ${
                      scanNotification.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {scanNotification.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    )}
                    <span className="truncate text-[11px]">{scanNotification.message}</span>
                  </div>
                )}

                {/* Product Quick-Search & Compact Catalog (Standard from NewSaleModal) */}
                <div className="bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-200 shrink-0 space-y-2">
                  <div className="flex items-center gap-2">
                    {/* Search Input */}
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder={t.searchProductPlaceholder}
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (filteredProducts.length > 0) {
                              const firstProd = filteredProducts[0];
                              handleAddItem(firstProd.id);
                              setScanNotification({
                                message: `Added: "${firstProd.name}" (${profile.currency}${firstProd.sellingPrice})`,
                                type: 'success',
                              });
                              setTimeout(() => setScanNotification(null), 2500);
                              setProductSearchTerm('');
                            }
                          }
                        }}
                        className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                      {productSearchTerm && (
                        <button
                          type="button"
                          onClick={() => setProductSearchTerm('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Catalog Toggle button */}
                    <button
                      type="button"
                      onClick={() => setIsCatalogExpanded((prev) => !prev)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                        isCatalogExpanded
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                      title="Toggle product catalog"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t.browseCatalog}</span>
                      <span className="sm:hidden">{t.browseCatalog}</span>
                      <span className="text-[10px] opacity-80">({products.length})</span>
                      {isCatalogExpanded ? (
                        <ChevronUp className="w-3 h-3 ml-0.5" />
                      ) : (
                        <ChevronDown className="w-3 h-3 ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Instant Search Results Tray (when actively searching) */}
                  {productSearchTerm.trim().length > 0 && (
                    <div className="bg-white rounded-xl border border-indigo-200 shadow-sm max-h-40 overflow-y-auto divide-y divide-slate-100 animate-fadeIn no-scrollbar">
                      {filteredProducts.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-500">
                          {language === 'pt' ? 'Nenhum produto encontrado com' : 'No products found matching'} &ldquo;{productSearchTerm}&rdquo;
                        </div>
                      ) : (
                        filteredProducts.map((prod) => (
                          <div
                            key={prod.id}
                            onClick={() => {
                              handleAddItem(prod.id);
                              setScanNotification({
                                message: `Added: "${prod.name}"`,
                                type: 'success',
                              });
                              setTimeout(() => setScanNotification(null), 2500);
                              setProductSearchTerm('');
                            }}
                            className="flex items-center justify-between p-2 px-3 hover:bg-indigo-50/70 transition-colors cursor-pointer"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {prod.name}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 rounded">
                                  {prod.sku}
                                </span>
                                {prod.category && (
                                  <span className="text-[10px] text-slate-600 bg-slate-100 px-1 rounded hidden sm:inline">
                                    {prod.category}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                <span>Stock: {prod.stock} {prod.unit}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-black text-indigo-600">
                                {profile.currency}{prod.sellingPrice.toLocaleString()}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddItem(prod.id);
                                  setScanNotification({
                                    message: `Added: "${prod.name}"`,
                                    type: 'success',
                                  });
                                  setTimeout(() => setScanNotification(null), 2500);
                                  setProductSearchTerm('');
                                }}
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                {language === 'pt' ? '+ Adicionar' : '+ Add'}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Expanded Catalog Browser (only when toggled and not searching) */}
                  {isCatalogExpanded && !productSearchTerm.trim() && (
                    <div className="space-y-1.5 pt-1.5 border-t border-slate-200 animate-fadeIn">
                      {/* Category Pills */}
                      {categories.length > 2 && (
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                          {categories.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setSelectedCategory(cat)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                                selectedCategory === cat
                                  ? 'bg-indigo-600 text-white shadow-2xs'
                                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Compact High-Density Product Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-32 overflow-y-auto no-scrollbar pr-0.5">
                        {filteredProducts.map((prod) => (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => handleAddItem(prod.id)}
                            className="text-left p-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 bg-white transition-all cursor-pointer shadow-2xs"
                          >
                            <div className="text-[11px] font-bold text-slate-900 truncate">
                              {prod.name}
                            </div>
                            <div className="flex items-center justify-between mt-0.5 text-[10px]">
                              <span className="font-bold text-indigo-600">
                                {profile.currency}{prod.sellingPrice}
                              </span>
                              <span className="text-slate-500">
                                {prod.stock} {prod.unit}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ======================================================== */}
                {/* LINE ITEMS (Bounded height, Zero screen-scroll) */}
                {/* ======================================================== */}
                <div className="flex-1 min-h-[140px] flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                  {/* Header with counter and clear */}
                  <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1.5">
                      <ShoppingCart className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                        {language === 'pt' ? 'Artigos do Orçamento' : 'Selected Items'} ({selectedItems.length})
                      </span>
                    </div>
                    {selectedItems.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                      >
                        {language === 'pt' ? 'Limpar Todos' : 'Clear All'}
                      </button>
                    )}
                  </div>

                  {/* Scrollable Items Container */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1 sm:p-2 space-y-1">
                    {selectedItems.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center h-full">
                        <ShoppingCart className="w-8 h-8 text-slate-300 mb-1.5" />
                        <span>{language === 'pt' ? 'Nenhum artigo adicionado ao orçamento.' : 'No items added yet.'}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          {language === 'pt' ? 'Leia o código de barras ou use a busca para adicionar artigos.' : 'Scan barcode or search products above to add items.'}
                        </span>
                      </div>
                    ) : (
                      selectedItems.map((item, idx) => {
                        const prod = products.find((p) => p.id === item.productId)!;
                        const lineTotal = item.quantity * item.unitPrice;

                        return (
                          <div
                            key={idx}
                            className="bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl p-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                          >
                            {/* Product Info */}
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-slate-900 truncate block">
                                {prod?.name || 'Product'}
                              </span>
                              <div className="text-[10px] text-slate-500 font-mono truncate">
                                SKU: {prod?.sku} • Stock: {prod?.stock || 0} {prod?.unit || ''}
                              </div>
                            </div>

                            {/* Stepper, Price, Subtotal, Delete */}
                            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                              {/* Quantity Stepper */}
                              <div className="inline-flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(idx, item.quantity - 1)}
                                  className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold text-xs"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleUpdateQuantity(idx, parseInt(e.target.value) || 1)
                                  }
                                  className="w-9 text-center text-xs font-bold py-0.5 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(idx, item.quantity + 1)}
                                  className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold text-xs"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Editable Unit Price */}
                              <div className="inline-flex items-center text-xs">
                                <span className="text-[10px] text-slate-400 mr-0.5">{profile.currency}</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={item.unitPrice}
                                  onChange={(e) =>
                                    handleUpdatePrice(idx, parseFloat(e.target.value) || 0)
                                  }
                                  className="w-16 text-right text-xs font-semibold border border-slate-300 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>

                              {/* Subtotal */}
                              <div className="text-right font-extrabold text-xs text-slate-900 w-16 truncate">
                                {profile.currency}{lineTotal.toLocaleString()}
                              </div>

                              {/* Trash Button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Mobile Bottom Prompt (Only on < lg screens to jump to summary without scrolling) */}
                <div className="lg:hidden pt-2 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Quotation Total</span>
                    <span className="text-sm font-black text-indigo-600 truncate block">
                      {profile.currency}{grandTotal.toLocaleString()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveMobileTab('summary')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-500 cursor-pointer"
                  >
                    <span>{language === 'pt' ? 'Ver Resumo' : 'Review & Finalize'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* ======================================================== */}
              {/* RIGHT PANE: Proposal Parameters, Totals, Actions */}
              {/* ======================================================== */}
              <div
                className={`lg:col-span-5 flex flex-col justify-between bg-slate-50 p-2.5 sm:p-4 space-y-2.5 overflow-y-auto ${
                  activeMobileTab === 'summary' ? 'flex' : 'hidden lg:flex'
                }`}
              >
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    {language === 'pt' ? 'Condições do Orçamento' : 'Quotation Parameters'}
                  </span>

                  {/* Validity Period */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {language === 'pt' ? 'Validade da Proposta' : 'Offer Validity'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {language === 'pt' ? 'Período de preço garantido' : 'Guaranteed pricing period'}
                        </div>
                      </div>
                    </div>
                    <select
                      value={validDays}
                      onChange={(e) => setValidDays(parseInt(e.target.value) || 15)}
                      className="p-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    >
                      <option value={7}>7 {language === 'pt' ? 'Dias' : 'Days'}</option>
                      <option value={15}>15 {language === 'pt' ? 'Dias' : 'Days'}</option>
                      <option value={30}>30 {language === 'pt' ? 'Dias' : 'Days'}</option>
                      <option value={60}>60 {language === 'pt' ? 'Dias' : 'Days'}</option>
                    </select>
                  </div>

                  {/* Discount & Tax */}
                  <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        {t.discount} (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercent}
                        onChange={(e) =>
                          setDiscountPercent(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))
                        }
                        className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        {t.tax} (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={taxPercent}
                        onChange={(e) =>
                          setTaxPercent(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))
                        }
                        className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                      />
                    </div>
                  </div>

                  {/* Notes & Commercial Terms */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      {language === 'pt' ? 'Notas Comerciais / Garantia' : 'Commercial Notes / Terms'}
                    </label>
                    <input
                      type="text"
                      placeholder={language === 'pt' ? 'Ex: 1 ano de garantia, entrega incluída...' : 'e.g. 1 year warranty, delivery included...'}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Calculations Summary Box */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs shadow-2xs">
                    <div className="flex justify-between text-slate-600">
                      <span>{t.subtotal} ({selectedItems.length} {language === 'pt' ? 'artigos' : 'items'}):</span>
                      <span className="font-semibold text-slate-900">{profile.currency}{subtotal.toLocaleString()}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>{t.discount} ({discountPercent}%):</span>
                        <span className="font-semibold">-{profile.currency}{discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {taxAmount > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>{t.tax} ({taxPercent}%):</span>
                        <span className="font-semibold">+{profile.currency}{taxAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="border-t-2 border-slate-200 pt-2 flex justify-between items-center text-sm font-extrabold text-slate-900">
                      <span>{language === 'pt' ? 'Total do Orçamento:' : 'Grand Total:'}</span>
                      <span className="text-base sm:text-lg font-black text-indigo-600">
                        {profile.currency}{grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pinned Action Buttons (Always visible!) */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeMobileTab === 'summary') {
                        setActiveMobileTab('items');
                      } else {
                        handleClose();
                      }
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <span className="lg:hidden">← {language === 'pt' ? 'Voltar' : 'Back to Items'}</span>
                    <span className="hidden lg:inline">{t.cancel}</span>
                  </button>
                  <button
                    type="submit"
                    disabled={selectedItems.length === 0}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FileText className="w-4 h-4" />
                    <span>
                      {language === 'pt' ? 'Salvar Orçamento' : 'Save Quotation'} ({profile.currency}{grandTotal.toLocaleString()})
                    </span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        )}

      </div>

      {/* Barcode Camera Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onScan={(code) => handleBarcodeScannedOrEntered(code)}
        title="Quotation Barcode Scanner"
        subtitle="Align product barcode to add directly to quotation"
        allowContinuous={true}
        quickSampleCodes={products.slice(0, 8).map((p) => ({
          code: p.barcode || p.sku,
          label: p.name,
        }))}
      />
    </div>
  );
};
