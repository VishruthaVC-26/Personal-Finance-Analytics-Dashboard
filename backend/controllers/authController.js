const db = require('../config/db');
const { generateId, hashPassword, comparePassword, signToken, setTokenCookie } = require('../utils/helpers');

const DEFAULT_CATEGORIES = [
  { name: 'Rent', type: 'expense' },
  { name: 'Utilities', type: 'expense' },
  { name: 'Groceries', type: 'expense' },
  { name: 'Transportation', type: 'expense' },
  { name: 'Healthcare', type: 'expense' },
  { name: 'Education', type: 'expense' },
  { name: 'Restaurants', type: 'expense' },
  { name: 'Shopping', type: 'expense' },
  { name: 'Entertainment', type: 'expense' },
  { name: 'Travel', type: 'expense' },
  { name: 'Subscriptions', type: 'expense' },
  { name: 'Savings', type: 'expense' },
  { name: 'Investments', type: 'expense' },
  { name: 'Insurance', type: 'expense' },
  { name: 'Loan Payment', type: 'expense' },
  { name: 'Gifts', type: 'expense' },
  { name: 'Personal', type: 'expense' },
  { name: 'Miscellaneous', type: 'expense' },
  { name: 'Salary', type: 'income' },
  { name: 'Freelance', type: 'income' },
  { name: 'Business', type: 'income' },
  { name: 'Interest', type: 'income' },
  { name: 'Dividends', type: 'income' },
  { name: 'Allowance', type: 'income' },
  { name: 'Gifts', type: 'income' },
  { name: 'Other', type: 'income' }
];

const register = async (req, res) => {
  try {
    const { name, email, password, currency } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const id = generateId();
    const passwordHash = await hashPassword(password);
    const userCurrency = currency || 'INR';

    db.prepare('INSERT INTO users (id, name, email, password_hash, currency) VALUES (?, ?, ?, ?, ?)')
      .run(id, name, email.toLowerCase(), passwordHash, userCurrency);

    const insertCat = db.prepare('INSERT INTO categories (id, user_id, name, type, is_default) VALUES (?, ?, ?, ?, 1)');
    DEFAULT_CATEGORIES.forEach(cat => {
      insertCat.run(generateId(), id, cat.name, cat.type);
    });

    const token = signToken(id);
    setTokenCookie(res, token);
    res.status(201).json({
      user: { id, name, email: email.toLowerCase(), currency: userCurrency }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }

    const token = signToken(user.id);
    setTokenCookie(res, token);
    res.json({
      user: { id: user.id, name: user.name, email: user.email, currency: user.currency }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully.' });
};

const getProfile = (req, res) => {
  const user = db.prepare('SELECT id, name, email, currency, created_at FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user });
};

const updateProfile = async (req, res) => {
  try {
    const { name, currency } = req.body;
    const updates = [];
    const params = [];
    if (name) { updates.push('name = ?'); params.push(name); }
    if (currency) { updates.push('currency = ?'); params.push(currency); }
    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update.' });

    updates.push("updated_at = datetime('now')");
    params.push(req.userId);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const user = db.prepare('SELECT id, name, email, currency FROM users WHERE id = ?').get(req.userId);
    res.json({ user });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    const valid = await comparePassword(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const hash = await hashPassword(newPassword);
    db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hash, req.userId);
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

module.exports = { register, login, logout, getProfile, updateProfile, changePassword };
