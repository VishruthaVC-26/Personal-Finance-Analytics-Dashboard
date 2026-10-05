import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { monthLabel, formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export default function SavingsProgressChart({ data }) {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';

  const chartData = (data || []).map(d => ({
    month: monthLabel(d.month),
    Savings: d.savings,
    'Savings Rate': d.savings_rate,
  }));

  if (!chartData.length) {
    return <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No data yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => formatCurrency(v, currency)} />
        <Tooltip
          formatter={(value, name) => name === 'Savings Rate' ? [`${value}%`, name] : [formatCurrency(value, currency), name]}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
        />
        <Area type="monotone" dataKey="Savings" stroke="#6366f1" strokeWidth={2.5} fill="url(#savingsGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
