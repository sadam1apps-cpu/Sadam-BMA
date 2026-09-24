import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Calendar,
  Lock,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    sales,
    expenses,
    products,
    permissions,
    profile,
  } = useBusiness();

  const [timeframe, setTimeframe] = useState<'all' | 'today' | 'month'>('all');
  const [mobileTab, setMobileTab] = useState<'pnl' | 'products' | 'customers'>('pnl');

  // Filter by timeframe
  const now = new Date();
  const filteredSales = sales.filter((s) => {
    if (timeframe === 'all') return true;
    const d = new Date(s.timestamp);
    if (timeframe === 'today') {
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }
    if (timeframe === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const filteredExpenses = expenses.filter((e) => {
    if (timeframe === 'all') return true;
    const d = new Date(e.timestamp);
    if (timeframe === 'today') {
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }
    if (timeframe === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Calculate P&L metrics
  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);

  // COGS: sum of item quantity * unit costPrice
  const totalCogs = filteredSales.reduce((acc, s) => {
    return (
      acc +
      s.items.reduce((itemAcc, item) => {
        const prod = products.find((p) => p.id === item.productId);
        const cost = prod ? prod.costPrice : 0;
        return itemAcc + item.quantity * cost;
      }, 0)
    );
  }, 0);

  const grossProfit = totalRevenue - totalCogs;
  const totalOperatingExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = grossProfit - totalOperatingExpenses;
  const netMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  // Best-selling products
  const productSalesCount: Record<string, { name: string; quantity: number; revenue: number }> = {};
  filteredSales.forEach((s) => {
    s.items.forEach((item) => {
      if (!productSalesCount[item.productId]) {
        productSalesCount[item.productId] = {
          name: item.productName,
          quantity: 0,
          revenue: 0,
        };
      }
      productSalesCount[item.productId].quantity += item.quantity;
      productSalesCount[item.productId].revenue += item.subtotal;
    });
  });

  const bestSellingProducts = Object.values(productSalesCount)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Top Customers
  const customerSpendMap: Record<string, { name: string; spend: number; orders: number }> = {};
  filteredSales.forEach((s) => {
    if (!customerSpendMap[s.customerName]) {
      customerSpendMap[s.customerName] = {
        name: s.customerName,
        spend: 0,
        orders: 0,
      };
    }
    customerSpendMap[s.customerName].spend += s.total;
    customerSpendMap[s.customerName].orders += 1;
  });

  const topCustomers = Object.values(customerSpendMap)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-2 sm:space-y-3">
      {/* Header and Filter */}
      <div className="bg-white rounded-xl p-2.5 sm:p-4 border border-slate-200 shadow-2xs flex items-center justify-between gap-2 shrink-0">
        <div>
          <h1 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight">
            Financial Reports
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500">
            P&L statement & product metrics
          </p>
        </div>

        <div className="flex items-center gap-1">
          {(['today', 'month', 'all'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTimeframe(t)}
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                timeframe === t
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'today' ? 'Today' : t === 'month' ? 'Month' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="flex sm:hidden bg-slate-200/80 p-0.5 rounded-lg shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('pnl')}
          className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            mobileTab === 'pnl' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          P&L Summary
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('products')}
          className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            mobileTab === 'products' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Top Products
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('customers')}
          className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            mobileTab === 'customers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Top Customers
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-2 sm:space-y-3">
        {/* P&L Statement */}
        <div className={`bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden ${mobileTab !== 'pnl' ? 'hidden sm:block' : 'block'}`}>
          <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                Profit & Loss ({timeframe === 'today' ? "Today" : timeframe === 'month' ? 'Current Month' : 'All Time'})
              </h2>
              <p className="text-[10px] text-slate-400">
                Revenue minus Cost of Goods Sold and Operating Expenses
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Net Margin</span>
              <div className={`text-sm sm:text-lg font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {netMargin}%
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
              <span className="font-semibold text-slate-900">Gross Sales Revenue</span>
              <span className="font-bold text-slate-900">
                +{profile.currency}{totalRevenue.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-slate-600 text-xs">
              <span className="pl-2">Cost of Goods Sold (COGS)</span>
              <span className="font-medium text-slate-700">
                -{profile.currency}{totalCogs.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs font-semibold text-slate-900">
              <span>Gross Operating Margin</span>
              <span className="font-bold text-indigo-700">
                {profile.currency}{grossProfit.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-slate-600 text-xs">
              <span className="pl-2">Overhead Expenses</span>
              <span className="font-medium text-rose-600">
                -{profile.currency}{totalOperatingExpenses.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 sm:p-3 bg-slate-900 text-white rounded-xl">
              <div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                  Net Bottom-Line Profit
                </span>
              </div>
              <div className="text-base sm:text-xl font-black text-emerald-400">
                {profile.currency}{netProfit.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Grid on Desktop / Tabbed on Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {/* Best Selling Products */}
          <div className={`bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs ${mobileTab !== 'products' ? 'hidden sm:block' : 'block'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-indigo-600" />
                <h2 className="text-xs font-bold text-slate-900">
                  Top Products by Revenue
                </h2>
              </div>
            </div>

            <div className="space-y-1.5">
              {bestSellingProducts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No product sales recorded.</p>
              ) : (
                bestSellingProducts.map((prod, idx) => (
                  <div
                    key={prod.name}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[9px] shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 truncate">
                        <div className="font-bold text-slate-900 truncate">{prod.name}</div>
                        <div className="text-[10px] text-slate-400">{prod.quantity} units sold</div>
                      </div>
                    </div>
                    <div className="font-black text-slate-900 text-xs shrink-0">
                      {profile.currency}{prod.revenue.toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Spending Customers */}
          <div className={`bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs ${mobileTab !== 'customers' ? 'hidden sm:block' : 'block'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <h2 className="text-xs font-bold text-slate-900">
                  Top Valuable Customers
                </h2>
              </div>
            </div>

            <div className="space-y-1.5">
              {topCustomers.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No customer orders recorded.</p>
              ) : (
                topCustomers.map((cust, idx) => (
                  <div
                    key={cust.name}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px] shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 truncate">
                        <div className="font-bold text-slate-900 truncate">{cust.name}</div>
                        <div className="text-[10px] text-slate-400">{cust.orders} order(s)</div>
                      </div>
                    </div>
                    <div className="font-black text-emerald-600 text-xs shrink-0">
                      {profile.currency}{cust.spend.toLocaleString()}
                    </div>
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
