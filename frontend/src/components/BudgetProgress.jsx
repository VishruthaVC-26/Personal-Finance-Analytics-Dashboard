import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

const statusColors = {
  normal: 'bg-emerald-50 text-emerald-700',
  approaching: 'bg-amber-50 text-amber-700',
  near_limit: 'bg-orange-50 text-orange-700',
  over: 'bg-red-50 text-red-700',
};

const statusLabels = {
  normal: 'Normal',
  approaching: 'Approaching limit',
  near_limit: 'Near limit',
  over: 'Over budget',
};

const barColors = {
  normal: 'bg-emerald-500',
  approaching: 'bg-amber-500',
  near_limit: 'bg-orange-500',
  over: 'bg-red-500',
};

export default function BudgetProgress({ budgets }) {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';

  if (!budgets || budgets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">No budgets set yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {budgets.map(b => {
        const pct = Math.min(b.utilization, 100);
        return (
          <div key={b.id}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-700">{b.category_name}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[b.status] || statusColors.normal}`}>
                {statusLabels[b.status] || 'Normal'}
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
              <div
                className={`h-full rounded-full transition-all ${barColors[b.status] || barColors.normal}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatCurrency(b.spent, currency)} of {formatCurrency(b.amount, currency)}</span>
              <span>{b.utilization.toFixed(1)}% used</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
