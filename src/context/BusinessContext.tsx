import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  Account,
  BusinessProfile,
  Customer,
  Employee,
  Expense,
  NotificationAlert,
  Product,
  RolePermissions,
  Sale,
  StockMovement,
  Supplier,
  UserRole,
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_HIERARCHY,
} from '../types';
import {
  initialAccounts,
  initialAlerts,
  initialBusinessProfile,
  initialCustomers,
  initialEmployees,
  initialExpenses,
  initialProducts,
  initialSales,
  initialStockMovements,
  initialSuppliers,
} from '../data/initialData';
import {
  fetchAllFromSheets,
  pushAllToSheets,
  testSheetsConnection,
  ApiQuotaStats,
  getApiQuotaStats,
} from '../services/sheetsDb';

export type SheetsSyncStatus = 'idle' | 'syncing' | 'connected' | 'error' | 'disconnected';

interface BusinessContextType {
  profile: BusinessProfile;
  updateProfile: (profile: Partial<BusinessProfile>) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  permissions: RolePermissions;

  // Google Sheets Database
  sheetsUrl: string;
  setSheetsUrl: (url: string) => void;
  sheetsSyncStatus: SheetsSyncStatus;
  lastSyncedAt: string | null;
  syncError: string | null;
  spreadsheetTitle: string | null;
  testSheetsConnection: (url?: string) => Promise<{ success: boolean; message: string; spreadsheetTitle?: string; sheets?: string[] }>;
  syncFromSheets: () => Promise<boolean>;
  pushToSheetsNow: () => Promise<boolean>;
  syncStrategy: 'smart_batch' | 'interval_15m' | 'manual';
  setSyncStrategy: (strategy: 'smart_batch' | 'interval_15m' | 'manual') => void;
  pendingChangesCount: number;
  apiQuotaStats: ApiQuotaStats;
  refreshQuotaStats: () => void;

  // User Authentication & Login Session
  currentUser: Employee | null;
  setCurrentUser: (user: Employee | null) => void;
  isAuthenticated: boolean;
  isScreenLocked: boolean;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  loginWithPin: (pin: string, employeeId?: string) => { success: boolean; message?: string };
  loginWithCredentials: (identifier: string, passwordOrPin: string) => { success: boolean; message?: string };
  loginAsEmployee: (employeeId: string) => boolean;
  logout: () => void;
  lockScreen: () => void;
  unlockScreen: (pin: string) => { success: boolean; message?: string };

  // Data
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  employees: Employee[];
  accounts: Account[];
  stockMovements: StockMovement[];
  alerts: NotificationAlert[];

  // Actions
  addSale: (saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'timestamp'>) => Sale;
  deleteSale: (saleId: string) => boolean;
  addProduct: (productData: Omit<Product, 'id' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  restockProduct: (productId: string, quantity: number, unitCost?: number, supplierId?: string) => void;
  deleteProduct: (id: string) => boolean;

  addCustomer: (customerData: Omit<Customer, 'id' | 'totalSpent'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  recordDebtPayment: (customerId: string, amount: number, accountId: string, notes?: string) => void;

  addSupplier: (supplierData: Omit<Supplier, 'id' | 'totalPurchased'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  paySupplier: (supplierId: string, amount: number, accountId: string, notes?: string) => void;

  addExpense: (expenseData: Omit<Expense, 'id' | 'timestamp'>) => Expense;
  deleteExpense: (id: string) => boolean;

  transferFunds: (fromAccountId: string, toAccountId: string, amount: number, description?: string) => void;

  addEmployee: (employeeData: Omit<Employee, 'id' | 'joinedDate'>) => Employee;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => boolean;
  toggleAttendance: (employeeId: string, status?: 'present' | 'absent' | 'late' | 'off') => void;

  markAlertRead: (id: string) => void;
  dismissAlert: (id: string) => void;
  resetDemoData: () => void;

  // Computed Metrics
  todaySalesTotal: number;
  todayExpensesTotal: number;
  todayEstimatedProfit: number;
  totalCashAvailable: number;
  totalCashAndBank: number;
  lowStockProducts: Product[];
  overdueCustomers: Customer[];
  totalReceivables: number;
  totalPayables: number;
  activeNavTab: string;
  setActiveNavTab: (tab: string) => void;
  resetToDemoData: () => void;
}

const STORAGE_PREFIX = 'biz_mgr_sheets_db_';

// Check if a stored string contains legacy hardcoded demo markers from previous versions
const isDemoString = (str: string | null) => {
  if (!str) return false;
  return (
    str.includes('BEV-COF-001') ||
    str.includes('Apex Wholesale') ||
    str.includes('AUDIO-001') ||
    str.includes('Grand Metro Cafe') ||
    str.includes('Pacific Coffee Importers')
  );
};

// Purge any legacy hardcoded demo items so real spreadsheet database info shows
try {
  ['products', 'sales', 'customers', 'suppliers', 'expenses', 'employees', 'accounts', 'stockMovements', 'alerts', 'profile'].forEach((key) => {
    const v1 = localStorage.getItem(`biz_mgr_data_v1_${key}`);
    if (v1 && isDemoString(v1)) {
      localStorage.removeItem(`biz_mgr_data_v1_${key}`);
    }
    const v2 = localStorage.getItem(`biz_mgr_v1_${key}`);
    if (v2 && isDemoString(v2)) {
      localStorage.removeItem(`biz_mgr_v1_${key}`);
    }
  });
} catch (e) {}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<BusinessProfile>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}profile`);
    if (saved && !isDemoString(saved)) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return initialBusinessProfile;
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}role`);
    return (saved as UserRole) || 'owner';
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}sales`);
    if (saved && !isDemoString(saved)) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}products`);
    if (saved && !isDemoString(saved)) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}customers`);
    if (saved && !isDemoString(saved)) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}suppliers`);
    if (saved && !isDemoString(saved)) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}expenses`);
    if (saved && !isDemoString(saved)) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}employees`);
    if (saved && !isDemoString(saved)) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (err) {}
    }
    return [];
  });

  // Current authenticated user (from session or spreadsheet database)
  const [currentUser, setCurrentUserState] = useState<Employee | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}currentUser`);
    if (saved && !isDemoString(saved)) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  const [isScreenLocked, setIsScreenLocked] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const setCurrentUser = (user: Employee | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem(`${STORAGE_PREFIX}currentUser`, JSON.stringify(user));
    } else {
      localStorage.removeItem(`${STORAGE_PREFIX}currentUser`);
    }
  };

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}accounts`);
    if (saved && !isDemoString(saved)) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}stockMovements`);
    if (saved && !isDemoString(saved)) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [alerts, setAlerts] = useState<NotificationAlert[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}alerts`);
    if (saved && !isDemoString(saved)) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [activeNavTab, setActiveNavTab] = useState<string>('dashboard');

  // Google Sheets Database State - constant from .env takes priority
  const envSheetsUrl = (
    (import.meta.env.VITE_GOOGLE_SHEETS_URL as string) ||
    (import.meta.env.VITE_SHEETS_DATABASE_URL as string) ||
    ''
  ).trim();

  const [sheetsUrl, setSheetsUrlState] = useState<string>(() => {
    return (
      envSheetsUrl ||
      localStorage.getItem(`${STORAGE_PREFIX}sheetsUrl`) ||
      localStorage.getItem('biz_mgr_data_v1_sheetsUrl') ||
      localStorage.getItem('biz_mgr_v1_sheetsUrl') ||
      ''
    );
  });
  const [sheetsSyncStatus, setSheetsSyncStatus] = useState<SheetsSyncStatus>(() => {
    const savedUrl =
      envSheetsUrl ||
      localStorage.getItem(`${STORAGE_PREFIX}sheetsUrl`) ||
      localStorage.getItem('biz_mgr_data_v1_sheetsUrl') ||
      localStorage.getItem('biz_mgr_v1_sheetsUrl');
    return savedUrl ? 'connected' : 'disconnected';
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    return (
      localStorage.getItem(`${STORAGE_PREFIX}lastSyncedAt`) ||
      localStorage.getItem('biz_mgr_data_v1_lastSyncedAt') ||
      null
    );
  });
  const [syncError, setSyncError] = useState<string | null>(null);
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string | null>(() => {
    return (
      localStorage.getItem(`${STORAGE_PREFIX}sheetsTitle`) ||
      localStorage.getItem('biz_mgr_data_v1_sheetsTitle') ||
      null
    );
  });

  // Sync Strategy & Quota Protection Engine
  const [syncStrategy, setSyncStrategyState] = useState<'smart_batch' | 'interval_15m' | 'manual'>(() => {
    return (localStorage.getItem(`${STORAGE_PREFIX}syncStrategy`) as any) || 'smart_batch';
  });
  const [pendingChangesCount, setPendingChangesCount] = useState<number>(0);
  const [apiQuotaStats, setApiQuotaStats] = useState<ApiQuotaStats>(() => getApiQuotaStats());

  const pendingChangesRef = useRef<number>(0);
  const debounceTimerRef = useRef<any>(null);
  const isSyncingFromSheetsRef = useRef<boolean>(false);
  const isInitialMount = useRef<boolean>(true);

  const setSyncStrategy = (strat: 'smart_batch' | 'interval_15m' | 'manual') => {
    setSyncStrategyState(strat);
    localStorage.setItem(`${STORAGE_PREFIX}syncStrategy`, strat);
  };

  const refreshQuotaStats = () => {
    setApiQuotaStats(getApiQuotaStats());
  };

  const setSheetsUrl = (url: string) => {
    const clean = url.trim();
    setSheetsUrlState(clean);
    localStorage.setItem(`${STORAGE_PREFIX}sheetsUrl`, clean);
    if (clean) {
      setSheetsSyncStatus('connected');
    } else {
      setSheetsSyncStatus('disconnected');
      setSpreadsheetTitle(null);
      localStorage.removeItem(`${STORAGE_PREFIX}sheetsTitle`);
    }
  };

  const handleTestConnection = async (urlToTest?: string) => {
    const targetUrl = urlToTest || sheetsUrl;
    if (!targetUrl) {
      return { success: false, message: 'Google Apps Script URL is empty.' };
    }
    const res = await testSheetsConnection(targetUrl);
    if (res.success) {
      if (res.spreadsheetTitle) {
        setSpreadsheetTitle(res.spreadsheetTitle);
        localStorage.setItem(`${STORAGE_PREFIX}sheetsTitle`, res.spreadsheetTitle);
      }
      setSheetsSyncStatus('connected');
      setSyncError(null);
    } else {
      setSheetsSyncStatus('error');
      setSyncError(res.message);
    }
    refreshQuotaStats();
    return res;
  };

  const syncFromSheets = async (): Promise<boolean> => {
    if (!sheetsUrl || !sheetsUrl.trim()) return false;
    setSheetsSyncStatus('syncing');
    setSyncError(null);
    try {
      isSyncingFromSheetsRef.current = true;
      const res = await fetchAllFromSheets(sheetsUrl);
      if (res.success && res.data) {
        const d = res.data;
        if (d.products && Array.isArray(d.products)) setProducts(d.products);
        if (d.sales && Array.isArray(d.sales)) setSales(d.sales);
        if (d.customers && Array.isArray(d.customers)) setCustomers(d.customers);
        if (d.suppliers && Array.isArray(d.suppliers)) setSuppliers(d.suppliers);
        if (d.expenses && Array.isArray(d.expenses)) setExpenses(d.expenses);
        if (d.accounts && Array.isArray(d.accounts)) setAccounts(d.accounts);
        if (d.stockMovements && Array.isArray(d.stockMovements)) setStockMovements(d.stockMovements);
        if (d.employees && Array.isArray(d.employees)) {
          setEmployees(d.employees);
          setCurrentUserState((prev) => {
            if (prev && d.employees!.some((e) => e.id === prev.id)) {
              const updated = d.employees!.find((e) => e.id === prev.id);
              return updated || prev;
            }
            return d.employees![0] || null;
          });
        }
        if (d.profile && typeof d.profile === 'object') {
          setProfile((prev) => ({ ...prev, ...d.profile }));
        }

        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncedAt(nowStr);
        localStorage.setItem(`${STORAGE_PREFIX}lastSyncedAt`, nowStr);
        setSheetsSyncStatus('connected');
        refreshQuotaStats();
        setTimeout(() => {
          isSyncingFromSheetsRef.current = false;
        }, 600);
        return true;
      } else {
        setSheetsSyncStatus('error');
        setSyncError(res.message || 'Failed to pull data from Google Sheets.');
        isSyncingFromSheetsRef.current = false;
        refreshQuotaStats();
        return false;
      }
    } catch (err: any) {
      setSheetsSyncStatus('error');
      setSyncError(err.message || 'Network failure while syncing from Google Sheets.');
      isSyncingFromSheetsRef.current = false;
      refreshQuotaStats();
      return false;
    }
  };

  const pushToSheetsNow = async (): Promise<boolean> => {
    if (!sheetsUrl || !sheetsUrl.trim()) return false;
    setSheetsSyncStatus('syncing');
    setSyncError(null);
    try {
      const res = await pushAllToSheets(sheetsUrl, {
        products,
        sales,
        customers,
        suppliers,
        expenses,
        accounts,
        stockMovements,
        employees,
        profile,
      });
      if (res.success) {
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncedAt(nowStr);
        localStorage.setItem(`${STORAGE_PREFIX}lastSyncedAt`, nowStr);
        setSheetsSyncStatus('connected');
        pendingChangesRef.current = 0;
        setPendingChangesCount(0);
        refreshQuotaStats();
        return true;
      } else {
        setSheetsSyncStatus('error');
        setSyncError(res.message || 'Failed to push data to Google Sheets.');
        refreshQuotaStats();
        return false;
      }
    } catch (err: any) {
      setSheetsSyncStatus('error');
      setSyncError(err.message || 'Network error pushing to Google Sheets.');
      refreshQuotaStats();
      return false;
    }
  };

  // Triggered on mutations to queue batch sync without exhausting API quotas
  const markPendingChange = () => {
    pendingChangesRef.current += 1;
    setPendingChangesCount(pendingChangesRef.current);

    if (syncStrategy === 'smart_batch' && sheetsUrl) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // Debounce window of 25 seconds: collapses multiple quick sales/edits into 1 single call
      debounceTimerRef.current = setTimeout(() => {
        pushToSheetsNow();
      }, 25000);
    }
  };

  // Watch state changes and trigger smart debounced queuing (skip initial load or sheets pull)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isSyncingFromSheetsRef.current) {
      return;
    }
    markPendingChange();
  }, [products, sales, customers, suppliers, expenses, employees, accounts, stockMovements, profile]);

  // Periodic interval sync when scheduled mode is chosen (syncs at most every 15 min if there are changes)
  useEffect(() => {
    if (syncStrategy !== 'interval_15m' || !sheetsUrl) return;

    const interval = setInterval(() => {
      if (pendingChangesRef.current > 0) {
        pushToSheetsNow();
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [syncStrategy, sheetsUrl]);

  // Initial pull from sheets if URL is configured
  useEffect(() => {
    if (sheetsUrl && sheetsUrl.trim()) {
      syncFromSheets();
    }
  }, []);

  // Persistence side-effects
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}profile`, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}role`, currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}sales`, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}products`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}customers`, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}suppliers`, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}expenses`, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}employees`, JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}accounts`, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}stockMovements`, JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}alerts`, JSON.stringify(alerts));
  }, [alerts]);

  // Dynamically computed effective role permissions, honoring customized overrides
  const permissions: RolePermissions = React.useMemo(() => {
    if (currentUser) {
      const base = DEFAULT_ROLE_PERMISSIONS[currentUser.role] || DEFAULT_ROLE_PERMISSIONS.owner;
      if (currentUser.customPermissions && Object.keys(currentUser.customPermissions).length > 0) {
        return { ...base, ...currentUser.customPermissions };
      }
      return base;
    }
    return DEFAULT_ROLE_PERMISSIONS[currentRole] || DEFAULT_ROLE_PERMISSIONS.owner;
  }, [currentUser, currentRole]);

  const updateProfile = (updates: Partial<BusinessProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  // Helper for today's date checking (same year, month, day)
  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  // Computed Metrics
  const todaySales = sales.filter((s) => isToday(s.timestamp));
  const todaySalesTotal = todaySales.reduce((acc, s) => acc + s.total, 0);

  const todayExpenses = expenses.filter((e) => isToday(e.timestamp));
  const todayExpensesTotal = todayExpenses.reduce((acc, e) => acc + e.amount, 0);

  // Today's estimated operating profit: Sales - Expenses
  const todayEstimatedProfit = todaySalesTotal - todayExpensesTotal;

  // Liquid Cash Available
  const totalCashAvailable = accounts.reduce((acc, a) => acc + a.balance, 0);

  // Low stock products
  const lowStockProducts = products.filter((p) => p.stock <= p.minStockAlert);

  // Customers with outstanding debts
  const overdueCustomers = customers.filter((c) => c.outstandingDebt > 0);

  // Receivables & Payables
  const totalReceivables = customers.reduce((acc, c) => acc + (c.outstandingDebt || 0), 0);
  const totalPayables = suppliers.reduce((acc, s) => acc + (s.amountOwed || 0), 0);

  // ADD SALE
  const addSale = (saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'timestamp'>): Sale => {
    const dateObj = new Date();
    const dateFormatted = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(100 + Math.random() * 900);
    const invoiceNumber = `INV-${dateFormatted}-${randSuffix}`;
    const timestamp = dateObj.toISOString();

    const newSale: Sale = {
      ...saleData,
      id: `sale-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      invoiceNumber,
      timestamp,
    };

    // 1. Deduct product inventory and record stock movements
    const newStockMovements: StockMovement[] = [];
    const updatedProducts = products.map((prod) => {
      const soldItem = saleData.items.find((item) => item.productId === prod.id);
      if (soldItem) {
        const newStock = Math.max(0, prod.stock - soldItem.quantity);
        newStockMovements.push({
          id: `sm-${Date.now()}-${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          type: 'sale',
          quantity: -soldItem.quantity,
          previousStock: prod.stock,
          newStock,
          reason: `Sale ${invoiceNumber} to ${saleData.customerName}`,
          timestamp,
          performedBy: saleData.cashierName || 'Staff',
        });
        return { ...prod, stock: newStock, updatedAt: timestamp };
      }
      return prod;
    });

    setProducts(updatedProducts);
    setStockMovements((prev) => [...newStockMovements, ...prev]);

    // 2. Adjust target account balance or customer debt
    if (newSale.amountPaid > 0) {
      let targetAccountId = 'acc-cash';
      if (newSale.paymentMethod === 'bank_transfer') targetAccountId = 'acc-bank';
      else if (newSale.paymentMethod === 'pos_card') targetAccountId = 'acc-pos';

      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === targetAccountId) {
            return { ...acc, balance: acc.balance + newSale.amountPaid };
          }
          return acc;
        })
      );
    }

    // 3. If credit or balanceDue > 0, increase customer debt
    if (newSale.balanceDue > 0 && newSale.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === newSale.customerId) {
            return {
              ...c,
              outstandingDebt: c.outstandingDebt + newSale.balanceDue,
              totalSpent: c.totalSpent + newSale.total,
              lastPurchaseDate: timestamp,
            };
          }
          return c;
        })
      );
    } else if (newSale.customerId) {
      // Just update total spent
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === newSale.customerId) {
            return {
              ...c,
              totalSpent: c.totalSpent + newSale.total,
              lastPurchaseDate: timestamp,
            };
          }
          return c;
        })
      );
    }

    // 4. Check for low stock alerts
    updatedProducts.forEach((p) => {
      if (p.stock <= p.minStockAlert) {
        const alreadyAlerted = alerts.some(
          (a) => a.type === 'low_stock' && a.message.includes(p.name) && !a.read
        );
        if (!alreadyAlerted) {
          setAlerts((prev) => [
            {
              id: `alert-low-${Date.now()}-${p.id}`,
              type: 'low_stock',
              title: `Low Stock: ${p.name}`,
              message: `Stock dropped to ${p.stock} ${p.unit} (Alert threshold: ${p.minStockAlert}).`,
              severity: p.stock === 0 ? 'critical' : 'warning',
              timestamp,
              read: false,
              actionTarget: { tab: 'inventory', id: p.id },
            },
            ...prev,
          ]);
        }
      }
    });

    setSales((prev) => [newSale, ...prev]);
    return newSale;
  };

  const deleteSale = (saleId: string): boolean => {
    if (!permissions.canDeleteTransactions) return false;
    const saleToDelete = sales.find((s) => s.id === saleId);
    if (!saleToDelete) return false;

    // Reverse inventory
    setProducts((prev) =>
      prev.map((prod) => {
        const item = saleToDelete.items.find((i) => i.productId === prod.id);
        if (item) {
          return { ...prod, stock: prod.stock + item.quantity };
        }
        return prod;
      })
    );

    // Reverse money
    if (saleToDelete.amountPaid > 0) {
      let targetAccountId = 'acc-cash';
      if (saleToDelete.paymentMethod === 'bank_transfer') targetAccountId = 'acc-bank';
      else if (saleToDelete.paymentMethod === 'pos_card') targetAccountId = 'acc-pos';

      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === targetAccountId) {
            return { ...acc, balance: Math.max(0, acc.balance - saleToDelete.amountPaid) };
          }
          return acc;
        })
      );
    }

    // Reverse customer debt
    if (saleToDelete.balanceDue > 0 && saleToDelete.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === saleToDelete.customerId) {
            return {
              ...c,
              outstandingDebt: Math.max(0, c.outstandingDebt - saleToDelete.balanceDue),
              totalSpent: Math.max(0, c.totalSpent - saleToDelete.total),
            };
          }
          return c;
        })
      );
    }

    setSales((prev) => prev.filter((s) => s.id !== saleId));
    return true;
  };

  const addProduct = (productData: Omit<Product, 'id' | 'updatedAt'>): Product => {
    const timestamp = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      updatedAt: timestamp,
    };

    if (newProduct.stock > 0) {
      setStockMovements((prev) => [
        {
          id: `sm-init-${Date.now()}`,
          productId: newProduct.id,
          productName: newProduct.name,
          type: 'adjustment',
          quantity: newProduct.stock,
          previousStock: 0,
          newStock: newProduct.stock,
          reason: 'Initial stock entry',
          timestamp,
          performedBy: 'Staff',
        },
        ...prev,
      ]);
    }

    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
  };

  const restockProduct = (
    productId: string,
    quantity: number,
    unitCost?: number,
    supplierId?: string
  ) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    const timestamp = new Date().toISOString();
    const newStock = target.stock + quantity;
    const effectiveCost = unitCost !== undefined ? unitCost : target.costPrice;

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              stock: newStock,
              costPrice: effectiveCost,
              updatedAt: timestamp,
            }
          : p
      )
    );

    setStockMovements((prev) => [
      {
        id: `sm-restock-${Date.now()}`,
        productId,
        productName: target.name,
        type: 'purchase',
        quantity,
        previousStock: target.stock,
        newStock,
        reason: `Restocked ${quantity} ${target.unit}`,
        timestamp,
        performedBy: 'Staff',
      },
      ...prev,
    ]);

    if (supplierId) {
      const costTotal = quantity * effectiveCost;
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === supplierId
            ? {
                ...s,
                totalPurchased: s.totalPurchased + costTotal,
                lastOrderDate: timestamp,
              }
            : s
        )
      );
    }
  };

  const deleteProduct = (id: string): boolean => {
    if (!permissions.canManageInventory) return false;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    return true;
  };

  const addCustomer = (customerData: Omit<Customer, 'id' | 'totalSpent'>): Customer => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      totalSpent: 0,
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const recordDebtPayment = (
    customerId: string,
    amount: number,
    accountId: string,
    notes?: string
  ) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    const actualAmount = Math.min(amount, customer.outstandingDebt);
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              outstandingDebt: Math.max(0, c.outstandingDebt - actualAmount),
            }
          : c
      )
    );

    // Increase target account
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId ? { ...acc, balance: acc.balance + actualAmount } : acc
      )
    );

    setAlerts((prev) => [
      {
        id: `alert-debt-pay-${Date.now()}`,
        type: 'system',
        title: `Debt Repayment Received: $${actualAmount.toLocaleString()}`,
        message: `${customer.name} paid $${actualAmount.toLocaleString()} towards outstanding balance. ${notes || ''}`,
        severity: 'info',
        timestamp: new Date().toISOString(),
        read: false,
        actionTarget: { tab: 'customers', id: customerId },
      },
      ...prev,
    ]);
  };

  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'totalPurchased'>): Supplier => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `sup-${Date.now()}`,
      totalPurchased: 0,
    };
    setSuppliers((prev) => [newSupplier, ...prev]);
    return newSupplier;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const paySupplier = (
    supplierId: string,
    amount: number,
    accountId: string,
    notes?: string
  ) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!supplier) return;

    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === supplierId
          ? {
              ...s,
              amountOwed: Math.max(0, s.amountOwed - amount),
            }
          : s
      )
    );

    // Deduct from account
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId ? { ...acc, balance: Math.max(0, acc.balance - amount) } : acc
      )
    );

    // Log as expense
    const newExpense: Expense = {
      id: `exp-sup-${Date.now()}`,
      title: `Supplier Payment: ${supplier.companyName}`,
      category: 'supplies',
      amount,
      accountId,
      paidTo: supplier.companyName,
      timestamp: new Date().toISOString(),
      recordedBy: 'Owner/Manager',
      notes: notes || 'Settlement of supplier balance',
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const addExpense = (expenseData: Omit<Expense, 'id' | 'timestamp'>): Expense => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    // Deduct from account
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === newExpense.accountId
          ? { ...acc, balance: Math.max(0, acc.balance - newExpense.amount) }
          : acc
      )
    );

    // Alert if expense is unusually large (> $500)
    if (newExpense.amount >= 500) {
      setAlerts((prev) => [
        {
          id: `alert-exp-${Date.now()}`,
          type: 'expense_alert',
          title: `Large Expense Logged: $${newExpense.amount.toLocaleString()}`,
          message: `${newExpense.title} (${newExpense.category}) recorded by ${newExpense.recordedBy}.`,
          severity: 'warning',
          timestamp: newExpense.timestamp,
          read: false,
          actionTarget: { tab: 'expenses' },
        },
        ...prev,
      ]);
    }

    setExpenses((prev) => [newExpense, ...prev]);
    return newExpense;
  };

  const deleteExpense = (id: string): boolean => {
    if (!permissions.canDeleteTransactions) return false;
    const exp = expenses.find((e) => e.id === id);
    if (!exp) return false;

    // Refund to account
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === exp.accountId ? { ...acc, balance: acc.balance + exp.amount } : acc
      )
    );

    setExpenses((prev) => prev.filter((e) => e.id !== id));
    return true;
  };

  const transferFunds = (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    description?: string
  ) => {
    if (fromAccountId === toAccountId || amount <= 0) return;

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === fromAccountId) {
          return { ...acc, balance: Math.max(0, acc.balance - amount) };
        }
        if (acc.id === toAccountId) {
          return { ...acc, balance: acc.balance + amount };
        }
        return acc;
      })
    );

    setAlerts((prev) => [
      {
        id: `alert-transfer-${Date.now()}`,
        type: 'system',
        title: `Account Transfer: $${amount.toLocaleString()}`,
        message: `Transferred $${amount.toLocaleString()} ${description ? `(${description})` : ''}.`,
        severity: 'info',
        timestamp: new Date().toISOString(),
        read: false,
        actionTarget: { tab: 'cashbank' },
      },
      ...prev,
    ]);
  };

  const addEmployee = (employeeData: Omit<Employee, 'id' | 'joinedDate'>): Employee => {
    // Privilege check: cannot assign equal or higher role unless owner
    const assignedRole = employeeData.role;
    if (currentUser) {
      const myLevel = ROLE_HIERARCHY[currentUser.role] || 1;
      const targetLevel = ROLE_HIERARCHY[assignedRole] || 1;
      if (currentUser.role !== 'owner' && targetLevel >= myLevel) {
        throw new Error('You can only assign roles to staff below your authorization level.');
      }
    }

    const newEmp: Employee = {
      ...employeeData,
      id: `emp-${Date.now()}`,
      joinedDate: new Date().toISOString().split('T')[0],
      pin: employeeData.pin || '1234',
      password: employeeData.password || 'password123',
      status: employeeData.status || 'active',
      customPermissions: employeeData.customPermissions || {},
    };
    setEmployees((prev) => [...prev, newEmp]);
    return newEmp;
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === id) {
          const sanitizedUpdates = { ...updates };

          const isRoleChange = updates.role && updates.role !== emp.role;
          const isPermChange = updates.customPermissions !== undefined;

          // Strict Privilege & Role Escalation Defense:
          // 1. A staff member CANNOT change their own role or custom permissions upon login or during their session
          if (isRoleChange || isPermChange) {
            if (currentUser && currentUser.id === id) {
              delete sanitizedUpdates.role;
              delete sanitizedUpdates.customPermissions;
            } else if (currentUser) {
              const myLevel = ROLE_HIERARCHY[currentUser.role] || 1;
              const targetLevel = ROLE_HIERARCHY[emp.role] || 1;
              const hasManagePerm = permissions.canManageEmployees;

              // 2. Only staff granted canManageEmployees and ranking strictly above the target can update roles/permissions
              const canModifyTarget =
                hasManagePerm && (currentUser.role === 'owner' || myLevel > targetLevel);

              if (!canModifyTarget) {
                delete sanitizedUpdates.role;
                delete sanitizedUpdates.customPermissions;
              } else if (isRoleChange && updates.role) {
                // 3. Cannot elevate staff to a rank equal to or above oneself
                const newRoleLevel = ROLE_HIERARCHY[updates.role] || 1;
                if (currentUser.role !== 'owner' && newRoleLevel >= myLevel) {
                  delete sanitizedUpdates.role;
                }
              }
            }
          }

          const updated = { ...emp, ...sanitizedUpdates };
          if (currentUser && currentUser.id === id) {
            setCurrentUser(updated);
            if (sanitizedUpdates.role) {
              setCurrentRole(sanitizedUpdates.role);
              localStorage.setItem(`${STORAGE_PREFIX}role`, sanitizedUpdates.role);
            }
          }
          return updated;
        }
        return emp;
      })
    );
  };

  const deleteEmployee = (id: string): boolean => {
    if (!permissions.canManageEmployees) return false;
    if (currentUser && currentUser.id === id) {
      return false; // Prevent deleting active session
    }
    const target = employees.find((e) => e.id === id);
    if (!target) return false;
    if (currentUser) {
      const myLevel = ROLE_HIERARCHY[currentUser.role] || 1;
      const targetLevel = ROLE_HIERARCHY[target.role] || 1;
      if (currentUser.role !== 'owner' && targetLevel >= myLevel) {
        return false;
      }
    }
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    return true;
  };

  // Staff Authentication Methods
  const loginWithPin = (
    pin: string,
    employeeId?: string
  ): { success: boolean; message?: string } => {
    const cleanPin = pin.trim();
    if (!cleanPin) {
      return { success: false, message: 'Please enter your 4-digit staff PIN.' };
    }

    let matched: Employee | undefined;
    if (employeeId) {
      matched = employees.find(
        (e) => e.id === employeeId && (e.pin === cleanPin || (!e.pin && cleanPin === '1234'))
      );
    } else {
      matched = employees.find(
        (e) => e.pin === cleanPin || (!e.pin && cleanPin === '1234')
      );
    }

    if (!matched) {
      return { success: false, message: 'Incorrect PIN. Please try again.' };
    }

    if (matched.status === 'suspended') {
      return {
        success: false,
        message: 'Account is suspended. Please contact the store owner.',
      };
    }

    const updatedUser: Employee = {
      ...matched,
      lastLogin: new Date().toISOString(),
    };

    setCurrentUser(updatedUser);
    setCurrentRole(updatedUser.role);
    localStorage.setItem(`${STORAGE_PREFIX}role`, updatedUser.role);
    setIsScreenLocked(false);
    setIsLoginModalOpen(false);
    updateEmployee(updatedUser.id, { lastLogin: updatedUser.lastLogin });

    return { success: true };
  };

  const loginWithCredentials = (
    identifier: string,
    passwordOrPin: string
  ): { success: boolean; message?: string } => {
    const idClean = identifier.trim().toLowerCase();
    const passClean = passwordOrPin.trim();

    if (!idClean) {
      return { success: false, message: 'Please enter your work email, name, or phone.' };
    }
    if (!passClean) {
      return { success: false, message: 'Please enter your account password or PIN.' };
    }

    const matched = employees.find((e) => {
      const emailMatch = e.email.toLowerCase() === idClean;
      const nameMatch = e.name.toLowerCase() === idClean;
      const phoneMatch = e.phone.replace(/\D/g, '') === idClean.replace(/\D/g, '');
      return emailMatch || nameMatch || phoneMatch;
    });

    if (!matched) {
      return { success: false, message: 'No employee account matches that email or name.' };
    }

    if (matched.status === 'suspended') {
      return {
        success: false,
        message: 'Account is suspended. Please contact the store owner.',
      };
    }

    const isMatch =
      (matched.password && matched.password === passClean) ||
      (matched.pin && matched.pin === passClean) ||
      (!matched.password && !matched.pin && (passClean === 'password' || passClean === '1234'));

    if (!isMatch) {
      return { success: false, message: 'Incorrect password or PIN. Please try again.' };
    }

    const updatedUser: Employee = {
      ...matched,
      lastLogin: new Date().toISOString(),
    };

    setCurrentUser(updatedUser);
    setCurrentRole(updatedUser.role);
    localStorage.setItem(`${STORAGE_PREFIX}role`, updatedUser.role);
    setIsScreenLocked(false);
    setIsLoginModalOpen(false);
    updateEmployee(updatedUser.id, { lastLogin: updatedUser.lastLogin });

    return { success: true };
  };

  const loginAsEmployee = (employeeId: string): boolean => {
    const matched = employees.find((e) => e.id === employeeId);
    if (!matched) return false;
    if (matched.status === 'suspended') return false;

    const updatedUser: Employee = {
      ...matched,
      lastLogin: new Date().toISOString(),
    };

    setCurrentUser(updatedUser);
    setCurrentRole(updatedUser.role);
    localStorage.setItem(`${STORAGE_PREFIX}role`, updatedUser.role);
    setIsScreenLocked(false);
    setIsLoginModalOpen(false);
    updateEmployee(updatedUser.id, { lastLogin: updatedUser.lastLogin });
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    setIsScreenLocked(false);
  };

  const lockScreen = () => {
    setIsScreenLocked(true);
  };

  const unlockScreen = (pin: string): { success: boolean; message?: string } => {
    const cleanPin = pin.trim();
    if (!currentUser) {
      return loginWithPin(cleanPin);
    }
    const isMatch =
      (currentUser.pin && currentUser.pin === cleanPin) ||
      (!currentUser.pin && cleanPin === '1234');
    if (isMatch) {
      setIsScreenLocked(false);
      return { success: true };
    }
    return { success: false, message: 'Incorrect PIN. Please re-enter.' };
  };

  const toggleAttendance = (
    employeeId: string,
    status?: 'present' | 'absent' | 'late' | 'off'
  ) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === employeeId) {
          const nextStatus =
            status ||
            (emp.attendanceStatus === 'present'
              ? 'off'
              : 'present');
          return {
            ...emp,
            attendanceStatus: nextStatus,
            lastClockIn: nextStatus === 'present' ? new Date().toISOString() : emp.lastClockIn,
          };
        }
        return emp;
      })
    );
  };

  const markAlertRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const resetDemoData = () => {
    setProfile(initialBusinessProfile);
    setCurrentRole('owner');
    setSales(initialSales);
    setProducts(initialProducts);
    setCustomers(initialCustomers);
    setSuppliers(initialSuppliers);
    setExpenses(initialExpenses);
    setEmployees(initialEmployees);
    setAccounts(initialAccounts);
    setStockMovements(initialStockMovements);
    setAlerts(initialAlerts);
  };

  return (
    <BusinessContext.Provider
      value={{
        profile,
        updateProfile,
        currentRole,
        setCurrentRole,
        permissions,
        sheetsUrl,
        setSheetsUrl,
        sheetsSyncStatus,
        lastSyncedAt,
        syncError,
        spreadsheetTitle,
        testSheetsConnection: handleTestConnection,
        syncFromSheets,
        pushToSheetsNow,
        syncStrategy,
        setSyncStrategy,
        pendingChangesCount,
        apiQuotaStats,
        refreshQuotaStats,
        // User Authentication & Session
        currentUser,
        setCurrentUser,
        isAuthenticated: Boolean(currentUser && !isScreenLocked),
        isScreenLocked,
        isLoginModalOpen,
        setIsLoginModalOpen,
        loginWithPin,
        loginWithCredentials,
        loginAsEmployee,
        logout,
        lockScreen,
        unlockScreen,
        sales,
        products,
        customers,
        suppliers,
        expenses,
        employees,
        accounts,
        stockMovements,
        alerts,
        addSale,
        deleteSale,
        addProduct,
        updateProduct,
        restockProduct,
        deleteProduct,
        addCustomer,
        updateCustomer,
        recordDebtPayment,
        addSupplier,
        updateSupplier,
        paySupplier,
        addExpense,
        deleteExpense,
        transferFunds,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        toggleAttendance,
        markAlertRead,
        dismissAlert,
        resetDemoData,
        todaySalesTotal,
        todayExpensesTotal,
        todayEstimatedProfit,
        totalCashAvailable,
        totalCashAndBank: totalCashAvailable,
        lowStockProducts,
        overdueCustomers,
        totalReceivables,
        totalPayables,
        activeNavTab,
        setActiveNavTab,
        resetToDemoData: resetDemoData,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
