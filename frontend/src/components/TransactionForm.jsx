import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

export default function TransactionForm({ categories, onSubmit, initial, onCancel }) {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';

  const [form, setForm] = useState({
    type: 'expense',
    amount: '',
    category_id: '',
    description: '',
    transaction_date: new Date().toISOString().slice(0, 10),
    payment_method: '',
    account: '',
    is_recurring: false
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initial) {
      setForm({
        type: initial.type,
        amount: String(initial.amount),
        category_id: initial.category_id || '',
        description: initial.description || '',
        transaction_date: initial.transaction_date,
        payment_method: initial.payment_method || '',
        account: initial.account || '',
        is_recurring: !!initial.is_recurring
      });
    }
  }, [initial]);

  const filteredCategories = categories.filter(c => c.type === form.type);

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: inputType === 'checkbox' ? checked : value,
      ...(name === 'type' ? { category_id: '' } : {})
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (!form.category_id) {
      setError('Please select a category.');
      return;
    }
    if (!form.transaction_date) {
      setError('Please select a date.');
      return;
    }

    onSubmit({
      ...form,
      amount,
      is_recurring: form.is_recurring ? 1 : 0
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Type</label>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, type: 'expense', category_id: '' }))}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                form.type === 'expense' ? 'bg-red-50 text-red-700' : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, type: 'income', category_id: '' }))}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                form.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        <div>
          <label className="label">Amount ({currency})</label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            className="input-field"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Category</label>
          <select name="category_id" value={form.category_id} onChange={handleChange} className="input-field" required>
            <option value="">Select category</option>
            {filteredCategories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Date</label>
          <input
            type="date"
            name="transaction_date"
            value={form.transaction_date}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <input
          type="text"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="e.g. Grocery shopping"
          className="input-field"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Payment Method</label>
          <select name="payment_method" value={form.payment_method} onChange={handleChange} className="input-field">
            <option value="">Select method</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Net Banking">Net Banking</option>
          </select>
        </div>

        <div>
          <label className="label">Account</label>
          <input
            type="text"
            name="account"
            value={form.account}
            onChange={handleChange}
            placeholder="e.g. HDFC"
            className="input-field"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          name="is_recurring"
          checked={form.is_recurring}
          onChange={handleChange}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        This is a recurring transaction
      </label>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1">
          {initial ? 'Update Transaction' : 'Add Transaction'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
