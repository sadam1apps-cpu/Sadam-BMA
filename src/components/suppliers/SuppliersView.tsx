import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Supplier } from '../../types';
import { Truck, Plus, Search, DollarSign, Edit2, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

interface SuppliersViewProps {
  onOpenNewSupplier: () => void;
  onEditSupplier: (supplier: Supplier) => void;
  onPaySupplier: (supplier: Supplier) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  onOpenNewSupplier,
  onEditSupplier,
  onPaySupplier,
}) => {
  const { suppliers, totalPayables, profile } = useBusiness();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pageSize = 5;
  const totalPages = Math.ceil(filteredSuppliers.length / pageSize) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const paginatedSuppliers = filteredSuppliers.slice((validPage - 1) * pageSize, validPage * pageSize);

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-2 sm:space-y-3">
      {/* Header */}
      <div className="bg-white rounded-xl p-2.5 sm:p-4 border border-slate-200 shadow-2xs flex items-center justify-between gap-2 shrink-0">
        <div>
          <h1 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight">
            Suppliers & Vendors
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500">
            {suppliers.length} registered vendors
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewSupplier}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 shrink-0">
        <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
            Vendors
          </span>
          <div className="text-sm sm:text-xl font-black text-slate-900 mt-0.5 sm:mt-1">
            {suppliers.length}
          </div>
          <span className="text-[10px] text-slate-500 hidden sm:block">Active sources</span>
        </div>

        <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
            Payables Owed
          </span>
          <div className="text-sm sm:text-xl font-black text-rose-600 mt-0.5 sm:mt-1 truncate">
            {profile.currency}{totalPayables.toLocaleString()}
          </div>
          <span className="text-[10px] text-rose-600 hidden sm:block">Pending bills</span>
        </div>

        <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
            Purchases Value
          </span>
          <div className="text-sm sm:text-xl font-black text-indigo-600 mt-0.5 sm:mt-1 truncate">
            {profile.currency}
            {suppliers.reduce((acc, s) => acc + s.totalPurchased, 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 hidden sm:block">Supplies to date</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs shrink-0">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers by name or category..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Suppliers Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Mobile View: Cards */}
        <div className="block sm:hidden flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
          {paginatedSuppliers.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No suppliers found matching search.
            </div>
          ) : (
            paginatedSuppliers.map((sup) => {
              const hasOwed = sup.amountOwed > 0;

              return (
                <div key={sup.id} className="p-2.5 flex flex-col gap-1.5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 pr-2 truncate">
                      <span className="font-bold text-xs text-slate-900 truncate block">{sup.companyName}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{sup.contactPerson} • {sup.category}</span>
                    </div>
                    <div>
                      {hasOwed ? (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800">
                          Owe {profile.currency}{sup.amountOwed.toLocaleString()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <span className="text-slate-500 text-[10px]">{sup.phone}</span>
                    <span className="font-semibold text-slate-900">
                      Total: {profile.currency}{sup.totalPurchased.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                    {hasOwed ? (
                      <button
                        type="button"
                        onClick={() => onPaySupplier(sup)}
                        className="px-2 py-0.5 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors cursor-pointer"
                      >
                        Pay Bill
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">Account clear</span>
                    )}

                    <button
                      type="button"
                      onClick={() => onEditSupplier(sup)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                      title="Edit supplier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden sm:block flex-1 min-h-0 overflow-y-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] z-10">
              <tr>
                <th className="py-2.5 px-3.5">Supplier Company</th>
                <th className="py-2.5 px-3.5">Contact Person</th>
                <th className="py-2.5 px-3.5">Category</th>
                <th className="py-2.5 px-3.5">Contact Info</th>
                <th className="py-2.5 px-3.5">Amount Owed</th>
                <th className="py-2.5 px-3.5">Total Purchases</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No suppliers found matching search.
                  </td>
                </tr>
              ) : (
                paginatedSuppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">
                      {sup.companyName}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-700 font-medium">
                      {sup.contactPerson}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                        {sup.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-600">
                      <div>{sup.phone}</div>
                      {sup.email && <div className="text-[10px] text-slate-400">{sup.email}</div>}
                    </td>
                    <td className="py-2.5 px-3.5">
                      {sup.amountOwed > 0 ? (
                        <span className="font-extrabold text-rose-600">
                          {profile.currency}{sup.amountOwed.toLocaleString()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">
                      {profile.currency}{sup.totalPurchased.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {sup.amountOwed > 0 && (
                          <button
                            type="button"
                            onClick={() => onPaySupplier(sup)}
                            className="px-2 py-0.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors cursor-pointer"
                          >
                            Pay Bill
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEditSupplier(sup)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                          title="Edit supplier"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
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
            {filteredSuppliers.length === 0
              ? '0 suppliers'
              : `${(validPage - 1) * pageSize + 1}-${Math.min(
                  validPage * pageSize,
                  filteredSuppliers.length
                )} of ${filteredSuppliers.length}`}
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
