import React, { useState } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Product } from '../../types';
import { X, PackagePlus, AlertCircle } from 'lucide-react';

interface RestockModalProps {
  product: Product | null;
  onClose: () => void;
}

export const RestockModal: React.FC<RestockModalProps> = ({ product, onClose }) => {
  const { restockProduct, suppliers, profile } = useBusiness();
  const [quantity, setQuantity] = useState<number>(10);
  const [unitCost, setUnitCost] = useState<number>(product ? product.costPrice : 0);
  const [supplierId, setSupplierId] = useState<string>('');

  if (!product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;

    restockProduct(product.id, quantity, unitCost, supplierId || undefined);
    onClose();
  };

  const totalCost = quantity * unitCost;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden z-10">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Restock Inventory</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="text-sm font-bold text-slate-900">{product.name}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              SKU: {product.sku} • Current Stock: <strong className="text-slate-900">{product.stock} {product.unit}</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Units to Add ({product.unit})
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              New stock level will be: <strong className="text-indigo-600">{product.stock + quantity} {product.unit}</strong>
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Unit Purchase Cost ({profile.currency})
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={unitCost}
              onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Total Purchase Cost: <strong className="text-slate-900">{profile.currency}{totalCost.toLocaleString()}</strong>
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Supplier (Optional)
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">-- No Supplier Specified --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.companyName} ({s.category})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Confirm Restock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
