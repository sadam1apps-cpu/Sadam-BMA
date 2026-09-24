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

export const initialBusinessProfile: BusinessProfile = {
  name: '',
  businessName: '',
  tagline: '',
  currency: '$',
  phone: '',
  email: '',
  address: '',
  taxRate: 0,
  invoiceFooter: 'Thank you for your business!',
};

export const initialAccounts: Account[] = [];

export const initialProducts: Product[] = [];

export const initialCustomers: Customer[] = [];

export const initialSuppliers: Supplier[] = [];

export const initialEmployees: Employee[] = [];

export const initialSales: Sale[] = [];

export const initialExpenses: Expense[] = [];

export const initialStockMovements: StockMovement[] = [];

export const initialAlerts: NotificationAlert[] = [];
