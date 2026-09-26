import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Product } from '../../types';
import {
  Package,
  Plus,
  Search,
  History,
  Edit2,
  Trash2,
  PackagePlus,
  ChevronLeft,
  ChevronRight,
  Barcode,
  Camera,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';

interface InventoryViewProps {
  onOpenNewProduct: (initialBarcode?: string) => void;
  onEditProduct: (product: Product) => void;
  onQuickRestock: (productId: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  onOpenNewProduct,
  onEditProduct,
  onQuickRestock,
}) => {
  const {
    products,
    stockMovements,
    deleteProduct,
    permissions,
    profile,
  } = useBusiness();

  const [activeTab, setActiveTab] = useState<'catalog' | 'movements'>('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [movementPage, setMovementPage] = useState(1);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [scannedFeedback, setScannedFeedback] = useState<{
    type: 'found' | 'not_found';
    code: string;
    product?: Product;
  } | null>(null);

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      String(p.name || '').toLowerCase().includes(term) ||
      String(p.sku || '').toLowerCase().includes(term) ||
      (p.barcode != null && String(p.barcode).toLowerCase().includes(term)) ||
      String(p.id || '').toLowerCase().includes(term);

    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;

    let matchesStock = true;
    if (stockFilter === 'low_stock') matchesStock = p.stock <= p.minStockAlert;
    else if (stockFilter === 'out_of_stock') matchesStock = p.stock === 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleBarcodeScanned = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    const match = products.find(
      (p) =>
        (p.barcode != null && String(p.barcode).trim().toLowerCase() === cleanCode.toLowerCase()) ||
        String(p.sku || '').toLowerCase() === cleanCode.toLowerCase() ||
        String(p.id || '').toLowerCase() === cleanCode.toLowerCase()
    );

    if (match) {
      setSearchTerm(match.sku);
      setCategoryFilter('all');
      setStockFilter('all');
      setCurrentPage(1);
      setScannedFeedback({
        type: 'found',
        code: cleanCode,
        product: match,
      });
    } else {
      setSearchTerm(cleanCode);
      setScannedFeedback({
        type: 'not_found',
        code: cleanCode,
      });
    }
  };

  const lowStockCount = products.filter((p) => p.stock <= p.minStockAlert).length;
  const totalCostBasis = products.reduce((acc, p) => acc + p.costPrice * p.stock, 0);
  const totalRetailValue = products.reduce((acc, p) => acc + p.sellingPrice * p.stock, 0);

  // Pagination for products
  const pageSize = 5;
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice((validPage - 1) * pageSize, validPage * pageSize);

  // Pagination for movements
  const movementPageSize = 6;
  const totalMovementPages = Math.ceil(stockMovements.length / movementPageSize) || 1;
  const validMovementPage = Math.min(movementPage, totalMovementPages);
  const paginatedMovements = stockMovements.slice((validMovementPage - 1) * movementPageSize, validMovementPage * movementPageSize);

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-2 sm:space-y-3">
      {/* Header */}
      <div className="bg-white rounded-xl p-2.5 sm:p-4 border border-slate-200 shadow-2xs flex items-center justify-between gap-2 shrink-0">
        <div>
          <h1 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight">
            Products & Inventory
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500">
            {products.length} SKUs across {categories.length} categories
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsBarcodeScannerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Scan product barcode with camera"
          >
            <Camera className="w-3.5 h-3.5 text-indigo-400" />
            <span>Scan Barcode</span>
          </button>

          {permissions.canManageInventory && (
            <button
              type="button"
              onClick={() => onOpenNewProduct()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2.5 shrink-0">
        <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
            Products
          </span>
          <div className="text-sm sm:text-xl font-black text-slate-900 mt-0.5 sm:mt-1">
            {products.length}
          </div>
          <span className="text-[10px] text-slate-500 hidden sm:block">{categories.length} categories</span>
        </div>

        <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
            Low Stock
          </span>
          <div className="text-sm sm:text-xl font-black text-amber-600 mt-0.5 sm:mt-1">
            {lowStockCount}
          </div>
          <span className="text-[10px] text-amber-700 hidden sm:block">Reorder required</span>
        </div>

        <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
            Cost Value
          </span>
          <div className="text-sm sm:text-xl font-black text-slate-900 mt-0.5 sm:mt-1 truncate">
            {permissions.canViewProfits ? (
              `${profile.currency}${totalCostBasis.toLocaleString()}`
            ) : (
              <span className="text-slate-400 text-xs">Restricted</span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 hidden sm:block">Invested capital</span>
        </div>

        <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
            Retail Value
          </span>
          <div className="text-sm sm:text-xl font-black text-indigo-600 mt-0.5 sm:mt-1 truncate">
            {profile.currency}{totalRetailValue.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 hidden sm:block">Est. sales value</span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => {
            setActiveTab('catalog');
            setCurrentPage(1);
          }}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'catalog'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Catalog ({filteredProducts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('movements');
            setMovementPage(1);
          }}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'movements'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Log ({stockMovements.length})</span>
        </button>
      </div>

      {activeTab === 'catalog' ? (
        <div className="flex-1 min-h-0 flex flex-col space-y-2 overflow-hidden">
          {/* Filters Bar */}
          <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, SKU, or barcode..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                  if (scannedFeedback) setScannedFeedback(null);
                }}
                className="w-full text-xs pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setIsBarcodeScannerOpen(true)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                title="Scan barcode with camera"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setStockFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  stockFilter === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                All
              </button>

              <button
                type="button"
                onClick={() => {
                  setStockFilter('low_stock');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  stockFilter === 'low_stock'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                Low ({lowStockCount})
              </button>
            </div>
          </div>

          {/* Scanned Feedback Banner */}
          {scannedFeedback && (
            <div
              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-150 shrink-0 ${
                scannedFeedback.type === 'found'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {scannedFeedback.type === 'found' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <div>
                  {scannedFeedback.type === 'found' && scannedFeedback.product ? (
                    <div className="text-xs">
                      <span className="font-bold text-emerald-900">
                        Found Product: {scannedFeedback.product.name}
                      </span>{' '}
                      <span className="text-emerald-700 font-mono text-[11px]">
                        (SKU: {scannedFeedback.product.sku}
                        {scannedFeedback.product.barcode ? ` | Barcode: ${scannedFeedback.product.barcode}` : ''})
                      </span>
                      <div className="text-[11px] text-emerald-800 mt-0.5">
                        In Stock: <strong>{scannedFeedback.product.stock} {scannedFeedback.product.unit}</strong> • Price: <strong>{profile.currency}{scannedFeedback.product.sellingPrice}</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs">
                      <span className="font-bold text-amber-900">
                        No product found for code "{scannedFeedback.code}"
                      </span>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Would you like to register a new product with this barcode?
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {scannedFeedback.type === 'found' && scannedFeedback.product && (
                  <>
                    <button
                      type="button"
                      onClick={() => onQuickRestock(scannedFeedback.product!.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Restock
                    </button>
                    {permissions.canManageInventory && (
                      <button
                        type="button"
                        onClick={() => onEditProduct(scannedFeedback.product!)}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                  </>
                )}

                {scannedFeedback.type === 'not_found' && permissions.canManageInventory && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenNewProduct(scannedFeedback.code);
                      setScannedFeedback(null);
                    }}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    + Add Product
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setScannedFeedback(null);
                    setSearchTerm('');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                  title="Clear filter"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Products Container */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Mobile View: Clean Card Items */}
            <div className="block sm:hidden flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
              {paginatedProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No products found matching filters.
                </div>
              ) : (
                paginatedProducts.map((prod) => {
                  const isLowStock = prod.stock <= prod.minStockAlert;
                  const isOutOfStock = prod.stock === 0;

                  return (
                    <div key={prod.id} className="p-2.5 flex flex-col gap-1.5 hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 pr-2 truncate">
                          <span className="font-bold text-xs text-slate-900 truncate block">{prod.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {prod.sku}{prod.barcode ? ` • Barcode: ${prod.barcode}` : ''} • {prod.category}
                          </span>
                        </div>
                        <div className="shrink-0">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-100 text-emerald-800">
                              In Stock
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <div className="text-[11px] text-slate-600">
                          Stock: <strong className={isLowStock ? 'text-rose-600' : 'text-slate-900'}>{prod.stock} {prod.unit}</strong>{' '}
                          <span className="text-slate-400 text-[10px]">(min {prod.minStockAlert})</span>
                        </div>
                        <div className="font-bold text-slate-900">
                          {profile.currency}{prod.sellingPrice}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                        <button
                          type="button"
                          onClick={() => onQuickRestock(prod.id)}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
                        >
                          <PackagePlus className="w-3 h-3" />
                          <span>Restock</span>
                        </button>

                        <div className="flex items-center gap-2">
                          {permissions.canManageInventory && (
                            <button
                              type="button"
                              onClick={() => onEditProduct(prod)}
                              className="text-slate-500 hover:text-slate-800 text-xs cursor-pointer p-0.5"
                              title="Edit product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {permissions.canDeleteTransactions && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete product "${prod.name}"?`)) {
                                  deleteProduct(prod.id);
                                }
                              }}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden sm:block flex-1 min-h-0 overflow-y-auto no-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] z-10">
                  <tr>
                    <th className="py-2.5 px-3.5">Product & SKU</th>
                    <th className="py-2.5 px-3.5">Category</th>
                    <th className="py-2.5 px-3.5">Current Stock</th>
                    <th className="py-2.5 px-3.5">Cost</th>
                    <th className="py-2.5 px-3.5">Price</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No products found matching filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((prod) => {
                      const isLowStock = prod.stock <= prod.minStockAlert;
                      const isOutOfStock = prod.stock === 0;

                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3.5">
                            <div className="font-bold text-slate-900">{prod.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {prod.sku}{prod.barcode ? ` • Barcode: ${prod.barcode}` : ''}
                            </div>
                          </td>

                          <td className="py-2.5 px-3.5 text-slate-600">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-medium text-slate-700">
                              {prod.category}
                            </span>
                          </td>

                          <td className="py-2.5 px-3.5">
                            <div className="font-bold text-slate-900">
                              {prod.stock} {prod.unit}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Min: {prod.minStockAlert}
                            </div>
                          </td>

                          <td className="py-2.5 px-3.5 text-slate-600">
                            {permissions.canViewProfits ? (
                              `${profile.currency}${prod.costPrice}`
                            ) : (
                              <span className="text-slate-400">--</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3.5 font-bold text-slate-900">
                            {profile.currency}{prod.sellingPrice}
                          </td>

                          <td className="py-2.5 px-3.5">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                In Stock
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onQuickRestock(prod.id)}
                                className="px-2 py-0.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                                title="Add stock"
                              >
                                <PackagePlus className="w-3 h-3 inline mr-0.5" />
                                Restock
                              </button>

                              {permissions.canManageInventory && (
                                <button
                                  type="button"
                                  onClick={() => onEditProduct(prod)}
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                                  title="Edit product"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              )}

                              {permissions.canDeleteTransactions && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Delete product "${prod.name}"?`)) {
                                      deleteProduct(prod.id);
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                  title="Delete product"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Compact Pagination Bar */}
            <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span className="text-[11px]">
                {filteredProducts.length === 0
                  ? '0 products'
                  : `${(validPage - 1) * pageSize + 1}-${Math.min(
                      validPage * pageSize,
                      filteredProducts.length
                    )} of ${filteredProducts.length}`}
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
        </div>
      ) : (
        /* Stock Movements Audit Log */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="p-2.5 sm:p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Stock Movements Log
            </h2>
            <span className="text-[11px] text-slate-500">{stockMovements.length} logged events</span>
          </div>

          {/* Mobile Card View */}
          <div className="block sm:hidden flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
            {paginatedMovements.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No stock movements recorded yet.</div>
            ) : (
              paginatedMovements.map((sm) => (
                <div key={sm.id} className="p-2.5 flex flex-col gap-1 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900 truncate">{sm.productName}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded uppercase font-bold text-[9px] ${
                        sm.type === 'purchase'
                          ? 'bg-blue-100 text-blue-800'
                          : sm.type === 'sale'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {sm.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={sm.quantity > 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                      {sm.quantity > 0 ? `+${sm.quantity}` : sm.quantity} ({sm.previousStock} → {sm.newStock})
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(sm.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    Reason: {sm.reason} • by {sm.performedBy}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block flex-1 min-h-0 overflow-y-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] z-10">
                <tr>
                  <th className="py-2.5 px-3.5">Time</th>
                  <th className="py-2.5 px-3.5">Product</th>
                  <th className="py-2.5 px-3.5">Type</th>
                  <th className="py-2.5 px-3.5">Change</th>
                  <th className="py-2.5 px-3.5">Level (Before → After)</th>
                  <th className="py-2.5 px-3.5">Reason</th>
                  <th className="py-2.5 px-3.5">Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedMovements.map((sm) => (
                  <tr key={sm.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(sm.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      {new Date(sm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 px-3.5 font-semibold text-slate-900">
                      {sm.productName}
                    </td>
                    <td className="py-2 px-3.5 uppercase font-bold text-[10px]">
                      <span
                        className={`px-1.5 py-0.5 rounded ${
                          sm.type === 'purchase'
                            ? 'bg-blue-100 text-blue-800'
                            : sm.type === 'sale'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {sm.type}
                      </span>
                    </td>
                    <td className="py-2 px-3.5 font-bold">
                      <span className={sm.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {sm.quantity > 0 ? `+${sm.quantity}` : sm.quantity}
                      </span>
                    </td>
                    <td className="py-2 px-3.5 text-slate-700">
                      {sm.previousStock} → <strong className="text-slate-900">{sm.newStock}</strong>
                    </td>
                    <td className="py-2 px-3.5 text-slate-600">{sm.reason}</td>
                    <td className="py-2 px-3.5 text-slate-500">{sm.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Movements Pagination Bar */}
          <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span className="text-[11px]">
              {stockMovements.length === 0
                ? '0 records'
                : `${(validMovementPage - 1) * movementPageSize + 1}-${Math.min(
                    validMovementPage * movementPageSize,
                    stockMovements.length
                  )} of ${stockMovements.length}`}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={validMovementPage <= 1}
                onClick={() => setMovementPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-semibold text-slate-700 px-1">
                {validMovementPage} / {totalMovementPages}
              </span>
              <button
                type="button"
                disabled={validMovementPage >= totalMovementPages}
                onClick={() => setMovementPage((p) => Math.min(totalMovementPages, p + 1))}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onScan={(code) => handleBarcodeScanned(code)}
        title="Inventory Barcode Scanner"
        subtitle="Point camera at product barcode or type code below"
        allowContinuous={false}
        quickSampleCodes={products.slice(0, 8).map((p) => ({
          code: p.barcode || p.sku,
          label: p.name,
        }))}
      />
    </div>
  );
};
