const db = require('../config/db');
const { generateId } = require('../utils/helpers');
const { calculateGoalProgress } = require('../utils/calculations');

const getGoals = (req, res) => {
  try {
    const goals = db.prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
    const enriched = goals.map(g => ({
      ...g,
      progress: calculateGoalProgress(g.current_amount, g.target_amount),
      remaining: Math.max(0, g.target_amount - g.current_amount)
    }));
    res.json({ goals: enriched });
  } catch (err) {
    console.error('Get goals error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const createGoal = (req, res) => {
  try {
    const { name, target_amount, current_amount, target_date } = req.body;

    if (!name) return res.status(400).json({ error: 'Goal name is required.' });
    if (!target_amount || target_amount <= 0) return res.status(400).json({ error: 'Target amount must be greater than 0.' });
    if (current_amount !== undefined && current_amount < 0) {
      return res.status(400).json({ error: 'Current amount cannot be negative.' });
    }

    const id = generateId();
    db.prepare('INSERT INTO goals (id, user_id, name, target_amount, current_amount, target_date) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, req.userId, name, target_amount, current_amount || 0, target_date || null);

    const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
    res.status(201).json({
      goal: { ...goal, progress: calculateGoalProgress(goal.current_amount, goal.target_amount) }
    });
  } catch (err) {
    console.error('Create goal error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const updateGoal = (req, res) => {
  try {
    const { name, target_amount, current_amount, target_date, status } = req.body;
    const existing = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: 'Goal not found.' });

    if (target_amount !== undefined && target_amount <= 0) {
      return res.status(400).json({ error: 'Target amount must be greater than 0.' });
    }
    if (current_amount !== undefined && current_amount < 0) {
      return res.status(400).json({ error: 'Current amount cannot be negative.' });
    }

    db.prepare(`
      UPDATE goals SET
        name = COALESCE(?, name),
        target_amount = COALESCE(?, target_amount),
        current_amount = COALESCE(?, current_amount),
        target_date = COALESCE(?, target_date),
        status = COALESCE(?, status),
        updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(name, target_amount, current_amount, target_date, status, req.params.id, req.userId);

    const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id);
    res.json({
      goal: { ...goal, progress: calculateGoalProgress(goal.current_amount, goal.target_amount) }
    });
  } catch (err) {
    console.error('Update goal error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const deleteGoal = (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: 'Goal not found.' });

    db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ message: 'Goal deleted successfully.' });
  } catch (err) {
    console.error('Delete goal error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

module.exports = { getGoals, createGoal, updateGoal, deleteGoal };
