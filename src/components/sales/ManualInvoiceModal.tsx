import React, { useEffect, useState } from 'react';
import { X, Wand2, CheckCircle2, Clock, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { ManualInvoice, ManualInvoicePayment } from '../../types';
import { formatDateOnly } from '../../utils/dateFormat';

interface ManualInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceToEdit?: ManualInvoice | null;
}

export const ManualInvoiceModal: React.FC<ManualInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoiceToEdit,
}) => {
  const {
    customers,
    profile,
    language,
    generateManualInvoiceNumber,
    addManualInvoice,
    updateManualInvoice,
  } = useBusiness();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('custom');
  const [customerName, setCustomerName] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [amountInput, setAmountInput] = useState<string>('');

  // Create mode initial payment
  const [initialPaidInput, setInitialPaidInput] = useState<string>('0');
  const [initialPayDate, setInitialPayDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Edit / Installment tracking mode
  const [payments, setPayments] = useState<ManualInvoicePayment[]>([]);
  const [newPayAmount, setNewPayAmount] = useState<string>('');
  const [newPayDate, setNewPayDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    const today = new Date().toISOString().slice(0, 10);

    if (invoiceToEdit) {
      const matchedCustomer = invoiceToEdit.customerId
        ? customers.find((c) => c.id === invoiceToEdit.customerId)
        : customers.find(
            (c) => c.name.trim().toLowerCase() === invoiceToEdit.customerName.trim().toLowerCase()
          );

      setSelectedCustomerId(matchedCustomer ? matchedCustomer.id : 'custom');
      setCustomerName(invoiceToEdit.customerName);
      setInvoiceNumber(invoiceToEdit.invoiceNumber);
      setDate(formatDateOnly(invoiceToEdit.date) || today);
      setAmountInput(String(invoiceToEdit.amount));

      const existingPayments: ManualInvoicePayment[] =
        Array.isArray(invoiceToEdit.payments) && invoiceToEdit.payments.length > 0
          ? invoiceToEdit.payments.map((p) => ({
              id: p.id,
              amount: p.amount,
              date: formatDateOnly(p.date),
            }))
          : invoiceToEdit.amountPaid > 0
          ? [
              {
                id: 'pay-init',
                amount: invoiceToEdit.amountPaid,
                date: formatDateOnly(invoiceToEdit.date) || today,
              },
            ]
          : [];

      setPayments(existingPayments);
      setNewPayAmount('');
      setNewPayDate(today);
    } else {
      setSelectedCustomerId('custom');
      setCustomerName('');
      setInvoiceNumber(generateManualInvoiceNumber());
      setDate(today);
      setAmountInput('');
      setInitialPaidInput('0');
      setInitialPayDate(today);
      setPayments([]);
      setNewPayAmount('');
      setNewPayDate(today);
    }
  }, [isOpen, invoiceToEdit]);

  if (!isOpen) return null;

  const numericAmount = Math.max(0, parseFloat(amountInput) || 0);
  const pendingAddAmount = Math.max(0, parseFloat(newPayAmount) || 0);

  const numericPaid = invoiceToEdit
    ? Number(
        (
          payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) +
          pendingAddAmount
        ).toFixed(2)
      )
    : Math.max(0, parseFloat(initialPaidInput) || 0);

  const computedBalance = Math.max(0, Number((numericAmount - numericPaid).toFixed(2)));
  const computedStatus: 'paid' | 'partial' | 'unpaid' =
    computedBalance <= 0 && numericAmount > 0
      ? 'paid'
      : numericPaid > 0
      ? 'partial'
      : 'unpaid';

  const handleCustomerSelectChange = (val: string) => {
    setSelectedCustomerId(val);
    if (val === 'custom') {
      setCustomerName('');
    } else {
      const cust = customers.find((c) => c.id === val);
      if (cust) {
        setCustomerName(cust.name);
      }
    }
  };

  const handleAutoGenerateNumber = () => {
    setInvoiceNumber(generateManualInvoiceNumber());
  };

  const handleAddInstallment = () => {
    setError('');
    const val = Math.max(0, parseFloat(newPayAmount) || 0);
    if (val <= 0) {
      setError(language === 'pt' ? 'Informe o valor do pagamento.' : 'Enter a payment amount greater than zero.');
      return;
    }
    const existingSum = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    if (numericAmount > 0 && Number((existingSum + val).toFixed(2)) > numericAmount) {
      setError(
        language === 'pt'
          ? 'O total pago não pode exceder o valor da fatura.'
          : 'Total paid cannot exceed the invoice amount.'
      );
      return;
    }
    const nextPayment: ManualInvoicePayment = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      amount: val,
      date: formatDateOnly(newPayDate || new Date().toISOString().slice(0, 10)),
    };
    setPayments((prev) => [...prev, nextPayment]);
    setNewPayAmount('');
  };

  const handleRemovePayment = (paymentId: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== paymentId));
  };

  const handleUpdatePaymentDate = (paymentId: string, updatedDate: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, date: formatDateOnly(updatedDate) } : p))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanNumber = invoiceNumber.trim();
    const cleanCustomer = customerName.trim();

    if (!cleanNumber) {
      setError(language === 'pt' ? 'Informe o número da fatura.' : 'Please enter or generate an invoice number.');
      return;
    }
    if (!cleanCustomer) {
      setError(language === 'pt' ? 'Informe o nome do cliente.' : 'Please select or enter a customer name.');
      return;
    }
    if (numericAmount <= 0) {
      setError(language === 'pt' ? 'O valor da fatura deve ser maior que zero.' : 'Invoice amount must be greater than zero.');
      return;
    }
    if (numericPaid > numericAmount) {
      setError(language === 'pt' ? 'O valor pago não pode exceder o valor total.' : 'Amount paid cannot exceed total amount.');
      return;
    }

    const customerId = selectedCustomerId !== 'custom' ? selectedCustomerId : '';

    if (invoiceToEdit) {
      const finalPayments = [...payments];
      if (pendingAddAmount > 0) {
        finalPayments.push({
          id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          amount: pendingAddAmount,
          date: formatDateOnly(newPayDate || new Date().toISOString().slice(0, 10)),
        });
      }
      updateManualInvoice(invoiceToEdit.id, {
        invoiceNumber: cleanNumber,
        customerId,
        customerName: cleanCustomer,
        date,
        amount: numericAmount,
        payments: finalPayments,
      });
    } else {
      const initialPayments: ManualInvoicePayment[] =
        numericPaid > 0
          ? [
              {
                id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                amount: numericPaid,
                date: formatDateOnly(initialPayDate || date),
              },
            ]
          : [];
      addManualInvoice({
        invoiceNumber: cleanNumber,
        customerId,
        customerName: cleanCustomer,
        date,
        amount: numericAmount,
        amountPaid: numericPaid,
        payments: initialPayments,
      });
    }

    onClose();
  };

  const currentRecordedSum = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remainingBeforeNew = Math.max(0, Number((numericAmount - currentRecordedSum).toFixed(2)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
        {/* Compact Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">
            {invoiceToEdit
              ? language === 'pt'
                ? 'Atualizar Fatura & Pagamentos'
                : 'Update Manual Invoice'
              : language === 'pt'
              ? 'Nova Fatura Manual'
              : 'New Manual Invoice'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Customer */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
              {language === 'pt' ? 'Cliente' : 'Customer'} *
            </label>
            {customers.length > 0 && (
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerSelectChange(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
              >
                <option value="custom">
                  {language === 'pt' ? '-- Digitar Nome do Cliente --' : '-- Custom Client Name --'}
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            )}
            {(selectedCustomerId === 'custom' || customers.length === 0) && (
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={language === 'pt' ? 'Nome do cliente ou empresa' : 'Customer or client name'}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
                required
              />
            )}
          </div>

          {/* Invoice Number (Auto or Manual) & Invoice Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                {language === 'pt' ? 'Nº da Fatura' : 'Invoice #'} *
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-001"
                  className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
                  required
                />
                <button
                  type="button"
                  onClick={handleAutoGenerateNumber}
                  className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors cursor-pointer shrink-0"
                  title={language === 'pt' ? 'Gerar número automático' : 'Auto-generate invoice number'}
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Auto</span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                {language === 'pt' ? 'Data da Fatura' : 'Invoice Date'} *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {!invoiceToEdit ? (
            /* Create Mode: Amount, Initial Paid, and Payment Date */
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    {language === 'pt' ? 'Valor' : 'Amount'} ({profile.currency}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      {language === 'pt' ? 'Valor Pago' : 'Amount Paid'} ({profile.currency})
                    </label>
                    {numericAmount > 0 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInitialPaidInput(String(Number((numericAmount / 2).toFixed(2))))}
                          className="text-[10px] font-bold text-slate-500 hover:text-indigo-700 cursor-pointer"
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          onClick={() => setInitialPaidInput(String(numericAmount))}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          {language === 'pt' ? 'Total' : 'Full'}
                        </button>
                      </div>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={initialPaidInput}
                    onChange={(e) => setInitialPaidInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {numericPaid > 0 && (
                <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                  <span className="text-[11px] font-semibold text-emerald-800">
                    {language === 'pt' ? 'Data do Pagamento:' : 'Payment Date:'}
                  </span>
                  <input
                    type="date"
                    value={initialPayDate}
                    onChange={(e) => setInitialPayDate(e.target.value)}
                    className="px-2 py-1 text-xs bg-white border border-emerald-200 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>
          ) : (
            /* Edit / Pay Mode: Amount + Compact Installment Payment History + Record Next Payment */
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex-1 space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    {language === 'pt' ? 'Valor Total' : 'Total Amount'} ({profile.currency}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="flex-1 space-y-1 text-right">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {language === 'pt' ? 'Total Pago' : 'Total Paid'}
                  </span>
                  <div className="px-2.5 py-1.5 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
                    {profile.currency}
                    {numericPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Compact Payment Dates Log */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-100/80 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    {language === 'pt' ? 'Pagamentos Registrados' : 'Payments'} ({payments.length})
                  </span>
                  {remainingBeforeNew > 0 && (
                    <button
                      type="button"
                      onClick={() => setNewPayAmount(String(remainingBeforeNew))}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      {language === 'pt' ? 'Quitar Saldo' : 'Fill Balance'} ({profile.currency}{remainingBeforeNew})
                    </button>
                  )}
                </div>

                {payments.length > 0 && (
                  <div className="divide-y divide-slate-100 max-h-28 overflow-y-auto bg-white">
                    {payments.map((p, idx) => (
                      <div key={p.id} className="flex items-center justify-between gap-2 px-2.5 py-1 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 w-4">{idx + 1}.</span>
                        <input
                          type="date"
                          value={p.date}
                          onChange={(e) => handleUpdatePaymentDate(p.id, e.target.value)}
                          className="px-1.5 py-0.5 text-[11px] bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="flex-1 text-right font-bold text-emerald-700">
                          {profile.currency}{Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePayment(p.id)}
                          className="p-0.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title={language === 'pt' ? 'Remover pagamento' : 'Remove payment'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Record New Payment Row */}
                {remainingBeforeNew > 0 && (
                  <div className="p-2 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newPayAmount}
                      onChange={(e) => setNewPayAmount(e.target.value)}
                      placeholder={language === 'pt' ? 'Novo valor' : 'Add amount'}
                      className="w-24 px-2 py-1 text-xs font-bold bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <input
                      type="date"
                      value={newPayDate}
                      onChange={(e) => setNewPayDate(e.target.value)}
                      className="flex-1 min-w-0 px-2 py-1 text-xs bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddInstallment}
                      className="inline-flex items-center gap-0.5 px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md cursor-pointer shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{language === 'pt' ? 'Add' : 'Add'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live Calculated Balance Strip */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                {language === 'pt' ? 'Saldo Restante' : 'Balance'}
              </span>
              <span
                className={`text-base font-black ${
                  computedBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {profile.currency}
                {computedBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div>
              {computedStatus === 'paid' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  {language === 'pt' ? 'Pago' : 'Paid'}
                </span>
              ) : computedStatus === 'partial' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                  <Clock className="w-3 h-3" />
                  {language === 'pt' ? 'Parcial' : 'Partial'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                  <AlertCircle className="w-3 h-3" />
                  {language === 'pt' ? 'Pendente' : 'Unpaid'}
                </span>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              {language === 'pt' ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {invoiceToEdit
                ? language === 'pt'
                  ? 'Salvar Alterações'
                  : 'Save Changes'
                : language === 'pt'
                ? 'Registrar Fatura'
                : 'Save Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
