const db = require('../config/db');
const { generateId } = require('../utils/helpers');

const getTransactions = (req, res) => {
  try {
    const { search, type, category_id, start_date, end_date, payment_method, min_amount, max_amount } = req.query;

    let query = `
      SELECT t.*, c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;
    const params = [req.userId];

    if (search) {
      query += ' AND (t.description LIKE ? OR c.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (type) { query += ' AND t.type = ?'; params.push(type); }
    if (category_id) { query += ' AND t.category_id = ?'; params.push(category_id); }
    if (start_date) { query += ' AND t.transaction_date >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND t.transaction_date <= ?'; params.push(end_date); }
    if (payment_method) { query += ' AND t.payment_method = ?'; params.push(payment_method); }
    if (min_amount) { query += ' AND t.amount >= ?'; params.push(parseFloat(min_amount)); }
    if (max_amount) { query += ' AND t.amount <= ?'; params.push(parseFloat(max_amount)); }

    query += ' ORDER BY t.transaction_date DESC, t.created_at DESC';

    const transactions = db.prepare(query).all(...params);
    res.json({ transactions });
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const getTransaction = (req, res) => {
  const transaction = db.prepare(`
    SELECT t.*, c.name as category_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ? AND t.user_id = ?
  `).get(req.params.id, req.userId);

  if (!transaction) return res.status(404).json({ error: 'Transaction not found.' });
  res.json({ transaction });
};

const createTransaction = (req, res) => {
  try {
    const { amount, type, category_id, description, transaction_date, payment_method, account, is_recurring } = req.body;

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Please enter a valid amount.' });
    if (!type || !['income', 'expense', 'transfer'].includes(type)) {
      return res.status(400).json({ error: 'Please select a valid transaction type.' });
    }
    if (!transaction_date) return res.status(400).json({ error: 'Please select a date.' });

    if (category_id) {
      const cat = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?').get(category_id, req.userId);
      if (!cat) return res.status(400).json({ error: 'Category not found.' });
    }

    const id = generateId();
    db.prepare(`
      INSERT INTO transactions (id, user_id, amount, type, category_id, description, transaction_date, payment_method, account, is_recurring)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.userId, amount, type, category_id || null, description || '', transaction_date, payment_method || null, account || null, is_recurring ? 1 : 0);

    const transaction = db.prepare(`
      SELECT t.*, c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(id);

    res.status(201).json({ transaction });
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const updateTransaction = (req, res) => {
  try {
    const { amount, type, category_id, description, transaction_date, payment_method, account, is_recurring } = req.body;

    const existing = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: 'Transaction not found.' });

    if (amount !== undefined && amount <= 0) return res.status(400).json({ error: 'Please enter a valid amount.' });

    db.prepare(`
      UPDATE transactions SET
        amount = COALESCE(?, amount),
        type = COALESCE(?, type),
        category_id = COALESCE(?, category_id),
        description = COALESCE(?, description),
        transaction_date = COALESCE(?, transaction_date),
        payment_method = COALESCE(?, payment_method),
        account = COALESCE(?, account),
        is_recurring = COALESCE(?, is_recurring),
        updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(
      amount, type, category_id || undefined, description, transaction_date,
      payment_method || undefined, account || undefined,
      is_recurring !== undefined ? (is_recurring ? 1 : 0) : undefined,
      req.params.id, req.userId
    );

    const transaction = db.prepare(`
      SELECT t.*, c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(req.params.id);

    res.json({ transaction });
  } catch (err) {
    console.error('Update transaction error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const deleteTransaction = (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: 'Transaction not found.' });

    db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ message: 'Transaction deleted successfully.' });
  } catch (err) {
    console.error('Delete transaction error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

module.exports = { getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction };
