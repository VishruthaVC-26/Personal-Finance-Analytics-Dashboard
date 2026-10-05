import { useState, useEffect } from 'react';
import { analyticsService } from '../services';
import { formatCurrency, monthLabel } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart';
import CategoryDonutChart from '../components/charts/CategoryDonutChart';
import ExpenseTrendChart from '../components/charts/ExpenseTrendChart';
import CashFlowChart from '../components/charts/CashFlowChart';
import SavingsProgressChart from '../components/charts/SavingsProgressChart';
import TopCategoriesChart from '../components/charts/TopCategoriesChart';

export default function Analytics() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [monthly, setMonthly] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cashFlow, setCashFlow] = useState(null);
  const [savings, setSavings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [mRes, cRes, cfRes, sRes] = await Promise.all([
        analyticsService.getMonthly(),
        analyticsService.getCategories(),
        analyticsService.getCashFlow(),
        analyticsService.getSavings(),
      ]);
      setMonthly(mRes.monthly);
      setCategories(cRes.categories);
      setCashFlow(cfRes);
      setSavings(sRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">Deep dive into your spending patterns and financial trends</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Income vs Expense</h2>
          <IncomeExpenseChart data={monthly} />
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Expense & Savings Trend</h2>
          <ExpenseTrendChart data={monthly} />
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Spending by Category</h2>
          <CategoryDonutChart data={categories} />
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Top Spending Categories</h2>
          <TopCategoriesChart data={categories} />
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Cash Flow</h2>
          <CashFlowChart data={cashFlow?.cash_flow || []} />
          {cashFlow && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Average Cash Flow</p>
                <p className={`text-lg font-bold ${cashFlow.average_cash_flow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(cashFlow.average_cash_flow, currency)}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Total Cash Flow</p>
                <p className={`text-lg font-bold ${cashFlow.total_cash_flow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(cashFlow.total_cash_flow, currency)}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Savings Progress</h2>
          <SavingsProgressChart data={monthly} />
          {savings && (
            <div className="mt-4 bg-primary-50 rounded-lg p-3">
              <p className="text-xs text-primary-700 font-medium">Total Savings</p>
              <p className="text-lg font-bold text-primary-900">{formatCurrency(savings.total_savings, currency)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Monthly Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">Month</th>
                <th className="pb-3 font-medium">Income</th>
                <th className="pb-3 font-medium">Expenses</th>
                <th className="pb-3 font-medium">Savings</th>
                <th className="pb-3 font-medium">Savings Rate</th>
              </tr>
            </thead>
            <tbody>
              {[...monthly].reverse().map(m => (
                <tr key={m.month} className="border-b border-gray-50">
                  <td className="py-3 font-medium text-gray-900">{monthLabel(m.month)}</td>
                  <td className="py-3 text-emerald-600">{formatCurrency(m.income, currency)}</td>
                  <td className="py-3 text-red-600">{formatCurrency(m.expenses, currency)}</td>
                  <td className={`py-3 font-medium ${m.savings >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(m.savings, currency)}
                  </td>
                  <td className="py-3 text-gray-600">{m.savings_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
