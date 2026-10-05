const { generateId, hashPassword } = require('../utils/helpers');
const db = require('../config/db');

async function seed() {
  console.log('Seeding database...');

  const existing = db.prepare("SELECT id FROM users WHERE email = 'demo@pfd.com'").get();
  if (existing) {
    console.log('Demo user already exists. Skipping seed.');
    return;
  }

  const userId = generateId();
  const passwordHash = await hashPassword('demo123');

  db.prepare('INSERT INTO users (id, name, email, password_hash, currency) VALUES (?, ?, ?, ?, ?)')
    .run(userId, 'Demo User', 'demo@pfd.com', passwordHash, 'INR');

  const cats = [
    ['Rent', 'expense', 1], ['Utilities', 'expense', 1], ['Groceries', 'expense', 1],
    ['Transportation', 'expense', 1], ['Restaurants', 'expense', 1], ['Shopping', 'expense', 1],
    ['Entertainment', 'expense', 1], ['Subscriptions', 'expense', 1], ['Healthcare', 'expense', 1],
    ['Travel', 'expense', 1], ['Personal', 'expense', 1], ['Miscellaneous', 'expense', 1],
    ['Salary', 'income', 1], ['Freelance', 'income', 1], ['Interest', 'income', 1],
  ];

  const catMap = {};
  const insertCat = db.prepare('INSERT INTO categories (id, user_id, name, type, is_default) VALUES (?, ?, ?, ?, ?)');
  cats.forEach(([name, type, isDef]) => {
    const id = generateId();
    insertCat.run(id, userId, name, type, isDef);
    catMap[name] = id;
  });

  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }

  const insertTx = db.prepare(`
    INSERT INTO transactions (id, user_id, amount, type, category_id, description, transaction_date, payment_method, account, is_recurring)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const expenseTemplates = [
    ['Rent', 15000, 'Monthly rent', 'Bank Transfer'],
    ['Groceries', 3500 + Math.floor(Math.random() * 2000), 'Grocery shopping', 'UPI'],
    ['Restaurants', 1200 + Math.floor(Math.random() * 1500), 'Restaurant', 'UPI'],
    ['Transportation', 800 + Math.floor(Math.random() * 700), 'Fuel / Cab', 'UPI'],
    ['Utilities', 2000 + Math.floor(Math.random() * 500), 'Electricity / Internet', 'Bank Transfer'],
    ['Entertainment', 500 + Math.floor(Math.random() * 800), 'Movies / Games', 'UPI'],
    ['Shopping', 1500 + Math.floor(Math.random() * 2500), 'Shopping', 'Card'],
    ['Subscriptions', 599, 'Netflix + Spotify', 'Card'],
  ];

  months.forEach(month => {
    const day = 1;
    insertTx.run(generateId(), userId, 50000, 'income', catMap['Salary'], 'Monthly salary', `${month}-${String(day).padStart(2, '0')}`, 'Bank Transfer', 'HDFC', 1);

    const randExtra = Math.random();
    if (randExtra > 0.5) {
      insertTx.run(generateId(), userId, 5000 + Math.floor(Math.random() * 10000), 'income', catMap['Freelance'], 'Freelance project', `${month}-15`, 'Bank Transfer', 'HDFC', 0);
    }

    expenseTemplates.forEach(([cat, amt, desc, pm], idx) => {
      const dayNum = 2 + (idx * 3) + Math.floor(Math.random() * 2);
      const maxDay = new Date(parseInt(month.slice(0,4)), parseInt(month.slice(5,7)), 0).getDate();
      const finalDay = Math.min(dayNum, maxDay);
      const variance = cat === 'Rent' ? 0 : (Math.random() * 0.3 - 0.15);
      const amount = Math.round(amt * (1 + variance));
      insertTx.run(generateId(), userId, amount, 'expense', catMap[cat], desc, `${month}-${String(finalDay).padStart(2, '0')}`, pm, 'HDFC', cat === 'Rent' || cat === 'Subscriptions' ? 1 : 0);
    });
  });

  const budgetStart = months[months.length - 1] + '-01';
  const budgetEnd = months[months.length - 1] + '-31';
  const insertBudget = db.prepare('INSERT INTO budgets (id, user_id, category_id, amount, period, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertBudget.run(generateId(), userId, catMap['Groceries'], 8000, 'monthly', budgetStart, budgetEnd);
  insertBudget.run(generateId(), userId, catMap['Restaurants'], 4000, 'monthly', budgetStart, budgetEnd);
  insertBudget.run(generateId(), userId, catMap['Entertainment'], 2000, 'monthly', budgetStart, budgetEnd);
  insertBudget.run(generateId(), userId, catMap['Transportation'], 3000, 'monthly', budgetStart, budgetEnd);
  insertBudget.run(generateId(), userId, catMap['Shopping'], 5000, 'monthly', budgetStart, budgetEnd);

  const insertGoal = db.prepare('INSERT INTO goals (id, user_id, name, target_amount, current_amount, target_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const goalDate = new Date(now.getFullYear() + 1, now.getMonth(), 15).toISOString().slice(0, 10);
  insertGoal.run(generateId(), userId, 'Emergency Fund', 100000, 45000, goalDate, 'active');
  insertGoal.run(generateId(), userId, 'New Laptop', 80000, 22000, goalDate, 'active');
  insertGoal.run(generateId(), userId, 'Vacation Fund', 50000, 12000, goalDate, 'active');

  console.log('Seed complete!');
  console.log('Login with: demo@pfd.com / demo123');
}

seed().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
