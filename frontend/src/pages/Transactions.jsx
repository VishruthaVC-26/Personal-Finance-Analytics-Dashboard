import { useState, useEffect } from 'react';
import { transactionService, categoryService } from '../services';
import { useAuth } from '../context/AuthContext';
import { downloadBlob, todayISO, firstDayOfMonth, lastDayOfMonth } from '../utils/formatters';
import { reportService } from '../services';
import TransactionTable from '../components/TransactionTable';
import TransactionForm from '../components/TransactionForm';
import EmptyState from '../components/EmptyState';

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category_id: '',
    start_date: '',
    end_date: '',
    min_amount: '',
    max_amount: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data.categories);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTransactions = async () => {
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      const data = await transactionService.getAll(params);
      setTransactions(data.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(p => ({ ...p, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', type: '', category_id: '', start_date: '', end_date: '', min_amount: '', max_amount: '' });
  };

  const handleSubmit = async (data) => {
    try {
      if (editing) {
        await transactionService.update(editing.id, data);
      } else {
        await transactionService.create(data);
      }
      setShowForm(false);
      setEditing(null);
      loadTransactions();
    } catch (err) {
      alert(err.response?.data?.error || 'Something went wrong.');
    }
  };

  const handleEdit = (t) => {
    setEditing(t);
    setShowForm(true);
  };

  const handleDelete = async (t) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await transactionService.delete(t.id);
      loadTransactions();
    } catch (err) {
      alert(err.response?.data?.error || 'Something went wrong.');
    }
  };

  const handleExport = async () => {
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      const blob = await reportService.exportTransactionsCSV(params);
      downloadBlob(blob, 'personal-finance-transactions.csv');
    } catch (err) {
      alert('Export failed. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500">Manage your income and expenses</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary">Export CSV</button>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary">+ Add Transaction</button>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search description or category…"
              className="input-field"
            />
          </div>
          <div>
            <select name="type" value={filters.type} onChange={handleFilterChange} className="input-field">
              <option value="">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <select name="category_id" value={filters.category_id} onChange={handleFilterChange} className="input-field">
              <option value="">All categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input type="date" name="start_date" value={filters.start_date} onChange={handleFilterChange} className="input-field" title="Start date" />
            <input type="date" name="end_date" value={filters.end_date} onChange={handleFilterChange} className="input-field" title="End date" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <input type="number" name="min_amount" value={filters.min_amount} onChange={handleFilterChange} placeholder="Min amount" className="input-field" />
          <input type="number" name="max_amount" value={filters.max_amount} onChange={handleFilterChange} placeholder="Max amount" className="input-field" />
          <button onClick={clearFilters} className="btn-secondary">Clear Filters</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon="💳"
            title="No transactions found"
            message={Object.values(filters).some(v => v) ? "No transactions match your filters." : "Add your first transaction to get started."}
            actionLabel={Object.values(filters).some(v => v) ? undefined : "+ Add Transaction"}
            onAction={Object.values(filters).some(v => v) ? undefined : () => { setEditing(null); setShowForm(true); }}
          />
        ) : (
          <TransactionTable
            transactions={transactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editing ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="p-5">
              <TransactionForm
                categories={categories}
                onSubmit={handleSubmit}
                initial={editing}
                onCancel={() => { setShowForm(false); setEditing(null); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
