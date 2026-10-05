import { useState, useEffect } from 'react';
import { reportService } from '../services';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, monthLabel, downloadBlob } from '../utils/formatters';

export default function Reports() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadReport();
  }, [month]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await reportService.getMonthlyReport(month);
      setReport(data.report);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportMonthly = async () => {
    setExporting(true);
    try {
      const blob = await reportService.exportMonthlyCSV(month);
      downloadBlob(blob, `monthly-report-${month}.csv`);
    } catch (err) {
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">Generate and export your financial reports</p>
        </div>
        <div className="flex gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="input-field w-auto"
          />
          <button onClick={handleExportMonthly} disabled={exporting} className="btn-primary">
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : report ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="card">
              <p className="text-sm text-gray-500">Income</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(report.income, currency)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">Expenses</p>
              <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(report.expenses, currency)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">Savings</p>
              <p className={`text-xl font-bold mt-1 ${report.savings >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(report.savings, currency)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">Savings Rate</p>
              <p className="text-xl font-bold text-primary-600 mt-1">{report.savings_rate}%</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Category Spending</h2>
              {report.category_spending.length === 0 ? (
                <p className="text-gray-400 text-sm">No expense data for this month.</p>
              ) : (
                <div className="space-y-3">
                  {report.category_spending.map((c, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{c.name}</span>
                        <span className="text-gray-600">{formatCurrency(c.amount, currency)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${c.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Budget Performance</h2>
              {report.budgets.length === 0 ? (
                <p className="text-gray-400 text-sm">No budgets for this month.</p>
              ) : (
                <div className="space-y-3">
                  {report.budgets.map((b, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{b.category}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(b.spent, currency)} of {formatCurrency(b.limit, currency)}</p>
                      </div>
                      <span className={`text-sm font-semibold ${
                        b.utilization > 100 ? 'text-red-600' :
                        b.utilization >= 90 ? 'text-orange-600' :
                        b.utilization >= 70 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {b.utilization.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Transactions ({report.transaction_count})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Description</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {report.transactions.map(t => (
                    <tr key={t.id} className="border-b border-gray-50">
                      <td className="py-2.5 text-gray-600">{t.transaction_date}</td>
                      <td className="py-2.5 text-gray-900">{t.description || '—'}</td>
                      <td className="py-2.5 text-gray-600">{t.category_name || '—'}</td>
                      <td className="py-2.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          t.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className={`py-2.5 text-right font-medium ${
                        t.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(t.amount, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500">No report data available.</p>
        </div>
      )}
    </div>
  );
}
