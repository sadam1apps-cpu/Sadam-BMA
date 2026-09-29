import React, { useState, useEffect } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { Product } from '../../types';
import { X, Package, Tag, DollarSign, Layers, Barcode, Camera } from 'lucide-react';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: Product | null;
  initialBarcode?: string;
  initialSku?: string;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  initialBarcode,
  initialSku,
}) => {
  const { addProduct, updateProduct, profile, t, language } = useBusiness();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [costPrice, setCostPrice] = useState<number>(10);
  const [sellingPrice, setSellingPrice] = useState<number>(25);
  const [stock, setStock] = useState<number>(20);
  const [minStockAlert, setMinStockAlert] = useState<number>(10);
  const [unit, setUnit] = useState('pcs');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku);
      setBarcode(productToEdit.barcode != null ? String(productToEdit.barcode) : '');
      setCategory(productToEdit.category);
      setCostPrice(productToEdit.costPrice);
      setSellingPrice(productToEdit.sellingPrice);
      setStock(productToEdit.stock);
      setMinStockAlert(productToEdit.minStockAlert);
      setUnit(productToEdit.unit);
    } else {
      setName('');
      setSku(initialSku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setBarcode(initialBarcode || '');
      setCategory('Electronics');
      setCostPrice(10);
      setSellingPrice(25);
      setStock(20);
      setMinStockAlert(10);
      setUnit('pcs');
    }
  }, [productToEdit, isOpen, initialBarcode, initialSku]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (productToEdit) {
      updateProduct(productToEdit.id, {
        name: name.trim(),
        sku: sku.trim(),
        barcode: barcode.trim() || undefined,
        category,
        costPrice,
        sellingPrice,
        stock,
        minStockAlert,
        unit,
      });
    } else {
      addProduct({
        name: name.trim(),
        sku: sku.trim(),
        barcode: barcode.trim() || undefined,
        category,
        costPrice,
        sellingPrice,
        stock,
        minStockAlert,
        unit,
      });
    }

    onClose();
  };

  const estimatedMargin =
    sellingPrice > 0 ? Math.round(((sellingPrice - costPrice) / sellingPrice) * 100) : 0;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div className="fixed inset-0" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden z-10">
          
          <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">
                {productToEdit ? t.editProduct : t.addNewProduct}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {t.productName}
              </label>
              <input
                type="text"
                placeholder={language === 'pt' ? 'ex: Fones de Ouvido Sem Fio Bluetooth' : 'e.g. Wireless Noise-Cancelling Headphones'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {t.sku} *
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    {t.barcode}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                    title="Scan with mobile camera"
                  >
                    <Camera className="w-3 h-3" />
                    <span>{language === 'pt' ? 'Câmera' : 'Scan'}</span>
                  </button>
                </div>
                <div className="relative">
                  <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={language === 'pt' ? 'Ler ou inserir código...' : 'Scan or enter barcode...'}
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                {t.category}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Electronics">{language === 'pt' ? 'Eletrónicos' : 'Electronics'}</option>
                <option value="Accessories">{language === 'pt' ? 'Acessórios' : 'Accessories'}</option>
                <option value="Office Supplies">{language === 'pt' ? 'Material de Escritório' : 'Office Supplies'}</option>
                <option value="Furniture">{language === 'pt' ? 'Mobiliário' : 'Furniture'}</option>
                <option value="General">{language === 'pt' ? 'Artigos Gerais' : 'General Goods'}</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {t.costPrice} ({profile.currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={costPrice}
                  onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {t.sellingPrice} ({profile.currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none font-semibold"
                  required
                />
              </div>

              <div className="col-span-2 text-xs text-slate-600 flex items-center justify-between pt-1">
                <span>{language === 'pt' ? 'Margem de Lucro Bruta:' : 'Gross Profit Margin:'}</span>
                <span className={`font-bold ${estimatedMargin > 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {estimatedMargin}% ({profile.currency}{(sellingPrice - costPrice).toFixed(2)} {language === 'pt' ? 'por unidade' : 'per unit'})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {t.stockQty}
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {t.minStockAlert}
                </label>
                <input
                  type="number"
                  min="0"
                  value={minStockAlert}
                  onChange={(e) => setMinStockAlert(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none font-semibold text-rose-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {t.unitOfMeasure}
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none"
                >
                  <option value="pcs">{language === 'pt' ? 'un (unidade)' : 'pcs'}</option>
                  <option value="pack">{language === 'pt' ? 'pct (pacote)' : 'pack'}</option>
                  <option value="box">{language === 'pt' ? 'cx (caixa)' : 'box'}</option>
                  <option value="kit">{language === 'pt' ? 'kit (conjunto)' : 'kit'}</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                {productToEdit ? t.saveChanges : t.saveProduct}
              </button>
            </div>

          </form>

        </div>
      </div>

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(scannedCode) => {
          setBarcode(scannedCode);
          if (!sku || sku.startsWith('SKU-')) {
            setSku(`SKU-${scannedCode.slice(-4)}`);
          }
        }}
        title="Scan Product Barcode"
        subtitle="Point camera at product label or packaging barcode"
      />
    </>
  );
};
