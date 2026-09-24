import React from 'react';
import { useBusiness } from '../../context/BusinessContext';
import {
  LayoutDashboard,
  Receipt,
  Package,
  Users,
  Truck,
  TrendingDown,
  UserCheck,
  Landmark,
  FileBarChart,
  Settings,
  Lock,
} from 'lucide-react';

export const IconNavBar: React.FC = () => {
  const {
    activeNavTab,
    setActiveNavTab,
    lowStockProducts,
    overdueCustomers,
    permissions,
    currentRole,
  } = useBusiness();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Overview',
      tooltip: 'Dashboard & Daily KPIs',
      icon: LayoutDashboard,
      badge: null,
      visible: true,
    },
    {
      id: 'sales',
      label: 'Sales',
      tooltip: 'Sales & Invoices',
      icon: Receipt,
      badge: null,
      visible: true,
    },
    {
      id: 'inventory',
      label: 'Stock',
      tooltip: 'Products & Inventory',
      icon: Package,
      badge: lowStockProducts.length > 0 ? lowStockProducts.length : null,
      badgeColor: 'bg-amber-500',
      visible: true,
    },
    {
      id: 'customers',
      label: 'Customers',
      tooltip: 'Customers & Debts',
      icon: Users,
      badge: overdueCustomers.length > 0 ? overdueCustomers.length : null,
      badgeColor: 'bg-rose-500',
      visible: true,
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      tooltip: 'Vendor Accounts',
      icon: Truck,
      badge: null,
      visible: true,
    },
    {
      id: 'expenses',
      label: 'Expenses',
      tooltip: 'Operating Expenses',
      icon: TrendingDown,
      badge: null,
      visible: permissions.canViewExpenses,
    },
    {
      id: 'employees',
      label: 'Staff',
      tooltip: 'Employees & Permissions',
      icon: UserCheck,
      badge: null,
      visible: true,
    },
    {
      id: 'cash_bank',
      label: 'Cash & Bank',
      tooltip: 'Cash Till & Bank Accounts',
      icon: Landmark,
      badge: null,
      visible: permissions.canViewBankBalances,
    },
    {
      id: 'reports',
      label: 'Reports',
      tooltip: 'Reports & P&L Analysis',
      icon: FileBarChart,
      badge: null,
      visible: permissions.canViewReports,
    },
    {
      id: 'settings',
      label: 'Settings',
      tooltip: 'Store Settings & Currency',
      icon: Settings,
      badge: null,
      visible: currentRole === 'owner' || permissions.canManageSettings || permissions.canManageDatabase,
    },
  ];

  return (
    <nav
      id="icon-nav-bar"
      aria-label="Application Navigation"
      className="sticky top-13 sm:top-16 z-20 bg-slate-900 border-b border-slate-800 shadow-xs shrink-0"
    >
      <div className="w-full flex items-center justify-center px-1 sm:px-4 lg:px-6">
        <div className="flex items-center justify-start sm:justify-center gap-1 sm:gap-2 md:gap-3 py-1 sm:py-2 overflow-x-auto no-scrollbar mx-auto max-w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeNavTab === item.id ||
              (item.id === 'cash_bank' && (activeNavTab as any) === 'cashbank');

            if (!item.visible) {
              return (
                <div
                  key={item.id}
                  className="flex flex-col items-center justify-center text-center px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl opacity-35 cursor-not-allowed select-none min-w-[48px] sm:min-w-[70px]"
                  title={`${item.label} (Restricted by role)`}
                >
                  <div className="relative flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-slate-500" />
                    <Lock className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-slate-400 absolute -bottom-1 -right-1" />
                  </div>
                  <span className="text-[9px] sm:text-[11px] font-medium text-slate-500 mt-0.5 sm:mt-1 whitespace-nowrap text-center">
                    {item.label}
                  </span>
                </div>
              );
            }

            return (
              <button
                key={item.id}
                id={`icon-nav-${item.id}`}
                type="button"
                onClick={() => setActiveNavTab(item.id)}
                title={item.tooltip}
                className={`group flex flex-col items-center justify-center text-center px-1.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all cursor-pointer relative min-w-[50px] sm:min-w-[72px] ${
                  isActive
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`w-3.5 h-3.5 sm:w-5 sm:h-5 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />

                  {/* Notification Badge */}
                  {item.badge !== null && (
                    <span
                      className={`absolute -top-1 -right-2 px-1 py-0.2 text-[8px] sm:text-[9px] font-bold text-white rounded-full leading-none shadow-sm ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[9px] sm:text-[11px] tracking-tight mt-0.5 sm:mt-1 whitespace-nowrap text-center ${
                    isActive ? 'text-white font-semibold' : 'text-slate-400 group-hover:text-slate-300'
                  }`}
                >
                  {item.label}
                </span>

                {/* Active Indicator Underline - centered */}
                {isActive && (
                  <span className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-5 sm:w-7 h-0.5 bg-indigo-400 rounded-full sm:block hidden"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
