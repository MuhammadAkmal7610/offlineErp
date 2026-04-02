import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import PageHeader from '@/components/PageHeader';
import StatsCard from '@/components/StatsCard';
import DashboardCharts from '@/components/DashboardCharts';
import { initDB, getDB } from '@/lib/db';
import { useSettings } from '@/hooks/useSettings';
import { useBusiness } from '@/contexts/BusinessContext';
import { formatCurrency, formatDate, calculateNetProfit } from '@/lib/utils';

const categoryColors = {
  Biscuits: '#2563eb',
  Chocolates: '#f97316',
  Beverages: '#14b8a6',
  Snacks: '#e11d48',
  Dairy: '#8b5cf6',
};

export default function Dashboard() {
  const { activeBusiness, businessName, businessIcon, businessColor } = useBusiness();
  const settings = useSettings();
  const currency = settings?.currency ?? 'Rs';
  const db = getDB(activeBusiness);
  // Debug log to check if Dashboard renders and what data is loaded
  console.log('Dashboard rendered', { activeBusiness, businessName, settings });

  const parseDate = (value) => {
    try {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const cleanupInvalidSaleDates = async () => {
      await initDB(activeBusiness);
      const currentDB = getDB(activeBusiness);
      const sales = await currentDB.sales.toArray();
      const invalidSales = sales.filter((sale) => {
        const date = parseDate(sale.date);
        return date === null;
      });
      if (invalidSales.length > 0) {
        await Promise.all(
          invalidSales.map((sale) =>
            sale.id ? currentDB.sales.update(sale.id, { date: new Date().toISOString() }) : Promise.resolve(0)
          )
        );
      }
    };
    cleanupInvalidSaleDates();
  }, [activeBusiness]);

  const dashboardData = useLiveQuery(
    async () => {
      await initDB(activeBusiness);
      const currentDB = getDB(activeBusiness);
      const [salesData, purchaseData, expenseData, inventoryData, productsData, studentsData, studentLedgerData] = await Promise.all([
        currentDB.sales.toArray(),
        currentDB.purchases.toArray(),
        currentDB.expenses.toArray(),
        currentDB.inventory.toArray(),
        currentDB.products.toArray(),
        currentDB.students.toArray(),
        currentDB.studentLedger.toArray(),
      ]);

      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const todaySales = salesData.filter((sale) => {
        const saleDate = parseDate(sale.date);
        if (!saleDate) return false;
        return (
          saleDate.getDate() === startOfToday.getDate() &&
          saleDate.getMonth() === startOfToday.getMonth() &&
          saleDate.getFullYear() === startOfToday.getFullYear()
        );
      });

      const salesThisMonth = salesData.filter((sale) => {
        const saleDate = parseDate(sale.date);
        if (!saleDate) return false;
        return (
          saleDate.getMonth() === startOfMonth.getMonth() &&
          saleDate.getFullYear() === startOfMonth.getFullYear()
        );
      });

      const purchasesThisMonth = purchaseData.filter((purchase) => {
        const purchaseDate = new Date(purchase.date);
        return purchaseDate >= startOfMonth && purchaseDate <= endOfMonth;
      });

      const expensesThisMonth = expenseData.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startOfMonth && expenseDate <= endOfMonth;
      });

      const purchasedProductIds = new Set(purchaseData.map((purchase) => purchase.productId));
      const lowStockCount = inventoryData.filter((item) => {
        const hasPreviousStock = purchasedProductIds.has(item.productId);
        return (
          (item.quantity > 0 && item.quantity <= item.lowStockThreshold) ||
          (item.quantity === 0 && hasPreviousStock)
        );
      }).length;

      const netProfitThisMonth = calculateNetProfit(salesThisMonth, productsData, expensesThisMonth);

      const linePoints = {};
      for (let offset = 29; offset >= 0; offset -= 1) {
        const date = new Date();
        date.setDate(date.getDate() - offset);
        linePoints[date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] = 0;
      }
      salesData.forEach((sale) => {
        const saleDate = parseDate(sale.date);
        if (!saleDate) return;
        const label = saleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (label in linePoints) {
          linePoints[label] += sale.totalAmount;
        }
      });
      const lineData = Object.entries(linePoints).map(([name, value]) => ({ name, value }));

      const months = {};
      for (let i = 0; i < 6; i += 1) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        months[label] = { revenue: 0, expense: 0 };
      }
      salesData.forEach((sale) => {
        const saleDate = parseDate(sale.date);
        if (!saleDate) return;
        const label = saleDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (months[label]) months[label].revenue += sale.totalAmount;
      });
      expenseData.forEach((expense) => {
        const expenseDate = parseDate(expense.date);
        if (!expenseDate) return;
        const label = expenseDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (months[label]) months[label].expense += expense.amount;
      });
      const barData = Object.entries(months)
        .map(([name, values]) => ({ name, ...values }))
        .reverse();

      const categoryTotals = {};
      salesData.forEach((sale) => {
        sale.items.forEach((item) => {
          const product = productsData.find((product) => product.id === item.productId);
          const category = product?.category ?? 'Other';
          categoryTotals[category] = (categoryTotals[category] || 0) + item.subtotal;
        });
      });
      const pieData = Object.entries(categoryTotals)
        .map(([name, value]) => ({ name, value, fill: categoryColors[name] || '#0f172a' }))
        .slice(0, 6);

      const recentTransactions = [
        ...salesData.map((sale) => ({
          type: 'Sale',
          date: sale.date,
          amount: sale.totalAmount,
          label: `${sale.items.length} item(s)`,
        })),
        ...purchaseData.map((purchase) => ({
          type: 'Purchase',
          date: purchase.date,
          amount: purchase.totalCost,
          label: purchase.productName,
        })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      const studentBalances = studentsData.map(student => {
        const ledger = studentLedgerData.filter(e => e.studentId === student.id);
        const totalCharged = ledger
          .filter(e => e.type === 'charge' || e.type === 'purchase')
          .reduce((sum, e) => sum + e.amount, 0);
        const totalPaid = ledger
          .filter(e => e.type === 'payment')
          .reduce((sum, e) => sum + e.amount, 0);
        return {
          studentId: student.id,
          balance: totalCharged - totalPaid
        };
      });

      const totalStudentBalance = studentBalances
        .filter(s => s.balance > 0)
        .reduce((sum, s) => sum + s.balance, 0);

      const studentsWithBalance = studentBalances.filter(s => s.balance > 0).length;

      return {
        salesData,
        purchaseData,
        expenseData,
        inventoryData,
        productsData,
        studentsData,
        studentLedgerData,
        todaySales,
        salesThisMonth,
        purchasesThisMonth,
        expensesThisMonth,
        lowStockCount,
        netProfitThisMonth,
        lineData,
        barData,
        pieData,
        recentTransactions,
        totalStudentBalance,
        studentsWithBalance,
      };
    },
    [activeBusiness]
  );

  // Loading and error fallback
  if (dashboardData === undefined) {
    return <div style={{ padding: 32, textAlign: 'center' }}>Loading dashboard data...</div>;
  }
  if (dashboardData === null) {
    return <div style={{ padding: 32, color: 'red', textAlign: 'center' }}>Error loading dashboard data.</div>;
  }

  // Default fallback if useLiveQuery returns nullish (shouldn't happen, but for safety)
  const {
    todaySales = [],
    salesThisMonth = [],
    purchasesThisMonth = [],
    expensesThisMonth = [],
    lowStockCount = 0,
    netProfitThisMonth = 0,
    productsData: products = [],
    lineData = [],
    barData = [],
    pieData = [],
    recentTransactions = [],
    totalStudentBalance = 0,
    studentsWithBalance = 0,
  } = dashboardData || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{businessIcon}</span>
        <div>
          <p className="text-sm text-slate-500">Active Business</p>
          <h1 className="text-xl font-bold text-slate-900">{businessName}</h1>
        </div>
      </div>
      <PageHeader title="Dashboard" description="Revenue overview and live inventory insights" />
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Sales Today" value={formatCurrency(todaySales.reduce((acc, sale) => acc + sale.totalAmount, 0), currency)} description={`${todaySales.length} transaction(s)`} />
        <StatsCard title="Sales This Month" value={formatCurrency(salesThisMonth.reduce((acc, sale) => acc + sale.totalAmount, 0), currency)} description={`${salesThisMonth.length} sales recorded`} />
        <StatsCard title="Purchases This Month" value={formatCurrency(purchasesThisMonth.reduce((acc, purchase) => acc + purchase.totalCost, 0), currency)} description={`${purchasesThisMonth.length} restocks`} />
        <StatsCard title="Net Profit" value={formatCurrency(netProfitThisMonth, currency)} description="Revenue minus cost and expenses" />
        <StatsCard title="Low Stock Alerts" value={`${lowStockCount}`} description="Products under threshold" />
        <StatsCard title="Total Products" value={`${products.length}`} description="Active product SKUs" />
        <StatsCard title="Student Balances" value={formatCurrency(totalStudentBalance, currency)} description={`${studentsWithBalance} students owe money`} />
      </div>

      <DashboardCharts lineData={lineData} barData={barData} pieData={pieData} currency={currency} />

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Recent Transactions</h3>
          </div>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-slate-500">No recent activity yet.</p>
            ) : (
              recentTransactions.map((txn, index) => (
                <div key={`${txn.type}-${index}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{txn.type}</p>
                    <p className="text-sm text-slate-500">{formatDate(txn.date)}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-sm text-slate-600">
                    <p>{txn.label}</p>
                    <p>{formatCurrency(txn.amount, currency)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}