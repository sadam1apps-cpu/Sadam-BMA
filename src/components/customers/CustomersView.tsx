import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Customer } from '../../types';
import {
  UserPlus,
  Search,
  DollarSign,
  Edit2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface CustomersViewProps {
  onOpenNewCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onCollectDebt: (customer: Customer) => void;
  onViewSalesForCustomer?: (customerId: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  onOpenNewCustomer,
  onEditCustomer,
  onCollectDebt,
}) => {
  const { customers, totalReceivables, profile } = useBusiness();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'with_debt'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDebt = filter === 'all' ? true : c.outstandingDebt > 0;
    return matchesSearch && matchesDebt;
  });

  const debtorsCount = customers.filter((c) => c.outstandingDebt > 0).length;

  const pageSize = 5;
  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const paginatedCustomers = filteredCustomers.slice((validPage - 1) * pageSize, validPage * pageSize);

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-2 sm:space-y-3">
      {/* Header */}
      <div className="bg-white rounded-xl p-2.5 sm:p-4 border border-slate-200 shadow-2xs flex items-center justify-between gap-2 shrink-0">
        <div>
          <h1 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight">
            Customers & Credit
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500">
            {customers.length} customer profiles
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewCustomer}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 shrink-0">
        <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
            Profiles
          </span>
          <div className="text-sm sm:text-xl font-black text-slate-900 mt-0.5 sm:mt-1">
            {customers.length}
          </div>
          <span className="text-[10px] text-slate-500 hidden sm:block">Active buyers</span>
        </div>

        <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
            Receivables
          </span>
          <div className="text-sm sm:text-xl font-black text-rose-600 mt-0.5 sm:mt-1 truncate">
            {profile.currency}{totalReceivables.toLocaleString()}
          </div>
          <span className="text-[10px] text-rose-600 hidden sm:block">
            {debtorsCount} with debt
          </span>
        </div>

        <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
            Customer Spend
          </span>
          <div className="text-sm sm:text-xl font-black text-emerald-600 mt-0.5 sm:mt-1 truncate">
            {profile.currency}
            {customers.reduce((acc, c) => acc + c.totalSpent, 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 hidden sm:block">Lifetime volume</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setFilter('all');
              setCurrentPage(1);
            }}
            className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer text-center ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            All ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter('with_debt');
              setCurrentPage(1);
            }}
            className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer text-center ${
              filter === 'with_debt'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            With Debt ({debtorsCount})
          </button>
        </div>
      </div>

      {/* Customers Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Mobile View: Cards */}
        <div className="block sm:hidden flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
          {paginatedCustomers.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No customers found matching search.
            </div>
          ) : (
            paginatedCustomers.map((cust) => {
              const hasDebt = cust.outstandingDebt > 0;

              return (
                <div key={cust.id} className="p-2.5 flex flex-col gap-1.5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 pr-2 truncate">
                      <span className="font-bold text-xs text-slate-900 truncate block">{cust.name}</span>
                      <span className="text-[10px] text-slate-400">{cust.phone}</span>
                    </div>
                    <div>
                      {hasDebt ? (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800">
                          Due {profile.currency}{cust.outstandingDebt.toLocaleString()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" /> Clear
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <span className="text-slate-500">
                      Limit: {profile.currency}{cust.creditLimit.toLocaleString()}
                    </span>
                    <span className="font-semibold text-slate-900">
                      Spent: {profile.currency}{cust.totalSpent.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                    {hasDebt ? (
                      <button
                        type="button"
                        onClick={() => onCollectDebt(cust)}
                        className="px-2 py-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors cursor-pointer flex items-center gap-0.5"
                      >
                        <DollarSign className="w-3 h-3" />
                        <span>Collect</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">No balance due</span>
                    )}

                    <button
                      type="button"
                      onClick={() => onEditCustomer(cust)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                      title="Edit customer profile"
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
                <th className="py-2.5 px-3.5">Customer</th>
                <th className="py-2.5 px-3.5">Phone</th>
                <th className="py-2.5 px-3.5">Debt</th>
                <th className="py-2.5 px-3.5">Credit Limit</th>
                <th className="py-2.5 px-3.5">Lifetime Spend</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No customers found matching search.
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((cust) => {
                  const hasDebt = cust.outstandingDebt > 0;

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3.5">
                        <div className="font-bold text-slate-900">{cust.name}</div>
                        {cust.email && (
                          <div className="text-[10px] text-slate-500">{cust.email}</div>
                        )}
                      </td>

                      <td className="py-2.5 px-3.5 text-slate-600 font-medium">
                        {cust.phone}
                      </td>

                      <td className="py-2.5 px-3.5">
                        {hasDebt ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            {profile.currency}{cust.outstandingDebt.toLocaleString()}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                            <CheckCircle2 className="w-3 h-3" /> Clear
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3.5 text-slate-600">
                        {profile.currency}{cust.creditLimit.toLocaleString()}
                      </td>

                      <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                        {profile.currency}{cust.totalSpent.toLocaleString()}
                      </td>

                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {hasDebt && (
                            <button
                              type="button"
                              onClick={() => onCollectDebt(cust)}
                              className="px-2 py-0.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors cursor-pointer"
                            >
                              <DollarSign className="w-3 h-3 inline" />
                              Collect
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onEditCustomer(cust)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                            title="Edit customer profile"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Compact Pagination Bar */}
        <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="text-[11px]">
            {filteredCustomers.length === 0
              ? '0 customers'
              : `${(validPage - 1) * pageSize + 1}-${Math.min(
                  validPage * pageSize,
                  filteredCustomers.length
                )} of ${filteredCustomers.length}`}
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
