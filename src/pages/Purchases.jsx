import { useEffect, useMemo, useState } from 'react';
import { Plus, Printer } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import PrintWrapper from '@/components/PrintWrapper';
import BulkDeleteBar from '@/components/BulkDeleteBar';
import { initDB, getDB } from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useSettings } from '@/hooks/useSettings';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { useBusiness } from '@/contexts/BusinessContext';

export default function Purchases() {
  const { activeBusiness } = useBusiness();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const settings = useSettings();
  const currency = settings?.currency ?? 'Rs';
  const { selectedIds, isSelected, toggleOne, toggleAll, clearSelection, isAllSelected, selectedCount } = useMultiSelect(purchases);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState({
    productId: 0,
    supplierId: 0,
    quantity: '',
    costPrice: '',
    date: new Date().toISOString().slice(0, 10),
    expiryDate: '',
    note: '',
  });

  useEffect(() => {
    const load = async () => {
      await initDB(activeBusiness);
      const currentDB = getDB(activeBusiness);
      const [productsData, suppliersData, purchasesData, inventoryData] = await Promise.all([
        currentDB.products.toArray(),
        currentDB.suppliers.toArray(),
        currentDB.purchases.toArray(),
        currentDB.inventory.toArray(),
      ]);
      setProducts(productsData);
      setSuppliers(suppliersData);
      setPurchases(purchasesData);
      setInventory(inventoryData);
      if (productsData[0]) setForm((current) => ({ ...current, productId: productsData[0].id }));
      if (suppliersData[0]) setForm((current) => ({ ...current, supplierId: suppliersData[0].id }));
    };
    load();
  }, [activeBusiness]);

  const selectedProduct = useMemo(() => products.find((product) => product.id === form.productId), [products, form.productId]);
  const selectedSupplier = useMemo(
    () => suppliers.find((supplier) => supplier.id === form.supplierId),
    [suppliers, form.supplierId]
  );
  const totalCost = form.quantity * form.costPrice;

  const savePurchase = async (event) => {
    event.preventDefault();
    if (!selectedProduct) return;
    const currentDB = getDB(activeBusiness);
    const purchase = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: form.quantity,
      costPrice: form.costPrice,
      totalCost,
      supplier: selectedSupplier?.name,
      date: new Date(form.date).toISOString(),
      expiryDate: form.expiryDate || null,
      note: form.note,
    };
    const id = await currentDB.purchases.add(purchase);
    setPurchases((current) => [{ ...purchase, id }, ...current]);
    const inventoryItem = await currentDB.inventory.where('productId').equals(selectedProduct.id).first();
    if (form.expiryDate) {
      await currentDB.products.update(selectedProduct.id, { expiryDate: form.expiryDate });
    }

    if (inventoryItem && inventoryItem.id) {
      const updatedQuantity = inventoryItem.quantity + form.quantity;
      await currentDB.inventory.update(inventoryItem.id, {
        quantity: updatedQuantity,
        lastUpdated: new Date().toISOString(),
        expiryDate: form.expiryDate || inventoryItem.expiryDate || null,
      });
      setInventory((current) =>
        current.map((item) =>
          item.id === inventoryItem.id
            ? { ...item, quantity: updatedQuantity, lastUpdated: new Date().toISOString(), expiryDate: form.expiryDate || inventoryItem.expiryDate || null }
            : item
        )
      );
    } else {
      const newInventoryId = await currentDB.inventory.add({
        productId: selectedProduct.id,
        quantity: form.quantity,
        lowStockThreshold: 5,
        lastUpdated: new Date().toISOString(),
        expiryDate: form.expiryDate || null,
      });
      setInventory((current) => [
        ...current,
        {
          id: newInventoryId,
          productId: selectedProduct.id,
          quantity: form.quantity,
          lowStockThreshold: 5,
          lastUpdated: new Date().toISOString(),
        },
      ]);
    }
    setForm((current) => ({ ...current, quantity: '', costPrice: '', note: '' }));
  };

  const deletePurchase = async (purchase) => {
    if (!purchase.id) return;
    const confirmed = window.confirm('Delete this purchase record?');
    if (!confirmed) return;

    const currentDB = getDB(activeBusiness);
    await currentDB.purchases.delete(purchase.id);
    setPurchases((current) => current.filter((item) => item.id !== purchase.id));

    const inventoryItem = await currentDB.inventory.where('productId').equals(purchase.productId).first();
    if (inventoryItem && inventoryItem.id) {
      const updatedQuantity = Math.max(0, inventoryItem.quantity - purchase.quantity);
      await currentDB.inventory.update(inventoryItem.id, { quantity: updatedQuantity, lastUpdated: new Date().toISOString() });
      setInventory((current) =>
        current.map((item) =>
          item.id === inventoryItem.id ? { ...item, quantity: updatedQuantity, lastUpdated: new Date().toISOString() } : item
        )
      );
    }
  };

  const deleteSelected = async () => {
    if (selectedCount === 0) return;
    const confirmed = window.confirm(`Delete ${selectedCount} purchase records? This will NOT reverse inventory.`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const currentDB = getDB(activeBusiness);
      // Use bulk delete for better performance
      await currentDB.purchases.bulkDelete(selectedIds);
      setPurchases((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
      clearSelection();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Purchases" description="Record restocks and print purchase reports" />
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel">
        <form onSubmit={savePurchase} className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                <span>Product</span>
                <select
                  value={form.productId}
                  onChange={(event) => setForm((current) => ({ ...current, productId: Number(event.target.value) }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500"
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>Supplier</span>
                <select
                  value={form.supplierId}
                  onChange={(event) => setForm((current) => ({ ...current, supplierId: Number(event.target.value) }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500"
                >
                  <option value={0}>No supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                <span>Quantity</span>
                <input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) }))}
                  onFocus={e => e.target.select()}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500"
                  required
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>Cost Price</span>
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  value={form.costPrice}
                  onChange={(event) => setForm((current) => ({ ...current, costPrice: Number(event.target.value) }))}
                  onFocus={e => e.target.select()}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500"
                  required
                />
              </label>
            </div>
            <label className="space-y-2 text-sm text-slate-700">
              <span>Date</span>
              <input
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500"
                required
              />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span>Expiry Date (optional)</span>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(event) => setForm((current) => ({ ...current, expiryDate: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span>Note</span>
              <textarea
                value={form.note}
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                rows={3}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500"
              />
            </label>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Total cost</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(totalCost, currency)}</p>
              </div>
              <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700">
                <Plus className="h-4 w-4" />
                Record Purchase
              </button>
            </div>
          </div>
        </form>
      </div>

      <PrintWrapper title="Purchase Report" printLabel="Purchase Report">
        <div className="overflow-x-auto overflow-y-auto max-h-[58vh] rounded-xl border border-slate-200">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-slate-700">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Unit Cost</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id} className={isSelected(purchase.id) ? 'bg-red-50' : 'border-b border-slate-200'}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected(purchase.id)}
                      onChange={() => toggleOne(purchase.id)}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">{formatDate(purchase.date)}</td>
                  <td className="px-4 py-3">{purchase.productName}</td>
                  <td className="px-4 py-3">{purchase.supplier || 'N/A'}</td>
                  <td className="px-4 py-3">{purchase.quantity}</td>
                  <td className="px-4 py-3">{formatCurrency(purchase.costPrice, currency)}</td>
                  <td className="px-4 py-3">{formatCurrency(purchase.totalCost, currency)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => deletePurchase(purchase)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PrintWrapper>

      <BulkDeleteBar
        selectedCount={selectedCount}
        onDelete={deleteSelected}
        onCancel={clearSelection}
        itemLabel="purchase"
        isDeleting={isDeleting}
      />
    </div>
  );
}