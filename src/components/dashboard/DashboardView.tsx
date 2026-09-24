import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  Wallet,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Lock,
  ChevronRight,
  Landmark,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenNewSale: () => void;
  onOpenNewExpense: () => void;
  onOpenNewProduct: () => void;
  onOpenInvoiceReceipt: (saleId: string) => void;
  onQuickRestock: (productId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewSale,
  onOpenNewExpense,
  onOpenInvoiceReceipt,
  onQuickRestock,
}) => {
  const {
    profile,
    permissions,
    sales,
    expenses,
    accounts,
    todaySalesTotal,
    todayExpensesTotal,
    todayEstimatedProfit,
    totalCashAvailable,
    lowStockProducts,
    overdueCustomers,
    totalReceivables,
    setActiveNavTab,
  } = useBusiness();

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  const todaySales = sales.filter((s) => isToday(s.timestamp));
  const todayExpenses = expenses.filter((e) => isToday(e.timestamp));

  // Today's unified activity feed
  const todayEvents = [
    ...todaySales.map((s) => ({
      id: s.id,
      type: 'sale' as const,
      title: `Sale to ${s.customerName}`,
      amount: s.total,
      time: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date(s.timestamp).getTime(),
      meta: `${s.items.length} item(s) • ${s.paymentMethod.toUpperCase()}`,
      by: s.cashierName,
    })),
    ...todayExpenses.map((e) => ({
      id: e.id,
      type: 'expense' as const,
      title: e.title,
      amount: e.amount,
      time: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date(e.timestamp).getTime(),
      meta: `Category: ${e.category.toUpperCase()}`,
      by: e.recordedBy,
    })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  const formatCurrency = (val: number) => {
    return `${profile.currency}${val.toLocaleString()}`;
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const marginPercent =
    todaySalesTotal > 0 ? Math.round((todayEstimatedProfit / todaySalesTotal) * 100) : 0;

  const [mobileTab, setMobileTab] = useState<'activity' | 'accounts'>('activity');

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-2 sm:space-y-3">
      {/* 1. Header Bar: Compact & Direct */}
      <div className="bg-white rounded-xl p-2.5 sm:p-4 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 truncate">
            <h1 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight truncate">
              Business Overview
            </h1>
            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
              {todayFormatted}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 truncate hidden sm:block">
            Real-time daily operations, cash balances, and urgent inventory alerts
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {permissions.canRecordSales && (
            <button
              type="button"
              onClick={onOpenNewSale}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Sale</span>
            </button>
          )}

          {permissions.canRecordExpenses && (
            <button
              type="button"
              onClick={onOpenNewExpense}
              className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Key Daily Metrics (4 Clean Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-3 shrink-0">
        {/* Metric 1: Today's Sales */}
        <div className="bg-white rounded-xl p-2 sm:p-3.5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Sales Today
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Receipt className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            </div>
          </div>
          <div className="mt-1 sm:mt-2">
            <div className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
              {formatCurrency(todaySalesTotal)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500">
              {todaySales.length} {todaySales.length === 1 ? 'order' : 'orders'}
            </div>
          </div>
        </div>

        {/* Metric 2: Today's Expenses */}
        <div className="bg-white rounded-xl p-2 sm:p-3.5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Expenses
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <TrendingDown className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            </div>
          </div>
          <div className="mt-1 sm:mt-2">
            {permissions.canViewExpenses ? (
              <>
                <div className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
                  {formatCurrency(todayExpensesTotal)}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500">
                  {todayExpenses.length} entries
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-400 py-1">Restricted</div>
            )}
          </div>
        </div>

        {/* Metric 3: Estimated Net Profit */}
        <div className="bg-white rounded-xl p-2 sm:p-3.5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Est. Profit
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            </div>
          </div>
          <div className="mt-1 sm:mt-2">
            {permissions.canViewProfits ? (
              <>
                <div className="text-base sm:text-xl font-black text-emerald-600 tracking-tight">
                  {formatCurrency(todayEstimatedProfit)}
                </div>
                <div className="text-[10px] sm:text-[11px] text-emerald-700 font-semibold">
                  {marginPercent}% margin
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-400 py-1">Hidden</div>
            )}
          </div>
        </div>

        {/* Metric 4: Cash Available */}
        <div className="bg-white rounded-xl p-2 sm:p-3.5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
              Cash & Bank
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Wallet className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            </div>
          </div>
          <div className="mt-1 sm:mt-2">
            {permissions.canViewBankBalances ? (
              <>
                <div className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
                  {formatCurrency(totalCashAvailable)}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500">Till & bank</div>
              </>
            ) : (
              <div className="text-xs text-slate-400 py-1">Confidential</div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Actionable Alert Strip (Only visible if action needed) */}
      {(lowStockProducts.length > 0 || overdueCustomers.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2.5 shrink-0">
          {lowStockProducts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1.5 sm:py-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <div className="text-xs text-amber-900 font-medium truncate">
                  <strong>{lowStockProducts.length} items</strong> below reorder level
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveNavTab('inventory')}
                className="text-[11px] font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-200 px-2 py-0.5 rounded shrink-0 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Restock</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {overdueCustomers.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-2.5 py-1.5 sm:py-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <div className="text-xs text-rose-900 font-medium truncate">
                  <strong>{formatCurrency(totalReceivables)}</strong> owed ({overdueCustomers.length} customers)
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveNavTab('customers')}
                className="text-[11px] font-bold text-rose-900 bg-rose-200/80 hover:bg-rose-200 px-2 py-0.5 rounded shrink-0 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Collect</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden items-center p-1 bg-slate-200/90 rounded-xl shrink-0 gap-1">
        <button
          type="button"
          onClick={() => setMobileTab('activity')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer text-center ${
            mobileTab === 'activity' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Activity ({todayEvents.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('accounts')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer text-center ${
            mobileTab === 'accounts' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Accounts & Stock ({lowStockProducts.length})
        </button>
      </div>

      {/* 4. Main Two-Column Layout on Desktop / Tabbed on Mobile */}
      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-3 lg:gap-3 overflow-hidden">
        {/* Left (2 cols): Today's Activity */}
        <div
          className={`lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs p-3 sm:p-4 flex flex-col min-h-0 overflow-hidden ${
            mobileTab === 'activity' ? 'flex flex-1' : 'hidden lg:flex'
          }`}
        >
          <div className="flex items-center justify-between mb-2 shrink-0">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Today's Activity
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">
              {todayEvents.length} recorded
            </span>
          </div>

          <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto no-scrollbar">
            {todayEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No sales or expenses recorded yet today. Click "+ Sale" to start.
              </div>
            ) : (
              todayEvents.slice(0, 5).map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100/70 border border-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                        evt.type === 'sale'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {evt.type === 'sale' ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {evt.title}
                        </span>
                        <span className="text-[10px] text-slate-600 shrink-0">{evt.time}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{evt.meta}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <div
                      className={`text-xs font-bold ${
                        evt.type === 'sale' ? 'text-emerald-600' : 'text-slate-800'
                      }`}
                    >
                      {evt.type === 'sale' ? '+' : '-'}
                      {formatCurrency(evt.amount)}
                    </div>
                    {evt.type === 'sale' && (
                      <button
                        type="button"
                        onClick={() => onOpenInvoiceReceipt(evt.id)}
                        className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        Receipt
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right (1 col): Quick Accounts & Low Stock */}
        <div
          className={`space-y-2 sm:space-y-3 min-h-0 flex-col overflow-hidden ${
            mobileTab === 'accounts' ? 'flex flex-1' : 'hidden lg:flex'
          }`}
        >
          {/* Accounts Mini Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Accounts
              </h2>
              {permissions.canViewBankBalances && (
                <button
                  type="button"
                  onClick={() => setActiveNavTab('cash_bank')}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  Manage
                </button>
              )}
            </div>

            {permissions.canViewBankBalances ? (
              <div className="space-y-1.5">
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 text-xs"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {acc.type === 'cash' ? (
                        <Wallet className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      ) : (
                        <Landmark className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )}
                      <span className="font-medium text-slate-800 truncate">{acc.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">{formatCurrency(acc.balance)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-1">
                Restricted
              </div>
            )}
          </div>

          {/* Urgent Restock Mini Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3 flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Low Stock ({lowStockProducts.length})
              </h2>
              <button
                type="button"
                onClick={() => setActiveNavTab('inventory')}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                Catalog
              </button>
            </div>

            <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto no-scrollbar">
              {lowStockProducts.length === 0 ? (
                <div className="text-xs text-emerald-600 text-center py-3">All stocks healthy</div>
              ) : (
                lowStockProducts.slice(0, 3).map((prod) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-amber-50/60 border border-amber-100 text-xs"
                  >
                    <div className="min-w-0 pr-1 truncate">
                      <div className="font-semibold text-slate-900 truncate">{prod.name}</div>
                      <div className="text-[10px] text-amber-800 truncate">
                        Stock: <strong className="text-rose-600">{prod.stock}</strong> (Min: {prod.minStockAlert})
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onQuickRestock(prod.id)}
                      className="px-2 py-0.5 text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded cursor-pointer shrink-0"
                    >
                      Restock
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
