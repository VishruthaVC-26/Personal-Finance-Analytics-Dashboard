import { Link } from 'react-router-dom';

const features = [
  { icon: '📊', title: 'Smart Dashboard', desc: 'See income, expenses, savings, and spending trends at a glance.' },
  { icon: '💳', title: 'Transaction Tracking', desc: 'Record income and expenses with categories, dates, and payment methods.' },
  { icon: '🎯', title: 'Budget Management', desc: 'Set monthly budgets and get warned before you overspend.' },
  { icon: '🏆', title: 'Savings Goals', desc: 'Create goals and track your progress toward financial milestones.' },
  { icon: '📈', title: 'Analytics & Insights', desc: 'Understand spending patterns with charts and rule-based insights.' },
  { icon: '📄', title: 'Export Reports', desc: 'Download your financial data as CSV anytime.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">PFD</div>
            <span className="font-bold text-gray-900">Personal Finance</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2">Log in</Link>
            <Link to="/register" className="btn-primary">Get started</Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-primary-600 rounded-full" />
          Personal Finance Analytics Dashboard
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight max-w-3xl mx-auto">
          Understand your money in <span className="text-primary-600">seconds</span>, not spreadsheets.
        </h1>
        <p className="text-lg text-gray-500 mt-6 max-w-2xl mx-auto">
          Track income and expenses, set budgets, monitor savings goals, and see clear visual insights about your financial health.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
          <Link to="/register" className="btn-primary text-base px-8 py-3">Start for free</Link>
          <Link to="/login" className="btn-secondary text-base px-8 py-3">Log in to demo</Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">Try the demo: demo@pfd.com / demo123</p>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">Everything you need to manage your finances</h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">From raw transactions to clear visual insights — all in one dashboard.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="card hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Take control of your financial future</h2>
          <p className="text-gray-500 mb-8">Join users who transformed their financial habits with clear analytics and smart budgeting.</p>
          <Link to="/register" className="btn-primary text-base px-8 py-3">Create your free account</Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Personal Finance Analytics Dashboard. Built for learning and personal use.
        </div>
      </footer>
    </div>
  );
}
