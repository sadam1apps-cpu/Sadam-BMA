import {
  Account,
  BusinessProfile,
  Customer,
  Employee,
  Expense,
  NotificationAlert,
  Product,
  Sale,
  StockMovement,
  Supplier,
} from '../types';

/**
 * Clean baseline structures for zero hard-coded mock data.
 * All application records, products, sales, customers, suppliers, expenses,
 * employees, accounts, and profile info are loaded directly from the connected
 * Google Sheets Database.
 */

export const DEFAULT_BRAND_LOGO = '/assets/stech-logo.png';

export const initialBusinessProfile: BusinessProfile = {
  name: 'STech GLOBAL LDA',
  businessName: 'STech GLOBAL LDA',
  tagline: 'CONNECTING TECHNOLOGY, EMPOWERING FUTURES',
  currency: 'MZN ',
  phone: '+258 842879960/843936212',
  email: 'stechglobalbusiness@gmail.com',
  address: 'Pemba Mozambique',
  taxRate: 16,
  invoiceFooter: 'Thank you for your business!',
  logo: DEFAULT_BRAND_LOGO,
};

export const defaultAccounts: Account[] = [
  {
    id: 'acc-cash',
    name: 'Main Cash Drawer Till',
    type: 'cash',
    accountNumber: 'TILL-01',
    balance: 0,
    currency: '$',
    notes: 'Internal physical cash drawer for direct point-of-sale customer cash.',
  },
  {
    id: 'acc-bank',
    name: 'Company Bank Account',
    type: 'bank',
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    branchName: '',
    swiftCode: '',
    ibanOrNib: '',
    balance: 0,
    currency: '$',
    notes: 'Internal company bank account details for wire transfers, client invoice settlements, and official records.',
  },
  {
    id: 'acc-pos',
    name: 'POS Card & Terminal',
    type: 'bank',
    accountNumber: 'POS-01',
    balance: 0,
    currency: '$',
    notes: 'Internal ledger for credit/debit card machine transactions.',
  },
];

export const initialAccounts: Account[] = defaultAccounts;

export const initialProducts: Product[] = [];

export const initialCustomers: Customer[] = [];

export const initialSuppliers: Supplier[] = [];

export const initialEmployees: Employee[] = [];

export const initialSales: Sale[] = [];

export const initialExpenses: Expense[] = [];

export const initialStockMovements: StockMovement[] = [];

export const initialAlerts: NotificationAlert[] = [];
