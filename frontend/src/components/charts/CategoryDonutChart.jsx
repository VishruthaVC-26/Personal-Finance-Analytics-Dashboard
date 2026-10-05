import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#14b8a6'];

export default function CategoryDonutChart({ data }) {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';

  const chartData = (data || []).slice(0, 8).map(d => ({
    name: d.name,
    value: d.amount,
  }));

  if (!chartData.length) {
    return <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No expense data yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(value, currency)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
