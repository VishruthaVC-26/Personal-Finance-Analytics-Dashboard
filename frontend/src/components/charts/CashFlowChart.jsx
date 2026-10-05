import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { monthLabel, formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export default function CashFlowChart({ data }) {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';

  const chartData = (data || []).map(d => ({
    month: monthLabel(d.month),
    'Cash Flow': d.cash_flow,
  }));

  if (!chartData.length) {
    return <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No data yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => formatCurrency(v, currency)} />
        <Tooltip
          formatter={(value) => formatCurrency(value, currency)}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
        />
        <ReferenceLine y={0} stroke="#94a3b8" />
        <Bar dataKey="Cash Flow" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry['Cash Flow'] >= 0 ? '#10b981' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
