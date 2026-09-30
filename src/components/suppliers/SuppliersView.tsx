import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Supplier, PurchaseOrder } from '../../types';
import {
  Truck,
  Building2,
  Plus,
  Search,
  DollarSign,
  Edit2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  PackageCheck,
  Clock,
  Calendar,
} from 'lucide-react';
import { PurchaseOrderModal } from './PurchaseOrderModal';

interface SuppliersViewProps {
  onOpenNewSupplier: () => void;
  onEditSupplier: (supplier: Supplier) => void;
  onPaySupplier: (supplier: Supplier) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  onOpenNewSupplier,
  onEditSupplier,
  onPaySupplier,
}) => {
  const {
    suppliers,
    purchaseOrders,
    totalPayables,
    deletePurchaseOrder,
    receivePurchaseOrder,
    profile,
    language,
    t,
  } = useBusiness();

  const [viewTab, setViewTab] = useState<'vendors' | 'purchase_orders'>('vendors');
  const [searchTerm, setSearchTerm] = useState('');
  const [poStatusFilter, setPoStatusFilter] = useState<'all' | 'issued' | 'received' | 'draft'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State for Purchase Orders
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Filtered Suppliers
  const filteredSuppliers = suppliers.filter(
    (s) =>
      (s.companyName && String(s.companyName).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.contactPerson && String(s.contactPerson).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.category && String(s.category).toLowerCase().includes(searchTerm.toLowerCase())) ||
      String(s.phone || '').includes(searchTerm)
  );

  // Filtered Purchase Orders
  const filteredPOs = purchaseOrders.filter((po) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      String(po.poNumber || '').toLowerCase().includes(term) ||
      String(po.supplierName || '').toLowerCase().includes(term) ||
      (po.supplierContact && String(po.supplierContact).toLowerCase().includes(term));

    const matchesStatus =
      poStatusFilter === 'all' ? true : po.status === poStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const totalPurchasesValue = suppliers.reduce((acc, s) => acc + s.totalPurchased, 0);
  const totalPOValue = purchaseOrders.reduce((acc, p) => acc + p.total, 0);
  const pendingPOsCount = purchaseOrders.filter((p) => p.status === 'issued' || p.status === 'draft').length;
  const receivedPOsCount = purchaseOrders.filter((p) => p.status === 'received').length;

  // Pagination
  const pageSize = 5;
  const activeItems = viewTab === 'vendors' ? filteredSuppliers : filteredPOs;
  const totalPages = Math.ceil(activeItems.length / pageSize) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const paginatedSuppliers = filteredSuppliers.slice((validPage - 1) * pageSize, validPage * pageSize);
  const paginatedPOs = filteredPOs.slice((validPage - 1) * pageSize, validPage * pageSize);

  const handleOpenPOView = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setIsPOModalOpen(true);
  };

  const handleReceiveStock = (po: PurchaseOrder) => {
    if (confirm(`Receive all stock from PO ${po.poNumber} into inventory?`)) {
      receivePurchaseOrder(po.id);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-2 sm:space-y-3">
      {/* Header with Vendors / Purchase Orders switcher */}
      <div className="bg-white rounded-xl p-2 sm:p-3 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 shrink-0">
        <div className="w-full sm:w-auto">
          {/* Sub-tab segmented control: Vendors vs Purchase Orders */}
          <div className="w-full sm:w-auto grid grid-cols-2 sm:flex p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1">
            <button
              type="button"
              onClick={() => {
                setViewTab('vendors');
                setCurrentPage(1);
              }}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewTab === 'vendors'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span>{language === 'pt' ? 'Fornecedores' : 'Vendors'}</span>
              <span
                className={`inline-flex items-center justify-center px-1.5 py-0.2 sm:px-2 sm:py-0.5 text-[10px] sm:text-[11px] font-extrabold rounded-full transition-colors ${
                  viewTab === 'vendors'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {suppliers.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewTab('purchase_orders');
                setCurrentPage(1);
              }}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewTab === 'purchase_orders'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate sm:hidden">{language === 'pt' ? 'Ordens (PO)' : 'Purchase Orders'}</span>
              <span className="hidden sm:inline">{language === 'pt' ? 'Ordens de Compra (PO)' : 'Purchase Orders (PO)'}</span>
              <span
                className={`inline-flex items-center justify-center px-1.5 py-0.2 sm:px-2 sm:py-0.5 text-[10px] sm:text-[11px] font-extrabold rounded-full transition-colors ${
                  viewTab === 'purchase_orders'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {purchaseOrders.length}
              </span>
            </button>
          </div>
        </div>

        {/* Action Buttons: New PO & Add Supplier */}
        <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setSelectedPO(null);
              setIsPOModalOpen(true);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-bold transition-all cursor-pointer border border-emerald-300 shadow-2xs"
            title="Create a Purchase Order to order goods from suppliers"
          >
            <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{language === 'pt' ? '+ Nova OC' : '+ New PO'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewSupplier}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 shrink-0 text-white" />
            <span className="truncate sm:hidden">{language === 'pt' ? '+ Fornecedor' : '+ Add Supplier'}</span>
            <span className="hidden sm:inline">{language === 'pt' ? 'Adicionar Fornecedor' : 'Add Supplier'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {viewTab === 'vendors' ? (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 shrink-0">
          <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
              {language === 'pt' ? 'Fornecedores' : 'Total Vendors'}
            </span>
            <div className="text-sm sm:text-xl font-black text-slate-900 mt-0.5 sm:mt-1">
              {suppliers.length}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">{language === 'pt' ? 'Fontes ativas' : 'Active sources'}</span>
          </div>

          <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
              {language === 'pt' ? 'A Pagar' : 'Payables Owed'}
            </span>
            <div className="text-sm sm:text-xl font-black text-rose-600 mt-0.5 sm:mt-1 truncate">
              {profile.currency}{totalPayables.toLocaleString()}
            </div>
            <span className="text-[10px] text-rose-600 block truncate">{language === 'pt' ? 'Contas pendentes' : 'Pending bills'}</span>
          </div>

          <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
              {language === 'pt' ? 'Volume de Compras' : 'Purchases Value'}
            </span>
            <div className="text-sm sm:text-xl font-black text-indigo-600 mt-0.5 sm:mt-1 truncate">
              {profile.currency}
              {totalPurchasesValue.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">{language === 'pt' ? 'Total acumulado' : 'Supplies to date'}</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 shrink-0">
          <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
              {language === 'pt' ? 'Volume PO' : 'PO Volume'}
            </span>
            <div className="text-sm sm:text-xl font-black text-slate-900 mt-0.5 sm:mt-1 truncate">
              {profile.currency}{totalPOValue.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">{purchaseOrders.length} {language === 'pt' ? 'ordens' : 'orders'}</span>
          </div>

          <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
              {language === 'pt' ? 'Em Trânsito' : 'Pending Delivery'}
            </span>
            <div className="text-sm sm:text-xl font-black text-sky-600 mt-0.5 sm:mt-1 truncate">
              {pendingPOsCount}
            </div>
            <span className="text-[10px] text-sky-600 block truncate">{language === 'pt' ? 'Aguardando' : 'Awaiting arrival'}</span>
          </div>

          <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
              {language === 'pt' ? 'Estoque Recebido' : 'Received Stock'}
            </span>
            <div className="text-sm sm:text-xl font-black text-emerald-600 mt-0.5 sm:mt-1 truncate">
              {receivedPOsCount}
            </div>
            <span className="text-[10px] text-emerald-600 block truncate">{language === 'pt' ? 'No estoque' : 'Added to inventory'}</span>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              viewTab === 'vendors'
                ? 'Search suppliers by name or category...'
                : 'Search PO # or vendor...'
            }
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {viewTab === 'purchase_orders' && (
          <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All' },
              { id: 'issued', label: 'Issued' },
              { id: 'received', label: 'Received' },
              { id: 'draft', label: 'Draft' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setPoStatusFilter(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer text-center ${
                  poStatusFilter === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex-1 min-h-0 flex flex-col overflow-hidden">
        {viewTab === 'vendors' ? (
          <>
            {/* Mobile View: Vendors Cards */}
            <div className="block sm:hidden flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
              {paginatedSuppliers.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No suppliers found matching search.
                </div>
              ) : (
                paginatedSuppliers.map((sup) => {
                  const hasOwed = sup.amountOwed > 0;

                  return (
                    <div key={sup.id} className="p-2.5 flex flex-col gap-1.5 hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 pr-2 truncate">
                          <span className="font-bold text-xs text-slate-900 truncate block">{sup.companyName}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{sup.contactPerson} • {sup.category}</span>
                        </div>
                        <div>
                          {hasOwed ? (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800">
                              Owe {profile.currency}{sup.amountOwed.toLocaleString()}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700">
                              <CheckCircle2 className="w-3 h-3" /> Paid
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-0.5">
                        <span className="text-slate-500 text-[10px]">{sup.phone}</span>
                        <span className="font-semibold text-slate-900">
                          Total: {profile.currency}{sup.totalPurchased.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                        {hasOwed ? (
                          <button
                            type="button"
                            onClick={() => onPaySupplier(sup)}
                            className="px-2 py-0.5 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors cursor-pointer"
                          >
                            Pay Bill
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">Account clear</span>
                        )}

                        <button
                          type="button"
                          onClick={() => onEditSupplier(sup)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                          title="Edit supplier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop View: Vendors Table */}
            <div className="hidden sm:block flex-1 min-h-0 overflow-y-auto no-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] z-10">
                  <tr>
                    <th className="py-2.5 px-3.5">Supplier Company</th>
                    <th className="py-2.5 px-3.5">Contact Person</th>
                    <th className="py-2.5 px-3.5">Category</th>
                    <th className="py-2.5 px-3.5">Contact Info</th>
                    <th className="py-2.5 px-3.5">Amount Owed</th>
                    <th className="py-2.5 px-3.5">Total Purchases</th>
                    <th className="py-2.5 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No suppliers found matching search.
                      </td>
                    </tr>
                  ) : (
                    paginatedSuppliers.map((sup) => (
                      <tr key={sup.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3.5 font-bold text-slate-900">
                          {sup.companyName}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-700 font-medium">
                          {sup.contactPerson}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                            {sup.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600">
                          <div>{sup.phone}</div>
                          {sup.email && <div className="text-[10px] text-slate-400">{sup.email}</div>}
                        </td>
                        <td className="py-2.5 px-3.5">
                          {sup.amountOwed > 0 ? (
                            <span className="font-extrabold text-rose-600">
                              {profile.currency}{sup.amountOwed.toLocaleString()}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                              <CheckCircle2 className="w-3 h-3" /> Paid
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 font-bold text-slate-900">
                          {profile.currency}{sup.totalPurchased.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {sup.amountOwed > 0 && (
                              <button
                                type="button"
                                onClick={() => onPaySupplier(sup)}
                                className="px-2 py-0.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors cursor-pointer"
                              >
                                Pay Bill
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onEditSupplier(sup)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                              title="Edit supplier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* Purchase Orders View */
          <>
            {/* Mobile View: PO Cards */}
            <div className="block sm:hidden flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
              {paginatedPOs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {language === 'pt' ? 'Nenhuma ordem de compra encontrada.' : 'No purchase orders found matching your search.'}
                </div>
              ) : (
                paginatedPOs.map((po) => (
                  <div key={po.id} className="p-2.5 flex flex-col gap-1.5 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-emerald-700">#{po.poNumber}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(po.timestamp).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold capitalize ${
                          po.status === 'received'
                            ? 'bg-emerald-100 text-emerald-800'
                            : po.status === 'issued'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {po.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="truncate pr-2">
                        <span className="font-semibold text-slate-900">{po.supplierName}</span>
                        <span className="text-[10px] text-slate-400 ml-1">
                          (Delivery: {po.expectedDeliveryDate || 'N/A'})
                        </span>
                      </div>
                      <span className="font-bold text-emerald-700 text-sm">
                        {profile.currency}{po.total.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-50 text-[11px]">
                      <span className="text-slate-400 text-[10px]">
                        {po.items.length} products
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenPOView(po)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          View/Print
                        </button>

                        {po.status !== 'received' && (
                          <button
                            type="button"
                            onClick={() => handleReceiveStock(po)}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer inline-flex items-center gap-0.5"
                            title="Receive stock into inventory"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Receive</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete Purchase Order ${po.poNumber}?`)) {
                              deletePurchaseOrder(po.id);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop View: PO Table */}
            <div className="hidden sm:block flex-1 min-h-0 overflow-y-auto no-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] z-10">
                  <tr>
                    <th className="py-2.5 px-3.5">PO #</th>
                    <th className="py-2.5 px-3.5">Vendor</th>
                    <th className="py-2.5 px-3.5">Order Date</th>
                    <th className="py-2.5 px-3.5">Expected Delivery</th>
                    <th className="py-2.5 px-3.5">Items</th>
                    <th className="py-2.5 px-3.5">Total Value</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedPOs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        {language === 'pt' ? 'Nenhuma ordem de compra encontrada.' : 'No purchase orders found matching your search.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedPOs.map((po) => (
                      <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3.5 font-bold text-emerald-700">
                          #{po.poNumber}
                        </td>
                        <td className="py-2.5 px-3.5 font-medium text-slate-900">
                          {po.supplierName}
                          {po.supplierPhone && (
                            <span className="text-slate-400 text-[10px] ml-1">({po.supplierPhone})</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-500 whitespace-nowrap">
                          {new Date(po.timestamp).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600 whitespace-nowrap">
                          {po.expectedDeliveryDate || 'N/A'}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600">
                          {po.items.length} {po.items.length === 1 ? 'item' : 'items'}
                        </td>
                        <td className="py-2.5 px-3.5 font-bold text-slate-900">
                          {profile.currency}{po.total.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              po.status === 'received'
                                ? 'bg-emerald-100 text-emerald-800'
                                : po.status === 'issued'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {po.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenPOView(po)}
                              className="px-2 py-0.5 text-xs font-semibold text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                              title="View & Print PO"
                            >
                              <Eye className="w-3 h-3 inline mr-1" />
                              View
                            </button>

                            {po.status !== 'received' ? (
                              <button
                                type="button"
                                onClick={() => handleReceiveStock(po)}
                                className="px-2 py-0.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors cursor-pointer"
                                title="Receive stock into inventory"
                              >
                                <PackageCheck className="w-3.5 h-3.5 inline mr-0.5" />
                                Receive
                              </button>
                            ) : (
                              <span className="text-[10px] font-semibold text-emerald-700">Received</span>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete Purchase Order ${po.poNumber}?`)) {
                                  deletePurchaseOrder(po.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              title="Delete PO"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Compact Pagination Bar */}
        <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="text-[11px]">
            {activeItems.length === 0
              ? '0 records'
              : `${(validPage - 1) * pageSize + 1}-${Math.min(
                  validPage * pageSize,
                  activeItems.length
                )} of ${activeItems.length}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={validPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-semibold text-slate-700 px-1">
              {validPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={validPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Purchase Order Modal */}
      <PurchaseOrderModal
        isOpen={isPOModalOpen}
        onClose={() => {
          setIsPOModalOpen(false);
          setSelectedPO(null);
        }}
        poToView={selectedPO}
      />
    </div>
  );
};
