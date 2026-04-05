import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, BookOpen, Edit, Trash2 } from 'lucide-react';
import BulkDeleteBar from '@/components/BulkDeleteBar';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import StatsCard from '@/components/StatsCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import { initDB, getDB } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';
import { useSettings } from '@/hooks/useSettings';
import { useBusiness } from '@/contexts/BusinessContext';

export default function Customers() {
  const navigate = useNavigate();
  const { activeBusiness } = useBusiness();
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState(0);
  const settings = useSettings();
  const currency = settings?.currency ?? 'Rs';

  useEffect(() => {
    loadCustomers();
  }, [activeBusiness]);

  const loadCustomers = async () => {
    await initDB(activeBusiness);
    const currentDB = getDB(activeBusiness);
    const customersData = await currentDB.customers.toArray();

    const customersWithBalance = await Promise.all(
      customersData.map(async (customer) => {
        const ledger = await currentDB.customerLedger.where('customerId').equals(customer.id).toArray();
        const totalCharged = ledger
          .filter(e => e.type === 'charge' || e.type === 'purchase')
          .reduce((sum, e) => sum + e.amount, 0);
        const totalPaid = ledger
          .filter(e => e.type === 'payment')
          .reduce((sum, e) => sum + e.amount, 0);
        return {
          ...customer,
          balance: totalCharged - totalPaid,
          totalPaid
        };
      })
    );

    setCustomers(customersWithBalance);
  };

  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query) ||
        (customer.email && customer.email.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [customers, searchQuery]);

  const totalCustomers = customers.length;
  const totalOwed = customers.reduce((sum, c) => sum + Math.max(0, c.balance), 0);
  const totalPaid = customers.reduce((sum, c) => sum + c.totalPaid, 0);

  const getBalanceColor = (balance) => {
    if (balance === 0) return 'text-green-600';
    if (balance <= 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleEditCustomer = (customer) => {
    setEditCustomer(customer);
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer?.id) return;
    const currentDB = getDB(activeBusiness);
    await currentDB.customers.delete(selectedCustomer.id);
    await currentDB.customerLedger.where('customerId').equals(selectedCustomer.id).delete();
    setCustomers((current) => current.filter((c) => c.id !== selectedCustomer.id));
    setConfirmDelete(false);
    setSelectedCustomer(null);
  };

  // Toggle single customer selection
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
      setSelectedIds(filteredCustomers?.map(c => c.id) ?? []);
      setSelectAll(true);
    }
  };

  // Delete selected customers - PERMANENT ELECTRON FIX
  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const confirm = window.confirm(
      `Delete ${selectedIds.length} selected customers? This cannot be undone.`
    );
    if (!confirm) return;

    // Show loading immediately
    setIsDeleting(true);
    setDeletionProgress(0);
    
    // Use setTimeout to ensure UI updates before heavy operations
    setTimeout(async () => {
      try {
        const currentDB = getDB(activeBusiness);
        
        // Process in smaller batches to prevent blocking
        const batchSize = 25; // Smaller batch size for Electron
        const batches = [];
        
        for (let i = 0; i < selectedIds.length; i += batchSize) {
          batches.push(selectedIds.slice(i, i + batchSize));
        }
        
        // Process batches with delays to keep UI responsive
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          
          // Delete customers batch
          await currentDB.customers.bulkDelete(batch);
          
          // Delete corresponding ledger entries
          const ledgerPromises = batch.map(id => 
            currentDB.customerLedger.where('customerId').equals(id).delete()
          );
          await Promise.all(ledgerPromises);
          
          // Update progress
          const progress = Math.round(((i + 1) / batches.length) * 100);
          setDeletionProgress(progress);
          
          // Longer delay to allow UI updates in Electron
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Final update
        setCustomers(prev => prev.filter(c => !selectedIds.includes(c.id)));
        setSelectedIds([]);
        setSelectAll(false);
        setDeletionProgress(100);
        
        // Success message
        setTimeout(() => {
          alert(`Successfully deleted ${selectedIds.length} customers!`);
          setDeletionProgress(0);
        }, 500);
        
      } catch (error) {
        console.error('Delete error:', error);
        alert('Error deleting customers. Please try again.');
      } finally {
        setIsDeleting(false);
        setDeletionProgress(0);
      }
    }, 200); // 200ms delay to ensure loading state shows in Electron
  };

  // Update selectAll when filteredCustomers or selectedIds change
  useEffect(() => {
    const allSelected = filteredCustomers.length > 0 && filteredCustomers.every(c => selectedIds.includes(c.id));
    setSelectAll(allSelected);
  }, [filteredCustomers, selectedIds]);

  const handleSaveCustomer = async (formData, isEdit = false) => {
    const currentDB = getDB(activeBusiness);
    
    if (isEdit && formData.id) {
      await currentDB.customers.update(formData.id, {
        name: formData.name,
        phone: formData.phone || '',
        email: formData.email || '',
        address: formData.address || '',
      });
      setCustomers((current) =>
        current.map((c) =>
          c.id === formData.id ? { ...c, ...formData } : c
        )
      );
    } else {
      const customerId = await currentDB.customers.add({
        name: formData.name,
        phone: formData.phone || '',
        email: formData.email || '',
        address: formData.address || '',
        createdAt: new Date().toISOString()
      });

      if (formData.openingBalance && formData.openingBalance > 0) {
        await currentDB.customerLedger.add({
          customerId,
          type: 'charge',
          amount: Number(formData.openingBalance),
          description: 'Opening balance',
          date: new Date().toISOString()
        });
      }
      
      await loadCustomers();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Manage customer accounts and credit tracking" />

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total Customers"
          value={totalCustomers.toString()}
          description="Active customer accounts"
        />
        <StatsCard
          title="Total Owed"
          value={formatCurrency(totalOwed, currency)}
          description="Outstanding balances"
        />
        <StatsCard
          title="Total Paid"
          value={formatCurrency(totalPaid, currency)}
          description="Payments received"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:bg-white"
            />
          </div>
          <button
            onClick={() => {
              setEditCustomer(null);
              setAddModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto overflow-y-auto max-h-[58vh] rounded-xl border border-slate-200">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Balance</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className={selectedIds.includes(customer.id) ? 'bg-red-50 hover:bg-red-100 transition-colors' : 'hover:bg-slate-50 transition-colors'}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(customer.id)}
                      onChange={() => toggleSelect(customer.id)}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-slate-900">{customer.name}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{customer.phone}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{customer.email || '-'}</td>
                  <td className={`px-4 py-3 text-sm font-bold ${getBalanceColor(customer.balance)}`}>
                    {formatCurrency(customer.balance, currency)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/customers/${customer.id}`)}
                        className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 transition-colors"
                        title="View Khata"
                      >
                        <BookOpen className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditCustomer(customer)}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 transition-colors"
                        title="Edit Customer"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {!selectedIds.includes(customer.id) ? (
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setConfirmDelete(true);
                          }}
                          className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredCustomers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <svg className="h-12 w-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm">No customers found</p>
          </div>
        )}
      </div>

      {(addModalOpen || editCustomer) && (
        <CustomerModal
          customer={editCustomer}
          onClose={() => {
            setAddModalOpen(false);
            setEditCustomer(null);
          }}
          onSave={(formData) => {
            handleSaveCustomer(formData, !!editCustomer);
            setAddModalOpen(false);
            setEditCustomer(null);
          }}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete customer"
        description="This will remove the customer and all their ledger entries. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDeleteCustomer}
      />

      {/* Enhanced Loading Overlay */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-sm mx-4">
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Deleting Customers</h3>
              <p className="text-sm text-gray-600 mb-3">
                Please wait while we delete {selectedIds.length} customers...
              </p>
              {deletionProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${deletionProgress}%` }}
                  ></div>
                </div>
              )}
              <p className="text-xs text-gray-500">
                {deletionProgress > 0 ? `${deletionProgress}% complete` : 'Initializing...'}
              </p>
            </div>
          </div>
        </div>
      )}

      <BulkDeleteBar
        selectedCount={selectedIds.length}
        onDelete={deleteSelected}
        onCancel={() => { setSelectedIds([]); setSelectAll(false); }}
        itemLabel="customer"
        isDeleting={isDeleting}
      />
    </div>
  );
}

function CustomerModal({ customer, onClose, onSave }) {
  const [formData, setFormData] = useState({
    id: customer?.id || null,
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || '',
    openingBalance: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{customer ? 'Edit Customer' : 'Add New Customer'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="mt-1 block w-full border rounded-md px-3 py-2"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="mt-1 block w-full border rounded-md px-3 py-2"
              placeholder="e.g. 0312-1234567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="mt-1 block w-full border rounded-md px-3 py-2"
              placeholder="e.g. john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="mt-1 block w-full border rounded-md px-3 py-2"
              rows={3}
              placeholder="Home address"
            />
          </div>

          {!customer && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Opening Balance (Rs)</label>
              <input
                type="number"
                min="1"
                value={formData.openingBalance}
                onChange={(e) => setFormData({...formData, openingBalance: Number(e.target.value)})}
                onFocus={e => e.target.select()}
                className="mt-1 block w-full border rounded-md px-3 py-2"
                placeholder=""
              />
              <p className="text-xs text-gray-400 mt-1">
                If customer already owes money, enter amount here
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              {customer ? 'Update Customer' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
