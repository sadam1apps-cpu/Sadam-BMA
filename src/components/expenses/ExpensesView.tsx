import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import {
  TrendingDown,
  Plus,
  Search,
  Trash2,
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface ExpensesViewProps {
  onOpenNewExpense: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ onOpenNewExpense }) => {
  const {
    expenses,
    deleteExpense,
    accounts,
    permissions,
    profile,
  } = useBusiness();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.paidTo && e.paidTo.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  // Group totals by category
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const pageSize = 5;
  const totalPages = Math.ceil(filteredExpenses.length / pageSize) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const paginatedExpenses = filteredExpenses.slice((validPage - 1) * pageSize, validPage * pageSize);

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-2 sm:space-y-3">
      {/* Header */}
      <div className="bg-white rounded-xl p-2.5 sm:p-4 border border-slate-200 shadow-2xs flex items-center justify-between gap-2 shrink-0">
        <div>
          <h1 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight">
            Operating Expenses
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500">
            Total: <strong>{profile.currency}{totalExpenses.toLocaleString()}</strong> ({expenses.length} entries)
          </p>
        </div>

        {permissions.canRecordExpenses && (
          <button
            type="button"
            onClick={onOpenNewExpense}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Expense</span>
          </button>
        )}
      </div>

      {/* Category Breakdown Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2.5 shrink-0">
        {[
          { id: 'utilities', label: 'Utilities' },
          { id: 'transport', label: 'Transport' },
          { id: 'supplies', label: 'Supplies' },
          { id: 'salaries', label: 'Salaries' },
        ].map((cat) => {
          const total = categoryTotals[cat.id] || 0;
          return (
            <div key={cat.id} className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
                {cat.label}
              </span>
              <div className="text-sm sm:text-lg font-black text-slate-900 mt-0.5 truncate">
                {profile.currency}{total.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search title or recipient..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="rent">Rent</option>
            <option value="salaries">Salaries</option>
            <option value="transport">Transport</option>
            <option value="utilities">Utilities</option>
            <option value="supplies">Supplies</option>
            <option value="marketing">Marketing</option>
            <option value="maintenance">Maintenance</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Expense Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Mobile View: Cards */}
        <div className="block sm:hidden flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
          {paginatedExpenses.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No expense records found matching filters.
            </div>
          ) : (
            paginatedExpenses.map((exp) => {
              const account = accounts.find((a) => a.id === exp.accountId);
              return (
                <div key={exp.id} className="p-2.5 flex flex-col gap-1.5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 pr-2 truncate">
                      <span className="font-bold text-xs text-slate-900 truncate block">{exp.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(exp.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {account?.name || 'Cash Tray'}
                      </span>
                    </div>
                    <div className="font-black text-xs text-rose-600 shrink-0">
                      -{profile.currency}{exp.amount.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-slate-50">
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[9px] font-semibold text-slate-700 uppercase">
                        {exp.category}
                      </span>
                      {exp.paidTo && (
                        <span className="text-slate-500 text-[10px]">to {exp.paidTo}</span>
                      )}
                    </div>

                    {permissions.canDeleteTransactions && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete expense "${exp.title}"?`)) {
                            deleteExpense(exp.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                        title="Delete expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
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
                <th className="py-2.5 px-3.5">Expense Description</th>
                <th className="py-2.5 px-3.5">Category</th>
                <th className="py-2.5 px-3.5">Paid To</th>
                <th className="py-2.5 px-3.5">Account</th>
                <th className="py-2.5 px-3.5">Date</th>
                <th className="py-2.5 px-3.5">Amount</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No expense records found matching filters.
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((exp) => {
                  const account = accounts.find((a) => a.id === exp.accountId);
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3.5 font-bold text-slate-900">
                        {exp.title}
                      </td>

                      <td className="py-2.5 px-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700 uppercase">
                          {exp.category}
                        </span>
                      </td>

                      <td className="py-2.5 px-3.5 text-slate-600">
                        {exp.paidTo || '--'}
                      </td>

                      <td className="py-2.5 px-3.5 text-slate-600 font-medium">
                        {account?.name || 'Cash Tray'}
                      </td>

                      <td className="py-2.5 px-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(exp.timestamp).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      <td className="py-2.5 px-3.5 font-black text-rose-600">
                        {profile.currency}{exp.amount.toLocaleString()}
                      </td>

                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        {permissions.canDeleteTransactions ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete expense "${exp.title}"?`)) {
                                deleteExpense(exp.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                            title="Delete expense"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="p-1 text-slate-300" title="Restricted for role">
                            <Lock className="w-3 h-3" />
                          </span>
                        )}
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
            {filteredExpenses.length === 0
              ? '0 records'
              : `${(validPage - 1) * pageSize + 1}-${Math.min(
                  validPage * pageSize,
                  filteredExpenses.length
                )} of ${filteredExpenses.length}`}
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
