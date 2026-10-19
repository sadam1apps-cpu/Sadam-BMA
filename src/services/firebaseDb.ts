/**
 * Firebase Firestore Service - Primary Database Integration
 * Manages collections, real-time listeners, persistent mutations,
 * and initial seeding for the business management application.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  Account,
  BusinessProfile,
  Customer,
  Employee,
  Expense,
  Product,
  PurchaseOrder,
  Quotation,
  Sale,
  StockMovement,
  Supplier,
} from '../types';

export const COLLECTIONS = {
  BUSINESS_PROFILE: 'businessProfile',
  PRODUCTS: 'products',
  SALES: 'sales',
  QUOTATIONS: 'quotations',
  PURCHASE_ORDERS: 'purchaseOrders',
  CUSTOMERS: 'customers',
  SUPPLIERS: 'suppliers',
  EXPENSES: 'expenses',
  EMPLOYEES: 'employees',
  ACCOUNTS: 'accounts',
  STOCK_MOVEMENTS: 'stockMovements',
} as const;

export interface FirestoreDatabaseState {
  profile: BusinessProfile | null;
  products: Product[];
  sales: Sale[];
  quotations: Quotation[];
  purchaseOrders: PurchaseOrder[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  employees: Employee[];
  accounts: Account[];
  stockMovements: StockMovement[];
}

/**
 * Remove undefined values from an object before saving to Firestore,
 * as Firestore throws when encounter undefined fields.
 */
export function cleanForFirestore<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) {
      // If field is barcode, normalize to empty string so it is valid in Firestore schema
      if (key === 'barcode') {
        result[key] = '';
      }
      continue;
    }
    if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      result[key] = cleanForFirestore(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

// ==========================================
// PROFILE
// ==========================================
export async function saveProfileToFirestore(profile: BusinessProfile): Promise<void> {
  const path = `${COLLECTIONS.BUSINESS_PROFILE}/main`;
  try {
    const cleaned = cleanForFirestore({
      ...profile,
      id: 'main',
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, COLLECTIONS.BUSINESS_PROFILE, 'main'), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ==========================================
// PRODUCTS
// ==========================================
export async function saveProductToFirestore(product: Product): Promise<void> {
  const path = `${COLLECTIONS.PRODUCTS}/${product.id}`;
  try {
    const safeProduct: Product = {
      ...product,
      barcode: product.barcode !== undefined && product.barcode !== null ? String(product.barcode).trim() : '',
    };
    const cleaned = cleanForFirestore(safeProduct);
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, product.id), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const path = `${COLLECTIONS.PRODUCTS}/${productId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// SALES
// ==========================================
export async function saveSaleToFirestore(sale: Sale): Promise<void> {
  const path = `${COLLECTIONS.SALES}/${sale.id}`;
  try {
    const cleaned = cleanForFirestore(sale);
    await setDoc(doc(db, COLLECTIONS.SALES, sale.id), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSaleFromFirestore(saleId: string): Promise<void> {
  const path = `${COLLECTIONS.SALES}/${saleId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.SALES, saleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// QUOTATIONS
// ==========================================
export async function saveQuotationToFirestore(quotation: Quotation): Promise<void> {
  const path = `${COLLECTIONS.QUOTATIONS}/${quotation.id}`;
  try {
    const cleaned = cleanForFirestore(quotation);
    await setDoc(doc(db, COLLECTIONS.QUOTATIONS, quotation.id), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteQuotationFromFirestore(quotationId: string): Promise<void> {
  const path = `${COLLECTIONS.QUOTATIONS}/${quotationId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.QUOTATIONS, quotationId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// PURCHASE ORDERS
// ==========================================
export async function savePurchaseOrderToFirestore(po: PurchaseOrder): Promise<void> {
  const path = `${COLLECTIONS.PURCHASE_ORDERS}/${po.id}`;
  try {
    const cleaned = cleanForFirestore(po);
    await setDoc(doc(db, COLLECTIONS.PURCHASE_ORDERS, po.id), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePurchaseOrderFromFirestore(poId: string): Promise<void> {
  const path = `${COLLECTIONS.PURCHASE_ORDERS}/${poId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.PURCHASE_ORDERS, poId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// CUSTOMERS
// ==========================================
export async function saveCustomerToFirestore(customer: Customer): Promise<void> {
  const path = `${COLLECTIONS.CUSTOMERS}/${customer.id}`;
  try {
    const cleaned = cleanForFirestore(customer);
    await setDoc(doc(db, COLLECTIONS.CUSTOMERS, customer.id), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ==========================================
// SUPPLIERS
// ==========================================
export async function saveSupplierToFirestore(supplier: Supplier): Promise<void> {
  const path = `${COLLECTIONS.SUPPLIERS}/${supplier.id}`;
  try {
    const cleaned = cleanForFirestore(supplier);
    await setDoc(doc(db, COLLECTIONS.SUPPLIERS, supplier.id), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ==========================================
// EXPENSES
// ==========================================
export async function saveExpenseToFirestore(expense: Expense): Promise<void> {
  const path = `${COLLECTIONS.EXPENSES}/${expense.id}`;
  try {
    const cleaned = cleanForFirestore(expense);
    await setDoc(doc(db, COLLECTIONS.EXPENSES, expense.id), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteExpenseFromFirestore(expenseId: string): Promise<void> {
  const path = `${COLLECTIONS.EXPENSES}/${expenseId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.EXPENSES, expenseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// EMPLOYEES
// ==========================================
export async function saveEmployeeToFirestore(employee: Employee): Promise<void> {
  const path = `${COLLECTIONS.EMPLOYEES}/${employee.id}`;
  try {
    const cleaned = cleanForFirestore(employee);
    await setDoc(doc(db, COLLECTIONS.EMPLOYEES, employee.id), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEmployeeFromFirestore(employeeId: string): Promise<void> {
  const path = `${COLLECTIONS.EMPLOYEES}/${employeeId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.EMPLOYEES, employeeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// ACCOUNTS
// ==========================================
export async function saveAccountToFirestore(account: Account): Promise<void> {
  const path = `${COLLECTIONS.ACCOUNTS}/${account.id}`;
  try {
    const cleaned = cleanForFirestore(account);
    await setDoc(doc(db, COLLECTIONS.ACCOUNTS, account.id), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAccountFromFirestore(accountId: string): Promise<void> {
  const path = `${COLLECTIONS.ACCOUNTS}/${accountId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.ACCOUNTS, accountId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// STOCK MOVEMENTS
// ==========================================
export async function saveStockMovementToFirestore(movement: StockMovement): Promise<void> {
  const path = `${COLLECTIONS.STOCK_MOVEMENTS}/${movement.id}`;
  try {
    const cleaned = cleanForFirestore(movement);
    await setDoc(doc(db, COLLECTIONS.STOCK_MOVEMENTS, movement.id), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ==========================================
// BATCH SEEDING INITIAL DATABASE
// ==========================================
export async function seedInitialFirestoreData(data: {
  profile: BusinessProfile;
  products: Product[];
  sales: Sale[];
  quotations?: Quotation[];
  purchaseOrders?: PurchaseOrder[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  employees: Employee[];
  accounts: Account[];
  stockMovements: StockMovement[];
}): Promise<void> {
  try {
    // Check if products collection has any docs
    const existingProducts = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
    if (!existingProducts.empty) {
      console.log('Firestore already contains data, skipping auto-seed.');
      return;
    }

    console.log('Seeding initial business data to Firestore main database...');
    const batch = writeBatch(db);

    // Profile
    const profileRef = doc(db, COLLECTIONS.BUSINESS_PROFILE, 'main');
    batch.set(profileRef, cleanForFirestore({ ...data.profile, id: 'main', updatedAt: new Date().toISOString() }));

    // Products
    for (const p of data.products) {
      batch.set(doc(db, COLLECTIONS.PRODUCTS, p.id), cleanForFirestore(p));
    }

    // Accounts
    for (const a of data.accounts) {
      batch.set(doc(db, COLLECTIONS.ACCOUNTS, a.id), cleanForFirestore(a));
    }

    // Employees
    for (const emp of data.employees) {
      batch.set(doc(db, COLLECTIONS.EMPLOYEES, emp.id), cleanForFirestore(emp));
    }

    // Customers
    for (const c of data.customers) {
      batch.set(doc(db, COLLECTIONS.CUSTOMERS, c.id), cleanForFirestore(c));
    }

    // Suppliers
    for (const s of data.suppliers) {
      batch.set(doc(db, COLLECTIONS.SUPPLIERS, s.id), cleanForFirestore(s));
    }

    // Expenses
    for (const exp of data.expenses) {
      batch.set(doc(db, COLLECTIONS.EXPENSES, exp.id), cleanForFirestore(exp));
    }

    // Sales
    for (const sale of data.sales) {
      batch.set(doc(db, COLLECTIONS.SALES, sale.id), cleanForFirestore(sale));
    }

    // Stock movements
    for (const sm of data.stockMovements) {
      batch.set(doc(db, COLLECTIONS.STOCK_MOVEMENTS, sm.id), cleanForFirestore(sm));
    }

    await batch.commit();
    console.log('Successfully seeded initial data to Firestore database.');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'batch-seed');
  }
}

/**
 * Fetch all documents in a collection once
 */
export async function fetchCollection<T>(collectionName: string): Promise<T[]> {
  try {
    const snap = await getDocs(collection(db, collectionName));
    return snap.docs.map((d) => d.data() as T);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionName);
  }
}

/**
 * Real-time collection listener adhering to error callback standards
 */
export function subscribeToCollection<T>(
  collectionName: string,
  onUpdate: (items: T[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, collectionName),
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => docSnap.data() as T);
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, collectionName);
    }
  );
}

/**
 * Real-time single document listener (e.g. for businessProfile/main)
 */
export function subscribeToDocument<T>(
  collectionName: string,
  docId: string,
  onUpdate: (data: T | null) => void
): Unsubscribe {
  const path = `${collectionName}/${docId}`;
  return onSnapshot(
    doc(db, collectionName, docId),
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as T);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
