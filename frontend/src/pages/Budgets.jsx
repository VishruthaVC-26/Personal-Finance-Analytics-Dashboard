import { useState, useEffect } from 'react';
import { budgetService, categoryService } from '../services';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import BudgetProgress from '../components/BudgetProgress';
import EmptyState from '../components/EmptyState';

export default function Budgets() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    category_id: '',
    amount: '',
    period: 'monthly',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bRes, cRes] = await Promise.all([budgetService.getAll(), categoryService.getAll({ type: 'expense' })]);
      setBudgets(bRes.budgets);
      setCategories(cRes.categories);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { alert('Please enter a valid amount.'); return; }
    if (!form.category_id) { alert('Please select a category.'); return; }
    if (!form.start_date || !form.end_date) { alert('Please select dates.'); return; }
    if (form.start_date > form.end_date) { alert('Start date must be before end date.'); return; }

    try {
      if (editing) {
        await budgetService.update(editing.id, { amount, period: form.period, start_date: form.start_date, end_date: form.end_date });
      } else {
        await budgetService.create(form);
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Something went wrong.');
    }
  };

  const resetForm = () => {
    const now = new Date();
    setForm({
      category_id: '',
      amount: '',
      period: 'monthly',
      start_date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
      end_date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`
    });
  };

  const handleEdit = (b) => {
    setEditing(b);
    setForm({
      category_id: b.category_id,
      amount: String(b.amount),
      period: b.period,
      start_date: b.start_date,
      end_date: b.end_date
    });
    setShowForm(true);
  };

  const handleDelete = async (b) => {
    if (!window.confirm('Delete this budget?')) return;
    try {
      await budgetService.delete(b.id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Something went wrong.');
    }
  };

  const openNew = () => {
    setEditing(null);
    resetForm();
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          <p className="text-sm text-gray-500">Set spending limits and track your progress</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ Add Budget</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="🎯"
            title="No budgets yet"
            message="Create monthly budgets for your spending categories to stay on track."
            actionLabel="+ Create Your First Budget"
            onAction={openNew}
          />
        </div>
      ) : (
        <>
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-5">Budget Overview</h2>
            <BudgetProgress budgets={budgets} />
          </div>

          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">All Budgets</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Limit</th>
                    <th className="pb-3 font-medium">Spent</th>
                    <th className="pb-3 font-medium">Remaining</th>
                    <th className="pb-3 font-medium">Utilization</th>
                    <th className="pb-3 font-medium">Period</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map(b => (
                    <tr key={b.id} className="border-b border-gray-50">
                      <td className="py-3 font-medium text-gray-900">{b.category_name}</td>
                      <td className="py-3 text-gray-600">{formatCurrency(b.amount, currency)}</td>
                      <td className="py-3 text-gray-600">{formatCurrency(b.spent, currency)}</td>
                      <td className="py-3 text-gray-600">{formatCurrency(b.remaining, currency)}</td>
                      <td className="py-3">
                        <span className={`font-medium ${
                          b.utilization > 100 ? 'text-red-600' :
                          b.utilization >= 90 ? 'text-orange-600' :
                          b.utilization >= 70 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {b.utilization.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 capitalize">{b.period}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(b)} className="text-gray-400 hover:text-primary-600 px-1.5">✏️</button>
                          <button onClick={() => handleDelete(b)} className="text-gray-400 hover:text-red-600 px-1.5">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editing ? 'Edit Budget' : 'Add Budget'}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="label">Category</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm(p => ({ ...p, category_id: e.target.value }))}
                  className="input-field"
                  disabled={!!editing}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Budget Limit ({currency})</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. 8000"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
              <div>
                <label className="label">Period</label>
                <select
                  value={form.period}
                  onChange={(e) => setForm(p => ({ ...p, period: e.target.value }))}
                  className="input-field"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm(p => ({ ...p, start_date: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm(p => ({ ...p, end_date: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">{editing ? 'Update Budget' : 'Create Budget'}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
