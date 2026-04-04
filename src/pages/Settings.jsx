import { useState, useEffect } from 'react';
import { RefreshCw, Download, Upload, Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useSettings } from '@/hooks/useSettings';
import { useBusiness } from '@/contexts/BusinessContext';
import { initDB, getDB, resetDatabase } from '@/lib/db';

export default function Settings() {
  const settings = useSettings();
  const { activeBusiness } = useBusiness();
  const [form, setForm] = useState({
    shopName: settings?.shopName || '',
    currency: settings?.currency || '',
    address: settings?.address || '',
    phone: settings?.phone || '',
  });
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState(null);

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setForm({
        shopName: settings.shopName || '',
        currency: settings.currency || '',
        address: settings.address || '',
        phone: settings.phone || '',
      });
    }
  }, [settings]);

  const handleSave = async (e) => {
    e.preventDefault();
    const currentDB = getDB(activeBusiness);
    
    await currentDB.settings.put({ key: 'shopName', value: form.shopName });
    await currentDB.settings.put({ key: 'currency', value: form.currency });
    await currentDB.settings.put({ key: 'address', value: form.address });
    await currentDB.settings.put({ key: 'phone', value: form.phone });
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = async () => {
    if (!confirm(`Are you sure you want to reset all data for this business? This will restore default products, suppliers, and ${activeBusiness === 'general' ? 'students' : 'customers'}.`)) {
      return;
    }

    setResetting(true);
    try {
      await resetDatabase(activeBusiness);
      setResetDone(true);
      setTimeout(() => setResetDone(false), 5000);
    } catch (error) {
      console.error('Failed to reset database:', error);
      alert('Failed to reset database. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    const preventDefault = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);

    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);

  const handleExportData = async () => {
    setExporting(true);
    try {
      const currentDB = getDB(activeBusiness);
      const exportBusiness = activeBusiness || 'general';
      const exportData = {
        business: exportBusiness,
        exportDate: new Date().toISOString(),
        data: {
          products: await currentDB.products.toArray(),
          inventory: await currentDB.inventory.toArray(),
          purchases: await currentDB.purchases.toArray(),
          sales: await currentDB.sales.toArray(),
          suppliers: await currentDB.suppliers.toArray(),
          expenses: await currentDB.expenses.toArray(),
          students: await currentDB.students.toArray(),
          studentLedger: await currentDB.studentLedger.toArray(),
          salesReturns: await currentDB.salesReturns.toArray(),
          settings: await currentDB.settings.toArray(),
          customers: await currentDB.customers.toArray(),
          customerLedger: await currentDB.customerLedger.toArray(),
        }
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-${exportBusiness}-${new Date().toISOString().substring(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleImportData = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportMessage(null);
    try {
      const fileContent = await file.text();
      const importData = JSON.parse(fileContent);
      
      // Check if business matches, but allow import if business field is missing (backward compatibility)
      if (importData.business && importData.business !== activeBusiness) {
        const confirmed = window.confirm(`Backup is for ${importData.business} business, but you are importing to ${activeBusiness} business. Continue anyway?`);
        if (!confirmed) return;
      }

      const currentDB = getDB(activeBusiness);
      
      // Clear existing data
      await Promise.all([
        currentDB.products.clear(),
        currentDB.inventory.clear(),
        currentDB.purchases.clear(),
        currentDB.sales.clear(),
        currentDB.suppliers.clear(),
        currentDB.expenses.clear(),
        currentDB.students.clear(),
        currentDB.studentLedger.clear(),
        currentDB.salesReturns.clear(),
        currentDB.customers.clear(),
        currentDB.customerLedger.clear(),
      ]);

      // Import new data
      await Promise.all([
        currentDB.products.bulkPut(importData.data.products || []),
        currentDB.inventory.bulkPut(importData.data.inventory || []),
        currentDB.purchases.bulkPut(importData.data.purchases || []),
        currentDB.sales.bulkPut(importData.data.sales || []),
        currentDB.suppliers.bulkPut(importData.data.suppliers || []),
        currentDB.expenses.bulkPut(importData.data.expenses || []),
        currentDB.students.bulkPut(importData.data.students || []),
        currentDB.studentLedger.bulkPut(importData.data.studentLedger || []),
        currentDB.salesReturns.bulkPut(importData.data.salesReturns || []),
        currentDB.customers.bulkPut(importData.data.customers || []),
        currentDB.customerLedger.bulkPut(importData.data.customerLedger || []),
      ]);

      // Import settings
      if (importData.data.settings && Array.isArray(importData.data.settings)) {
        for (const setting of importData.data.settings) {
          await currentDB.settings.put(setting);
        }
      }

      setImportMessage({ type: 'success', text: 'Data imported successfully! Refresh the page to see changes.' });
      setTimeout(() => setImportMessage(null), 5000);
    } catch (error) {
      console.error('Import failed:', error);
      setImportMessage({ type: 'error', text: `Import failed: ${error.message}` });
      setTimeout(() => setImportMessage(null), 5000);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleClearAllData = async () => {
    if (!confirm('Are you sure you want to permanently delete ALL data for this business? This cannot be undone.')) {
      return;
    }

    try {
      const currentDB = getDB(activeBusiness);
      await Promise.all([
        currentDB.products.clear(),
        currentDB.inventory.clear(),
        currentDB.purchases.clear(),
        currentDB.sales.clear(),
        currentDB.suppliers.clear(),
        currentDB.expenses.clear(),
        currentDB.students.clear(),
        currentDB.studentLedger.clear(),
        currentDB.salesReturns.clear(),
        currentDB.customers.clear(),
        currentDB.customerLedger.clear(),
        currentDB.settings.clear(),
      ]);
      setImportMessage({ type: 'success', text: 'All data cleared successfully!' });
      setTimeout(() => { window.location.reload(); }, 2000);
    } catch (error) {
      console.error('Clear failed:', error);
      setImportMessage({ type: 'error', text: `Failed to clear data: ${error.message}` });
      setTimeout(() => setImportMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure your shop preferences" />
      
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4">Shop Information</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Shop Name</span>
                <input
                  value={form.shopName}
                  onChange={(e) => setForm((current) => ({ ...current, shopName: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:bg-white"
                  placeholder="Enter shop name"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Currency Symbol</span>
                <input
                  value={form.currency}
                  onChange={(e) => setForm((current) => ({ ...current, currency: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:bg-white"
                  placeholder="e.g. Rs, $, PKR"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Phone Number</span>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:bg-white"
                  placeholder="Enter phone number"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Address</span>
                <input
                  value={form.address}
                  onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:bg-white"
                  placeholder="Enter shop address"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Settings
            </button>
            {saved && (
              <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Settings saved successfully!
              </span>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-base font-bold text-red-900">Danger Zone</h3>
        </div>
        <p className="text-sm text-red-700 mb-4">
          Resetting will delete ALL data (products, sales, purchases, inventory, {activeBusiness === 'general' ? 'students' : 'customers'}, etc.) for the current business and restore default seed data. This action cannot be undone.
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={handleReset}
            disabled={resetting}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${resetting ? 'animate-spin' : ''}`} />
            {resetting ? 'Resetting...' : `Reset ${activeBusiness === 'general' ? 'General Store' : activeBusiness === 'jaggery' ? 'Jaggery Business' : 'Cosmetics Business'} Data`}
          </button>
          {resetDone && (
            <span className="flex items-center gap-1 text-sm font-medium text-green-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Database reset successfully! Refresh the page to see changes.
            </span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4">Data Management</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Export Button */}
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-slate-200 bg-slate-50 px-6 py-4 text-sm font-semibold text-slate-700 hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className={`h-5 w-5 ${exporting ? 'animate-spin' : ''}`} />
            {exporting ? 'Exporting...' : 'Export All Data'}
          </button>

          {/* Import Button */}
          <label className="flex flex-col items-center gap-3 rounded-xl border-2 border-slate-200 bg-slate-50 px-6 py-4 text-sm font-semibold text-slate-700 hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            <Upload className={`h-5 w-5 ${importing ? 'animate-spin' : ''}`} />
            {importing ? 'Importing...' : 'Import JSON Backup'}
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              disabled={importing}
              className="hidden"
            />
          </label>

          {/* Clear Button */}
          <button
            onClick={handleClearAllData}
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-red-200 bg-red-50 px-6 py-4 text-sm font-semibold text-red-700 hover:border-red-500 hover:bg-red-100 transition-all"
          >
            <Trash2 className="h-5 w-5" />
            Clear All Data
          </button>
        </div>

        {importMessage && (
          <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${
            importMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {importMessage.type === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              )}
            </svg>
            {importMessage.text}
          </div>
        )}
      </div>

      {/* <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4">Current Configuration</h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2.5 px-3 rounded-lg bg-slate-50">
            <span className="text-sm text-slate-500">Shop Name</span>
            <span className="text-sm font-semibold text-slate-900">{settings?.shopName || 'Not set'}</span>
          </div>
          <div className="flex justify-between py-2.5 px-3 rounded-lg bg-slate-50">
            <span className="text-sm text-slate-500">Currency</span>
            <span className="text-sm font-semibold text-slate-900">{settings?.currency || 'Not set'}</span>
          </div>
          <div className="flex justify-between py-2.5 px-3 rounded-lg bg-slate-50">
            <span className="text-sm text-slate-500">Address</span>
            <span className="text-sm font-semibold text-slate-900">{settings?.address || 'Not set'}</span>
          </div>
          <div className="flex justify-between py-2.5 px-3 rounded-lg bg-slate-50">
            <span className="text-sm text-slate-500">Phone</span>
            <span className="text-sm font-semibold text-slate-900">{settings?.phone || 'Not set'}</span>
          </div>
        </div>
      </div> */}
    </div>
  );
}
