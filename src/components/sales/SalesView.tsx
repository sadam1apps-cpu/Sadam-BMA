import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Trash2,
  Lock,
  ChevronLeft,
  ChevronRight,
  FileText,
  ArrowRight,
  Receipt,
  ClipboardList,
  Pencil,
  Calendar,
  X,
} from 'lucide-react';
import { ManualInvoice, Quotation, Sale } from '../../types';
import { QuotationModal } from './QuotationModal';
import { ManualInvoiceModal } from './ManualInvoiceModal';
import { formatDateOnly } from '../../utils/dateFormat';

interface SalesViewProps {
  onOpenNewSale: () => void;
  onOpenReceipt: (saleId: string) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  onOpenNewSale,
  onOpenReceipt,
}) => {
  const {
    sales,
    manualInvoices,
    quotations,
    deleteSale,
    deleteManualInvoice,
    deleteQuotation,
    convertQuotationToSale,
    permissions,
    profile,
    language,
    t,
  } = useBusiness();

  const [viewTab, setViewTab] = useState<'invoices' | 'quotations'>('invoices');
  const [invoiceSubTab, setInvoiceSubTab] = useState<'system' | 'manual'>('system');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [manualStatusFilter, setManualStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<'all' | 'sent' | 'accepted' | 'converted'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State for Quotations
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  // Modal State for Manual Invoices
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedManualInvoice, setSelectedManualInvoice] = useState<ManualInvoice | null>(null);
  const [manualInvoiceToDelete, setManualInvoiceToDelete] = useState<ManualInvoice | null>(null);
  const [paymentTimelineInvoice, setPaymentTimelineInvoice] = useState<ManualInvoice | null>(null);

  const renderPaymentDatesTrigger = (inv: ManualInvoice, alignRight = false) => {
    const list = inv.payments || [];
    if (list.length === 0) return null;

    const summaryText =
      list.length === 1
        ? formatDateOnly(list[0].date)
        : list.length === 2
        ? `${formatDateOnly(list[0].date)} · ${formatDateOnly(list[1].date)}`
        : `${list.length}x · ${formatDateOnly(list[list.length - 1].date)}`;

    const tooltipText = list
      .map((p, idx) => `${idx + 1}. ${formatDateOnly(p.date)} (${profile.currency}${p.amount.toLocaleString()})`)
      .join('\n');

    return (
      <button
        type="button"
        onClick={() => setPaymentTimelineInvoice(inv)}
        title={tooltipText}
        className={`inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer mt-0.5 ${
          alignRight ? 'ml-auto' : ''
        }`}
      >
        <Calendar className="w-2.5 h-2.5 shrink-0 text-slate-400" />
        <span className="truncate">{summaryText}</span>
      </button>
    );
  };

  // Filtered Sales
  const filteredSales = sales.filter((s) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      String(s.invoiceNumber || '').toLowerCase().includes(term) ||
      String(s.customerName || '').toLowerCase().includes(term) ||
      (s.customerPhone && String(s.customerPhone).includes(searchTerm));

    const matchesStatus =
      statusFilter === 'all' ? true : s.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filtered Manual Invoices
  const filteredManualInvoices = manualInvoices.filter((m) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      String(m.invoiceNumber || '').toLowerCase().includes(term) ||
      String(m.customerName || '').toLowerCase().includes(term);

    const matchesStatus =
      manualStatusFilter === 'all' ? true : m.status === manualStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filtered Quotations
  const filteredQuotations = quotations.filter((q) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      String(q.quotationNumber || '').toLowerCase().includes(term) ||
      String(q.customerName || '').toLowerCase().includes(term) ||
      (q.customerNuit && String(q.customerNuit).toLowerCase().includes(term)) ||
      (q.customerAddress && String(q.customerAddress).toLowerCase().includes(term)) ||
      (q.customerPhone && String(q.customerPhone).includes(searchTerm));

    const matchesStatus =
      quoteStatusFilter === 'all' ? true : q.status === quoteStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const totalSalesVolume = sales.reduce((acc, s) => acc + s.total, 0);
  const totalPaidVolume = sales.reduce((acc, s) => acc + s.amountPaid, 0);
  const totalUnpaidVolume = sales.reduce((acc, s) => acc + s.balanceDue, 0);

  const totalManualAmount = manualInvoices.reduce((acc, m) => acc + m.amount, 0);
  const totalManualPaid = manualInvoices.reduce((acc, m) => acc + m.amountPaid, 0);
  const totalManualBalance = manualInvoices.reduce((acc, m) => acc + m.balance, 0);

  const totalQuotedVolume = quotations.reduce((acc, q) => acc + q.total, 0);
  const activeQuotesCount = quotations.filter((q) => q.status !== 'converted' && q.status !== 'declined').length;
  const convertedQuotesCount = quotations.filter((q) => q.status === 'converted').length;

  // Pagination
  const pageSize = 5;
  const activeItems =
    viewTab === 'invoices'
      ? invoiceSubTab === 'system'
        ? filteredSales
        : filteredManualInvoices
      : filteredQuotations;
  const totalPages = Math.ceil(activeItems.length / pageSize) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const paginatedSales = filteredSales.slice((validPage - 1) * pageSize, validPage * pageSize);
  const paginatedManualInvoices = filteredManualInvoices.slice((validPage - 1) * pageSize, validPage * pageSize);
  const paginatedQuotations = filteredQuotations.slice((validPage - 1) * pageSize, validPage * pageSize);

  const handleOpenQuotationView = (q: Quotation) => {
    setSelectedQuotation(q);
    setIsQuotationModalOpen(true);
  };

  const handleConvertQuotation = (q: Quotation) => {
    const createdSale = convertQuotationToSale(q.id);
    if (createdSale) {
      onOpenReceipt(createdSale.id);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-2 sm:space-y-3">
      {/* Header with Invoices / Quotations switch + Invoices sub-tabs (System Invoices | Manual Invoices) */}
      <div className="bg-white rounded-xl p-2 sm:p-3 border border-slate-200 shadow-2xs flex flex-col gap-2 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4">
          <div className="w-full sm:w-auto">
            {/* Top-level segmented control: Invoices vs Quotations */}
            <div className="w-full sm:w-auto grid grid-cols-2 sm:flex p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1">
              <button
                type="button"
                onClick={() => {
                  setViewTab('invoices');
                  setCurrentPage(1);
                }}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewTab === 'invoices'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 shrink-0" />
                <span>{language === 'pt' ? 'Faturas' : 'Invoices'}</span>
                <span
                  className={`inline-flex items-center justify-center px-1.5 py-0.2 sm:px-2 sm:py-0.5 text-[10px] sm:text-[11px] font-extrabold rounded-full transition-colors ${
                    viewTab === 'invoices'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {sales.length + manualInvoices.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewTab('quotations');
                  setCurrentPage(1);
                }}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewTab === 'quotations'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>{language === 'pt' ? 'Orçamentos' : 'Quotations'}</span>
                <span
                  className={`inline-flex items-center justify-center px-1.5 py-0.2 sm:px-2 sm:py-0.5 text-[10px] sm:text-[11px] font-extrabold rounded-full transition-colors ${
                    viewTab === 'quotations'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {quotations.length}
                </span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          {viewTab === 'invoices' && invoiceSubTab === 'manual' ? (
            <div className="w-full sm:w-auto flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedManualInvoice(null);
                  setIsManualModalOpen(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 shrink-0 text-white" />
                <span>{language === 'pt' ? 'Nova Fatura Manual' : 'New Manual Invoice'}</span>
              </button>
            </div>
          ) : (
            <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedQuotation(null);
                  setIsQuotationModalOpen(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-700 rounded-lg text-xs font-bold transition-all cursor-pointer border border-indigo-200 shadow-2xs"
                title="Create a price quotation or estimate"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">{language === 'pt' ? '+ Orçamento' : '+ Quotation'}</span>
              </button>

              {permissions.canRecordSales && (
                <button
                  type="button"
                  onClick={onOpenNewSale}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0 text-white" />
                  <span className="truncate sm:hidden">{language === 'pt' ? '+ Venda' : '+ New Sale'}</span>
                  <span className="hidden sm:inline">{language === 'pt' ? 'Nova Venda' : 'New Sale'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sub-tabs inside Invoices: System Invoices | Manual Invoices */}
        {viewTab === 'invoices' && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setInvoiceSubTab('system');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                invoiceSubTab === 'system'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100 border border-transparent'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 shrink-0" />
              <span>{language === 'pt' ? 'Faturas do Sistema' : 'System Invoices'}</span>
              <span
                className={`px-1.5 py-0.2 text-[10px] font-extrabold rounded-full ${
                  invoiceSubTab === 'system'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {sales.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setInvoiceSubTab('manual');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                invoiceSubTab === 'manual'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100 border border-transparent'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 shrink-0" />
              <span>{language === 'pt' ? 'Faturas Manuais' : 'Manual Invoices'}</span>
              <span
                className={`px-1.5 py-0.2 text-[10px] font-extrabold rounded-full ${
                  invoiceSubTab === 'manual'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {manualInvoices.length}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      {viewTab === 'invoices' && invoiceSubTab === 'system' ? (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 shrink-0">
          <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
              {language === 'pt' ? 'Faturado' : 'Total Invoiced'}
            </span>
            <div className="text-xs sm:text-lg font-black text-slate-900 mt-0.5 sm:mt-1 truncate">
              {profile.currency}{totalSalesVolume.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">{sales.length} {language === 'pt' ? 'faturas' : 'invoices'}</span>
          </div>

          <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
              {language === 'pt' ? 'Recebido' : 'Collected'}
            </span>
            <div className="text-xs sm:text-lg font-black text-emerald-600 mt-0.5 sm:mt-1 truncate">
              {profile.currency}{totalPaidVolume.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-600 block truncate">{language === 'pt' ? 'Liquidado' : 'Settled'}</span>
          </div>

          <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
              {language === 'pt' ? 'Pendente (Crédito)' : 'Outstanding'}
            </span>
            <div className="text-xs sm:text-lg font-black text-rose-600 mt-0.5 sm:mt-1 truncate">
              {profile.currency}{totalUnpaidVolume.toLocaleString()}
            </div>
            <span className="text-[10px] text-rose-600 block truncate">{language === 'pt' ? 'A receber' : 'Due credit'}</span>
          </div>
        </div>
      ) : viewTab === 'invoices' && invoiceSubTab === 'manual' ? (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 shrink-0">
          <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
              {language === 'pt' ? 'Valor Total' : 'Amount'}
            </span>
            <div className="text-xs sm:text-lg font-black text-slate-900 mt-0.5 sm:mt-1 truncate">
              {profile.currency}{totalManualAmount.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">
              {manualInvoices.length} {language === 'pt' ? 'faturas' : 'invoices'}
            </span>
          </div>

          <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
              {language === 'pt' ? 'Valor Pago' : 'Amount Paid'}
            </span>
            <div className="text-xs sm:text-lg font-black text-emerald-600 mt-0.5 sm:mt-1 truncate">
              {profile.currency}{totalManualPaid.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-600 block truncate">
              {language === 'pt' ? 'Recebido' : 'Collected'}
            </span>
          </div>

          <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
              {language === 'pt' ? 'Saldo' : 'Balance'}
            </span>
            <div className="text-xs sm:text-lg font-black text-rose-600 mt-0.5 sm:mt-1 truncate">
              {profile.currency}{totalManualBalance.toLocaleString()}
            </div>
            <span className="text-[10px] text-rose-600 block truncate">
              {language === 'pt' ? 'Em aberto' : 'Remaining'}
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 shrink-0">
          <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
              {language === 'pt' ? 'Total Orçado' : 'Quoted Volume'}
            </span>
            <div className="text-xs sm:text-lg font-black text-slate-900 mt-0.5 sm:mt-1 truncate">
              {profile.currency}{totalQuotedVolume.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">{quotations.length} {language === 'pt' ? 'propostas' : 'proposals'}</span>
          </div>

          <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
              {language === 'pt' ? 'Ativos / Pendentes' : 'Open Quotes'}
            </span>
            <div className="text-xs sm:text-lg font-black text-indigo-600 mt-0.5 sm:mt-1 truncate">
              {activeQuotesCount}
            </div>
            <span className="text-[10px] text-indigo-600 block truncate">{language === 'pt' ? 'Em decisão' : 'Awaiting decision'}</span>
          </div>

          <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
              {language === 'pt' ? 'Convertidos' : 'Converted'}
            </span>
            <div className="text-xs sm:text-lg font-black text-emerald-600 mt-0.5 sm:mt-1 truncate">
              {convertedQuotesCount}
            </div>
            <span className="text-[10px] text-emerald-600 block truncate">{language === 'pt' ? 'Vendas fechadas' : 'Realized sales'}</span>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              viewTab === 'invoices'
                ? invoiceSubTab === 'system'
                  ? 'Search invoice or customer...'
                  : language === 'pt'
                  ? 'Buscar fatura manual ou cliente...'
                  : 'Search manual invoice # or customer...'
                : 'Search quote # or customer...'
            }
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {viewTab === 'invoices' && invoiceSubTab === 'system' ? (
          <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All' },
              { id: 'paid', label: 'Paid' },
              { id: 'partial', label: 'Partial' },
              { id: 'unpaid', label: 'Unpaid' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer text-center ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : viewTab === 'invoices' && invoiceSubTab === 'manual' ? (
          <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: language === 'pt' ? 'Todas' : 'All' },
              { id: 'paid', label: language === 'pt' ? 'Pago' : 'Paid' },
              { id: 'partial', label: language === 'pt' ? 'Parcial' : 'Partial' },
              { id: 'unpaid', label: language === 'pt' ? 'Pendente' : 'Unpaid' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setManualStatusFilter(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer text-center ${
                  manualStatusFilter === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All' },
              { id: 'sent', label: 'Sent' },
              { id: 'accepted', label: 'Accepted' },
              { id: 'converted', label: 'Converted' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setQuoteStatusFilter(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer text-center ${
                  quoteStatusFilter === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main List Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex-1 min-h-0 flex flex-col overflow-hidden">
        {viewTab === 'invoices' && invoiceSubTab === 'system' ? (
          <>
            {/* Mobile View: Invoices */}
            <div className="block sm:hidden flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
              {paginatedSales.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No sales invoices found matching your filters.
                </div>
              ) : (
                paginatedSales.map((sale) => (
                  <div key={sale.id} className="p-2.5 flex flex-col gap-1.5 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-indigo-600">#{sale.invoiceNumber}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(sale.timestamp).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div>
                        {sale.paymentStatus === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Paid
                          </span>
                        ) : sale.paymentStatus === 'partial' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-2.5 h-2.5" /> Due {profile.currency}{sale.balanceDue}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800">
                            <AlertCircle className="w-2.5 h-2.5" /> Debt
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="truncate pr-2">
                        <span className="font-semibold text-slate-900">{sale.customerName}</span>
                        <span className="text-[10px] text-slate-500 ml-1.5">({sale.items.length} items)</span>
                      </div>
                      <span className="font-bold text-slate-900 text-sm">
                        {profile.currency}{sale.total.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-50 text-[11px]">
                      <span className="text-slate-500 uppercase font-medium text-[9px]">
                        {sale.paymentMethod.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenReceipt(sale.id)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          Receipt
                        </button>
                        {permissions.canDeleteTransactions && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete invoice ${sale.invoiceNumber}? Stock will be restored.`)) {
                                deleteSale(sale.id);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Delete invoice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop View: Invoices */}
            <div className="hidden sm:block flex-1 min-h-0 overflow-y-auto no-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] z-10">
                  <tr>
                    <th className="py-2.5 px-3.5">Invoice #</th>
                    <th className="py-2.5 px-3.5">Customer</th>
                    <th className="py-2.5 px-3.5">Date</th>
                    <th className="py-2.5 px-3.5">Items</th>
                    <th className="py-2.5 px-3.5">Total</th>
                    <th className="py-2.5 px-3.5">Method</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedSales.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No sales invoices found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3.5 font-bold text-indigo-600">
                          #{sale.invoiceNumber}
                        </td>
                        <td className="py-2.5 px-3.5 font-medium text-slate-900">
                          {sale.customerName}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-500 whitespace-nowrap">
                          {new Date(sale.timestamp).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600">
                          {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}
                        </td>
                        <td className="py-2.5 px-3.5 font-bold text-slate-900">
                          {profile.currency}{sale.total.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600 uppercase font-semibold text-[10px]">
                          {sale.paymentMethod.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 px-3.5">
                          {sale.paymentStatus === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Paid
                            </span>
                          ) : sale.paymentStatus === 'partial' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-2.5 h-2.5" /> Due {profile.currency}{sale.balanceDue}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <AlertCircle className="w-2.5 h-2.5" /> Debt
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onOpenReceipt(sale.id)}
                              className="px-2 py-0.5 text-xs font-semibold text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                              title="View receipt"
                            >
                              <Eye className="w-3 h-3 inline mr-1" />
                              Receipt
                            </button>

                            {permissions.canDeleteTransactions ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Delete invoice ${sale.invoiceNumber}? Stock will be restored.`)) {
                                    deleteSale(sale.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                title="Delete sale"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="p-1 text-slate-300" title="Restricted for role">
                                <Lock className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : viewTab === 'invoices' && invoiceSubTab === 'manual' ? (
          /* Manual Invoices Register View */
          <>
            {/* Mobile View: Manual Invoices */}
            <div className="block sm:hidden flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
              {paginatedManualInvoices.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {language === 'pt'
                    ? 'Nenhuma fatura manual encontrada.'
                    : 'No manual invoices found.'}
                </div>
              ) : (
                paginatedManualInvoices.map((inv) => (
                  <div key={inv.id} className="p-2.5 flex flex-col gap-1.5 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-indigo-600">#{inv.invoiceNumber}</span>
                        <span className="text-[10px] text-slate-400">{formatDateOnly(inv.date)}</span>
                      </div>
                      <div>
                        {inv.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-2.5 h-2.5" /> {language === 'pt' ? 'Pago' : 'Paid'}
                          </span>
                        ) : inv.status === 'partial' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-2.5 h-2.5" /> {language === 'pt' ? 'Parcial' : 'Partial'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800">
                            <AlertCircle className="w-2.5 h-2.5" /> {language === 'pt' ? 'Pendente' : 'Unpaid'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900 truncate pr-2">{inv.customerName}</span>
                      <span className="font-bold text-slate-900">
                        {profile.currency}{inv.amount.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-50 text-[11px]">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="text-emerald-700 font-semibold">
                            {language === 'pt' ? 'Pago:' : 'Paid:'} {profile.currency}{inv.amountPaid.toLocaleString()}
                          </span>
                          <span className={`font-bold ${inv.balance > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                            {language === 'pt' ? 'Saldo:' : 'Bal:'} {profile.currency}{inv.balance.toLocaleString()}
                          </span>
                        </div>
                        {renderPaymentDatesTrigger(inv, false)}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedManualInvoice(inv);
                            setIsManualModalOpen(true);
                          }}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          {language === 'pt' ? 'Editar / Pagar' : 'Edit / Pay'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setManualInvoiceToDelete(inv)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title={language === 'pt' ? 'Excluir fatura manual' : 'Delete manual invoice'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop View: Manual Invoices Table */}
            <div className="hidden sm:block flex-1 min-h-0 overflow-y-auto no-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] z-10">
                  <tr>
                    <th className="py-2.5 px-3.5">{language === 'pt' ? 'Fatura #' : 'Invoice #'}</th>
                    <th className="py-2.5 px-3.5">{language === 'pt' ? 'Cliente' : 'Customer'}</th>
                    <th className="py-2.5 px-3.5">{language === 'pt' ? 'Data' : 'Date'}</th>
                    <th className="py-2.5 px-3.5 text-right">{language === 'pt' ? 'Valor' : 'Amount'}</th>
                    <th className="py-2.5 px-3.5 text-right">{language === 'pt' ? 'Valor Pago' : 'Amount Paid'}</th>
                    <th className="py-2.5 px-3.5 text-right">{language === 'pt' ? 'Saldo' : 'Balance'}</th>
                    <th className="py-2.5 px-3.5">{language === 'pt' ? 'Status' : 'Status'}</th>
                    <th className="py-2.5 px-3.5 text-right">{language === 'pt' ? 'Ações' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedManualInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        {language === 'pt'
                          ? 'Nenhuma fatura manual encontrada.'
                          : 'No manual invoices found matching your filters.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedManualInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3.5 font-bold text-indigo-600 whitespace-nowrap">
                          #{inv.invoiceNumber}
                        </td>
                        <td className="py-2.5 px-3.5 font-medium text-slate-900">
                          {inv.customerName}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-500 whitespace-nowrap">
                          {formatDateOnly(inv.date)}
                        </td>
                        <td className="py-2.5 px-3.5 font-bold text-slate-900 text-right whitespace-nowrap">
                          {profile.currency}{inv.amount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3.5 font-semibold text-emerald-700 text-right whitespace-nowrap">
                          <div className="flex flex-col items-end">
                            <span>{profile.currency}{inv.amountPaid.toLocaleString()}</span>
                            {renderPaymentDatesTrigger(inv, true)}
                          </div>
                        </td>
                        <td
                          className={`py-2.5 px-3.5 font-bold text-right whitespace-nowrap ${
                            inv.balance > 0 ? 'text-rose-600' : 'text-slate-500'
                          }`}
                        >
                          {profile.currency}{inv.balance.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3.5">
                          {inv.status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-2.5 h-2.5" /> {language === 'pt' ? 'Pago' : 'Paid'}
                            </span>
                          ) : inv.status === 'partial' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-2.5 h-2.5" /> {language === 'pt' ? 'Parcial' : 'Partial'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <AlertCircle className="w-2.5 h-2.5" /> {language === 'pt' ? 'Pendente' : 'Unpaid'}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedManualInvoice(inv);
                                setIsManualModalOpen(true);
                              }}
                              className="px-2 py-0.5 text-xs font-semibold text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                              title="Edit invoice or update payment"
                            >
                              <Pencil className="w-3 h-3 inline mr-1" />
                              {language === 'pt' ? 'Editar / Pagar' : 'Edit / Pay'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setManualInvoiceToDelete(inv)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              title={language === 'pt' ? 'Excluir fatura manual' : 'Delete manual invoice'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* Quotations View */
          <>
            {/* Mobile View: Quotations Cards */}
            <div className="block sm:hidden flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
              {paginatedQuotations.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {language === 'pt' ? 'Nenhum orçamento encontrado.' : 'No quotations found matching your search.'}
                </div>
              ) : (
                paginatedQuotations.map((quote) => (
                  <div key={quote.id} className="p-2.5 flex flex-col gap-1.5 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-indigo-700">#{quote.quotationNumber}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(quote.timestamp).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold capitalize ${
                          quote.status === 'converted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : quote.status === 'accepted'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {quote.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="truncate pr-2">
                        <span className="font-semibold text-slate-900">{quote.customerName}</span>
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-500 mt-0.5">
                          {quote.customerPhone && <span>{quote.customerPhone}</span>}
                          {quote.customerNuit && (
                            <span className="font-mono bg-slate-100 text-slate-700 px-1 py-0.2 rounded border border-slate-200 font-semibold">
                              NUIT: {quote.customerNuit}
                            </span>
                          )}
                          <span className="text-slate-400">• (Valid: {formatDateOnly(quote.validUntil)})</span>
                        </div>
                        {quote.customerAddress && (
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {quote.customerAddress}
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-indigo-700 text-sm">
                        {profile.currency}{quote.total.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-50 text-[11px]">
                      <span className="text-slate-400 text-[10px]">
                        {quote.items.length} items
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenQuotationView(quote)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          View/Print
                        </button>

                        {quote.status !== 'converted' && (
                          <button
                            type="button"
                            onClick={() => handleConvertQuotation(quote)}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer inline-flex items-center gap-0.5"
                            title="Convert to Sale"
                          >
                            <ArrowRight className="w-3 h-3" />
                            <span>Convert</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete quotation ${quote.quotationNumber}?`)) {
                              deleteQuotation(quote.id);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop View: Quotations Table */}
            <div className="hidden sm:block flex-1 min-h-0 overflow-y-auto no-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] z-10">
                  <tr>
                    <th className="py-2.5 px-3.5">Quote #</th>
                    <th className="py-2.5 px-3.5">Customer</th>
                    <th className="py-2.5 px-3.5">Issue Date</th>
                    <th className="py-2.5 px-3.5">Valid Until</th>
                    <th className="py-2.5 px-3.5">Items</th>
                    <th className="py-2.5 px-3.5">Total Amount</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedQuotations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        {language === 'pt' ? 'Nenhum orçamento encontrado.' : 'No quotations found matching your search.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedQuotations.map((quote) => (
                      <tr key={quote.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3.5 font-bold text-indigo-700">
                          #{quote.quotationNumber}
                        </td>
                        <td className="py-2.5 px-3.5 font-medium text-slate-900">
                          <div className="font-bold text-slate-900">{quote.customerName}</div>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            {quote.customerPhone && (
                              <span className="text-slate-500 text-[10px]">{quote.customerPhone}</span>
                            )}
                            {quote.customerNuit && (
                              <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200 font-semibold">
                                NUIT: {quote.customerNuit}
                              </span>
                            )}
                          </div>
                          {quote.customerAddress && (
                            <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                              {quote.customerAddress}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-500 whitespace-nowrap">
                          {new Date(quote.timestamp).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600 whitespace-nowrap">
                          {formatDateOnly(quote.validUntil)}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600">
                          {quote.items.length} {quote.items.length === 1 ? 'item' : 'items'}
                        </td>
                        <td className="py-2.5 px-3.5 font-bold text-slate-900">
                          {profile.currency}{quote.total.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              quote.status === 'converted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : quote.status === 'accepted'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {quote.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenQuotationView(quote)}
                              className="px-2 py-0.5 text-xs font-semibold text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                              title="View & Print Quotation"
                            >
                              <Eye className="w-3 h-3 inline mr-1" />
                              View
                            </button>

                            {quote.status !== 'converted' ? (
                              <button
                                type="button"
                                onClick={() => handleConvertQuotation(quote)}
                                className="px-2 py-0.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors cursor-pointer"
                                title="Convert directly to Sale & Invoice"
                              >
                                <ArrowRight className="w-3 h-3 inline mr-0.5" />
                                Convert
                              </button>
                            ) : (
                              <span className="text-[10px] font-semibold text-emerald-700">Converted</span>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete quotation ${quote.quotationNumber}?`)) {
                                  deleteQuotation(quote.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              title="Delete quotation"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Compact Pagination Bar */}
        <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="text-[11px]">
            {activeItems.length === 0
              ? '0 records'
              : `${(validPage - 1) * pageSize + 1}-${Math.min(
                  validPage * pageSize,
                  activeItems.length
                )} of ${activeItems.length}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={validPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-semibold text-slate-700 px-1">
              {validPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={validPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quotation Modal */}
      <QuotationModal
        isOpen={isQuotationModalOpen}
        onClose={() => {
          setIsQuotationModalOpen(false);
          setSelectedQuotation(null);
        }}
        quotationToView={selectedQuotation}
        onQuotationConverted={(sale) => onOpenReceipt(sale.id)}
      />

      {/* Manual Invoice Modal */}
      <ManualInvoiceModal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setSelectedManualInvoice(null);
        }}
        invoiceToEdit={selectedManualInvoice}
      />

      {/* Compact Payment Dates Timeline Popover Modal */}
      {paymentTimelineInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-3"
          onClick={() => setPaymentTimelineInvoice(null)}
        >
          <div
            className="bg-white w-full max-w-xs rounded-xl shadow-xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border-b border-slate-100">
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  #{paymentTimelineInvoice.invoiceNumber} · {language === 'pt' ? 'Datas de Pagamento' : 'Payment Dates'}
                </div>
                <div className="text-[11px] text-slate-500 truncate">{paymentTimelineInvoice.customerName}</div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentTimelineInvoice(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {(paymentTimelineInvoice.payments || []).map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between px-3.5 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] inline-flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-slate-700 tabular-nums">{formatDateOnly(p.date)}</span>
                  </div>
                  <span className="font-bold text-emerald-700 tabular-nums">
                    {profile.currency}{p.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>

            <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <div>
                <span className="text-slate-500">{language === 'pt' ? 'Saldo:' : 'Balance:'} </span>
                <span className={`font-bold ${paymentTimelineInvoice.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {profile.currency}{paymentTimelineInvoice.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const inv = paymentTimelineInvoice;
                  setPaymentTimelineInvoice(null);
                  setSelectedManualInvoice(inv);
                  setIsManualModalOpen(true);
                }}
                className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                {language === 'pt' ? 'Editar / Pagar' : 'Edit / Pay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compact In-App Delete Confirmation for Manual Invoices */}
      {manualInvoiceToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[1px] p-3"
          onClick={() => setManualInvoiceToDelete(null)}
        >
          <div
            className="bg-white w-full max-w-xs rounded-xl shadow-xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900">
                {language === 'pt' ? 'Excluir Fatura Manual?' : 'Delete Manual Invoice?'}
              </h4>
              <button
                type="button"
                onClick={() => setManualInvoiceToDelete(null)}
                className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="px-4 py-3 text-xs text-slate-600 space-y-1">
              <p>
                {language === 'pt'
                  ? 'Tem certeza que deseja excluir permanentemente:'
                  : 'Are you sure you want to delete:'}
              </p>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-900 flex items-center justify-between">
                <span className="truncate pr-2">
                  #{manualInvoiceToDelete.invoiceNumber} · {manualInvoiceToDelete.customerName}
                </span>
                <span className="shrink-0">
                  {profile.currency}{manualInvoiceToDelete.amount.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setManualInvoiceToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg cursor-pointer"
              >
                {language === 'pt' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const idToDelete = manualInvoiceToDelete.id;
                  deleteManualInvoice(idToDelete);
                  if (selectedManualInvoice?.id === idToDelete) {
                    setSelectedManualInvoice(null);
                    setIsManualModalOpen(false);
                  }
                  if (paymentTimelineInvoice?.id === idToDelete) {
                    setPaymentTimelineInvoice(null);
                  }
                  setManualInvoiceToDelete(null);
                }}
                className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer"
              >
                {language === 'pt' ? 'Excluir' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
