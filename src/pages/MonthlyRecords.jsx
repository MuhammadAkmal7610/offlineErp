import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useBusiness } from '@/contexts/BusinessContext'

export default function MonthlyRecords() {
  const { db } = useBusiness()
  const [expandedMonth, setExpandedMonth] = useState(null)

  // Get ALL data grouped by month
  const allData = useLiveQuery(async () => {
    if (!db) return null
    const [sales, purchases, expenses] = await Promise.all([
      db.sales.toArray(),
      db.purchases.toArray(),
      db.expenses.toArray(),
    ])

    // Group by month helper
    const groupByMonth = (items) => {
      const groups = {}
      items.forEach(item => {
        const d = new Date(item.date)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (!groups[key]) groups[key] = []
        groups[key].push(item)
      })
      return groups
    }

    const salesByMonth = groupByMonth(sales)
    const purchasesByMonth = groupByMonth(purchases)
    const expensesByMonth = groupByMonth(expenses)

    // Get all unique months
    const allMonths = [...new Set([
      ...Object.keys(salesByMonth),
      ...Object.keys(purchasesByMonth),
      ...Object.keys(expensesByMonth)
    ])].sort().reverse() // newest first

    // Build month summaries
    const monthSummaries = allMonths.map(month => {
      const monthlySales = salesByMonth[month] ?? []
      const monthlyPurchases = purchasesByMonth[month] ?? []
      const monthlyExpenses = expensesByMonth[month] ?? []

      const totalSales = monthlySales.reduce((s, x) => s + (x.totalAmount ?? 0), 0)
      const totalPurchases = monthlyPurchases.reduce((s, x) => s + (x.totalCost ?? 0), 0)
      const totalExpenses = monthlyExpenses.reduce((s, x) => s + (x.amount ?? 0), 0)
      const netProfit = totalSales - totalPurchases - totalExpenses

      const [year, mon] = month.split('-')
      const monthName = new Date(Number(year), Number(mon) - 1).toLocaleString('default', {
        month: 'long', year: 'numeric'
      })

      return {
        key: month,
        monthName,
        sales: monthlySales,
        purchases: monthlyPurchases,
        expenses: monthlyExpenses,
        totalSales,
        totalPurchases,
        totalExpenses,
        netProfit
      }
    })

    // Grand totals
    const grandTotalSales = monthSummaries.reduce((s, m) => s + m.totalSales, 0)
    const grandTotalPurchases = monthSummaries.reduce((s, m) => s + m.totalPurchases, 0)
    const grandTotalExpenses = monthSummaries.reduce((s, m) => s + m.totalExpenses, 0)
    const grandNetProfit = grandTotalSales - grandTotalPurchases - grandTotalExpenses

    return {
      monthSummaries,
      grandTotalSales,
      grandTotalPurchases,
      grandTotalExpenses,
      grandNetProfit
    }
  }, [db])

  const formatCurrency = (amount) => `Rs ${amount.toFixed(2)}`

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-PK', {
      day: 'numeric', month: 'short', year: 'numeric'
    })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Monthly Records</h1>
          <p className="text-gray-500 text-sm">Complete history grouped by month</p>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          🖨 Print All Records
        </button>
      </div>

      {/* Grand Total Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-600 font-medium uppercase">All Time Sales</p>
          <p className="text-2xl font-bold text-green-700">
            {formatCurrency(allData?.grandTotalSales ?? 0)}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-medium uppercase">All Time Purchases</p>
          <p className="text-2xl font-bold text-blue-700">
            {formatCurrency(allData?.grandTotalPurchases ?? 0)}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs text-red-600 font-medium uppercase">All Time Expenses</p>
          <p className="text-2xl font-bold text-red-700">
            {formatCurrency(allData?.grandTotalExpenses ?? 0)}
          </p>
        </div>
        <div className={`border rounded-xl p-4 ${
          (allData?.grandNetProfit ?? 0) >= 0
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-orange-50 border-orange-200'
        }`}>
          <p className="text-xs font-medium text-gray-500 uppercase">Total Net Profit</p>
          <p className={`text-2xl font-bold ${
            (allData?.grandNetProfit ?? 0) >= 0 ? 'text-emerald-700' : 'text-orange-700'
          }`}>
            {formatCurrency(allData?.grandNetProfit ?? 0)}
          </p>
        </div>
      </div>

      {/* Month by Month Records */}
      <div className="space-y-4">
        {allData?.monthSummaries && allData.monthSummaries.map(month => (
          <div key={month.key} className="bg-white rounded-xl border overflow-hidden">

            {/* Month Header — click to expand */}
            <button
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedMonth(
                expandedMonth === month.key ? null : month.key
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-xl">📅</span>
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800">{month.monthName}</p>
                  <p className="text-xs text-gray-400">
                    {month.sales.length} sales · {month.purchases.length} purchases · {month.expenses.length} expenses
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-right">
                <div>
                  <p className="text-xs text-gray-400">Sales</p>
                  <p className="font-semibold text-green-600">{formatCurrency(month.totalSales)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Purchases</p>
                  <p className="font-semibold text-blue-600">{formatCurrency(month.totalPurchases)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Expenses</p>
                  <p className="font-semibold text-red-500">{formatCurrency(month.totalExpenses)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Net Profit</p>
                  <p className={`font-bold text-lg ${month.netProfit >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {formatCurrency(month.netProfit)}
                  </p>
                </div>
                <span className="text-gray-400 text-lg">
                  {expandedMonth === month.key ? '▲' : '▼'}
                </span>
              </div>
            </button>

            {/* Expanded Details */}
            {expandedMonth === month.key && (
              <div className="border-t">

                {/* Sales */}
                {month.sales.length > 0 && (
                  <div className="p-4">
                    <h3 className="font-semibold text-sm text-gray-600 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Sales ({month.sales.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-green-50">
                          <tr>
                            <th className="text-left p-2">Date</th>
                            <th className="text-left p-2">Items</th>
                            <th className="text-left p-2">Customer</th>
                            <th className="text-left p-2">Payment</th>
                            <th className="text-right p-2">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {month.sales.map((sale) => (
                            <tr key={sale.id} className="border-b border-gray-100">
                              <td className="p-2">{formatDate(sale.date)}</td>
                              <td className="p-2">{sale.items?.length ?? 0} items</td>
                              <td className="p-2">{sale.accountName ?? 'Walk-in'}</td>
                              <td className="p-2">{sale.paymentMethod}</td>
                              <td className="p-2 text-right font-medium text-green-600">
                                {formatCurrency(sale.totalAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="font-bold bg-green-50">
                          <tr>
                            <td colSpan={4} className="p-2">Month Total</td>
                            <td className="p-2 text-right text-green-700">
                              {formatCurrency(month.totalSales)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Purchases */}
                {month.purchases.length > 0 && (
                  <div className="p-4 border-t">
                    <h3 className="font-semibold text-sm text-gray-600 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Purchases ({month.purchases.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-blue-50">
                          <tr>
                            <th className="text-left p-2">Date</th>
                            <th className="text-left p-2">Product</th>
                            <th className="text-left p-2">Supplier</th>
                            <th className="text-left p-2">Qty</th>
                            <th className="text-right p-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {month.purchases.map((purchase) => (
                            <tr key={purchase.id} className="border-b border-gray-100">
                              <td className="p-2">{formatDate(purchase.date)}</td>
                              <td className="p-2">{purchase.productName}</td>
                              <td className="p-2">{purchase.supplier ?? 'N/A'}</td>
                              <td className="p-2">{purchase.quantity}</td>
                              <td className="p-2 text-right font-medium text-blue-600">
                                {formatCurrency(purchase.totalCost)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="font-bold bg-blue-50">
                          <tr>
                            <td colSpan={4} className="p-2">Month Total</td>
                            <td className="p-2 text-right text-blue-700">
                              {formatCurrency(month.totalPurchases)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Expenses */}
                {month.expenses.length > 0 && (
                  <div className="p-4 border-t">
                    <h3 className="font-semibold text-sm text-gray-600 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      Expenses ({month.expenses.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-red-50">
                          <tr>
                            <th className="text-left p-2">Date</th>
                            <th className="text-left p-2">Title</th>
                            <th className="text-left p-2">Category</th>
                            <th className="text-right p-2">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {month.expenses.map((expense) => (
                            <tr key={expense.id} className="border-b border-gray-100">
                              <td className="p-2">{formatDate(expense.date)}</td>
                              <td className="p-2">{expense.title}</td>
                              <td className="p-2">{expense.category}</td>
                              <td className="p-2 text-right font-medium text-red-600">
                                {formatCurrency(expense.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="font-bold bg-red-50">
                          <tr>
                            <td colSpan={3} className="p-2">Month Total</td>
                            <td className="p-2 text-right text-red-700">
                              {formatCurrency(month.totalExpenses)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Month Net Summary */}
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-700">
                      {month.monthName} — Net Profit
                    </span>
                    <span className={`text-xl font-bold ${
                      month.netProfit >= 0 ? 'text-emerald-600' : 'text-orange-600'
                    }`}>
                      {formatCurrency(month.netProfit)}
                    </span>
                  </div>
                </div>

              </div>
            )}
          </div>
        ))}

        {(!allData?.monthSummaries || allData.monthSummaries.length === 0) && (
          <div className="bg-white rounded-xl border p-12 text-center">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-gray-500">No records found yet.</p>
            <p className="text-gray-400 text-sm">Start adding sales, purchases and expenses.</p>
          </div>
        )}
      </div>
    </div>
  )
}