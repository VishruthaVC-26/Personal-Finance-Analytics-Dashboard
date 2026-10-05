import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { monthLabel, formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export default function ExpenseTrendChart({ data }) {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';

  const chartData = (data || []).map(d => ({
    month: monthLabel(d.month),
    Expenses: d.expenses,
    Savings: d.savings,
  }));

  if (!chartData.length) {
    return <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No data yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => formatCurrency(v, currency)} />
        <Tooltip
          formatter={(value, name) => [formatCurrency(value, currency), name]}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
        />
        <Line type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="Savings" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
