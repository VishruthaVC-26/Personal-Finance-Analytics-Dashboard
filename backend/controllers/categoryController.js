const db = require('../config/db');
const { generateId } = require('../utils/helpers');

const getCategories = (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM categories WHERE user_id = ?';
    const params = [req.userId];
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    query += ' ORDER BY is_default DESC, name ASC';
    const categories = db.prepare(query).all(...params);
    res.json({ categories });
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const createCategory = (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Name and type are required.' });
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Type must be income or expense.' });
    }

    const existing = db.prepare('SELECT id FROM categories WHERE user_id = ? AND name = ? AND type = ?')
      .get(req.userId, name, type);
    if (existing) return res.status(400).json({ error: 'Category already exists.' });

    const id = generateId();
    db.prepare('INSERT INTO categories (id, user_id, name, type, is_default) VALUES (?, ?, ?, ?, 0)')
      .run(id, req.userId, name, type);

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    res.status(201).json({ category });
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const updateCategory = (req, res) => {
  try {
    const { name } = req.body;
    const existing = db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: 'Category not found.' });
    if (!name) return res.status(400).json({ error: 'Name is required.' });

    db.prepare("UPDATE categories SET name = ?, created_at = created_at WHERE id = ? AND user_id = ?")
      .run(name, req.params.id, req.userId);

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    res.json({ category });
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const deleteCategory = (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: 'Category not found.' });

    db.prepare('UPDATE transactions SET category_id = NULL WHERE category_id = ?').run(req.params.id);
    db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
