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
} from 'lucide-react';

interface SalesViewProps {
  onOpenNewSale: () => void;
  onOpenReceipt: (saleId: string) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  onOpenNewSale,
  onOpenReceipt,
}) => {
  const { sales, deleteSale, permissions, profile } = useBusiness();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.customerPhone && s.customerPhone.includes(searchTerm));

    const matchesStatus =
      statusFilter === 'all' ? true : s.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalSalesVolume = sales.reduce((acc, s) => acc + s.total, 0);
  const totalPaidVolume = sales.reduce((acc, s) => acc + s.amountPaid, 0);
  const totalUnpaidVolume = sales.reduce((acc, s) => acc + s.balanceDue, 0);

  // Pagination (4 per page on mobile, 7 on desktop)
  const pageSize = 5;
  const totalPages = Math.ceil(filteredSales.length / pageSize) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const paginatedSales = filteredSales.slice((validPage - 1) * pageSize, validPage * pageSize);

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-2 sm:space-y-3">
      {/* Header */}
      <div className="bg-white rounded-xl p-2.5 sm:p-4 border border-slate-200 shadow-2xs flex items-center justify-between gap-2 shrink-0">
        <div>
          <h1 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight">
            Sales & Invoices
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500">
            {sales.length} orders recorded
          </p>
        </div>

        {permissions.canRecordSales && (
          <button
            type="button"
            onClick={onOpenNewSale}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Sale</span>
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 shrink-0">
        <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
            Invoiced
          </span>
          <div className="text-xs sm:text-lg font-black text-slate-900 mt-0.5 sm:mt-1 truncate">
            {profile.currency}{totalSalesVolume.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 hidden sm:block">{sales.length} invoices</span>
        </div>

        <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
            Collected
          </span>
          <div className="text-xs sm:text-lg font-black text-emerald-600 mt-0.5 sm:mt-1 truncate">
            {profile.currency}{totalPaidVolume.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 hidden sm:block">Settled</span>
        </div>

        <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
            Outstanding
          </span>
          <div className="text-xs sm:text-lg font-black text-rose-600 mt-0.5 sm:mt-1 truncate">
            {profile.currency}{totalUnpaidVolume.toLocaleString()}
          </div>
          <span className="text-[10px] text-rose-600 hidden sm:block">Due credit</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice or customer..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

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
      </div>

      {/* Invoices List Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Mobile View: Clean, Stacked Card List (No horizontal scrolling) */}
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

        {/* Desktop View: Full Data Table */}
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
                            <Trash2 className="w-3 h-3" />
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

        {/* Compact Pagination Bar */}
        <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="text-[11px]">
            {filteredSales.length === 0
              ? '0 orders'
              : `${(validPage - 1) * pageSize + 1}-${Math.min(
                  validPage * pageSize,
                  filteredSales.length
                )} of ${filteredSales.length}`}
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
    </div>
  );
};
