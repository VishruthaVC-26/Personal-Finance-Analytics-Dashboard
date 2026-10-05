const db = require('../config/db');
const {
  getMonthlyTotals,
  getCategoryTotals,
  calculateSavingsRate,
  calculateBudgetUtilization,
  getBudgetStatus,
  generateInsights
} = require('../utils/calculations');

const getSummary = (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let dateFilter = '';
    const params = [req.userId];
    if (start_date) { dateFilter += ' AND transaction_date >= ?'; params.push(start_date); }
    if (end_date) { dateFilter += ' AND transaction_date <= ?'; params.push(end_date); }

    const totals = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses
      FROM transactions
      WHERE user_id = ?${dateFilter}
    `).get(...params);

    const netSavings = totals.total_income - totals.total_expenses;
    const savingsRate = calculateSavingsRate(totals.total_income, totals.total_expenses);

    const monthCountRow = db.prepare(`
      SELECT COUNT(DISTINCT substr(transaction_date, 1, 7)) as months
      FROM transactions WHERE user_id = ? AND type = 'expense'${dateFilter}
    `).get(...params);

    const months = monthCountRow.months || 1;
    const avgMonthlyExpense = totals.total_expenses / months;

    res.json({
      summary: {
        total_income: totals.total_income,
        total_expenses: totals.total_expenses,
        net_savings: netSavings,
        savings_rate: savingsRate,
        avg_monthly_expense: avgMonthlyExpense,
        transaction_count: db.prepare(`SELECT COUNT(*) as c FROM transactions WHERE user_id = ?${dateFilter}`).get(...params).c
      }
    });
  } catch (err) {
    console.error('Get summary error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const getMonthly = (req, res) => {
  try {
    const transactions = db.prepare(`
      SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date ASC
    `).all(req.userId);

    const monthly = getMonthlyTotals(transactions);
    const withRate = monthly.map(m => ({
      ...m,
      savings_rate: calculateSavingsRate(m.income, m.expenses)
    }));

    res.json({ monthly: withRate });
  } catch (err) {
    console.error('Get monthly error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const getCategories = (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = `
      SELECT t.*, c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.type = 'expense'
    `;
    const params = [req.userId];
    if (start_date) { query += ' AND t.transaction_date >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND t.transaction_date <= ?'; params.push(end_date); }

    const transactions = db.prepare(query).all(...params);
    const categories = getCategoryTotals(transactions);
    const totalExpense = categories.reduce((s, c) => s + c.amount, 0);
    const withPercent = categories.map(c => ({
      ...c,
      percentage: totalExpense > 0 ? Math.round((c.amount / totalExpense) * 10000) / 100 : 0
    }));

    res.json({ categories: withPercent, total_expense: totalExpense });
  } catch (err) {
    console.error('Get categories analytics error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const getCashFlow = (req, res) => {
  try {
    const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date ASC').all(req.userId);
    const monthly = getMonthlyTotals(transactions);
    const cashFlow = monthly.map(m => ({
      month: m.month,
      cash_flow: m.income - m.expenses,
      income: m.income,
      expenses: m.expenses
    }));

    const totalFlow = cashFlow.reduce((s, c) => s + c.cash_flow, 0);
    const avgFlow = cashFlow.length > 0 ? totalFlow / cashFlow.length : 0;

    res.json({
      cash_flow: cashFlow,
      average_cash_flow: avgFlow,
      total_cash_flow: totalFlow
    });
  } catch (err) {
    console.error('Get cash flow error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const getSavings = (req, res) => {
  try {
    const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date ASC').all(req.userId);
    const monthly = getMonthlyTotals(transactions);

    const savingsTrend = monthly.map(m => ({
      month: m.month,
      savings: m.savings,
      savings_rate: calculateSavingsRate(m.income, m.expenses)
    }));

    const totalSavings = monthly.reduce((s, m) => s + m.savings, 0);

    res.json({ savings_trend: savingsTrend, total_savings: totalSavings });
  } catch (err) {
    console.error('Get savings error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const getInsights = (req, res) => {
  try {
    const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC').all(req.userId);
    const monthly = getMonthlyTotals(transactions);

    const now = new Date();
    const currentMonthKey = now.toISOString().slice(0, 7);
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = prevDate.toISOString().slice(0, 7);

    const currentMonth = monthly.find(m => m.month === currentMonthKey) || monthly[monthly.length - 1];
    const previousMonth = monthly.find(m => m.month === prevMonthKey);

    const budgets = db.prepare(`
      SELECT b.*, c.name as category_name
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ?
    `).all(req.userId).map(b => {
      const spent = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as spent FROM transactions
        WHERE user_id = ? AND category_id = ? AND type = 'expense'
          AND transaction_date >= ? AND transaction_date <= ?
      `).get(req.userId, b.category_id, b.start_date, b.end_date);
      return {
        ...b,
        spent: spent.spent,
        utilization: calculateBudgetUtilization(spent.spent, b.amount),
        status: getBudgetStatus(calculateBudgetUtilization(spent.spent, b.amount))
      };
    });

    const goals = db.prepare('SELECT * FROM goals WHERE user_id = ? AND status = ?').all(req.userId, 'active')
      .map(g => ({ ...g, progress: calculateGoalProgressSafe(g.current_amount, g.target_amount) }));

    const insights = generateInsights(currentMonth, previousMonth, budgets, goals);

    if (insights.length === 0) {
      insights.push({
        type: 'info',
        title: 'Getting Started',
        message: 'Add a few transactions to start seeing your financial insights.'
      });
    }

    res.json({ insights });
  } catch (err) {
    console.error('Get insights error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

function calculateGoalProgressSafe(current, target) {
  if (target === 0) return 0;
  return Math.round((current / target) * 10000) / 100;
}

module.exports = { getSummary, getMonthly, getCategories, getCashFlow, getSavings, getInsights };
