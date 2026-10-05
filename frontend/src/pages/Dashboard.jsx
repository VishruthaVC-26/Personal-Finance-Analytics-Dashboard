import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService, budgetService, transactionService, categoryService } from '../services';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, monthLabel, firstDayOfMonth, lastDayOfMonth } from '../utils/formatters';
import KPICard from '../components/KPICard';
import TransactionTable from '../components/TransactionTable';
import BudgetProgress from '../components/BudgetProgress';
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart';
import CategoryDonutChart from '../components/charts/CategoryDonutChart';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';

  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [insights, setInsights] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const start = firstDayOfMonth();
      const end = lastDayOfMonth();

      const [sumRes, monthlyRes, catRes, budgetRes, insightRes, txRes] = await Promise.all([
        analyticsService.getSummary({ start_date: start, end_date: end }),
        analyticsService.getMonthly(),
        analyticsService.getCategories({ start_date: start, end_date: end }),
        budgetService.getAll(),
        analyticsService.getInsights(),
        transactionService.getAll(),
      ]);

      setSummary(sumRes.summary);
      setMonthly(monthlyRes.monthly);
      setCategoryData(catRes.categories);
      setBudgets(budgetRes.budgets.filter(b => b.is_current));
      setInsights(insightRes.insights);
      setRecentTx(txRes.transactions.slice(0, 8));
    } catch (err) {
      console.error('Dashboard load error:', err);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Your financial overview for {monthLabel(new Date().toISOString().slice(0, 7))}</p>
        </div>
        <Link to="/transactions" className="btn-primary">+ Add Transaction</Link>
      </div>

      {(!summary || summary.transaction_count === 0) ? (
        <div className="card">
          <EmptyState
            icon="📊"
            title="No transactions yet"
            message="Add a few transactions to start seeing your financial analytics."
            actionLabel="+ Add Your First Transaction"
            onAction={() => window.location.href = '/transactions'}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Net Balance"
              value={formatCurrency(summary.net_savings, currency)}
              icon="💰"
              color={summary.net_savings >= 0 ? 'green' : 'red'}
            />
            <KPICard
              title="Income"
              value={formatCurrency(summary.total_income, currency)}
              icon="📈"
              color="green"
            />
            <KPICard
              title="Expenses"
              value={formatCurrency(summary.total_expenses, currency)}
              icon="📉"
              color="red"
            />
            <KPICard
              title="Savings Rate"
              value={`${summary.savings_rate}%`}
              icon="🎯"
              color="primary"
              subtitle={`Avg expense: ${formatCurrency(summary.avg_monthly_expense, currency)}/mo`}
            />
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Income vs Expense</h2>
              <Link to="/analytics" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all →</Link>
            </div>
            <IncomeExpenseChart data={monthly.slice(-6)} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Spending by Category</h2>
              <CategoryDonutChart data={categoryData} />
            </div>
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Budget Progress</h2>
                <Link to="/budgets" className="text-sm text-primary-600 hover:text-primary-700 font-medium">Manage →</Link>
              </div>
              <BudgetProgress budgets={budgets} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Recent Transactions</h2>
              <Link to="/transactions" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all →</Link>
            </div>
            <TransactionTable transactions={recentTx} compact />
          </div>

          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Financial Insights</h2>
            <div className="space-y-3">
              {insights.map((ins, i) => (
                <div key={i} className={`flex gap-3 p-3 rounded-lg ${
                  ins.type === 'positive' ? 'bg-emerald-50' : ins.type === 'warning' ? 'bg-amber-50' : 'bg-primary-50'
                }`}>
                  <span className="text-lg">
                    {ins.type === 'positive' ? '✅' : ins.type === 'warning' ? '⚠️' : 'ℹ️'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ins.title}</p>
                    <p className="text-sm text-gray-600">{ins.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
