import React, { useState, useMemo } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { InvoiceItem, Sale } from '../../types';
import {
  X,
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  Receipt,
  User,
  CreditCard,
  Wallet,
  Landmark,
  FileCheck,
  Barcode,
  Camera,
  CheckCircle2,
  AlertCircle,
  Search,
  ShoppingCart,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleCreated: (sale: Sale) => void;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({
  isOpen,
  onClose,
  onSaleCreated,
}) => {
  const {
    profile,
    products,
    customers,
    addSale,
    currentRole,
    permissions,
  } = useBusiness();

  const [customerId, setCustomerId] = useState<string>('cust-7'); // default Walk-in Retail Customer
  const [customCustomerName, setCustomCustomerName] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<
    Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
    }>
  >([]);

  const [productSearchTerm, setProductSearchTerm] = useState<string>('');
  const [isCatalogExpanded, setIsCatalogExpanded] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'pos_card' | 'credit'>('cash');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [quickBarcodeInput, setQuickBarcodeInput] = useState('');
  const [scanNotification, setScanNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return ['All', ...Array.from(cats)];
  }, [products]);

  // Filter products by search term and category (Hook called unconditionally on every render)
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

  const handleAddItem = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    // If item already in cart, increment quantity
    const existingIndex = selectedItems.findIndex((i) => i.productId === productId);
    if (existingIndex > -1) {
      setSelectedItems((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
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
      if (found.stock <= 0) {
        setScanNotification({
          message: `Warning: "${found.name}" is out of stock (0 ${found.unit}). Added to invoice anyway.`,
          type: 'error',
        });
      } else {
        setScanNotification({
          message: `Added: "${found.name}" (${found.sku}) to invoice!`,
          type: 'success',
        });
      }
      handleAddItem(found.id);
      setQuickBarcodeInput('');
      setTimeout(() => setScanNotification(null), 3000);
    } else {
      setScanNotification({
        message: `No product found matching code "${cleanCode}". Check SKU or Barcode.`,
        type: 'error',
      });
      setTimeout(() => setScanNotification(null), 4000);
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
      prev.map((item, idx) => (idx === index ? { ...item, unitPrice: Math.max(0, unitPrice) } : item))
    );
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleClearAll = () => {
    setSelectedItems([]);
  };

  // Calculations
  const invoiceItems: InvoiceItem[] = selectedItems.map((si) => {
    const prod = products.find((p) => p.id === si.productId);
    return {
      productId: prod?.id || si.productId,
      productName: prod?.name || 'Item',
      quantity: si.quantity,
      unitCost: prod?.costPrice || 0,
      unitPrice: si.unitPrice,
      subtotal: si.quantity * si.unitPrice,
    };
  });

  const subtotal = invoiceItems.reduce((acc, item) => acc + item.subtotal, 0);
  const discountAmount = permissions.canGiveDiscounts
    ? (subtotal * discountPercent) / 100
    : 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * taxPercent) / 100;
  const grandTotal = taxableAmount + taxAmount;

  // Amount paid logic
  const numericAmountPaid =
    amountPaidInput === ''
      ? paymentMethod === 'credit'
        ? 0
        : grandTotal
      : parseFloat(amountPaidInput) || 0;

  const balanceDue = Math.max(0, grandTotal - numericAmountPaid);
  const changeGiven = numericAmountPaid > grandTotal ? numericAmountPaid - grandTotal : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (selectedItems.length === 0) {
      setErrorMsg('Please add at least one product item to the invoice.');
      return;
    }

    // Check stock quantities
    for (const item of selectedItems) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod && item.quantity > prod.stock) {
        setErrorMsg(
          `Requested quantity for "${prod.name}" (${item.quantity}) exceeds currently available stock (${prod.stock}).`
        );
        return;
      }
    }

    // Customer details
    let finalCustomerName = 'Walk-in Retail Customer';
    let customerPhone: string | undefined = undefined;

    if (customerId === 'new') {
      if (!customCustomerName.trim()) {
        setErrorMsg('Please enter customer name or select an existing customer.');
        return;
      }
      finalCustomerName = customCustomerName.trim();
    } else {
      const existing = customers.find((c) => c.id === customerId);
      if (existing) {
        finalCustomerName = existing.name;
        customerPhone = existing.phone;
      }
    }

    // Payment status
    let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'paid';
    if (balanceDue === grandTotal) {
      paymentStatus = 'unpaid';
    } else if (balanceDue > 0) {
      paymentStatus = 'partial';
    }

    const createdSale = addSale({
      customerId: customerId === 'new' ? '' : customerId,
      customerName: finalCustomerName,
      customerPhone,
      items: invoiceItems,
      subtotal,
      discountAmount,
      taxAmount,
      total: grandTotal,
      amountPaid: Math.min(numericAmountPaid, grandTotal),
      balanceDue,
      paymentMethod,
      paymentStatus,
      cashierName: currentRole === 'owner' ? 'Alex Mercer (Owner)' : 'Staff Member',
      notes: notes.trim() || undefined,
    });

    onSaleCreated(createdSale);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-3 md:p-6 bg-slate-950/80 backdrop-blur-sm overflow-hidden select-none">
      
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[95vh] max-h-[95vh] flex flex-col overflow-hidden z-10 animate-fadeIn">
        
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3.5 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs shrink-0">
              <Receipt className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-base font-bold text-white truncate">
                  Create New Sale &amp; Invoice
                </h2>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  POS Terminal
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Live Total</span>
              <span className="text-sm font-black text-indigo-400">
                {profile.currency}{grandTotal.toLocaleString()}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
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
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="truncate">{errorMsg}</span>
          </div>
        )}

        {/* Form Container (Dual-column on desktop/tablet, stacked with fixed bounded sections on mobile) */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 overflow-hidden">
          
          {/* ======================================================== */}
          {/* LEFT PANE: Customer, Barcode, Catalog, Line Items */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 flex flex-col min-h-0 h-full border-b lg:border-b-0 lg:border-r border-slate-200 bg-white overflow-y-auto lg:overflow-hidden p-2.5 sm:p-4 space-y-2.5 sm:space-y-3">
            
            {/* Customer & Barcode Quick Section */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 shrink-0">
              
              {/* Customer Selector */}
              <div className="sm:col-span-6 bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-200">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Customer Account
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.outstandingDebt > 0 ? `(Debt: ${profile.currency}${c.outstandingDebt})` : ''}
                    </option>
                  ))}
                  <option value="new">+ Enter New Customer Name</option>
                </select>
                {customerId === 'new' && (
                  <input
                    type="text"
                    placeholder="Enter customer name..."
                    value={customCustomerName}
                    onChange={(e) => setCustomCustomerName(e.target.value)}
                    className="w-full mt-1 text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                )}
              </div>

              {/* Barcode / SKU Scan Bar */}
              <div className="sm:col-span-6 bg-indigo-50/60 p-2 sm:p-2.5 rounded-xl border border-indigo-100 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                    <Barcode className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Barcode / SKU</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsBarcodeScannerOpen(true)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Camera</span>
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="Scan or type barcode & Enter..."
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
                    + Add
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

            {/* Product Quick-Search & Compact Catalog */}
            <div className="bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-200 shrink-0 space-y-2">
              <div className="flex items-center gap-2">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search product name, SKU, or barcode to add..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (filteredProducts.length > 0) {
                          const firstAvailable = filteredProducts.find((p) => p.stock > 0) || filteredProducts[0];
                          handleAddItem(firstAvailable.id);
                          setScanNotification({
                            message: `Added: "${firstAvailable.name}" (${profile.currency}${firstAvailable.sellingPrice})`,
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

                {/* Catalog Toggle button (prevents products from taking up unnecessary space) */}
                <button
                  type="button"
                  onClick={() => setIsCatalogExpanded((prev) => !prev)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    isCatalogExpanded
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                  title="Toggle full product catalog browsing"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Browse Catalog</span>
                  <span className="sm:hidden">Catalog</span>
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
                <div className="bg-white rounded-xl border border-indigo-200 shadow-sm max-h-44 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
                  {filteredProducts.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      No products found matching &ldquo;{productSearchTerm}&rdquo;
                    </div>
                  ) : (
                    filteredProducts.map((prod) => {
                      const isOutOfStock = prod.stock <= 0;
                      return (
                        <div
                          key={prod.id}
                          onClick={() => {
                            if (!isOutOfStock) {
                              handleAddItem(prod.id);
                              setScanNotification({
                                message: `Added: "${prod.name}"`,
                                type: 'success',
                              });
                              setTimeout(() => setScanNotification(null), 2500);
                              setProductSearchTerm('');
                            }
                          }}
                          className={`flex items-center justify-between p-2 px-3 hover:bg-indigo-50/70 transition-colors cursor-pointer ${
                            isOutOfStock ? 'opacity-50 cursor-not-allowed bg-slate-50/60' : ''
                          }`}
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
                            <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span
                                className={`font-semibold ${
                                  isOutOfStock
                                    ? 'text-rose-600'
                                    : prod.stock <= prod.minStockAlert
                                    ? 'text-amber-600'
                                    : 'text-emerald-700'
                                }`}
                              >
                                {isOutOfStock ? 'Out of Stock' : `${prod.stock} ${prod.unit} left`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-black text-indigo-600">
                              {profile.currency}{prod.sellingPrice.toLocaleString()}
                            </span>
                            <button
                              type="button"
                              disabled={isOutOfStock}
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
                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              + Add
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Expanded Catalog Browser (only when toggled open and not actively searching) */}
              {isCatalogExpanded && !productSearchTerm.trim() && (
                <div className="space-y-2 pt-1.5 border-t border-slate-200 animate-fadeIn">
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto no-scrollbar pr-0.5">
                    {filteredProducts.map((prod) => {
                      const isOutOfStock = prod.stock <= 0;
                      return (
                        <button
                          key={prod.id}
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => handleAddItem(prod.id)}
                          className={`text-left p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isOutOfStock
                              ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                              : 'bg-white hover:bg-indigo-50 border-slate-200 hover:border-indigo-300 shadow-2xs'
                          }`}
                        >
                          <div className="text-[11px] font-bold text-slate-900 truncate">
                            {prod.name}
                          </div>
                          <div className="flex items-center justify-between mt-0.5 text-[10px]">
                            <span className="font-bold text-indigo-600">
                              {profile.currency}{prod.sellingPrice}
                            </span>
                            <span
                              className={`font-semibold ${
                                isOutOfStock
                                  ? 'text-rose-600'
                                  : prod.stock <= prod.minStockAlert
                                  ? 'text-amber-600'
                                  : 'text-slate-500'
                              }`}
                            >
                              {isOutOfStock ? '0' : prod.stock} {prod.unit}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* INVOICE LINE ITEMS (Scrollable Window - Solves Long Lists!) */}
            {/* ======================================================== */}
            <div className="flex-1 min-h-[160px] flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              
              {/* Header with counter and clear action */}
              <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Selected Items ({selectedItems.length})
                  </span>
                </div>
                {selectedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {/* Bounded Scrollable Items Container (NO MORE ENDLESS PAGE EXPANSION) */}
              <div className="flex-1 overflow-y-auto max-h-[220px] sm:max-h-[260px] lg:max-h-none divide-y divide-slate-100">
                {selectedItems.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center h-full">
                    <ShoppingCart className="w-8 h-8 text-slate-300 mb-1.5" />
                    <span>No products added yet.</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Click any item from the catalog or scan barcode to add.
                    </span>
                  </div>
                ) : (
                  <div className="p-1 sm:p-2 space-y-1 sm:space-y-1.5">
                    {selectedItems.map((item, idx) => {
                      const prod = products.find((p) => p.id === item.productId)!;
                      const lineTotal = item.quantity * item.unitPrice;
                      const hasStockWarning = item.quantity > prod.stock;

                      return (
                        <div
                          key={idx}
                          className="bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl p-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                        >
                          {/* Item Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between sm:justify-start gap-2">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {prod.name}
                              </span>
                              {hasStockWarning && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700">
                                  Exceeds Stock ({prod.stock})
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono truncate">
                              SKU: {prod.sku} • Stock: {prod.stock} {prod.unit}
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
                                max={prod.stock}
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
                                className="w-14 text-right text-xs font-semibold border border-slate-300 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT PANE: Payment Method, Calculations, Sticky Footer */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-50 p-3 sm:p-4 space-y-3 overflow-y-auto">
            
            <div className="space-y-3">
              
              {/* Payment Method Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'cash', label: 'Cash Till', icon: Wallet },
                    { id: 'bank_transfer', label: 'Bank Transfer', icon: Landmark },
                    { id: 'pos_card', label: 'POS / Card', icon: CreditCard },
                    { id: 'credit', label: 'Store Credit', icon: User },
                  ].map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id as any)}
                      className={`flex items-center gap-1.5 p-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        paymentMethod === pm.id
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <pm.icon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">{pm.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Tendered */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Amount Paid Now ({profile.currency})
                  </label>
                  <button
                    type="button"
                    onClick={() => setAmountPaidInput(grandTotal.toString())}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    Exact ({profile.currency}{grandTotal})
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={`Full amount (${profile.currency}${grandTotal})`}
                  value={amountPaidInput}
                  onChange={(e) => setAmountPaidInput(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500 font-bold"
                />
              </div>

              {/* Sale Notes / Reference */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Notes / Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Receipt memo or PO number..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Calculations Summary Box */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs shadow-2xs">
                
                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Subtotal ({selectedItems.length} items):</span>
                  <span className="font-semibold text-slate-900">
                    {profile.currency}{subtotal.toLocaleString()}
                  </span>
                </div>

                {permissions.canGiveDiscounts && (
                  <div className="flex items-center justify-between text-slate-600 text-xs">
                    <span>Discount (%):</span>
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-12 text-right border border-slate-300 rounded px-1 py-0.2 bg-white font-semibold text-xs"
                      />
                      <span className="text-emerald-600 font-semibold">
                        -{profile.currency}{discountAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-600 text-xs">
                  <span>Tax (%):</span>
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-12 text-right border border-slate-300 rounded px-1 py-0.2 bg-white font-semibold text-xs"
                    />
                    <span>+{profile.currency}{taxAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t-2 border-slate-200 pt-2 flex justify-between items-center text-sm font-extrabold text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-base sm:text-lg font-black text-indigo-600">
                    {profile.currency}{grandTotal.toLocaleString()}
                  </span>
                </div>

                {/* Change or Customer Debt Status */}
                {changeGiven > 0 && (
                  <div className="flex justify-between text-emerald-800 font-bold bg-emerald-50 px-2 py-1 rounded-lg text-xs border border-emerald-200 mt-1">
                    <span>Change to Return:</span>
                    <span>{profile.currency}{changeGiven.toLocaleString()}</span>
                  </div>
                )}

                {balanceDue > 0 && (
                  <div className="flex justify-between text-rose-800 font-bold bg-rose-50 px-2 py-1 rounded-lg text-xs border border-rose-200 mt-1">
                    <span>Customer Debt (Credit):</span>
                    <span>{profile.currency}{balanceDue.toLocaleString()}</span>
                  </div>
                )}

              </div>

            </div>

            {/* Pinned Action Buttons (Always visible!) */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedItems.length === 0}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FileCheck className="w-4 h-4" />
                <span>Complete Sale ({profile.currency}{grandTotal.toLocaleString()})</span>
              </button>
            </div>

          </div>

        </form>

      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onScan={(code) => handleBarcodeScannedOrEntered(code)}
        title="POS Barcode Scanner"
        subtitle="Align product barcode to add directly to sale"
        allowContinuous={true}
        quickSampleCodes={products.slice(0, 8).map((p) => ({
          code: p.barcode || p.sku,
          label: p.name,
        }))}
      />
    </div>
  );
};
