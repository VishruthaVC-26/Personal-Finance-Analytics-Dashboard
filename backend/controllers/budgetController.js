const db = require('../config/db');
const { generateId } = require('../utils/helpers');
const { calculateBudgetUtilization, getBudgetStatus } = require('../utils/calculations');

const getBudgets = (req, res) => {
  try {
    const budgets = db.prepare(`
      SELECT b.*, c.name as category_name, c.type as category_type
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ?
      ORDER BY b.start_date DESC
    `).all(req.userId);

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    const enriched = budgets.map(b => {
      const spentRow = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as spent
        FROM transactions
        WHERE user_id = ? AND category_id = ? AND type = 'expense'
          AND transaction_date >= ? AND transaction_date <= ?
      `).get(req.userId, b.category_id, b.start_date, b.end_date);

      const spent = spentRow.spent;
      const utilization = calculateBudgetUtilization(spent, b.amount);
      return {
        ...b,
        spent,
        remaining: Math.max(0, b.amount - spent),
        utilization,
        status: getBudgetStatus(utilization),
        is_current: b.start_date.slice(0, 7) === currentMonth
      };
    });

    res.json({ budgets: enriched });
  } catch (err) {
    console.error('Get budgets error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const createBudget = (req, res) => {
  try {
    const { category_id, amount, period, start_date, end_date } = req.body;

    if (!category_id) return res.status(400).json({ error: 'Category is required.' });
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Budget amount must be greater than 0.' });
    if (!start_date || !end_date) return res.status(400).json({ error: 'Start date and end date are required.' });
    if (start_date > end_date) return res.status(400).json({ error: 'Start date must be before end date.' });

    const cat = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?').get(category_id, req.userId);
    if (!cat) return res.status(400).json({ error: 'Category not found.' });

    const id = generateId();
    db.prepare('INSERT INTO budgets (id, user_id, category_id, amount, period, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, req.userId, category_id, amount, period || 'monthly', start_date, end_date);

    const budget = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id);
    res.status(201).json({ budget });
  } catch (err) {
    console.error('Create budget error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const updateBudget = (req, res) => {
  try {
    const { amount, period, start_date, end_date } = req.body;
    const existing = db.prepare('SELECT * FROM budgets WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: 'Budget not found.' });

    if (amount !== undefined && amount <= 0) return res.status(400).json({ error: 'Budget amount must be greater than 0.' });

    db.prepare(`
      UPDATE budgets SET
        amount = COALESCE(?, amount),
        period = COALESCE(?, period),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date)
      WHERE id = ? AND user_id = ?
    `).run(amount, period, start_date, end_date, req.params.id, req.userId);

    const budget = db.prepare('SELECT * FROM budgets WHERE id = ?').get(req.params.id);
    res.json({ budget });
  } catch (err) {
    console.error('Update budget error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const deleteBudget = (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM budgets WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: 'Budget not found.' });

    db.prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ message: 'Budget deleted successfully.' });
  } catch (err) {
    console.error('Delete budget error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget };
