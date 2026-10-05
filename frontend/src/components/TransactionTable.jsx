import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

export default function TransactionTable({ transactions, onEdit, onDelete, compact = false }) {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-gray-500 text-sm mb-4">No transactions yet.</p>
      </div>
    );
  }

  const list = compact ? transactions.slice(0, 8) : transactions;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
            <th className="pb-3 font-medium">Date</th>
            <th className="pb-3 font-medium">Description</th>
            <th className="pb-3 font-medium">Category</th>
            <th className="pb-3 font-medium">Type</th>
            <th className="pb-3 font-medium text-right">Amount</th>
            {!compact && <th className="pb-3 font-medium text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {list.map(t => (
            <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
              <td className="py-3 text-gray-600 whitespace-nowrap">{formatDate(t.transaction_date)}</td>
              <td className="py-3 text-gray-900 max-w-[200px] truncate">{t.description || '—'}</td>
              <td className="py-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {t.category_name || 'Uncategorized'}
                </span>
              </td>
              <td className="py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  t.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                  {t.type === 'income' ? 'Income' : t.type === 'expense' ? 'Expense' : 'Transfer'}
                </span>
              </td>
              <td className={`py-3 text-right font-semibold whitespace-nowrap ${
                t.type === 'income' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
              </td>
              {!compact && (
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {onEdit && (
                      <button onClick={() => onEdit(t)} className="text-gray-400 hover:text-primary-600 px-1.5 py-1 rounded" title="Edit">
                        ✏️
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={() => onDelete(t)} className="text-gray-400 hover:text-red-600 px-1.5 py-1 rounded" title="Delete">
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
