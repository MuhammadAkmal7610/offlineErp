import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { useSettings } from '@/hooks/useSettings';
import { useBusiness } from '@/contexts/BusinessContext';
import { initDB, getDB } from '@/lib/db';

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

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure your shop preferences" />
      
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Shop Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                <span>Shop Name</span>
                <input
                  value={form.shopName}
                  onChange={(e) => setForm((current) => ({ ...current, shopName: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500"
                  placeholder="Enter shop name"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>Currency Symbol</span>
                <input
                  value={form.currency}
                  onChange={(e) => setForm((current) => ({ ...current, currency: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500"
                  placeholder="e.g. Rs, $, PKR"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>Phone Number</span>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500"
                  placeholder="Enter phone number"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>Address</span>
                <input
                  value={form.address}
                  onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500"
                  placeholder="Enter shop address"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Save Settings
            </button>
            {saved && (
              <span className="text-green-600 text-sm font-medium">✓ Settings saved successfully!</span>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Current Configuration</h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Shop Name:</span>
            <span className="font-medium text-slate-900">{settings?.shopName || 'Not set'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Currency:</span>
            <span className="font-medium text-slate-900">{settings?.currency || 'Not set'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Address:</span>
            <span className="font-medium text-slate-900">{settings?.address || 'Not set'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-500">Phone:</span>
            <span className="font-medium text-slate-900">{settings?.phone || 'Not set'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
