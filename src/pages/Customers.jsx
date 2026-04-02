import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, BookOpen, Edit, Trash2 } from 'lucide-react';
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

      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Search by name, phone, email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] border rounded-lg px-4 py-2"
        />
        <button
          onClick={() => {
            setEditCustomer(null);
            setAddModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{customer.name}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{customer.phone}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{customer.email || '-'}</td>
                <td className={`px-4 py-3 text-sm font-medium ${getBalanceColor(customer.balance)}`}>
                  {formatCurrency(customer.balance, currency)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/customers/${customer.id}`)}
                      className="text-blue-600 hover:text-blue-800"
                      title="View Khata"
                    >
                      <BookOpen className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditCustomer(customer)}
                      className="text-gray-600 hover:text-gray-800"
                      title="Edit Customer"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setConfirmDelete(true);
                      }}
                      className="text-red-600 hover:text-red-800"
                      title="Delete Customer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCustomers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No customers found
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
    openingBalance: 0,
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
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Customer Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="mt-1 block w-full border rounded-md px-3 py-2"
                placeholder="e.g. Ahmad Khan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="mt-1 block w-full border rounded-md px-3 py-2"
                placeholder="e.g. 0312-1234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="mt-1 block w-full border rounded-md px-3 py-2"
                placeholder="Optional"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address 
                <span className="text-gray-400 font-normal text-xs"> (optional)</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="mt-1 block w-full border rounded-md px-3 py-2"
                placeholder="Home or business address"
              />
            </div>

            {!customer && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Opening Balance (Rs)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.openingBalance}
                  onChange={(e) => setFormData({...formData, openingBalance: Number(e.target.value)})}
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  placeholder="0"
                />
                <p className="text-xs text-gray-400 mt-1">
                  If customer already owes money, enter amount here
                </p>
              </div>
            )}
          </div>

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