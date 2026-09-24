import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { InvoiceItem, Sale } from '../../types';
import {
  X,
  Plus,
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
        (p.barcode && p.barcode.toLowerCase() === cleanCode.toLowerCase()) ||
        p.sku.toLowerCase() === cleanCode.toLowerCase() ||
        p.id.toLowerCase() === cleanCode.toLowerCase()
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

  // Calculations
  const invoiceItems: InvoiceItem[] = selectedItems.map((si) => {
    const prod = products.find((p) => p.id === si.productId)!;
    return {
      productId: prod.id,
      productName: prod.name,
      quantity: si.quantity,
      unitCost: prod.costPrice,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create New Sale & Invoice</h2>
              <p className="text-xs text-slate-400">
                Instantly adjust inventory and record cash/bank receipts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Customer Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Customer Account
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.outstandingDebt > 0 ? `(Debt: ${profile.currency}${c.outstandingDebt})` : ''}
                  </option>
                ))}
                <option value="new">+ Enter New Customer Name</option>
              </select>
            </div>

            {customerId === 'new' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  New Customer Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Hospital Logistics"
                  value={customCustomerName}
                  onChange={(e) => setCustomCustomerName(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>
            )}
          </div>

          {/* Fast Barcode & Product Code Scanner Bar */}
          <div className="bg-gradient-to-r from-indigo-50/90 to-slate-50 border border-indigo-200/80 p-3 sm:p-3.5 rounded-xl space-y-2.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
                  <Barcode className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    Scan Barcode / Product Code
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Use camera or enter SKU/barcode to instantly add products to sale
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBarcodeScannerOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan with Camera</span>
              </button>
            </div>

            {/* Quick manual barcode/sku input row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Scan or type barcode / SKU (e.g. AUDIO-001, 8901001000012) & press Enter..."
                  value={quickBarcodeInput}
                  onChange={(e) => setQuickBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleBarcodeScannedOrEntered(quickBarcodeInput);
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleBarcodeScannedOrEntered(quickBarcodeInput)}
                disabled={!quickBarcodeInput.trim()}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                + Add Item
              </button>
            </div>

            {scanNotification && (
              <div
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150 ${
                  scanNotification.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {scanNotification.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="truncate">{scanNotification.message}</span>
              </div>
            )}
          </div>

          {/* Product Quick-Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                1. Select Products From Inventory
              </label>
              <span className="text-xs text-slate-500">
                Click any product below or scan barcode
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
              {products.map((prod) => {
                const isOutOfStock = prod.stock <= 0;
                return (
                  <button
                    key={prod.id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => handleAddItem(prod.id)}
                    className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isOutOfStock
                        ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                        : 'bg-white hover:bg-indigo-50 border-slate-200 hover:border-indigo-300 shadow-2xs'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {prod.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {prod.sku}{prod.barcode ? ` • ${prod.barcode}` : ''}
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="font-semibold text-indigo-600">
                        {profile.currency}{prod.sellingPrice}
                      </span>
                      <span
                        className={`font-medium ${
                          prod.stock <= prod.minStockAlert ? 'text-amber-600 font-bold' : 'text-slate-500'
                        }`}
                      >
                        {prod.stock} {prod.unit}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Invoice Items Table */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              2. Invoice Line Items ({selectedItems.length})
            </label>

            {selectedItems.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                No items added yet. Click products from the catalog above to add them to this sale.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="text-left py-2.5 px-3">Product</th>
                      <th className="text-center py-2.5 px-2 w-28">Quantity</th>
                      <th className="text-right py-2.5 px-2 w-28">Unit Price</th>
                      <th className="text-right py-2.5 px-3 w-28">Subtotal</th>
                      <th className="text-center py-2.5 px-2 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedItems.map((item, idx) => {
                      const prod = products.find((p) => p.id === item.productId)!;
                      const lineTotal = item.quantity * item.unitPrice;
                      const hasStockWarning = item.quantity > prod.stock;

                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{prod.name}</div>
                            <div className="text-[10px] text-slate-600">
                              SKU: {prod.sku} • Stock: {prod.stock} {prod.unit}
                              {hasStockWarning && (
                                <span className="ml-1 text-rose-600 font-bold">
                                  (Exceeds stock!)
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-2.5 px-2 text-center">
                            <div className="inline-flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(idx, item.quantity - 1)}
                                className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={prod.stock}
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateQuantity(idx, parseInt(e.target.value) || 1)
                                }
                                className="w-12 text-center text-xs font-semibold py-1 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(idx, item.quantity + 1)}
                                className="px-2 py-1 text-slate-600 hover:bg-slate-100 font-bold"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          <td className="py-2.5 px-2 text-right">
                            <div className="inline-flex items-center">
                              <span className="text-slate-400 mr-1">{profile.currency}</span>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  handleUpdatePrice(idx, parseFloat(e.target.value) || 0)
                                }
                                className="w-18 text-right text-xs font-semibold border border-slate-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                            {profile.currency}{lineTotal.toLocaleString()}
                          </td>

                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment & Totals Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Left: Payment Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'cash', label: 'Cash Till', icon: Wallet },
                    { id: 'bank_transfer', label: 'Bank Transfer', icon: Landmark },
                    { id: 'pos_card', label: 'POS / Card', icon: CreditCard },
                    { id: 'credit', label: 'Store Credit / Debt', icon: User },
                  ].map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id as any)}
                      className={`flex items-center gap-2 p-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        paymentMethod === pm.id
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <pm.icon className="w-4 h-4 text-indigo-600" />
                      <span>{pm.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Amount Tendered / Paid Now ({profile.currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={`Leave blank for full amount (${profile.currency}${grandTotal})`}
                  value={amountPaidInput}
                  onChange={(e) => setAmountPaidInput(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
                />
                <span className="text-[11px] text-slate-600 mt-0.5 block">
                  {paymentMethod === 'credit'
                    ? 'Outstanding balance will be added to the customer debt ledger.'
                    : 'If less than total, the remaining balance will be recorded as customer debt.'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Sale Notes / Receipt Memo
                </label>
                <input
                  type="text"
                  placeholder="Optional reference number or delivery note"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Right: Calculations Summary Box */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({selectedItems.length} items):</span>
                <span className="font-semibold text-slate-900">
                  {profile.currency}{subtotal.toLocaleString()}
                </span>
              </div>

              {permissions.canGiveDiscounts && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>Discount (%):</span>
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-14 text-right border border-slate-300 rounded px-1.5 py-0.5 bg-white font-semibold text-xs"
                    />
                    <span className="text-emerald-600 font-semibold">
                      -{profile.currency}{discountAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-600">
                <span>Tax (%):</span>
                <div className="inline-flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-14 text-right border border-slate-300 rounded px-1.5 py-0.5 bg-white font-semibold text-xs"
                  />
                  <span>+{profile.currency}{taxAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t-2 border-slate-200 pt-2 flex justify-between items-center text-sm font-extrabold text-slate-900">
                <span>Invoice Total:</span>
                <span className="text-lg font-black text-indigo-600">
                  {profile.currency}{grandTotal.toLocaleString()}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-2 space-y-1 text-xs">
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Amount Paid:</span>
                  <span>{profile.currency}{numericAmountPaid.toLocaleString()}</span>
                </div>

                {changeGiven > 0 && (
                  <div className="flex justify-between text-blue-700 font-bold bg-blue-50 p-1.5 rounded-md">
                    <span>Change Due to Customer:</span>
                    <span>{profile.currency}{changeGiven.toLocaleString()}</span>
                  </div>
                )}

                {balanceDue > 0 && (
                  <div className="flex justify-between text-rose-700 font-bold bg-rose-50 p-1.5 rounded-md border border-rose-200">
                    <span>Outstanding Debt (Credit):</span>
                    <span>{profile.currency}{balanceDue.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Footer Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedItems.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileCheck className="w-4 h-4" />
              <span>Complete Sale & Issue Invoice</span>
            </button>
          </div>

        </form>

      </div>

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
