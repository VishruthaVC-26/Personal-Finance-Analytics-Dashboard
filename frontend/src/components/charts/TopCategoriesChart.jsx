import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export default function TopCategoriesChart({ data }) {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';

  const chartData = (data || []).slice(0, 6).map(d => ({
    name: d.name,
    Amount: d.amount,
  }));

  if (!chartData.length) {
    return <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No data yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => formatCurrency(v, currency)} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" width={100} />
        <Tooltip
          formatter={(value) => formatCurrency(value, currency)}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
        />
        <Bar dataKey="Amount" fill="#6366f1" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
