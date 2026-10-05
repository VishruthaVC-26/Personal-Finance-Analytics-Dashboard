import { useState, useEffect } from 'react';
import { goalService } from '../services';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import EmptyState from '../components/EmptyState';

export default function Goals() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    target_date: ''
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const data = await goalService.getAll();
      setGoals(data.goals);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const target = parseFloat(form.target_amount);
    const current = parseFloat(form.current_amount) || 0;
    if (!target || target <= 0) { alert('Target amount must be greater than 0.'); return; }
    if (current < 0) { alert('Current amount cannot be negative.'); return; }

    try {
      if (editing) {
        await goalService.update(editing.id, {
          name: form.name,
          target_amount: target,
          current_amount: current,
          target_date: form.target_date || null
        });
      } else {
        await goalService.create({
          name: form.name,
          target_amount: target,
          current_amount: current,
          target_date: form.target_date || null
        });
      }
      setShowForm(false);
      setEditing(null);
      resetForm();
      loadGoals();
    } catch (err) {
      alert(err.response?.data?.error || 'Something went wrong.');
    }
  };

  const resetForm = () => setForm({ name: '', target_amount: '', current_amount: '', target_date: '' });

  const handleEdit = (g) => {
    setEditing(g);
    setForm({
      name: g.name,
      target_amount: String(g.target_amount),
      current_amount: String(g.current_amount),
      target_date: g.target_date || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (g) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      await goalService.delete(g.id);
      loadGoals();
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
          <h1 className="text-2xl font-bold text-gray-900">Savings Goals</h1>
          <p className="text-sm text-gray-500">Track progress toward your financial milestones</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ Add Goal</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : goals.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="🏆"
            title="No goals yet"
            message="Create savings goals to stay motivated and track your progress."
            actionLabel="+ Create Your First Goal"
            onAction={openNew}
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map(g => (
            <div key={g.id} className="card flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{g.name}</h3>
                  {g.target_date && (
                    <p className="text-xs text-gray-500 mt-0.5">Target: {formatDate(g.target_date)}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(g)} className="text-gray-400 hover:text-primary-600 text-sm">✏️</button>
                  <button onClick={() => handleDelete(g)} className="text-gray-400 hover:text-red-600 text-sm">🗑️</button>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-end justify-between mb-1">
                  <span className="text-2xl font-bold text-gray-900">{g.progress.toFixed(0)}%</span>
                  <span className="text-sm text-gray-500">
                    {formatCurrency(g.current_amount, currency)} / {formatCurrency(g.target_amount, currency)}
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      g.progress >= 100 ? 'bg-emerald-500' : g.progress >= 50 ? 'bg-primary-500' : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min(g.progress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {g.progress >= 100
                    ? '🎉 Goal completed!'
                    : `${formatCurrency(g.remaining, currency)} remaining`}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <label className="text-xs font-medium text-gray-500 block mb-1">Quick update</label>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const input = e.target.amount.value;
                    const val = parseFloat(input);
                    if (!val || val < 0) return;
                    try {
                      await goalService.update(g.id, { current_amount: val });
                      loadGoals();
                    } catch (err) {
                      alert('Update failed.');
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="number"
                    name="amount"
                    placeholder="New amount"
                    step="0.01"
                    min="0"
                    className="input-field flex-1 py-1.5 text-xs"
                  />
                  <button type="submit" className="btn-primary py-1.5 px-3 text-xs">Save</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editing ? 'Edit Goal' : 'Add Goal'}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="label">Goal Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. Emergency Fund"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Target Amount ({currency})</label>
                  <input
                    type="number"
                    value={form.target_amount}
                    onChange={(e) => setForm(p => ({ ...p, target_amount: e.target.value }))}
                    className="input-field"
                    placeholder="100000"
                    step="0.01"
                    min="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="label">Current Amount ({currency})</label>
                  <input
                    type="number"
                    value={form.current_amount}
                    onChange={(e) => setForm(p => ({ ...p, current_amount: e.target.value }))}
                    className="input-field"
                    placeholder="0"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="label">Target Date</label>
                <input
                  type="date"
                  value={form.target_date}
                  onChange={(e) => setForm(p => ({ ...p, target_date: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">{editing ? 'Update Goal' : 'Create Goal'}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
