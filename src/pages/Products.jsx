import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit3, Trash2, Search } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import PageHeader from '@/components/PageHeader';
import ImageUpload from '@/components/ImageUpload';
import ConfirmDialog from '@/components/ConfirmDialog';
import PrintWrapper from '@/components/PrintWrapper';
import BulkDeleteBar from '@/components/BulkDeleteBar';
import { initDB, getDB } from '@/lib/db';
import { DEFAULT_IMAGE, formatCurrency } from '@/lib/utils';
import { useSettings } from '@/hooks/useSettings';
import { useBusiness } from '@/contexts/BusinessContext';

const categories = ['Biscuits', 'Chocolates', 'Beverages', 'Snacks', 'Dairy'];
const units = ['pcs', 'kg', 'litre', 'bottle', 'pack'];

export default function Products() {
  const { activeBusiness } = useBusiness();
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const settings = useSettings();
  const currency = settings?.currency ?? 'Rs';
  const [search, setSearch] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tempPreviewBarcode, setTempPreviewBarcode] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'Biscuits',
    barcode: '',
    price: '',
    costPrice: '',
    unit: 'pcs',
    expiryDate: '',
    image: DEFAULT_IMAGE,
    description: '',
    createdAt: new Date().toISOString(),
  });

  // Reset modal state when business changes (prevents stale state in Electron)
  useEffect(() => {
    return () => {
      setOpenForm(false);
      setConfirmDelete(false);
      setSelectedProduct(null);
      setSelectedIds([]);
      setSelectAll(false);
    };
  }, [activeBusiness]);

  useEffect(() => {
    const load = async () => {
      await initDB(activeBusiness);
      const currentDB = getDB(activeBusiness);
      const [productData, inventoryData] = await Promise.all([
        currentDB.products.toArray(),
        currentDB.inventory.toArray()
      ]);
      setProducts(productData);
      setInventory(inventoryData);
    };
    load();
  }, [activeBusiness]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const query = search.toLowerCase();
      return (
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.barcode.toLowerCase().includes(query)
      );
    });
  }, [products, search]);

  const openNewProduct = () => {
    setSelectedProduct(null);
    setTempPreviewBarcode(`SHOP-TEMP-${Date.now()}`);
    setForm({
      name: '',
      category: 'Biscuits',
      barcode: '',
      price: '',
      costPrice: '',
      unit: 'pcs',
      expiryDate: '',
      image: DEFAULT_IMAGE,
      description: '',
      createdAt: new Date().toISOString(),
    });
    setOpenForm(true);
  };

  const openEditProduct = (product) => {
    setSelectedProduct(product);
    setTempPreviewBarcode(product.barcode?.trim() || `SHOP-TEMP-${Date.now()}`);
    setForm({
      ...product,
      expiryDate: product.expiryDate || '',
    });
    setOpenForm(true);
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    if (!form.name || !form.category) return;

    const currentDB = getDB(activeBusiness);
    const barcodeValue = form.barcode?.trim() ?? '';
    const shouldGenerateBarcode = !barcodeValue && !selectedProduct?.barcode;
    let finalBarcode = barcodeValue || selectedProduct?.barcode || '';
    const productData = { ...form, barcode: finalBarcode };

    if (selectedProduct?.id) {
      await currentDB.products.update(selectedProduct.id, productData);
      if (shouldGenerateBarcode) {
        finalBarcode = `SHOP-${selectedProduct.id}-${Date.now()}`;
        await currentDB.products.update(selectedProduct.id, { barcode: finalBarcode });
      }
      setProducts((current) =>
        current.map((item) =>
          item.id === selectedProduct.id ? { ...item, ...productData, barcode: finalBarcode } : item
        )
      );
    } else {
      const id = await currentDB.products.add({ ...productData, createdAt: new Date().toISOString() });
      let savedBarcode = finalBarcode;
      if (shouldGenerateBarcode) {
        savedBarcode = `SHOP-${id}-${Date.now()}`;
        await currentDB.products.update(id, { barcode: savedBarcode });
      }
      await currentDB.inventory.add({
        productId: id,
        quantity: 0,
        lowStockThreshold: 10,
        lastUpdated: new Date().toISOString()
      });
      setProducts((current) => [...current, { ...productData, id, barcode: savedBarcode }]);
    }
    setOpenForm(false);
  };

  const removeProduct = async () => {
    if (!selectedProduct?.id) return;
    const idToDelete = selectedProduct.id;
    const currentDB = getDB(activeBusiness);
    try {
      await currentDB.products.delete(idToDelete);
      await currentDB.inventory.where('productId').equals(idToDelete).delete();
      setProducts((current) => current.filter((item) => item.id !== idToDelete));
    } catch (error) {
      console.error('Error deleting product:', error);
      // Don't close modals if there was an error
      return;
    }
    // Reset all state in a specific order to prevent UI issues
    // First close the confirm dialog
    setConfirmDelete(false);
    // Then close the form modal
    setOpenForm(false);
    // Finally reset the product-specific state
    setSelectedProduct(null);
    setForm({
      name: '',
      category: 'Biscuits',
      barcode: '',
      price: '',
      costPrice: '',
      unit: 'pcs',
      expiryDate: '',
      image: DEFAULT_IMAGE,
      description: '',
      createdAt: new Date().toISOString(),
    });
  };

  const updateBarcode = (value) => {
    setForm((current) => ({ ...current, barcode: value }));
  };

  const productInventory = (productId) => inventory.find((item) => item.productId === productId);

  // Toggle single product selection
  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      setSelectedIds(filteredProducts?.map(p => p.id) ?? []);
      setSelectAll(true);
    }
  };

  // Delete selected products
  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const confirm = window.confirm(
      `Delete ${selectedIds.length} selected products? This cannot be undone.`
    );
    if (!confirm) return;

    setIsDeleting(true);
    try {
      const currentDB = getDB(activeBusiness);
      
      // Use bulk delete for better performance
      await currentDB.products.bulkDelete(selectedIds);
      
      // Delete inventory records in parallel
      const inventoryDeletePromises = selectedIds.map(async (id) => {
        const inv = await currentDB.inventory.where('productId').equals(id).first();
        if (inv?.id) return currentDB.inventory.delete(inv.id);
        return Promise.resolve();
      });
      await Promise.all(inventoryDeletePromises);
      
      setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      setSelectAll(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Update selectAll when filteredProducts or selectedIds change
  useEffect(() => {
    const allSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.includes(p.id));
    setSelectAll(allSelected);
  }, [filteredProducts, selectedIds]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Add, edit, and print product QR labels"
        action={
          <button
            type="button"
            onClick={openNewProduct}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, category, or barcode"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:bg-white"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="rounded-lg bg-slate-100 px-3 py-1 font-medium">{filteredProducts.length} products</span>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[58vh] rounded-xl border border-slate-200">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Barcode</th>
                <th className="px-4 py-3">Sale Price</th>
                <th className="px-4 py-3">Cost Price</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className={selectedIds.includes(product.id) ? 'bg-red-50' : 'hover:bg-slate-50 transition-colors'}>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <img src={product.image} alt={product.name} className="h-12 w-12 rounded-xl object-cover" />
                      <div>
                        <p className="font-semibold text-slate-900">{product.name}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              product.barcode ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {product.barcode ? '✓ Has Barcode' : '○ Name Only'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-700 font-mono text-xs">{product.barcode || '-'}</td>
                  <td className="px-4 py-4 font-semibold text-slate-900">{formatCurrency(product.price, currency)}</td>
                  <td className="px-4 py-4 text-slate-600">{formatCurrency(product.costPrice, currency)}</td>
                  <td className="px-4 py-4 text-slate-600 text-xs">{product.unit}</td>
                  <td className="px-4 py-4 text-slate-600 text-xs">
                    {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      (productInventory(product.id)?.quantity ?? 0) <= 0
                        ? 'bg-red-100 text-red-700'
                        : (productInventory(product.id)?.quantity ?? 0) <= (product.lowStockThreshold || 10)
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {productInventory(product.id)?.quantity ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditProduct(product)}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setOpenForm(true);
                          setConfirmDelete(true);
                        }}
                        className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <svg className="h-12 w-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm">No products found</p>
          </div>
        )}
      </div>

      {openForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {selectedProduct ? 'Edit product' : 'Add product'}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {selectedProduct ? selectedProduct.name : 'New product'}
                </h2>
              </div>
              <button
                onClick={() => setOpenForm(false)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
            <form onSubmit={saveProduct} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Name</span>
                    <input
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:bg-white"
                      required
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Category</span>
                    <select
                      value={form.category}
                      onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:bg-white"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Barcode <span className="text-slate-400 font-normal">(optional)</span>
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Scan or type barcode"
                        value={form.barcode}
                        onChange={(event) => updateBarcode(event.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:bg-white"
                        autoComplete="off"
                      />
                      {form.barcode && (
                        <span className="flex items-center text-sm font-medium text-emerald-600">✓</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">Scan with USB scanner or type the barcode number</p>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Unit</span>
                    <select
                      value={form.unit}
                      onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:bg-white"
                    >
                      {units.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Sale Price</span>
                    <input
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(event) => setForm((current) => ({ ...current, price: Number(event.target.value) }))}
                      onFocus={e => e.target.select()}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:bg-white"
                      required
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Cost Price</span>
                    <input
                      type="number"
                      step="0.01"
                      value={form.costPrice}
                      onChange={(event) => setForm((current) => ({ ...current, costPrice: Number(event.target.value) }))}
                      onFocus={e => e.target.select()}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:bg-white"
                      required
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Expiry Date (optional)</span>
                    <input
                      type="date"
                      value={form.expiryDate || ''}
                      onChange={(event) => setForm((current) => ({ ...current, expiryDate: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:bg-white"
                    />
                  </label>
                </div>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Description</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:bg-white"
                  />
                </label>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    {selectedProduct ? 'Update Product' : 'Save Product'}
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                <ImageUpload value={form.image} onChange={(value) => setForm((current) => ({ ...current, image: value }))} />
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-900 mb-3">QR Code Preview</p>

                  <div className="flex flex-col items-center gap-3 bg-white rounded-lg border border-slate-200 p-4">
                    <div id="product-qr" className="rounded-lg overflow-hidden">
                      <QRCodeSVG value={form.barcode?.trim() || tempPreviewBarcode} size={160} includeMargin={true} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-900">{form.name || 'Product Name'}</p>
                      <p className="text-xs text-slate-500">{currency} {(typeof form.price === 'number' ? form.price : parseFloat(form.price) || 0).toFixed(2)}</p>
                      <p className="text-xs text-slate-400 font-mono mt-1">{form.barcode?.trim() || tempPreviewBarcode}</p>
                    </div>
                  </div>

                  {!form.barcode?.trim() && (
                    <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-xs text-amber-700">
                        ⚠️ No barcode entered. A unique QR will be auto-generated when you save.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        const svg = document.getElementById('product-qr')?.querySelector('svg');
                        if (!svg) return;
                        const svgData = new XMLSerializer().serializeToString(svg);
                        const blob = new Blob([svgData], { type: 'image/svg+xml' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${form.name || 'product'}-qr.svg`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex-1 rounded-xl border border-blue-600 px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      ⬇ Download QR
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const svg = document.getElementById('product-qr')?.querySelector('svg');
                        if (!svg) return;
                        const svgData = new XMLSerializer().serializeToString(svg);
                        const w = window.open('', '_blank');
                        if (!w) return;
                        w.document.write(`
                          <html>
                            <head>
                              <title>QR Label - ${form.name || 'Product'}</title>
                              <style>
                                body { 
                                  display: flex; 
                                  flex-direction: column;
                                  align-items: center; 
                                  justify-content: center;
                                  padding: 20px;
                                  font-family: Arial, sans-serif;
                                }
                                .label {
                                  border: 1px solid #ccc;
                                  padding: 15px;
                                  text-align: center;
                                  width: 220px;
                                }
                                svg { width: 160px; height: 160px; }
                                .name { font-weight: bold; font-size: 14px; margin: 8px 0 4px; }
                                .price { font-size: 12px; color: #666; margin: 0; }
                                .barcode { font-size: 10px; color: #999; margin-top: 4px; }
                                @media print {
                                  body { margin: 0; }
                                }
                              </style>
                            </head>
                            <body>
                              <div class="label">
                                ${svgData}
                                <p class="name">${form.name || 'Product'}</p>
                                <p class="price">${currency} ${(typeof form.price === 'number' ? form.price : parseFloat(form.price) || 0).toFixed(2)}</p>
                                <p class="barcode">${form.barcode?.trim() || tempPreviewBarcode}</p>
                              </div>
                              <script>window.onload = () => { window.print(); window.close(); }</script>
                            </body>
                          </html>
                        `);
                      }}
                      className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                      🖨 Print QR
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <PrintWrapper title="Print QR Labels" printLabel="QR Labels">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <div key={product.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center">
              <div className="mb-3 grid place-items-center">
                <QRCodeSVG value={product.barcode || product.name} size={120} includeMargin />
              </div>
              <p className="font-semibold text-slate-900">{product.name}</p>
              <p className="text-sm text-slate-600">{formatCurrency(product.price, currency)}</p>
              <p className="text-xs text-slate-500 mt-2">{product.barcode}</p>
            </div>
          ))}
        </div>
      </PrintWrapper>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete product"
        description="This will remove the product and its inventory record. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => {
          setConfirmDelete(false);
          setOpenForm(false);
          setSelectedProduct(null);
        }}
        onConfirm={removeProduct}
      />

      <BulkDeleteBar
        selectedCount={selectedIds.length}
        onDelete={deleteSelected}
        onCancel={() => { setSelectedIds([]); setSelectAll(false); }}
        itemLabel="product"
        isDeleting={isDeleting}
      />
    </div>
  );
}