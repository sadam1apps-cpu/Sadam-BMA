import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import {
  Wallet,
  Building2,
  ArrowRightLeft,
  Lock,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface CashBankViewProps {
  onOpenTransfer: () => void;
}

export const CashBankView: React.FC<CashBankViewProps> = ({ onOpenTransfer }) => {
  const { accounts, totalCashAndBank, profile, sales, expenses } = useBusiness();
  const [currentPage, setCurrentPage] = useState(1);

  // Unified activity log
  const recentActivities = [
    ...sales.map((s) => ({
      id: s.id,
      title: `Sale Receipt #${s.invoiceNumber}`,
      type: 'inflow' as const,
      amount: s.amountPaid,
      timestamp: s.timestamp,
      account: s.paymentMethod === 'cash' ? 'Cash Drawer' : 'Bank Account',
    })),
    ...expenses.map((e) => ({
      id: e.id,
      title: `Expense: ${e.title}`,
      type: 'outflow' as const,
      amount: e.amount,
      timestamp: e.timestamp,
      account: accounts.find((a) => a.id === e.accountId)?.name || 'Cash',
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const pageSize = 8;
  const totalPages = Math.ceil(recentActivities.length / pageSize) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const paginatedActivities = recentActivities.slice((validPage - 1) * pageSize, validPage * pageSize);

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-2 sm:space-y-3">
      {/* Header */}
      <div className="bg-white rounded-xl p-2.5 sm:p-4 border border-slate-200 shadow-2xs flex items-center justify-between gap-2 shrink-0">
        <div>
          <h1 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight">
            Cash, Bank & Liquidity
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500">
            Total reserves: <strong>{profile.currency}{totalCashAndBank.toLocaleString()}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenTransfer}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Internal Transfer</span>
        </button>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 shrink-0">
        <div className="bg-slate-900 text-white p-2 sm:p-3.5 rounded-xl shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate block">
            Liquidity
          </span>
          <div className="text-xs sm:text-xl font-black text-white mt-0.5 sm:mt-1 truncate">
            {profile.currency}{totalCashAndBank.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-300 hidden sm:block">
            Liquid funds
          </span>
        </div>

        {accounts.map((acc) => {
          const isCash = acc.type === 'cash';
          return (
            <div key={acc.id} className="bg-white p-2 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
                  {acc.name}
                </span>
                {isCash ? (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 hidden sm:flex">
                    <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                ) : (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 hidden sm:flex">
                    <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                )}
              </div>

              <div className="text-xs sm:text-xl font-black text-slate-900 mt-0.5 sm:mt-1 truncate">
                {profile.currency}{acc.balance.toLocaleString()}
              </div>

              <div className="text-[10px] text-slate-500 hidden sm:block truncate">
                {acc.accountNumber ? `Acct: ${acc.accountNumber}` : 'Cash Register Till'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction Stream Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="p-2 sm:p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <h2 className="text-[11px] sm:text-xs font-bold text-slate-900 uppercase tracking-wider">
            Activity Feed
          </h2>
          <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
            {recentActivities.length} entries
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
          {paginatedActivities.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No transactions recorded yet.</div>
          ) : (
            paginatedActivities.map((tx) => {
              const isInflow = tx.type === 'inflow';
              return (
                <div
                  key={`${tx.id}-${tx.title}`}
                  className="p-2 sm:p-2.5 sm:px-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center shrink-0 ${
                        isInflow
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isInflow ? (
                        <ArrowDownLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="font-semibold text-xs text-slate-900 truncate">{tx.title}</div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {tx.account} • {new Date(tx.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`font-black text-xs shrink-0 ${
                      isInflow ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {isInflow ? '+' : '-'}
                    {profile.currency}{tx.amount.toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Compact Pagination Bar */}
        <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="text-[11px]">
            {recentActivities.length === 0
              ? '0 entries'
              : `${(validPage - 1) * pageSize + 1}-${Math.min(
                  validPage * pageSize,
                  recentActivities.length
                )} of ${recentActivities.length}`}
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
