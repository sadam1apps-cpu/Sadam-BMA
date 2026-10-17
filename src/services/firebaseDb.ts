import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import {db} from './firebase';

// ─────────────────────────────────────────────────────────────
// Collection name map (single source of truth)
// ─────────────────────────────────────────────────────────────
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

export type FirestoreCollectionName =
  (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function stripId<T extends {id?: string}>(item: T): Record<string, any> {
  const {id, ...rest} = item as any;
  return rest;
}

// ─────────────────────────────────────────────────────────────
// Real-time listeners
// ─────────────────────────────────────────────────────────────
export function subscribeToCollection<T extends {id: string}>(
  name: FirestoreCollectionName,
  cb: (items: T[]) => void,
): () => void {
  const colRef = collection(db, name);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => ({id: d.id, ...d.data()})) as T[];
      cb(items);
    },
    (err) => {
      console.error(`[subscribeToCollection] ${name} error:`, err);
    },
  );
}

export function subscribeToDocument<T>(
  name: FirestoreCollectionName,
  docId: string,
  cb: (data: T | null) => void,
): () => void {
  const docRef = doc(db, name, docId);
  return onSnapshot(
    docRef,
    (snap) => {
      cb(snap.exists() ? ({...snap.data()} as T) : null);
    },
    (err) => {
      console.error(`[subscribeToDocument] ${name}/${docId} error:`, err);
    },
  );
}

// ─────────────────────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────────────────────
export async function saveProfileToFirestore(profile: any): Promise<boolean> {
  try {
    await setDoc(doc(db, COLLECTIONS.BUSINESS_PROFILE, 'main'), profile, {
      merge: true,
    });
    return true;
  } catch (e) {
    console.error('saveProfileToFirestore', e);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// Products
// ─────────────────────────────────────────────────────────────
export async function saveProductToFirestore(p: {id: string}): Promise<boolean> {
  try {
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, p.id), stripId(p), {merge: true});
    return true;
  } catch (e) {
    console.error('saveProductToFirestore', e);
    return false;
  }
}

export async function deleteProductFromFirestore(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, id));
    return true;
  } catch (e) {
    console.error('deleteProductFromFirestore', e);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// Sales
// ─────────────────────────────────────────────────────────────
export async function saveSaleToFirestore(s: {id: string}): Promise<boolean> {
  try {
    await setDoc(doc(db, COLLECTIONS.SALES, s.id), stripId(s), {merge: true});
    return true;
  } catch (e) {
    console.error('saveSaleToFirestore', e);
    return false;
  }
}

export async function deleteSaleFromFirestore(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.SALES, id));
    return true;
  } catch (e) {
    console.error('deleteSaleFromFirestore', e);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// Quotations
// ─────────────────────────────────────────────────────────────
export async function saveQuotationToFirestore(q: {id: string}): Promise<boolean> {
  try {
    await setDoc(doc(db, COLLECTIONS.QUOTATIONS, q.id), stripId(q), {merge: true});
    return true;
  } catch (e) {
    console.error('saveQuotationToFirestore', e);
    return false;
  }
}

export async function deleteQuotationFromFirestore(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.QUOTATIONS, id));
    return true;
  } catch (e) {
    console.error('deleteQuotationFromFirestore', e);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// Purchase Orders
// ─────────────────────────────────────────────────────────────
export async function savePurchaseOrderToFirestore(po: {id: string}): Promise<boolean> {
  try {
    await setDoc(doc(db, COLLECTIONS.PURCHASE_ORDERS, po.id), stripId(po), {
      merge: true,
    });
    return true;
  } catch (e) {
    console.error('savePurchaseOrderToFirestore', e);
    return false;
  }
}

export async function deletePurchaseOrderFromFirestore(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.PURCHASE_ORDERS, id));
    return true;
  } catch (e) {
    console.error('deletePurchaseOrderFromFirestore', e);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// Customers
// ─────────────────────────────────────────────────────────────
export async function saveCustomerToFirestore(c: {id: string}): Promise<boolean> {
  try {
    await setDoc(doc(db, COLLECTIONS.CUSTOMERS, c.id), stripId(c), {merge: true});
    return true;
  } catch (e) {
    console.error('saveCustomerToFirestore', e);
    return false;
  }
}

export async function deleteCustomerFromFirestore(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.CUSTOMERS, id));
    return true;
  } catch (e) {
    console.error('deleteCustomerFromFirestore', e);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// Suppliers
// ─────────────────────────────────────────────────────────────
export async function saveSupplierToFirestore(s: {id: string}): Promise<boolean> {
  try {
    await setDoc(doc(db, COLLECTIONS.SUPPLIERS, s.id), stripId(s), {merge: true});
    return true;
  } catch (e) {
    console.error('saveSupplierToFirestore', e);
    return false;
  }
}

export async function deleteSupplierFromFirestore(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.SUPPLIERS, id));
    return true;
  } catch (e) {
    console.error('deleteSupplierFromFirestore', e);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// Expenses
// ─────────────────────────────────────────────────────────────
export async function saveExpenseToFirestore(e: {id: string}): Promise<boolean> {
  try {
    await setDoc(doc(db, COLLECTIONS.EXPENSES, e.id), stripId(e), {merge: true});
    return true;
  } catch (err) {
    console.error('saveExpenseToFirestore', err);
    return false;
  }
}

export async function deleteExpenseFromFirestore(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.EXPENSES, id));
    return true;
  } catch (e) {
    console.error('deleteExpenseFromFirestore', e);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// Employees
// ─────────────────────────────────────────────────────────────
export async function saveEmployeeToFirestore(emp: {id: string}): Promise<boolean> {
  try {
    await setDoc(doc(db, COLLECTIONS.EMPLOYEES, emp.id), stripId(emp), {
      merge: true,
    });
    return true;
  } catch (e) {
    console.error('saveEmployeeToFirestore', e);
    return false;
  }
}

export async function deleteEmployeeFromFirestore(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.EMPLOYEES, id));
    return true;
  } catch (e) {
    console.error('deleteEmployeeFromFirestore', e);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// Accounts
// ─────────────────────────────────────────────────────────────
export async function saveAccountToFirestore(a: {id: string}): Promise<boolean> {
  try {
    await setDoc(doc(db, COLLECTIONS.ACCOUNTS, a.id), stripId(a), {merge: true});
    return true;
  } catch (e) {
    console.error('saveAccountToFirestore', e);
    return false;
  }
}

export async function deleteAccountFromFirestore(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.ACCOUNTS, id));
    return true;
  } catch (e) {
    console.error('deleteAccountFromFirestore', e);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// Stock Movements
// ─────────────────────────────────────────────────────────────
export async function saveStockMovementToFirestore(sm: {id: string}): Promise<boolean> {
  try {
    await setDoc(doc(db, COLLECTIONS.STOCK_MOVEMENTS, sm.id), stripId(sm), {
      merge: true,
    });
    return true;
  } catch (e) {
    console.error('saveStockMovementToFirestore', e);
    return false;
  }
}

export async function deleteStockMovementFromFirestore(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.STOCK_MOVEMENTS, id));
    return true;
  } catch (e) {
    console.error('deleteStockMovementFromFirestore', e);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// One-shot fetch (kept for compatibility)
// ─────────────────────────────────────────────────────────────
export async function fetchCollection<T = any>(
  name: FirestoreCollectionName,
): Promise<T[]> {
  try {
    const snap = await getDocs(collection(db, name));
    return snap.docs.map((d) => ({id: d.id, ...d.data()})) as T[];
  } catch (e) {
    console.error(`fetchCollection(${name})`, e);
    return [];
  }
}

export async function fetchDocument<T = any>(
  name: FirestoreCollectionName,
  docId: string,
): Promise<T | null> {
  try {
    const snap = await getDoc(doc(db, name, docId));
    return snap.exists() ? ({...snap.data()} as T) : null;
  } catch (e) {
    console.error(`fetchDocument(${name}/${docId})`, e);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Seeding (used on first run)
// ─────────────────────────────────────────────────────────────
export async function seedInitialFirestoreData(payload: {
  profile?: any;
  products?: any[];
  customers?: any[];
  suppliers?: any[];
  employees?: any[];
  accounts?: any[];
}): Promise<boolean> {
  try {
    const batch = writeBatch(db);
    if (payload.profile) {
      batch.set(
        doc(db, COLLECTIONS.BUSINESS_PROFILE, 'main'),
        payload.profile,
        {merge: true},
      );
    }
    (payload.products || []).forEach((p) =>
      batch.set(doc(db, COLLECTIONS.PRODUCTS, p.id), stripId(p), {merge: true}),
    );
    (payload.customers || []).forEach((c) =>
      batch.set(doc(db, COLLECTIONS.CUSTOMERS, c.id), stripId(c), {merge: true}),
    );
    (payload.suppliers || []).forEach((s) =>
      batch.set(doc(db, COLLECTIONS.SUPPLIERS, s.id), stripId(s), {merge: true}),
    );
    (payload.employees || []).forEach((e) =>
      batch.set(doc(db, COLLECTIONS.EMPLOYEES, e.id), stripId(e), {merge: true}),
    );
    (payload.accounts || []).forEach((a) =>
      batch.set(doc(db, COLLECTIONS.ACCOUNTS, a.id), stripId(a), {merge: true}),
    );
    await batch.commit();
    return true;
  } catch (e) {
    console.error('seedInitialFirestoreData', e);
    return false;
  }
}