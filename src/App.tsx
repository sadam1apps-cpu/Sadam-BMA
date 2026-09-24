import React, { useState } from 'react';
import { BusinessProvider, useBusiness } from './context/BusinessContext';
import { Header } from './components/layout/Header';
import { IconNavBar } from './components/layout/IconNavBar';
import { NotificationsModal } from './components/layout/NotificationsModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { SalesView } from './components/sales/SalesView';
import { InventoryView } from './components/inventory/InventoryView';
import { CustomersView } from './components/customers/CustomersView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { EmployeesView } from './components/employees/EmployeesView';
import { CashBankView } from './components/finance/CashBankView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';

// Modals
import { NewSaleModal } from './components/sales/NewSaleModal';
import { InvoiceReceiptModal } from './components/sales/InvoiceReceiptModal';
import { ProductModal } from './components/inventory/ProductModal';
import { RestockModal } from './components/inventory/RestockModal';
import { CustomerModal } from './components/customers/CustomerModal';
import { DebtPaymentModal } from './components/customers/DebtPaymentModal';
import { SupplierModal } from './components/suppliers/SupplierModal';
import { PaySupplierModal } from './components/suppliers/PaySupplierModal';
import { ExpenseModal } from './components/expenses/ExpenseModal';
import { EmployeeModal } from './components/employees/EmployeeModal';
import { TransferModal } from './components/finance/TransferModal';
import { LoginModal } from './components/auth/LoginModal';

import { Product, Customer, Supplier, Sale } from './types';
import { ShieldAlert } from 'lucide-react';

function BusinessApp() {
  const {
    activeNavTab,
    setActiveNavTab,
    products,
    sales,
    currentUser,
    currentRole,
    permissions,
    isScreenLocked,
    isLoginModalOpen,
    setIsLoginModalOpen,
  } = useBusiness();

  // Navigation & Layout States
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Modal States
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [receiptSaleId, setReceiptSaleId] = useState<string | null>(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProductBarcode, setNewProductBarcode] = useState<string | undefined>(undefined);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [debtCollectingCustomer, setDebtCollectingCustomer] = useState<Customer | null>(null);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Helper handlers
  const handleOpenReceipt = (saleId: string) => {
    setReceiptSaleId(saleId);
  };

  const handleQuickRestock = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      setRestockProduct(prod);
    }
  };

  const selectedReceiptSale = sales.find((s) => s.id === receiptSaleId) || null;

  // Unauthenticated or Locked Screen state
  if (!currentUser) {
    return <LoginModal fullScreen isOpen={true} />;
  }

  if (isScreenLocked) {
    return <LoginModal fullScreen isOpen={true} />;
  }

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* Top Header with Store Brand, Role Switcher, Alerts, Quick Sale */}
      <Header
        onOpenNewSale={() => setIsNewSaleOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Top Icon Navigation Bar (Replacing side menu with direct icons) */}
      <IconNavBar />

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden w-full">
        <main className="flex-1 min-h-0 p-2 sm:p-4 lg:p-6 max-w-7xl mx-auto w-full flex flex-col overflow-hidden">
          {activeNavTab === 'dashboard' && (
            <DashboardView
              onOpenNewSale={() => setIsNewSaleOpen(true)}
              onOpenNewExpense={() => setIsExpenseModalOpen(true)}
              onOpenNewProduct={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              onOpenInvoiceReceipt={handleOpenReceipt}
              onQuickRestock={handleQuickRestock}
            />
          )}

          {activeNavTab === 'sales' && (
            <SalesView
              onOpenNewSale={() => setIsNewSaleOpen(true)}
              onOpenReceipt={handleOpenReceipt}
            />
          )}

          {activeNavTab === 'inventory' && (
            <InventoryView
              onOpenNewProduct={(initialBarcode?: string) => {
                setEditingProduct(null);
                setNewProductBarcode(initialBarcode);
                setIsProductModalOpen(true);
              }}
              onEditProduct={(p) => {
                setEditingProduct(p);
                setNewProductBarcode(undefined);
                setIsProductModalOpen(true);
              }}
              onQuickRestock={handleQuickRestock}
            />
          )}

          {activeNavTab === 'customers' && (
            <CustomersView
              onOpenNewCustomer={() => {
                setEditingCustomer(null);
                setIsCustomerModalOpen(true);
              }}
              onEditCustomer={(c) => {
                setEditingCustomer(c);
                setIsCustomerModalOpen(true);
              }}
              onCollectDebt={(c) => setDebtCollectingCustomer(c)}
            />
          )}

          {activeNavTab === 'suppliers' && (
            <SuppliersView
              onOpenNewSupplier={() => {
                setEditingSupplier(null);
                setIsSupplierModalOpen(true);
              }}
              onEditSupplier={(s) => {
                setEditingSupplier(s);
                setIsSupplierModalOpen(true);
              }}
              onPaySupplier={(s) => setPayingSupplier(s)}
            />
          )}

          {activeNavTab === 'expenses' && (
            <ExpensesView onOpenNewExpense={() => setIsExpenseModalOpen(true)} />
          )}

          {activeNavTab === 'employees' && (
            <EmployeesView onOpenNewEmployee={() => setIsEmployeeModalOpen(true)} />
          )}

          {(activeNavTab === 'cash_bank' || (activeNavTab as any) === 'cashbank') && (
            <CashBankView onOpenTransfer={() => setIsTransferModalOpen(true)} />
          )}

          {activeNavTab === 'reports' && <ReportsView />}

          {activeNavTab === 'settings' &&
            (currentRole === 'owner' ||
            permissions.canManageSettings ||
            permissions.canManageDatabase ? (
              <SettingsView />
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md text-center shadow-xs">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">Access Restricted</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Settings and system configuration are restricted to authorized store administrators.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveNavTab('dashboard')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            ))}
        </main>
      </div>

      {/* Global Modals */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <NewSaleModal
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
        onSaleCreated={(sale: Sale) => {
          setReceiptSaleId(sale.id);
        }}
      />

      <InvoiceReceiptModal
        sale={selectedReceiptSale}
        onClose={() => setReceiptSaleId(null)}
      />

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setNewProductBarcode(undefined);
        }}
        productToEdit={editingProduct}
        initialBarcode={newProductBarcode}
        initialSku={newProductBarcode ? `SKU-${newProductBarcode.slice(-4).toUpperCase()}` : undefined}
      />

      {restockProduct && (
        <RestockModal
          product={restockProduct}
          onClose={() => setRestockProduct(null)}
        />
      )}

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customerToEdit={editingCustomer}
      />

      {debtCollectingCustomer && (
        <DebtPaymentModal
          customer={debtCollectingCustomer}
          onClose={() => setDebtCollectingCustomer(null)}
        />
      )}

      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        supplierToEdit={editingSupplier}
      />

      {payingSupplier && (
        <PaySupplierModal
          supplier={payingSupplier}
          onClose={() => setPayingSupplier(null)}
        />
      )}

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />

      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />

      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BusinessProvider>
      <BusinessApp />
    </BusinessProvider>
  );
}
