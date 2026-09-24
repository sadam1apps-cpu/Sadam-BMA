export type UserRole = 'owner' | 'manager' | 'cashier' | 'inventory_clerk';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 4,
  manager: 3,
  inventory_clerk: 2,
  cashier: 1,
};

export interface RolePermissions {
  canViewProfits: boolean;
  canDeleteTransactions: boolean;
  canViewExpenses: boolean;
  canManageInventory: boolean;
  canManageEmployees: boolean;
  canViewBankBalances: boolean;
  canRecordSales: boolean;
  canRecordExpenses: boolean;
  canGiveDiscounts: boolean;
  canViewReports: boolean;
  canManageDatabase: boolean;
  canManageSettings: boolean;
}

export interface BusinessProfile {
  name: string;
  businessName?: string;
  ownerName?: string;
  tagline: string;
  currency: string;
  phone: string;
  email: string;
  address: string;
  taxRate: number; // e.g., 5 for 5%
  invoiceFooter?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStockAlert: number;
  unit: string;
  barcode?: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'sale' | 'purchase' | 'adjustment' | 'return';
  quantity: number; // positive or negative
  previousStock: number;
  newStock: number;
  reason: string;
  timestamp: string;
  performedBy: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'pos_card' | 'credit';
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  timestamp: string; // ISO date string
  cashierName: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  outstandingDebt: number;
  creditLimit: number;
  totalSpent: number;
  lastPurchaseDate?: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  category: string;
  amountOwed: number;
  totalPurchased: number;
  lastOrderDate?: string;
}

export interface Expense {
  id: string;
  title: string;
  category: 'rent' | 'salaries' | 'transport' | 'utilities' | 'supplies' | 'marketing' | 'maintenance' | 'other';
  amount: number;
  accountId: string; // account from which cash/bank was paid
  paidTo?: string;
  timestamp: string;
  recordedBy: string;
  notes?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  email: string;
  monthlySalary: number;
  commissionRate: number; // e.g. 2 for 2%
  attendanceStatus: 'present' | 'absent' | 'late' | 'off';
  lastClockIn?: string;
  joinedDate: string;
  // User Login & Customizable Security
  pin?: string;                    // 4-digit quick login PIN (e.g. '1234')
  password?: string;               // Password for standard email login
  status?: 'active' | 'suspended'; // Account state
  customPermissions?: Partial<RolePermissions>; // Granular customized permissions
  lastLogin?: string;              // ISO timestamp of last login
}

export const PERMISSION_METADATA: Record<
  keyof RolePermissions,
  { label: string; description: string; category: 'financial' | 'pos' | 'inventory' | 'management' }
> = {
  canViewProfits: {
    label: 'View Profits & Margins',
    description: 'See estimated daily profits, product margins, and markup rates.',
    category: 'financial',
  },
  canViewExpenses: {
    label: 'View Expenses',
    description: 'Inspect business operating expense history and category breakdown.',
    category: 'financial',
  },
  canViewBankBalances: {
    label: 'View Cash & Bank Balances',
    description: 'Access physical cash drawer balances, bank accounts, and transfers.',
    category: 'financial',
  },
  canRecordSales: {
    label: 'Process POS Sales',
    description: 'Create new invoices, process customer checkouts, and print receipts.',
    category: 'pos',
  },
  canGiveDiscounts: {
    label: 'Apply Discounts',
    description: 'Apply percentage or fixed cash discounts during checkout.',
    category: 'pos',
  },
  canDeleteTransactions: {
    label: 'Delete Invoices & Transactions',
    description: 'Permanently remove or void completed sales and logged expenses.',
    category: 'pos',
  },
  canManageInventory: {
    label: 'Manage Products & Stock',
    description: 'Add new items, adjust prices, edit barcode/SKU, and restock supplies.',
    category: 'inventory',
  },
  canManageEmployees: {
    label: 'Manage Staff Logins & Permissions',
    description: 'Create employee accounts, reset PINs/passwords, and customize role permissions.',
    category: 'management',
  },
  canRecordExpenses: {
    label: 'Log New Expenses',
    description: 'Record operating expenses, utility payments, and payouts from cash till.',
    category: 'financial',
  },
  canViewReports: {
    label: 'Access Financial Reports',
    description: 'View deep monthly reporting, top-selling items, and profit/loss statements.',
    category: 'management',
  },
  canManageDatabase: {
    label: 'Sheets Database Access',
    description: 'Connect, synchronize, view schemas, and manage the central Google Sheets database.',
    category: 'management',
  },
  canManageSettings: {
    label: 'Store Profile & Settings',
    description: 'Configure store name, address, tax rate, and receipt currency parameters.',
    category: 'management',
  },
};

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  owner: {
    canViewProfits: true,
    canDeleteTransactions: true,
    canViewExpenses: true,
    canManageInventory: true,
    canManageEmployees: true,
    canViewBankBalances: true,
    canRecordSales: true,
    canRecordExpenses: true,
    canGiveDiscounts: true,
    canViewReports: true,
    canManageDatabase: true,
    canManageSettings: true,
  },
  manager: {
    canViewProfits: true,
    canDeleteTransactions: false,
    canViewExpenses: true,
    canManageInventory: true,
    canManageEmployees: true,
    canViewBankBalances: true,
    canRecordSales: true,
    canRecordExpenses: true,
    canGiveDiscounts: true,
    canViewReports: true,
    canManageDatabase: false, // SheetsDB is strictly restricted to Owner / Admin
    canManageSettings: true,
  },
  cashier: {
    canViewProfits: false,
    canDeleteTransactions: false,
    canViewExpenses: false,
    canManageInventory: false,
    canManageEmployees: false,
    canViewBankBalances: false,
    canRecordSales: true,
    canRecordExpenses: false,
    canGiveDiscounts: true,
    canViewReports: false,
    canManageDatabase: false,
    canManageSettings: false,
  },
  inventory_clerk: {
    canViewProfits: false,
    canDeleteTransactions: false,
    canViewExpenses: false,
    canManageInventory: true,
    canManageEmployees: false,
    canViewBankBalances: false,
    canRecordSales: false,
    canRecordExpenses: false,
    canGiveDiscounts: false,
    canViewReports: false,
    canManageDatabase: false,
    canManageSettings: false,
  },
};

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'mobile_money';
  accountNumber?: string;
  balance: number;
  currency: string;
}

export interface AccountTransaction {
  id: string;
  accountId: string;
  type: 'inflow' | 'outflow' | 'transfer';
  amount: number;
  balanceAfter: number;
  category: string;
  description: string;
  timestamp: string;
  referenceId?: string;
}

export interface NotificationAlert {
  id: string;
  type: 'low_stock' | 'overdue_debt' | 'unpaid_invoice' | 'expense_alert' | 'system';
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  read: boolean;
  actionTarget?: {
    tab: 'sales' | 'inventory' | 'customers' | 'suppliers' | 'expenses' | 'cashbank';
    id?: string;
  };
}
