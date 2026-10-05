const db = require('../config/db');
const { toCSV } = require('../utils/csv');
const { getMonthlyTotals, getCategoryTotals } = require('../utils/calculations');

const exportTransactions = (req, res) => {
  try {
    const { start_date, end_date, type, category_id } = req.query;
    let query = `
      SELECT t.id, t.amount, t.type, c.name as category, t.description, t.transaction_date,
             t.payment_method, t.account, t.is_recurring, t.created_at
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;
    const params = [req.userId];
    if (start_date) { query += ' AND t.transaction_date >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND t.transaction_date <= ?'; params.push(end_date); }
    if (type) { query += ' AND t.type = ?'; params.push(type); }
    if (category_id) { query += ' AND t.category_id = ?'; params.push(category_id); }
    query += ' ORDER BY t.transaction_date DESC';

    const transactions = db.prepare(query).all(...params);
    const csv = toCSV(transactions, ['id', 'amount', 'type', 'category', 'description', 'transaction_date', 'payment_method', 'account', 'is_recurring', 'created_at']);

    const monthLabel = start_date ? start_date.slice(0, 7) : 'all';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=personal-finance-${monthLabel}.csv`);
    res.send(csv);
  } catch (err) {
    console.error('Export transactions error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const generateMonthlyReport = (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const startDate = `${targetMonth}-01`;
    const endDate = `${targetMonth}-31`;

    const transactions = db.prepare(`
      SELECT t.*, c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.transaction_date >= ? AND t.transaction_date <= ?
    `).all(req.userId, startDate, endDate);

    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const savings = income - expenses;
    const savingsRate = income > 0 ? Math.round((savings / income) * 10000) / 100 : 0;

    const categorySpending = getCategoryTotals(transactions);

    const budgets = db.prepare(`
      SELECT b.*, c.name as category_name
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ? AND b.start_date <= ? AND b.end_date >= ?
    `).all(req.userId, endDate, startDate).map(b => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category_id === b.category_id)
        .reduce((s, t) => s + t.amount, 0);
      return {
        category: b.category_name,
        limit: b.amount,
        spent,
        remaining: Math.max(0, b.amount - spent),
        utilization: b.amount > 0 ? Math.round((spent / b.amount) * 10000) / 100 : 0
      };
    });

    res.json({
      report: {
        month: targetMonth,
        income,
        expenses,
        savings,
        savings_rate: savingsRate,
        transaction_count: transactions.length,
        category_spending: categorySpending,
        budgets,
        transactions
      }
    });
  } catch (err) {
    console.error('Generate monthly report error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const exportMonthlyReport = (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const startDate = `${targetMonth}-01`;
    const endDate = `${targetMonth}-31`;

    const transactions = db.prepare(`
      SELECT t.id, t.amount, t.type, c.name as category, t.description, t.transaction_date, t.payment_method
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.transaction_date >= ? AND t.transaction_date <= ?
      ORDER BY t.transaction_date ASC
    `).all(req.userId, startDate, endDate);

    const csv = toCSV(transactions, ['id', 'amount', 'type', 'category', 'description', 'transaction_date', 'payment_method']);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=monthly-report-${targetMonth}.csv`);
    res.send(csv);
  } catch (err) {
    console.error('Export monthly report error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

module.exports = { exportTransactions, generateMonthlyReport, exportMonthlyReport };
