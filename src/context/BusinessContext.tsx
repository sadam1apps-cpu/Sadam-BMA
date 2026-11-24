import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  Account,
  BankDetail,
  BusinessProfile,
  Customer,
  Employee,
  Expense,
  ManualInvoice,
  ManualInvoicePayment,
  NotificationAlert,
  Product,
  Quotation,
  PurchaseOrder,
  RolePermissions,
  Sale,
  StockMovement,
  Supplier,
  UserRole,
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_HIERARCHY,
  Language,
} from '../types';
import { formatDateOnly } from '../utils/dateFormat';
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
  pushDeltaToSheets,
  canonicalRecordHash,
  SheetsDeltaCollectionKey,
  SheetsDeltaPayload,
  testSheetsConnection,
  ApiQuotaStats,
  getApiQuotaStats,
} from '../services/sheetsDb';
import {
  saveProfileToFirestore,
  saveProductToFirestore,
  deleteProductFromFirestore,
  saveSaleToFirestore,
  deleteSaleFromFirestore,
  saveManualInvoiceToFirestore,
  deleteManualInvoiceFromFirestore,
  saveQuotationToFirestore,
  deleteQuotationFromFirestore,
  savePurchaseOrderToFirestore,
  deletePurchaseOrderFromFirestore,
  saveCustomerToFirestore,
  saveSupplierToFirestore,
  saveExpenseToFirestore,
  deleteExpenseFromFirestore,
  saveEmployeeToFirestore,
  deleteEmployeeFromFirestore,
  saveAccountToFirestore,
  deleteAccountFromFirestore,
  saveStockMovementToFirestore,
  batchWriteAllToFirestore,
  subscribeToCollection,
  subscribeToDocument,
  seedInitialFirestoreData,
  COLLECTIONS,
} from '../services/firebaseDb';
import { testConnection } from '../services/firebase';
import { getTranslation, TranslationHelper } from '../translations';

export type SheetsSyncStatus = 'idle' | 'syncing' | 'connected' | 'error' | 'disconnected';
export type FirebaseSyncStatus = 'connecting' | 'connected' | 'error' | 'disconnected';

interface BusinessContextType {
  profile: BusinessProfile;
  updateProfile: (profile: Partial<BusinessProfile>) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationHelper;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  permissions: RolePermissions;

  // Firebase Firestore Main Database
  firebaseSyncStatus: FirebaseSyncStatus;
  firebaseLastSyncedAt: string | null;
  firebaseError: string | null;
  isFirebaseMainDb: boolean;
  retryFirebaseConnection: () => Promise<void>;
  syncAllToFirebaseNow: () => Promise<{ success: boolean; message: string; count?: number }>;
  backupToSheetsNow: () => Promise<boolean>;

  // Google Sheets Backup Database
  sheetsUrl: string;
  setSheetsUrl: (url: string) => void;
  sheetsSyncStatus: SheetsSyncStatus;
  isInitialSyncLoading: boolean;
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
  loginWithPin: (
    pin: string,
    identifierOrId?: string
  ) => { success: boolean; message?: string; matchesCount?: number };
  loginWithCredentials: (identifier: string, passwordOrPin: string) => { success: boolean; message?: string };
  loginAsEmployee: (employeeId: string) => boolean;
  logout: () => void;
  lockScreen: () => void;
  unlockScreen: (pin: string) => { success: boolean; message?: string };

  // Data
  sales: Sale[];
  manualInvoices: ManualInvoice[];
  quotations: Quotation[];
  purchaseOrders: PurchaseOrder[];
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
  generateManualInvoiceNumber: () => string;
  addManualInvoice: (
    data: Omit<ManualInvoice, 'id' | 'balance' | 'status' | 'createdAt' | 'updatedAt'> & {
      invoiceNumber?: string;
    }
  ) => ManualInvoice;
  updateManualInvoice: (id: string, updates: Partial<ManualInvoice>) => void;
  deleteManualInvoice: (id: string) => boolean;
  addQuotation: (quotationData: Omit<Quotation, 'id' | 'quotationNumber' | 'timestamp'>) => Quotation;
  updateQuotation: (id: string, updates: Partial<Quotation>) => void;
  deleteQuotation: (id: string) => boolean;
  convertQuotationToSale: (quotationId: string) => Sale | null;
  addPurchaseOrder: (poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'timestamp'>) => PurchaseOrder;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (id: string) => boolean;
  receivePurchaseOrder: (poId: string) => boolean;
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
  addAccount: (accountData: Omit<Account, 'id'>) => Account;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => boolean;

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
const DIRTY_DELTA_STORAGE_KEY = `${STORAGE_PREFIX}dirtyDeltas_v1`;
const SYNCED_HASHES_STORAGE_KEY = `${STORAGE_PREFIX}syncedHashes_v1`;

const DELTA_COLLECTION_KEYS: SheetsDeltaCollectionKey[] = [
  'products',
  'sales',
  'customers',
  'suppliers',
  'expenses',
  'accounts',
  'stockMovements',
  'employees',
  'quotations',
  'purchaseOrders',
  'manualInvoices',
];

interface DirtyDeltaState {
  upserts: Record<SheetsDeltaCollectionKey, string[]>;
  deletes: Record<SheetsDeltaCollectionKey, string[]>;
  profile: boolean;
}

type SyncedHashesMap = Partial<Record<SheetsDeltaCollectionKey, Record<string, string>>> & {
  profile?: string;
  hasFullBaseline?: boolean;
};

const createEmptyDirtyDelta = (): DirtyDeltaState => ({
  upserts: {
    products: [],
    sales: [],
    customers: [],
    suppliers: [],
    expenses: [],
    accounts: [],
    stockMovements: [],
    employees: [],
    quotations: [],
    purchaseOrders: [],
    manualInvoices: [],
  },
  deletes: {
    products: [],
    sales: [],
    customers: [],
    suppliers: [],
    expenses: [],
    accounts: [],
    stockMovements: [],
    employees: [],
    quotations: [],
    purchaseOrders: [],
    manualInvoices: [],
  },
  profile: false,
});

const loadDirtyDeltaFromStorage = (): DirtyDeltaState => {
  const base = createEmptyDirtyDelta();
  try {
    const raw = localStorage.getItem(DIRTY_DELTA_STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return base;
    for (const key of DELTA_COLLECTION_KEYS) {
      if (Array.isArray(parsed.upserts?.[key])) {
        base.upserts[key] = Array.from(new Set(parsed.upserts[key].map(String)));
      }
      if (Array.isArray(parsed.deletes?.[key])) {
        base.deletes[key] = Array.from(new Set(parsed.deletes[key].map(String)));
      }
    }
    base.profile = Boolean(parsed.profile);
  } catch {}
  return base;
};

const saveDirtyDeltaToStorage = (state: DirtyDeltaState) => {
  try {
    localStorage.setItem(DIRTY_DELTA_STORAGE_KEY, JSON.stringify(state));
  } catch {}
};

const countDirtyDelta = (state: DirtyDeltaState): number => {
  let total = state.profile ? 1 : 0;
  for (const key of DELTA_COLLECTION_KEYS) {
    total += state.upserts[key].length + state.deletes[key].length;
  }
  return total;
};

const loadSyncedHashesFromStorage = (): SyncedHashesMap | null => {
  try {
    const raw = localStorage.getItem(SYNCED_HASHES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const saveSyncedHashesToStorage = (hashes: SyncedHashesMap) => {
  try {
    localStorage.setItem(SYNCED_HASHES_STORAGE_KEY, JSON.stringify(hashes));
  } catch {}
};

const buildHashesMapFromData = (data: {
  products?: Product[];
  sales?: Sale[];
  customers?: Customer[];
  suppliers?: Supplier[];
  expenses?: Expense[];
  accounts?: Account[];
  stockMovements?: StockMovement[];
  employees?: Employee[];
  quotations?: Quotation[];
  purchaseOrders?: PurchaseOrder[];
  manualInvoices?: ManualInvoice[];
  profile?: BusinessProfile;
}): SyncedHashesMap => {
  const map: SyncedHashesMap = {};
  for (const key of DELTA_COLLECTION_KEYS) {
    const list = (data as any)[key];
    if (Array.isArray(list)) {
      const colMap: Record<string, string> = {};
      for (const item of list) {
        if (item && item.id !== undefined && item.id !== null) {
          colMap[String(item.id)] = canonicalRecordHash(key, item);
        }
      }
      map[key] = colMap;
    }
  }
  if (data.profile) {
    map.profile = canonicalRecordHash('profile', data.profile);
  }
  map.hasFullBaseline = true;
  return map;
};

export const DEFAULT_SHEETS_URL =
  'https://script.google.com/macros/s/AKfycbyDzfC-9Se5Xf4CA0on6NHDoJ3PSAJBNMdpEeGSkiCsEa5GSIWJANOLOse6dkQptNSa/exec';

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
        const parsed = JSON.parse(saved);
        if (!parsed.logo || !parsed.logo.trim()) {
          parsed.logo = initialBusinessProfile.logo;
        }
        return parsed;
      } catch (e) {}
    }
    return initialBusinessProfile;
  });

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}language`);
    if (saved === 'en' || saved === 'pt') return saved;
    return profile.language || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(`${STORAGE_PREFIX}language`, lang);
    setProfile((prev) => ({ ...prev, language: lang }));
  };

  const t = getTranslation(language);

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

  const normalizeBankDetails = (raw: any): BankDetail[] => {
    let arr = raw;
    if (typeof raw === 'string' && raw.trim()) {
      try {
        arr = JSON.parse(raw);
      } catch {
        arr = [];
      }
    }
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((b) => b && typeof b === 'object')
      .map((b, idx) => ({
        id: b.id ? String(b.id) : `bank-${idx + 1}`,
        bankName: b.bankName !== undefined && b.bankName !== null ? String(b.bankName).trim() : '',
        accountNumber: b.accountNumber !== undefined && b.accountNumber !== null ? String(b.accountNumber).trim() : '',
        nib: b.nib !== undefined && b.nib !== null ? String(b.nib).trim() : '',
      }));
  };

  const normalizeQuotation = (q: any): Quotation => ({
    ...q,
    validUntil: formatDateOnly(q.validUntil),
    includeBankDetails: Boolean(q.includeBankDetails === true || q.includeBankDetails === 'true'),
    bankDetails: q.bankDetails ? normalizeBankDetails(q.bankDetails) : [],
  });

  const normalizePurchaseOrder = (po: any): PurchaseOrder => ({
    ...po,
    expectedDeliveryDate: po.expectedDeliveryDate ? formatDateOnly(po.expectedDeliveryDate) : '',
  });

  const computeManualInvoiceFields = (rawAmount: any, rawAmountPaid: any) => {
    const amount = Math.max(0, typeof rawAmount === 'number' ? rawAmount : parseFloat(rawAmount) || 0);
    const amountPaid = Math.max(0, typeof rawAmountPaid === 'number' ? rawAmountPaid : parseFloat(rawAmountPaid) || 0);
    const balance = Math.max(0, Number((amount - amountPaid).toFixed(2)));
    const status: 'paid' | 'partial' | 'unpaid' =
      balance <= 0 && amount > 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';
    return { amount, amountPaid, balance, status };
  };

  const normalizeManualPayments = (
    rawPayments: any,
    fallbackAmountPaid: number,
    fallbackDate: string
  ): ManualInvoicePayment[] => {
    let arr = rawPayments;
    if (typeof rawPayments === 'string' && rawPayments.trim()) {
      try {
        arr = JSON.parse(rawPayments);
      } catch {
        arr = [];
      }
    }
    if (Array.isArray(arr)) {
      return arr
        .filter((p) => p && typeof p === 'object')
        .map((p, idx) => ({
          id: p.id ? String(p.id) : `pay-${idx + 1}`,
          amount: Math.max(0, typeof p.amount === 'number' ? p.amount : parseFloat(p.amount) || 0),
          date: formatDateOnly(p.date || fallbackDate),
        }))
        .filter((p) => p.amount > 0);
    }
    if (fallbackAmountPaid > 0) {
      return [
        {
          id: 'pay-init',
          amount: fallbackAmountPaid,
          date: formatDateOnly(fallbackDate),
        },
      ];
    }
    return [];
  };

  const normalizeManualInvoice = (m: any): ManualInvoice => {
    const nowIso = new Date().toISOString();
    const fallbackDate = formatDateOnly(m.date || m.createdAt || nowIso);
    const rawPaid = Math.max(0, typeof m.amountPaid === 'number' ? m.amountPaid : parseFloat(m.amountPaid) || 0);
    const payments = normalizeManualPayments(m.payments, rawPaid, fallbackDate);
    const effectivePaid = Array.isArray(m.payments) || typeof m.payments === 'string'
      ? Number(payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2))
      : rawPaid;
    const { amount, amountPaid, balance, status } = computeManualInvoiceFields(m.amount, effectivePaid);
    return {
      id: m.id !== undefined && m.id !== null ? String(m.id) : `minv-${Date.now()}`,
      invoiceNumber: m.invoiceNumber !== undefined && m.invoiceNumber !== null ? String(m.invoiceNumber).trim() : '',
      customerId: m.customerId ? String(m.customerId).trim() : '',
      customerName: m.customerName !== undefined && m.customerName !== null ? String(m.customerName).trim() : '',
      date: fallbackDate,
      amount,
      amountPaid,
      balance,
      status,
      payments,
      createdAt: m.createdAt || nowIso,
      updatedAt: m.updatedAt || m.createdAt || nowIso,
    };
  };

  const [manualInvoices, setManualInvoices] = useState<ManualInvoice[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}manualInvoices`);
    if (saved && !isDemoString(saved)) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map(normalizeManualInvoice);
      } catch (e) {}
    }
    return [];
  });

  const normalizeEmployee = (emp: any): Employee => ({
    ...emp,
    joinedDate: formatDateOnly(emp.joinedDate),
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}quotations`);
    if (saved && !isDemoString(saved)) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map(normalizeQuotation);
      } catch (e) {}
    }
    return [];
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}purchaseOrders`);
    if (saved && !isDemoString(saved)) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map(normalizePurchaseOrder);
      } catch (e) {}
    }
    return [];
  });

  const normalizeProduct = (p: any): Product => ({
    ...p,
    id: p.id !== undefined && p.id !== null ? String(p.id) : `prod-${Date.now()}`,
    name: p.name !== undefined && p.name !== null ? String(p.name) : '',
    sku: p.sku !== undefined && p.sku !== null ? String(p.sku) : '',
    category: p.category !== undefined && p.category !== null ? String(p.category) : 'General',
    costPrice: typeof p.costPrice === 'number' ? p.costPrice : parseFloat(p.costPrice) || 0,
    sellingPrice: typeof p.sellingPrice === 'number' ? p.sellingPrice : parseFloat(p.sellingPrice) || 0,
    stock: typeof p.stock === 'number' ? p.stock : parseFloat(p.stock) || 0,
    minStockAlert: typeof p.minStockAlert === 'number' ? p.minStockAlert : parseFloat(p.minStockAlert) || 0,
    unit: p.unit !== undefined && p.unit !== null ? String(p.unit) : 'pcs',
    barcode: p.barcode !== undefined && p.barcode !== null ? String(p.barcode).trim() : '',
    techSpecs: p.techSpecs !== undefined && p.techSpecs !== null ? String(p.techSpecs).trim() : '',
    updatedAt: p.updatedAt || new Date().toISOString(),
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}products`);
    if (saved && !isDemoString(saved)) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map(normalizeProduct);
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
        if (Array.isArray(parsed)) return parsed.map(normalizeEmployee);
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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return initialAccounts;
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

  // Google Sheets Database State - constant from .env or DEFAULT_SHEETS_URL
  const envSheetsUrl = (
    (import.meta.env.VITE_SHEETS_SCRIPT_URL as string) ||
    (import.meta.env.VITE_GOOGLE_SHEETS_URL as string) ||
    (import.meta.env.VITE_SHEETS_DATABASE_URL as string) ||
    DEFAULT_SHEETS_URL
  ).trim();

  const [sheetsUrl, setSheetsUrlState] = useState<string>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}sheetsUrl`);
    if (saved && saved.trim() && saved === DEFAULT_SHEETS_URL) {
      return saved.trim();
    }
    return envSheetsUrl || DEFAULT_SHEETS_URL;
  });
  const [sheetsSyncStatus, setSheetsSyncStatus] = useState<SheetsSyncStatus>(() => {
    const activeUrl = envSheetsUrl || DEFAULT_SHEETS_URL;
    return activeUrl ? 'connected' : 'disconnected';
  });
  const [isInitialSyncLoading, setIsInitialSyncLoading] = useState<boolean>(false);
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

  // Firebase Main Database State
  const [firebaseSyncStatus, setFirebaseSyncStatus] = useState<FirebaseSyncStatus>('connecting');
  const [firebaseLastSyncedAt, setFirebaseLastSyncedAt] = useState<string | null>(null);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const isSyncingFromFirestoreRef = useRef<boolean>(false);

  const retryFirebaseConnection = async () => {
    setFirebaseSyncStatus('connecting');
    setFirebaseError(null);
    try {
      const ok = await testConnection();
      if (ok) {
        setFirebaseSyncStatus('connected');
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setFirebaseLastSyncedAt(nowStr);
      } else {
        setFirebaseSyncStatus('error');
        setFirebaseError('Firebase connection check failed.');
      }
    } catch (e: any) {
      setFirebaseSyncStatus('error');
      setFirebaseError(e.message || 'Error connecting to Firebase');
    }
  };

  const syncAllToFirebaseNow = async (): Promise<{ success: boolean; message: string; count?: number }> => {
    setFirebaseSyncStatus('connecting');
    setFirebaseError(null);
    try {
      const count = await batchWriteAllToFirestore({
        profile,
        products,
        sales,
        manualInvoices,
        quotations,
        purchaseOrders,
        customers,
        suppliers,
        expenses,
        employees,
        accounts,
        stockMovements,
      });
      setFirebaseSyncStatus('connected');
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setFirebaseLastSyncedAt(nowStr);
      return {
        success: true,
        message: `Successfully synced ${count} items across all collections to Firebase Firestore.`,
        count,
      };
    } catch (err: any) {
      setFirebaseSyncStatus('error');
      setFirebaseError(err.message || 'Failed to sync all records to Firebase');
      return { success: false, message: err.message || 'Failed to sync to Firebase' };
    }
  };
  const initialDirtyDelta = loadDirtyDeltaFromStorage();
  const initialDirtyCount = countDirtyDelta(initialDirtyDelta);
  const [syncStrategy, setSyncStrategyState] = useState<'smart_batch' | 'interval_15m' | 'manual'>(() => {
    return (localStorage.getItem(`${STORAGE_PREFIX}syncStrategy`) as any) || 'smart_batch';
  });
  const [pendingChangesCount, setPendingChangesCount] = useState<number>(initialDirtyCount);
  const [apiQuotaStats, setApiQuotaStats] = useState<ApiQuotaStats>(() => getApiQuotaStats());

  const dirtyDeltaRef = useRef<DirtyDeltaState>(initialDirtyDelta);
  const syncedHashesRef = useRef<SyncedHashesMap | null>(loadSyncedHashesFromStorage());
  const pendingChangesRef = useRef<number>(initialDirtyCount);
  const debounceTimerRef = useRef<any>(null);
  const isSyncingFromSheetsRef = useRef<boolean>(false);
  const isSyncOperationActiveRef = useRef<boolean>(false);
  const pendingPushQueuedRef = useRef<boolean>(false);
  const latestDataRef = useRef({
    products,
    sales,
    customers,
    suppliers,
    expenses,
    accounts,
    stockMovements,
    employees,
    profile,
    quotations,
    purchaseOrders,
    manualInvoices,
  });
  latestDataRef.current = {
    products,
    sales,
    customers,
    suppliers,
    expenses,
    accounts,
    stockMovements,
    employees,
    profile,
    quotations,
    purchaseOrders,
    manualInvoices,
  };
  const syncStrategyRef = useRef(syncStrategy);
  syncStrategyRef.current = syncStrategy;
  const sheetsUrlRef = useRef(sheetsUrl);
  sheetsUrlRef.current = sheetsUrl;

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
    if (!sheetsUrl || !sheetsUrl.trim()) {
      setIsInitialSyncLoading(false);
      return false;
    }

    // Mutual exclusion: avoid overlapping active sync operations
    if (isSyncOperationActiveRef.current) {
      return false;
    }

    isSyncOperationActiveRef.current = true;
    isSyncingFromSheetsRef.current = true;
    setSheetsSyncStatus('syncing');
    setSyncError(null);

    try {
      const res = await fetchAllFromSheets(sheetsUrl);
      if (res.success && res.data) {
        const d = res.data;
        if (d.products && Array.isArray(d.products)) setProducts(d.products.map(normalizeProduct));
        if (d.sales && Array.isArray(d.sales)) setSales(d.sales);
        if (d.customers && Array.isArray(d.customers)) {
          setCustomers(
            d.customers.map((c) => ({
              ...c,
              name: c.name !== undefined && c.name !== null ? String(c.name) : '',
              phone: c.phone !== undefined && c.phone !== null ? String(c.phone).trim() : '',
              email: c.email !== undefined && c.email !== null ? String(c.email).trim() : '',
            }))
          );
        }
        if (d.suppliers && Array.isArray(d.suppliers)) {
          setSuppliers(
            d.suppliers.map((s) => ({
              ...s,
              companyName: s.companyName !== undefined && s.companyName !== null ? String(s.companyName) : '',
              contactPerson: s.contactPerson !== undefined && s.contactPerson !== null ? String(s.contactPerson) : '',
              phone: s.phone !== undefined && s.phone !== null ? String(s.phone).trim() : '',
            }))
          );
        }
        if (d.expenses && Array.isArray(d.expenses)) setExpenses(d.expenses);
        if (d.accounts && Array.isArray(d.accounts)) setAccounts(d.accounts);
        if (d.stockMovements && Array.isArray(d.stockMovements)) setStockMovements(d.stockMovements);
        if (d.quotations && Array.isArray(d.quotations)) setQuotations(d.quotations.map(normalizeQuotation));
        if (d.purchaseOrders && Array.isArray(d.purchaseOrders)) setPurchaseOrders(d.purchaseOrders.map(normalizePurchaseOrder));
        if (d.manualInvoices && Array.isArray(d.manualInvoices)) setManualInvoices(d.manualInvoices.map(normalizeManualInvoice));
        if (d.employees && Array.isArray(d.employees)) {
          const normalizedEmployees: Employee[] = d.employees.map((emp) => ({
            ...emp,
            name: emp.name !== undefined && emp.name !== null ? String(emp.name).trim() : '',
            email: emp.email !== undefined && emp.email !== null ? String(emp.email).trim() : '',
            phone: emp.phone !== undefined && emp.phone !== null ? String(emp.phone).trim() : '',
            pin: emp.pin !== undefined && emp.pin !== null ? String(emp.pin).trim() : '1234',
            password: emp.password !== undefined && emp.password !== null ? String(emp.password).trim() : 'password',
            joinedDate: formatDateOnly(emp.joinedDate),
          }));
          setEmployees(normalizedEmployees);
          setCurrentUserState((prev) => {
            if (prev && normalizedEmployees.some((e) => e.id === prev.id)) {
              const updated = normalizedEmployees.find((e) => e.id === prev.id);
              if (updated) {
                localStorage.setItem(`${STORAGE_PREFIX}currentUser`, JSON.stringify(updated));
                return updated;
              }
              return prev;
            }
            // CRITICAL SECURITY FIX: Do NOT auto-login employees[0] when unauthenticated!
            // Prevents the app from automatically logging in after a page reload.
            return null;
          });
        }
        if (d.profile && typeof d.profile === 'object') {
          setProfile((prev) => ({
            ...prev,
            ...d.profile,
            bankDetails: d.profile?.bankDetails !== undefined ? normalizeBankDetails(d.profile.bankDetails) : prev.bankDetails,
          }));
        }

        const restoredHashes = buildHashesMapFromData({
          products: Array.isArray(d.products) ? d.products.map(normalizeProduct) : undefined,
          sales: Array.isArray(d.sales) ? d.sales : undefined,
          customers: Array.isArray(d.customers) ? d.customers : undefined,
          suppliers: Array.isArray(d.suppliers) ? d.suppliers : undefined,
          expenses: Array.isArray(d.expenses) ? d.expenses : undefined,
          accounts: Array.isArray(d.accounts) ? d.accounts : undefined,
          stockMovements: Array.isArray(d.stockMovements) ? d.stockMovements : undefined,
          employees: Array.isArray(d.employees) ? d.employees.map(normalizeEmployee) : undefined,
          quotations: Array.isArray(d.quotations) ? d.quotations.map(normalizeQuotation) : undefined,
          purchaseOrders: Array.isArray(d.purchaseOrders) ? d.purchaseOrders.map(normalizePurchaseOrder) : undefined,
          manualInvoices: Array.isArray(d.manualInvoices) ? d.manualInvoices.map(normalizeManualInvoice) : undefined,
          profile: d.profile && typeof d.profile === 'object' ? { ...profile, ...d.profile } : undefined,
        });
        syncedHashesRef.current = restoredHashes;
        saveSyncedHashesToStorage(restoredHashes);
        dirtyDeltaRef.current = createEmptyDirtyDelta();
        saveDirtyDeltaToStorage(dirtyDeltaRef.current);
        pendingChangesRef.current = 0;
        setPendingChangesCount(0);

        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncedAt(nowStr);
        localStorage.setItem(`${STORAGE_PREFIX}lastSyncedAt`, nowStr);
        setSheetsSyncStatus('connected');
        setSyncError(null);
        setIsInitialSyncLoading(false);
        refreshQuotaStats();
        return true;
      } else {
        setSheetsSyncStatus('error');
        setSyncError(res.message || 'Failed to pull data from Google Sheets.');
        setIsInitialSyncLoading(false);
        refreshQuotaStats();
        return false;
      }
    } catch (err: any) {
      setSheetsSyncStatus('error');
      setSyncError(err.message || 'Network failure while syncing from Google Sheets.');
      setIsInitialSyncLoading(false);
      refreshQuotaStats();
      return false;
    } finally {
      isSyncOperationActiveRef.current = false;
      // Allow React state batching and side-effects to settle before unlocking mutation watcher
      setTimeout(() => {
        isSyncingFromSheetsRef.current = false;
        // If a push was requested while pull was in flight, execute it cleanly
        if (pendingPushQueuedRef.current) {
          pendingPushQueuedRef.current = false;
          executeSheetsPush(true);
        }
      }, 1200);
    }
  };

  const executeSheetsPush = async (isAutoTrigger: boolean): Promise<boolean> => {
    const targetUrl = sheetsUrlRef.current;
    if (!targetUrl || !targetUrl.trim()) return false;

    // Concurrency protection: if already syncing/pushing, queue this push to execute next
    if (isSyncOperationActiveRef.current) {
      pendingPushQueuedRef.current = true;
      return true;
    }

    isSyncOperationActiveRef.current = true;
    setSheetsSyncStatus('syncing');
    setSyncError(null);

    try {
      // If user clicked manual "Backup to Sheets" on a browser without a full baseline yet,
      // fetch the spreadsheet baseline once so only genuinely new or unsynced records are pushed.
      if (!isAutoTrigger && !syncedHashesRef.current?.hasFullBaseline) {
        const baselineRes = await fetchAllFromSheets(targetUrl);
        if (baselineRes.success && baselineRes.data) {
          const remoteHashes = buildHashesMapFromData({
            products: Array.isArray(baselineRes.data.products) ? baselineRes.data.products.map(normalizeProduct) : [],
            sales: Array.isArray(baselineRes.data.sales) ? baselineRes.data.sales : [],
            customers: Array.isArray(baselineRes.data.customers) ? baselineRes.data.customers : [],
            suppliers: Array.isArray(baselineRes.data.suppliers) ? baselineRes.data.suppliers : [],
            expenses: Array.isArray(baselineRes.data.expenses) ? baselineRes.data.expenses : [],
            accounts: Array.isArray(baselineRes.data.accounts) ? baselineRes.data.accounts : [],
            stockMovements: Array.isArray(baselineRes.data.stockMovements) ? baselineRes.data.stockMovements : [],
            employees: Array.isArray(baselineRes.data.employees) ? baselineRes.data.employees.map(normalizeEmployee) : [],
            quotations: Array.isArray(baselineRes.data.quotations) ? baselineRes.data.quotations.map(normalizeQuotation) : [],
            purchaseOrders: Array.isArray(baselineRes.data.purchaseOrders)
              ? baselineRes.data.purchaseOrders.map(normalizePurchaseOrder)
              : [],
            manualInvoices: Array.isArray(baselineRes.data.manualInvoices)
              ? baselineRes.data.manualInvoices.map(normalizeManualInvoice)
              : [],
            profile: baselineRes.data.profile,
          });
          syncedHashesRef.current = remoteHashes;
          saveSyncedHashesToStorage(remoteHashes);
        } else if (countDirtyDelta(dirtyDeltaRef.current) === 0) {
          setSheetsSyncStatus('error');
          setSyncError(baselineRes.message || 'Failed to verify spreadsheet baseline.');
          refreshQuotaStats();
          return false;
        }
      }

      const snapshot = latestDataRef.current;
      const dirty = dirtyDeltaRef.current;
      const baseline = syncedHashesRef.current;

      const deltaPayload: SheetsDeltaPayload = {
        upserts: {},
        deletes: {},
      };
      const pushedUpsertHashes: Partial<Record<SheetsDeltaCollectionKey, Record<string, string>>> = {};
      const pushedDeleteIds: Partial<Record<SheetsDeltaCollectionKey, string[]>> = {};
      let pushedProfileHash: string | null = null;
      let hasChangesToPush = false;

      for (const key of DELTA_COLLECTION_KEYS) {
        const items = (snapshot[key] || []) as any[];
        const itemMap = new Map<string, any>();
        for (const item of items) {
          if (item && item.id !== undefined && item.id !== null) {
            itemMap.set(String(item.id), item);
          }
        }

        const dirtyUpsertIds = new Set<string>(dirty.upserts[key] || []);
        const dirtyDeleteIds = new Set<string>(dirty.deletes[key] || []);
        const colBaseline = baseline?.[key];

        // On manual sync with a full baseline, also catch any unsynced/modified records not yet in baseline
        if (!isAutoTrigger && baseline?.hasFullBaseline) {
          for (const [id, item] of itemMap.entries()) {
            const currentHash = canonicalRecordHash(key, item);
            if (!colBaseline || colBaseline[id] !== currentHash) {
              dirtyUpsertIds.add(id);
            }
          }
        }

        const upsertRecords: any[] = [];
        const upsertHashMap: Record<string, string> = {};
        for (const id of dirtyUpsertIds) {
          if (dirtyDeleteIds.has(id)) continue;
          const record = itemMap.get(id);
          if (!record) continue;
          const currentHash = canonicalRecordHash(key, record);
          if (colBaseline && colBaseline[id] === currentHash) {
            continue;
          }
          upsertRecords.push(record);
          upsertHashMap[id] = currentHash;
        }

        const deleteIdList = Array.from(dirtyDeleteIds);

        if (upsertRecords.length > 0) {
          (deltaPayload.upserts as any)[key] = upsertRecords;
          pushedUpsertHashes[key] = upsertHashMap;
          hasChangesToPush = true;
        }
        if (deleteIdList.length > 0) {
          deltaPayload.deletes[key] = deleteIdList;
          pushedDeleteIds[key] = deleteIdList;
          hasChangesToPush = true;
        }
      }

      const currentProfileHash = canonicalRecordHash('profile', snapshot.profile);
      const shouldPushProfile =
        dirty.profile
          ? !baseline?.profile || baseline.profile !== currentProfileHash
          : !isAutoTrigger && Boolean(baseline?.hasFullBaseline) && baseline?.profile !== currentProfileHash;

      if (shouldPushProfile) {
        deltaPayload.profile = snapshot.profile;
        pushedProfileHash = currentProfileHash;
        hasChangesToPush = true;
      }

      // If everything is already in sync with the spreadsheet, skip unnecessary network write
      if (!hasChangesToPush) {
        dirtyDeltaRef.current = createEmptyDirtyDelta();
        saveDirtyDeltaToStorage(dirtyDeltaRef.current);
        pendingChangesRef.current = 0;
        setPendingChangesCount(0);
        setSheetsSyncStatus('connected');
        setSyncError(null);
        refreshQuotaStats();
        return true;
      }

      let res = await pushDeltaToSheets(targetUrl, deltaPayload);

      // Compatibility fallback only if the deployed Apps Script has not yet been updated with syncDelta
      if (!res.success && res.unsupportedAction) {
        const fullRes = await pushAllToSheets(targetUrl, {
          products: snapshot.products,
          sales: snapshot.sales,
          customers: snapshot.customers,
          suppliers: snapshot.suppliers,
          expenses: snapshot.expenses,
          accounts: snapshot.accounts,
          stockMovements: snapshot.stockMovements,
          employees: snapshot.employees,
          profile: snapshot.profile,
          quotations: snapshot.quotations,
          purchaseOrders: snapshot.purchaseOrders,
          manualInvoices: snapshot.manualInvoices,
        });
        if (fullRes.success) {
          const updatedHashes = buildHashesMapFromData(snapshot);
          syncedHashesRef.current = updatedHashes;
          saveSyncedHashesToStorage(updatedHashes);
          dirtyDeltaRef.current = createEmptyDirtyDelta();
          saveDirtyDeltaToStorage(dirtyDeltaRef.current);
          pendingChangesRef.current = 0;
          setPendingChangesCount(0);
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setLastSyncedAt(nowStr);
          localStorage.setItem(`${STORAGE_PREFIX}lastSyncedAt`, nowStr);
          setSheetsSyncStatus('connected');
          setSyncError(null);
          refreshQuotaStats();
          return true;
        }
        res = fullRes;
      }

      if (res.success) {
        // Update synced baseline ONLY for the records actually pushed
        const nextBaseline: SyncedHashesMap = syncedHashesRef.current ? { ...syncedHashesRef.current } : {};
        for (const key of DELTA_COLLECTION_KEYS) {
          const pushedCol = pushedUpsertHashes[key];
          const deletedCol = pushedDeleteIds[key];
          if (pushedCol || deletedCol) {
            const colMap = { ...(nextBaseline[key] || {}) };
            if (pushedCol) {
              Object.assign(colMap, pushedCol);
            }
            if (deletedCol) {
              for (const delId of deletedCol) {
                delete colMap[delId];
              }
            }
            nextBaseline[key] = colMap;
          }
        }
        if (pushedProfileHash !== null) {
          nextBaseline.profile = pushedProfileHash;
        }
        syncedHashesRef.current = nextBaseline;
        saveSyncedHashesToStorage(nextBaseline);

        // Prune only the pushed mutations from dirtyDeltaRef (preserve any edits made while request was in flight)
        const latestSnapshot = latestDataRef.current;
        const nextDirty = createEmptyDirtyDelta();
        for (const key of DELTA_COLLECTION_KEYS) {
          const latestItems = new Map<string, any>(
            ((latestSnapshot[key] || []) as any[])
              .filter((x) => x && x.id !== undefined && x.id !== null)
              .map((x) => [String(x.id), x])
          );
          const pushedCol = pushedUpsertHashes[key] || {};
          const deletedSet = new Set(pushedDeleteIds[key] || []);

          for (const id of dirtyDeltaRef.current.upserts[key]) {
            if (pushedCol[id]) {
              const latestRec = latestItems.get(id);
              if (latestRec && canonicalRecordHash(key, latestRec) === pushedCol[id]) {
                continue;
              }
            }
            nextDirty.upserts[key].push(id);
          }

          for (const id of dirtyDeltaRef.current.deletes[key]) {
            if (deletedSet.has(id)) continue;
            nextDirty.deletes[key].push(id);
          }
        }

        if (dirtyDeltaRef.current.profile) {
          if (
            pushedProfileHash !== null &&
            canonicalRecordHash('profile', latestSnapshot.profile) === pushedProfileHash
          ) {
            nextDirty.profile = false;
          } else {
            nextDirty.profile = true;
          }
        }

        dirtyDeltaRef.current = nextDirty;
        saveDirtyDeltaToStorage(nextDirty);
        const remainingCount = countDirtyDelta(nextDirty);
        pendingChangesRef.current = remainingCount;
        setPendingChangesCount(remainingCount);

        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncedAt(nowStr);
        localStorage.setItem(`${STORAGE_PREFIX}lastSyncedAt`, nowStr);
        setSheetsSyncStatus('connected');
        setSyncError(null);
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
    } finally {
      isSyncOperationActiveRef.current = false;
      if (pendingPushQueuedRef.current) {
        pendingPushQueuedRef.current = false;
        setTimeout(() => {
          executeSheetsPush(true);
        }, 500);
      }
    }
  };

  const pushToSheetsNow = (): Promise<boolean> => executeSheetsPush(false);

  // Triggered explicitly on Save, Update, and Delete actions across the app with exact changed IDs
  const triggerSheetsBackup = (spec?: {
    upserts?: Partial<Record<SheetsDeltaCollectionKey, string[]>>;
    deletes?: Partial<Record<SheetsDeltaCollectionKey, string[]>>;
    profile?: boolean;
  }) => {
    if (isSyncingFromSheetsRef.current || isSyncingFromFirestoreRef.current) {
      return;
    }

    if (spec) {
      const nextDirty = dirtyDeltaRef.current;
      if (spec.upserts) {
        for (const [col, ids] of Object.entries(spec.upserts) as [SheetsDeltaCollectionKey, string[] | undefined][]) {
          if (!ids || ids.length === 0) continue;
          const delSet = new Set(nextDirty.deletes[col]);
          const upSet = new Set(nextDirty.upserts[col]);
          for (const rawId of ids) {
            const id = String(rawId || '').trim();
            if (!id) continue;
            delSet.delete(id);
            upSet.add(id);
          }
          nextDirty.deletes[col] = Array.from(delSet);
          nextDirty.upserts[col] = Array.from(upSet);
        }
      }
      if (spec.deletes) {
        for (const [col, ids] of Object.entries(spec.deletes) as [SheetsDeltaCollectionKey, string[] | undefined][]) {
          if (!ids || ids.length === 0) continue;
          const upSet = new Set(nextDirty.upserts[col]);
          const delSet = new Set(nextDirty.deletes[col]);
          for (const rawId of ids) {
            const id = String(rawId || '').trim();
            if (!id) continue;
            upSet.delete(id);
            delSet.add(id);
          }
          nextDirty.upserts[col] = Array.from(upSet);
          nextDirty.deletes[col] = Array.from(delSet);
        }
      }
      if (spec.profile) {
        nextDirty.profile = true;
      }
      saveDirtyDeltaToStorage(nextDirty);
      const count = countDirtyDelta(nextDirty);
      pendingChangesRef.current = count;
      setPendingChangesCount(count);
    }

    if (syncStrategyRef.current === 'smart_batch' && sheetsUrlRef.current?.trim()) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // Short 1.2s coalescing window so multi-step saves (e.g. Sale + Stock + Customer) push in 1 single incremental backup call
      debounceTimerRef.current = setTimeout(() => {
        executeSheetsPush(true);
      }, 1200);
    }
  };

  // Boot-time Firebase Firestore Listeners: Only profile & employees (for login/branding) to conserve read quota
  useEffect(() => {
    let unsubs: (() => void)[] = [];
    let isMounted = true;

    async function initBootFirestore() {
      try {
        setFirebaseSyncStatus('connecting');
        const isOnline = await testConnection();
        if (!isOnline && isMounted) {
          setFirebaseSyncStatus('error');
          setFirebaseError('Firebase connection check failed. Client may be offline.');
        }

        const unsubProfile = subscribeToDocument<BusinessProfile>(
          COLLECTIONS.BUSINESS_PROFILE,
          'main',
          (docData) => {
            if (!isMounted || !docData) return;
            isSyncingFromFirestoreRef.current = true;
            setProfile((prev) => ({
              ...prev,
              ...docData,
              logo: docData.logo && docData.logo.trim() ? docData.logo : (prev.logo || initialBusinessProfile.logo),
              bankDetails: docData.bankDetails !== undefined ? normalizeBankDetails(docData.bankDetails) : (prev.bankDetails || []),
            }));
            setTimeout(() => {
              isSyncingFromFirestoreRef.current = false;
            }, 300);
          }
        );
        unsubs.push(unsubProfile);

        const unsubEmployees = subscribeToCollection<Employee>(
          COLLECTIONS.EMPLOYEES,
          (items) => {
            if (!isMounted) return;
            if (items.length > 0) {
              isSyncingFromFirestoreRef.current = true;
              setEmployees(items.map(normalizeEmployee));
              setTimeout(() => {
                isSyncingFromFirestoreRef.current = false;
              }, 300);
            }
          }
        );
        unsubs.push(unsubEmployees);

        if (isMounted) {
          setFirebaseSyncStatus('connected');
          setFirebaseError(null);
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setFirebaseLastSyncedAt(nowStr);
        }
      } catch (err: any) {
        if (isMounted) {
          setFirebaseSyncStatus('error');
          setFirebaseError(err.message || 'Failed to connect to Firebase database');
        }
      }
    }

    initBootFirestore();

    return () => {
      isMounted = false;
      unsubs.forEach((unsub) => {
        try {
          unsub();
        } catch {}
      });
    };
  }, []);

  // Authenticated-session Firebase Firestore Listeners: Only subscribe to operational collections when a staff user is signed in
  const isAuthenticatedUser = Boolean(currentUser);
  useEffect(() => {
    if (!isAuthenticatedUser) return;

    let unsubs: (() => void)[] = [];
    let isMounted = true;

    try {
      const unsubProducts = subscribeToCollection<Product>(
        COLLECTIONS.PRODUCTS,
        (items) => {
          if (!isMounted) return;
          if (items.length > 0) {
            isSyncingFromFirestoreRef.current = true;
            setProducts(items.map(normalizeProduct));
            setTimeout(() => {
              isSyncingFromFirestoreRef.current = false;
            }, 300);
          }
        }
      );
      unsubs.push(unsubProducts);

      const unsubSales = subscribeToCollection<Sale>(
        COLLECTIONS.SALES,
        (items) => {
          if (!isMounted) return;
          if (items.length > 0) {
            isSyncingFromFirestoreRef.current = true;
            setSales(items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            setTimeout(() => {
              isSyncingFromFirestoreRef.current = false;
            }, 300);
          }
        }
      );
      unsubs.push(unsubSales);

      const unsubQuotations = subscribeToCollection<Quotation>(
        COLLECTIONS.QUOTATIONS,
        (items) => {
          if (!isMounted) return;
          if (items.length > 0) {
            isSyncingFromFirestoreRef.current = true;
            setQuotations(items.map(normalizeQuotation).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            setTimeout(() => {
              isSyncingFromFirestoreRef.current = false;
            }, 300);
          }
        }
      );
      unsubs.push(unsubQuotations);

      const unsubPOs = subscribeToCollection<PurchaseOrder>(
        COLLECTIONS.PURCHASE_ORDERS,
        (items) => {
          if (!isMounted) return;
          if (items.length > 0) {
            isSyncingFromFirestoreRef.current = true;
            setPurchaseOrders(items.map(normalizePurchaseOrder).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            setTimeout(() => {
              isSyncingFromFirestoreRef.current = false;
            }, 300);
          }
        }
      );
      unsubs.push(unsubPOs);

      let hasManualSnapshotData = false;
      const unsubManualInvoices = subscribeToCollection<ManualInvoice>(
        COLLECTIONS.MANUAL_INVOICES,
        (items) => {
          if (!isMounted) return;
          if (items.length > 0 || hasManualSnapshotData) {
            if (items.length > 0) hasManualSnapshotData = true;
            isSyncingFromFirestoreRef.current = true;
            setManualInvoices(
              items
                .map(normalizeManualInvoice)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            );
            setTimeout(() => {
              isSyncingFromFirestoreRef.current = false;
            }, 300);
          }
        }
      );
      unsubs.push(unsubManualInvoices);

      const unsubCustomers = subscribeToCollection<Customer>(
        COLLECTIONS.CUSTOMERS,
        (items) => {
          if (!isMounted) return;
          if (items.length > 0) {
            isSyncingFromFirestoreRef.current = true;
            setCustomers(items);
            setTimeout(() => {
              isSyncingFromFirestoreRef.current = false;
            }, 300);
          }
        }
      );
      unsubs.push(unsubCustomers);

      const unsubSuppliers = subscribeToCollection<Supplier>(
        COLLECTIONS.SUPPLIERS,
        (items) => {
          if (!isMounted) return;
          if (items.length > 0) {
            isSyncingFromFirestoreRef.current = true;
            setSuppliers(items);
            setTimeout(() => {
              isSyncingFromFirestoreRef.current = false;
            }, 300);
          }
        }
      );
      unsubs.push(unsubSuppliers);

      const unsubExpenses = subscribeToCollection<Expense>(
        COLLECTIONS.EXPENSES,
        (items) => {
          if (!isMounted) return;
          if (items.length > 0) {
            isSyncingFromFirestoreRef.current = true;
            setExpenses(items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            setTimeout(() => {
              isSyncingFromFirestoreRef.current = false;
            }, 300);
          }
        }
      );
      unsubs.push(unsubExpenses);

      const unsubAccounts = subscribeToCollection<Account>(
        COLLECTIONS.ACCOUNTS,
        (items) => {
          if (!isMounted) return;
          if (items.length > 0) {
            isSyncingFromFirestoreRef.current = true;
            setAccounts(items);
            setTimeout(() => {
              isSyncingFromFirestoreRef.current = false;
            }, 300);
          }
        }
      );
      unsubs.push(unsubAccounts);

      const unsubStock = subscribeToCollection<StockMovement>(
        COLLECTIONS.STOCK_MOVEMENTS,
        (items) => {
          if (!isMounted) return;
          if (items.length > 0) {
            isSyncingFromFirestoreRef.current = true;
            setStockMovements(items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            setTimeout(() => {
              isSyncingFromFirestoreRef.current = false;
            }, 300);
          }
        }
      );
      unsubs.push(unsubStock);

      if (isMounted) {
        setFirebaseSyncStatus('connected');
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setFirebaseLastSyncedAt(nowStr);
      }
    } catch (err: any) {
      if (isMounted) {
        setFirebaseSyncStatus('error');
        setFirebaseError(err.message || 'Failed to sync operational collections');
      }
    }

    return () => {
      isMounted = false;
      unsubs.forEach((unsub) => {
        try {
          unsub();
        } catch {}
      });
    };
  }, [isAuthenticatedUser]);

  // Periodic interval sync when scheduled mode is chosen (syncs at most every 15 min if there are changes)
  useEffect(() => {
    if (syncStrategy !== 'interval_15m' || !sheetsUrl) return;

    const interval = setInterval(() => {
      if (pendingChangesRef.current > 0 && !isSyncOperationActiveRef.current) {
        executeSheetsPush(true);
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [syncStrategy, sheetsUrl]);

  // Automatic reconnection push when user regains internet and has queued backups
  useEffect(() => {
    const handleOnline = () => {
      if (sheetsUrl && sheetsUrl.trim() && !isSyncOperationActiveRef.current && pendingChangesRef.current > 0) {
        executeSheetsPush(true);
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [sheetsUrl]);

  // Auto-retry queued backup push if a transient sync error occurred
  useEffect(() => {
    if (sheetsSyncStatus === 'error' && sheetsUrl && sheetsUrl.trim() && !isSyncOperationActiveRef.current && pendingChangesRef.current > 0) {
      const autoRetryTimer = setTimeout(() => {
        if (pendingChangesRef.current > 0) {
          executeSheetsPush(true);
        }
      }, 15000);
      return () => clearTimeout(autoRetryTimer);
    }
  }, [sheetsSyncStatus, sheetsUrl]);

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
    localStorage.setItem(`${STORAGE_PREFIX}manualInvoices`, JSON.stringify(manualInvoices));
  }, [manualInvoices]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}quotations`, JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}purchaseOrders`, JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

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
    if (updates.language && (updates.language === 'en' || updates.language === 'pt')) {
      setLanguageState(updates.language);
      localStorage.setItem(`${STORAGE_PREFIX}language`, updates.language);
    }
    setProfile((prev) => {
      const updated = { ...prev, ...updates };
      saveProfileToFirestore(updated).catch(console.error);
      return updated;
    });
    triggerSheetsBackup({ profile: true });
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
          performedBy:
            saleData.cashierName ||
            currentUser?.name ||
            profile.ownerName ||
            profile.businessName ||
            profile.name ||
            '',
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

    // Save to Firebase Firestore (Main Database)
    saveSaleToFirestore(newSale).catch(console.error);
    const soldProductIds: string[] = [];
    updatedProducts.forEach((p) => {
      if (saleData.items.some((i) => i.productId === p.id)) {
        soldProductIds.push(p.id);
        saveProductToFirestore(p).catch(console.error);
      }
    });
    newStockMovements.forEach((sm) => {
      saveStockMovementToFirestore(sm).catch(console.error);
    });
    let targetAccountIdForBackup: string | null = null;
    if (newSale.amountPaid > 0) {
      let targetAccountId = 'acc-cash';
      if (newSale.paymentMethod === 'bank_transfer') targetAccountId = 'acc-bank';
      else if (newSale.paymentMethod === 'pos_card') targetAccountId = 'acc-pos';
      targetAccountIdForBackup = targetAccountId;
      const targetAcc = accounts.find((a) => a.id === targetAccountId);
      if (targetAcc) {
        saveAccountToFirestore({ ...targetAcc, balance: targetAcc.balance + newSale.amountPaid }).catch(console.error);
      }
    }
    let customerIdForBackup: string | null = null;
    if (newSale.customerId) {
      const cust = customers.find((c) => c.id === newSale.customerId);
      if (cust) {
        customerIdForBackup = cust.id;
        saveCustomerToFirestore({
          ...cust,
          outstandingDebt: newSale.balanceDue > 0 ? cust.outstandingDebt + newSale.balanceDue : cust.outstandingDebt,
          totalSpent: cust.totalSpent + newSale.total,
          lastPurchaseDate: timestamp,
        }).catch(console.error);
      }
    }

    triggerSheetsBackup({
      upserts: {
        sales: [newSale.id],
        ...(soldProductIds.length > 0 ? { products: soldProductIds } : {}),
        ...(newStockMovements.length > 0 ? { stockMovements: newStockMovements.map((sm) => sm.id) } : {}),
        ...(targetAccountIdForBackup ? { accounts: [targetAccountIdForBackup] } : {}),
        ...(customerIdForBackup ? { customers: [customerIdForBackup] } : {}),
      },
    });
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

    // Delete and sync reversals to Firestore
    deleteSaleFromFirestore(saleId).catch(console.error);
    const affectedProductIds: string[] = [];
    products.forEach((prod) => {
      const item = saleToDelete.items.find((i) => i.productId === prod.id);
      if (item) {
        affectedProductIds.push(prod.id);
        saveProductToFirestore({ ...prod, stock: prod.stock + item.quantity }).catch(console.error);
      }
    });
    let reversedAccountId: string | null = null;
    if (saleToDelete.amountPaid > 0) {
      let targetAccountId = 'acc-cash';
      if (saleToDelete.paymentMethod === 'bank_transfer') targetAccountId = 'acc-bank';
      else if (saleToDelete.paymentMethod === 'pos_card') targetAccountId = 'acc-pos';
      reversedAccountId = targetAccountId;
      const targetAcc = accounts.find((a) => a.id === targetAccountId);
      if (targetAcc) {
        saveAccountToFirestore({ ...targetAcc, balance: Math.max(0, targetAcc.balance - saleToDelete.amountPaid) }).catch(console.error);
      }
    }
    let reversedCustomerId: string | null = null;
    if (saleToDelete.balanceDue > 0 && saleToDelete.customerId) {
      const cust = customers.find((c) => c.id === saleToDelete.customerId);
      if (cust) {
        reversedCustomerId = cust.id;
        saveCustomerToFirestore({
          ...cust,
          outstandingDebt: Math.max(0, cust.outstandingDebt - saleToDelete.balanceDue),
          totalSpent: Math.max(0, cust.totalSpent - saleToDelete.total),
        }).catch(console.error);
      }
    }

    triggerSheetsBackup({
      upserts: {
        ...(affectedProductIds.length > 0 ? { products: affectedProductIds } : {}),
        ...(reversedAccountId ? { accounts: [reversedAccountId] } : {}),
        ...(reversedCustomerId ? { customers: [reversedCustomerId] } : {}),
      },
      deletes: {
        sales: [saleId],
      },
    });
    return true;
  };

  // MANUAL CUSTOMER INVOICE TRACKING ACTIONS (Independent of POS sales, stock, & cash accounts)
  const generateManualInvoiceNumber = (): string => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const existingNums = new Set(manualInvoices.map((m) => m.invoiceNumber.trim().toUpperCase()));
    let seq = manualInvoices.length + 101;
    let candidate = `MINV-${dateStr}-${seq}`;
    while (existingNums.has(candidate.toUpperCase())) {
      seq += 1;
      candidate = `MINV-${dateStr}-${seq}`;
    }
    return candidate;
  };

  const addManualInvoice = (
    data: Omit<ManualInvoice, 'id' | 'balance' | 'status' | 'createdAt' | 'updatedAt'> & {
      invoiceNumber?: string;
    }
  ): ManualInvoice => {
    const nowIso = new Date().toISOString();
    const invoiceDate = formatDateOnly(data.date || nowIso);
    const initialPaid = Math.max(0, Number(data.amountPaid) || 0);
    const payments = normalizeManualPayments(
      data.payments,
      initialPaid,
      invoiceDate
    );
    const summedPaid =
      Array.isArray(data.payments)
        ? Number(payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2))
        : initialPaid;
    const { amount, amountPaid, balance, status } = computeManualInvoiceFields(data.amount, summedPaid);
    const invoiceNumber =
      data.invoiceNumber && data.invoiceNumber.trim()
        ? data.invoiceNumber.trim()
        : generateManualInvoiceNumber();

    const newManualInvoice: ManualInvoice = {
      id: `minv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      invoiceNumber,
      customerId: data.customerId ? String(data.customerId).trim() : '',
      customerName: String(data.customerName || '').trim(),
      date: invoiceDate,
      amount,
      amountPaid,
      balance,
      status,
      payments,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setManualInvoices((prev) => [newManualInvoice, ...prev]);
    saveManualInvoiceToFirestore(newManualInvoice).catch(console.error);
    triggerSheetsBackup({ upserts: { manualInvoices: [newManualInvoice.id] } });
    return newManualInvoice;
  };

  const updateManualInvoice = (id: string, updates: Partial<ManualInvoice>) => {
    const nowIso = new Date().toISOString();
    setManualInvoices((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const merged = { ...m, ...updates, updatedAt: nowIso };
          const invoiceDate = formatDateOnly(merged.date || m.date);
          const payments =
            updates.payments !== undefined
              ? normalizeManualPayments(updates.payments, 0, invoiceDate)
              : normalizeManualPayments(m.payments, m.amountPaid, invoiceDate);
          const effectivePaid =
            updates.payments !== undefined
              ? Number(payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2))
              : merged.amountPaid;
          const { amount, amountPaid, balance, status } = computeManualInvoiceFields(
            merged.amount,
            effectivePaid
          );
          const updated: ManualInvoice = {
            ...merged,
            invoiceNumber: String(merged.invoiceNumber || m.invoiceNumber).trim(),
            customerName: String(merged.customerName || m.customerName).trim(),
            date: invoiceDate,
            amount,
            amountPaid,
            balance,
            status,
            payments,
          };
          saveManualInvoiceToFirestore(updated).catch(console.error);
          return updated;
        }
        return m;
      })
    );
    triggerSheetsBackup({ upserts: { manualInvoices: [id] } });
  };

  const deleteManualInvoice = (id: string): boolean => {
    setManualInvoices((prev) => prev.filter((m) => m.id !== id));
    deleteManualInvoiceFromFirestore(id).catch(console.error);
    triggerSheetsBackup({ deletes: { manualInvoices: [id] } });
    return true;
  };

  // QUOTATION ACTIONS
  const addQuotation = (
    quotationData: Omit<Quotation, 'id' | 'quotationNumber' | 'timestamp'>
  ): Quotation => {
    const nextNum = quotations.length + 1001;
    const newQuotation: Quotation = {
      ...quotationData,
      id: `quote-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      quotationNumber: `QT-${nextNum}`,
      timestamp: new Date().toISOString(),
    };
    setQuotations((prev) => [newQuotation, ...prev]);
    saveQuotationToFirestore(newQuotation).catch(console.error);
    triggerSheetsBackup({ upserts: { quotations: [newQuotation.id] } });
    return newQuotation;
  };

  const updateQuotation = (id: string, updates: Partial<Quotation>) => {
    setQuotations((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const updated = { ...q, ...updates };
          saveQuotationToFirestore(updated).catch(console.error);
          return updated;
        }
        return q;
      })
    );
    triggerSheetsBackup({ upserts: { quotations: [id] } });
  };

  const deleteQuotation = (id: string): boolean => {
    setQuotations((prev) => prev.filter((q) => q.id !== id));
    deleteQuotationFromFirestore(id).catch(console.error);
    triggerSheetsBackup({ deletes: { quotations: [id] } });
    return true;
  };

  const convertQuotationToSale = (quotationId: string): Sale | null => {
    const quote = quotations.find((q) => q.id === quotationId);
    if (!quote) return null;

    const invoiceItems = quote.items.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitCost: prod?.costPrice || 0,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      };
    });

    const newSale = addSale({
      customerId: quote.customerId || '',
      customerName: quote.customerName || '',
      customerPhone: quote.customerPhone,
      items: invoiceItems,
      subtotal: quote.subtotal,
      discountAmount: quote.discountAmount,
      taxAmount: quote.taxAmount,
      total: quote.total,
      amountPaid: quote.total,
      balanceDue: 0,
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      cashierName:
        currentUser?.name ||
        quote.cashierName ||
        profile.ownerName ||
        profile.businessName ||
        profile.name ||
        '',
      notes: `Converted from Quotation ${quote.quotationNumber}. ${quote.notes || ''}`.trim(),
    });

    updateQuotation(quotationId, { status: 'converted' });
    return newSale;
  };

  // PURCHASE ORDER ACTIONS
  const addPurchaseOrder = (
    poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'timestamp'>
  ): PurchaseOrder => {
    const nextNum = purchaseOrders.length + 1001;
    const newPO: PurchaseOrder = {
      ...poData,
      id: `po-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      poNumber: `PO-${nextNum}`,
      timestamp: new Date().toISOString(),
    };
    setPurchaseOrders((prev) => [newPO, ...prev]);
    savePurchaseOrderToFirestore(newPO).catch(console.error);
    triggerSheetsBackup({ upserts: { purchaseOrders: [newPO.id] } });
    return newPO;
  };

  const updatePurchaseOrder = (id: string, updates: Partial<PurchaseOrder>) => {
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.id === id) {
          const updated = { ...po, ...updates };
          savePurchaseOrderToFirestore(updated).catch(console.error);
          return updated;
        }
        return po;
      })
    );
    triggerSheetsBackup({ upserts: { purchaseOrders: [id] } });
  };

  const deletePurchaseOrder = (id: string): boolean => {
    setPurchaseOrders((prev) => prev.filter((po) => po.id !== id));
    deletePurchaseOrderFromFirestore(id).catch(console.error);
    triggerSheetsBackup({ deletes: { purchaseOrders: [id] } });
    return true;
  };

  const receivePurchaseOrder = (poId: string): boolean => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return false;

    po.items.forEach((item) => {
      restockProduct(item.productId, item.quantity, item.unitCost, po.supplierId);
    });

    updatePurchaseOrder(poId, {
      status: 'received',
      receivedAt: new Date().toISOString(),
    });
    return true;
  };

  const addProduct = (productData: Omit<Product, 'id' | 'updatedAt'>): Product => {
    const timestamp = new Date().toISOString();
    const newProduct: Product = normalizeProduct({
      ...productData,
      id: `prod-${Date.now()}`,
      updatedAt: timestamp,
    });

    let initSmId: string | null = null;
    if (newProduct.stock > 0) {
      const initSm: StockMovement = {
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
      };
      initSmId = initSm.id;
      setStockMovements((prev) => [initSm, ...prev]);
      saveStockMovementToFirestore(initSm).catch(console.error);
    }

    setProducts((prev) => [newProduct, ...prev]);
    saveProductToFirestore(newProduct).catch(console.error);
    triggerSheetsBackup({
      upserts: {
        products: [newProduct.id],
        ...(initSmId ? { stockMovements: [initSmId] } : {}),
      },
    });
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = normalizeProduct({
            ...p,
            ...updates,
            updatedAt: new Date().toISOString(),
          });
          saveProductToFirestore(updated).catch(console.error);
          return updated;
        }
        return p;
      })
    );
    triggerSheetsBackup({ upserts: { products: [id] } });
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

    const updatedProd = {
      ...target,
      stock: newStock,
      costPrice: effectiveCost,
      updatedAt: timestamp,
    };

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? updatedProd : p))
    );
    saveProductToFirestore(updatedProd).catch(console.error);

    const newSm: StockMovement = {
      id: `sm-restock-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      productId,
      productName: target.name,
      type: 'purchase',
      quantity,
      previousStock: target.stock,
      newStock,
      reason: `Restocked ${quantity} ${target.unit}`,
      timestamp,
      performedBy: 'Staff',
    };
    setStockMovements((prev) => [newSm, ...prev]);
    saveStockMovementToFirestore(newSm).catch(console.error);

    if (supplierId) {
      const costTotal = quantity * effectiveCost;
      setSuppliers((prev) =>
        prev.map((s) => {
          if (s.id === supplierId) {
            const updatedSup = {
              ...s,
              totalPurchased: s.totalPurchased + costTotal,
              lastOrderDate: timestamp,
            };
            saveSupplierToFirestore(updatedSup).catch(console.error);
            return updatedSup;
          }
          return s;
        })
      );
    }
    triggerSheetsBackup({
      upserts: {
        products: [productId],
        stockMovements: [newSm.id],
        ...(supplierId ? { suppliers: [supplierId] } : {}),
      },
    });
  };

  const deleteProduct = (id: string): boolean => {
    if (!permissions.canManageInventory) return false;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    deleteProductFromFirestore(id).catch(console.error);
    triggerSheetsBackup({ deletes: { products: [id] } });
    return true;
  };

  const addCustomer = (customerData: Omit<Customer, 'id' | 'totalSpent'>): Customer => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      totalSpent: 0,
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    saveCustomerToFirestore(newCustomer).catch(console.error);
    triggerSheetsBackup({ upserts: { customers: [newCustomer.id] } });
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          saveCustomerToFirestore(updated).catch(console.error);
          return updated;
        }
        return c;
      })
    );
    triggerSheetsBackup({ upserts: { customers: [id] } });
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
    const updatedDebt = Math.max(0, customer.outstandingDebt - actualAmount);

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              outstandingDebt: updatedDebt,
            }
          : c
      )
    );
    saveCustomerToFirestore({
      ...customer,
      outstandingDebt: updatedDebt,
    }).catch(console.error);

    // Increase target account
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === accountId) {
          const updatedAcc = { ...acc, balance: acc.balance + actualAmount };
          saveAccountToFirestore(updatedAcc).catch(console.error);
          return updatedAcc;
        }
        return acc;
      })
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
    triggerSheetsBackup({ upserts: { customers: [customerId], accounts: [accountId] } });
  };

  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'totalPurchased'>): Supplier => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `sup-${Date.now()}`,
      totalPurchased: 0,
    };
    setSuppliers((prev) => [newSupplier, ...prev]);
    saveSupplierToFirestore(newSupplier).catch(console.error);
    triggerSheetsBackup({ upserts: { suppliers: [newSupplier.id] } });
    return newSupplier;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, ...updates };
          saveSupplierToFirestore(updated).catch(console.error);
          return updated;
        }
        return s;
      })
    );
    triggerSheetsBackup({ upserts: { suppliers: [id] } });
  };

  const paySupplier = (
    supplierId: string,
    amount: number,
    accountId: string,
    notes?: string
  ) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!supplier) return;

    const updatedOwed = Math.max(0, supplier.amountOwed - amount);
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === supplierId
          ? {
              ...s,
              amountOwed: updatedOwed,
            }
          : s
      )
    );
    saveSupplierToFirestore({
      ...supplier,
      amountOwed: updatedOwed,
    }).catch(console.error);

    // Deduct from account
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === accountId) {
          const updatedAcc = { ...acc, balance: Math.max(0, acc.balance - amount) };
          saveAccountToFirestore(updatedAcc).catch(console.error);
          return updatedAcc;
        }
        return acc;
      })
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
    saveExpenseToFirestore(newExpense).catch(console.error);
    triggerSheetsBackup({
      upserts: {
        suppliers: [supplierId],
        accounts: [accountId],
        expenses: [newExpense.id],
      },
    });
  };

  const addExpense = (expenseData: Omit<Expense, 'id' | 'timestamp'>): Expense => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    // Deduct from account
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === newExpense.accountId) {
          const updatedAcc = { ...acc, balance: Math.max(0, acc.balance - newExpense.amount) };
          saveAccountToFirestore(updatedAcc).catch(console.error);
          return updatedAcc;
        }
        return acc;
      })
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
    saveExpenseToFirestore(newExpense).catch(console.error);
    triggerSheetsBackup({
      upserts: {
        expenses: [newExpense.id],
        accounts: [newExpense.accountId],
      },
    });
    return newExpense;
  };

  const deleteExpense = (id: string): boolean => {
    if (!permissions.canDeleteTransactions) return false;
    const exp = expenses.find((e) => e.id === id);
    if (!exp) return false;

    // Refund to account
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === exp.accountId) {
          const updatedAcc = { ...acc, balance: acc.balance + exp.amount };
          saveAccountToFirestore(updatedAcc).catch(console.error);
          return updatedAcc;
        }
        return acc;
      })
    );

    setExpenses((prev) => prev.filter((e) => e.id !== id));
    deleteExpenseFromFirestore(id).catch(console.error);
    triggerSheetsBackup({
      upserts: { accounts: [exp.accountId] },
      deletes: { expenses: [id] },
    });
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
          const updatedAcc = { ...acc, balance: Math.max(0, acc.balance - amount) };
          saveAccountToFirestore(updatedAcc).catch(console.error);
          return updatedAcc;
        }
        if (acc.id === toAccountId) {
          const updatedAcc = { ...acc, balance: acc.balance + amount };
          saveAccountToFirestore(updatedAcc).catch(console.error);
          return updatedAcc;
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
    triggerSheetsBackup({ upserts: { accounts: [fromAccountId, toAccountId] } });
  };

  const addAccount = (accountData: Omit<Account, 'id'>): Account => {
    const newAccount: Account = {
      ...accountData,
      id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setAccounts((prev) => [...prev, newAccount]);
    saveAccountToFirestore(newAccount).catch(console.error);
    triggerSheetsBackup({ upserts: { accounts: [newAccount.id] } });
    return newAccount;
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === id) {
          const updated = { ...acc, ...updates };
          saveAccountToFirestore(updated).catch(console.error);
          return updated;
        }
        return acc;
      })
    );
    triggerSheetsBackup({ upserts: { accounts: [id] } });
  };

  const deleteAccount = (id: string): boolean => {
    if (accounts.length <= 1) return false;
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    deleteAccountFromFirestore(id).catch(console.error);
    triggerSheetsBackup({ deletes: { accounts: [id] } });
    return true;
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
    saveEmployeeToFirestore(newEmp).catch(console.error);
    triggerSheetsBackup({ upserts: { employees: [newEmp.id] } });
    return newEmp;
  };

  const updateEmployee = (id: string, updates: Partial<Employee>, skipSheetsBackup = false) => {
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
          saveEmployeeToFirestore(updated).catch(console.error);
          return updated;
        }
        return emp;
      })
    );
    if (!skipSheetsBackup) {
      triggerSheetsBackup({ upserts: { employees: [id] } });
    }
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
    deleteEmployeeFromFirestore(id).catch(console.error);
    triggerSheetsBackup({ deletes: { employees: [id] } });
    return true;
  };

  // Staff Authentication Methods
  const loginWithPin = (
    pin: string,
    identifierOrId?: string
  ): { success: boolean; message?: string; matchesCount?: number } => {
    const cleanPin = String(pin).trim();
    if (!cleanPin) {
      return { success: false, message: 'Please enter your 4-digit staff PIN.' };
    }

    if (employees.length === 0) {
      if (sheetsSyncStatus === 'syncing') {
        return { success: false, message: 'Connecting to database. Please wait a moment...' };
      }
      return { success: false, message: 'No staff accounts configured. Please initialize store owner.' };
    }

    let matched: Employee | undefined;
    if (identifierOrId && identifierOrId.trim()) {
      const cleanIdent = identifierOrId.trim().toLowerCase();
      matched = employees.find((e) => {
        const idMatch = e.id ? String(e.id).toLowerCase() === cleanIdent : false;
        const emailMatch = e.email ? String(e.email).toLowerCase() === cleanIdent : false;
        const nameMatch = e.name ? String(e.name).toLowerCase() === cleanIdent : false;
        const empPin = e.pin !== undefined && e.pin !== null ? String(e.pin).trim() : '1234';
        const pinMatch = empPin === cleanPin;
        return (idMatch || emailMatch || nameMatch) && pinMatch;
      });

      if (!matched) {
        return { success: false, message: 'Incorrect PIN or employee identifier.' };
      }
    } else {
      const matchingEmployees = employees.filter((e) => {
        const empPin = e.pin !== undefined && e.pin !== null ? String(e.pin).trim() : '1234';
        return empPin === cleanPin;
      });

      if (matchingEmployees.length === 0) {
        return { success: false, message: 'Incorrect PIN. Please try again.' };
      }

      if (matchingEmployees.length > 1) {
        return {
          success: false,
          matchesCount: matchingEmployees.length,
          message: 'Multiple accounts share this default PIN. Please enter your work email or use Password login.',
        };
      }

      matched = matchingEmployees[0];
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
    const lastLoginTs = matched.lastLogin ? new Date(matched.lastLogin).getTime() : 0;
    if (!lastLoginTs || Date.now() - lastLoginTs > 15 * 60 * 1000) {
      updateEmployee(updatedUser.id, { lastLogin: updatedUser.lastLogin }, true);
    }

    return { success: true };
  };

  const loginWithCredentials = (
    identifier: string,
    passwordOrPin: string
  ): { success: boolean; message?: string } => {
    const idClean = identifier.trim().toLowerCase();
    const passClean = String(passwordOrPin).trim();

    if (!idClean) {
      return { success: false, message: 'Please enter your work email or username.' };
    }
    if (!passClean) {
      return { success: false, message: 'Please enter your account password or PIN.' };
    }

    if (employees.length === 0) {
      if (sheetsSyncStatus === 'syncing') {
        return { success: false, message: 'Connecting to database. Please wait a moment...' };
      }
      return { success: false, message: 'No staff accounts configured. Please initialize store owner.' };
    }

    const matched = employees.find((e) => {
      const emailMatch = e.email ? String(e.email).toLowerCase() === idClean : false;
      const nameMatch = e.name ? String(e.name).toLowerCase() === idClean : false;
      const phoneStr = e.phone !== undefined && e.phone !== null ? String(e.phone).trim() : '';
      const phoneDigits = phoneStr.replace(/\D/g, '');
      const idDigits = idClean.replace(/\D/g, '');
      const phoneMatch = phoneDigits && idDigits ? phoneDigits === idDigits : false;
      const idMatch = e.id ? String(e.id).toLowerCase() === idClean : false;
      return emailMatch || nameMatch || phoneMatch || idMatch;
    });

    if (!matched) {
      return { success: false, message: 'Invalid credentials. Please verify your details.' };
    }

    if (matched.status === 'suspended') {
      return {
        success: false,
        message: 'Account is suspended. Please contact the store owner.',
      };
    }

    const matchedPassword = matched.password !== undefined && matched.password !== null ? String(matched.password).trim() : '';
    const matchedPin = matched.pin !== undefined && matched.pin !== null ? String(matched.pin).trim() : '';

    const isMatch =
      (matchedPassword && matchedPassword === passClean) ||
      (matchedPin && matchedPin === passClean) ||
      (!matchedPassword && !matchedPin && (passClean === 'password' || passClean === '1234'));

    if (!isMatch) {
      return { success: false, message: 'Invalid credentials. Please verify your details.' };
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
    const lastLoginTsCred = matched.lastLogin ? new Date(matched.lastLogin).getTime() : 0;
    if (!lastLoginTsCred || Date.now() - lastLoginTsCred > 15 * 60 * 1000) {
      updateEmployee(updatedUser.id, { lastLogin: updatedUser.lastLogin }, true);
    }

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
    const lastLoginTsSwitch = matched.lastLogin ? new Date(matched.lastLogin).getTime() : 0;
    if (!lastLoginTsSwitch || Date.now() - lastLoginTsSwitch > 15 * 60 * 1000) {
      updateEmployee(updatedUser.id, { lastLogin: updatedUser.lastLogin }, true);
    }
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
    const cleanPin = String(pin).trim();
    if (!currentUser) {
      return loginWithPin(cleanPin);
    }
    const currentPin = currentUser.pin !== undefined && currentUser.pin !== null ? String(currentUser.pin).trim() : '1234';
    const isMatch = currentPin === cleanPin;
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
          const updatedEmp = {
            ...emp,
            attendanceStatus: nextStatus,
            lastClockIn: nextStatus === 'present' ? new Date().toISOString() : emp.lastClockIn,
          };
          saveEmployeeToFirestore(updatedEmp).catch(console.error);
          return updatedEmp;
        }
        return emp;
      })
    );
    triggerSheetsBackup({ upserts: { employees: [employeeId] } });
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
        language,
        setLanguage,
        t,
        currentRole,
        setCurrentRole,
        permissions,
        // Firebase Firestore Main Database
        firebaseSyncStatus,
        firebaseLastSyncedAt,
        firebaseError,
        isFirebaseMainDb: true,
        retryFirebaseConnection,
        syncAllToFirebaseNow,
        backupToSheetsNow: pushToSheetsNow,
        // Google Sheets Backup
        sheetsUrl,
        setSheetsUrl,
        sheetsSyncStatus,
        isInitialSyncLoading,
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
        manualInvoices,
        quotations,
        purchaseOrders,
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
        generateManualInvoiceNumber,
        addManualInvoice,
        updateManualInvoice,
        deleteManualInvoice,
        addQuotation,
        updateQuotation,
        deleteQuotation,
        convertQuotationToSale,
        addPurchaseOrder,
        updatePurchaseOrder,
        deletePurchaseOrder,
        receivePurchaseOrder,
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
        addAccount,
        updateAccount,
        deleteAccount,
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
