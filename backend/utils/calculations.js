const getMonthlyTotals = (transactions) => {
  const map = {};
  transactions.forEach(t => {
    const month = t.transaction_date.slice(0, 7);
    if (!map[month]) map[month] = { income: 0, expenses: 0, savings: 0 };
    if (t.type === 'income') map[month].income += t.amount;
    if (t.type === 'expense') map[month].expenses += t.amount;
  });
  Object.values(map).forEach(m => { m.savings = m.income - m.expenses; });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));
};

const getCategoryTotals = (transactions) => {
  const map = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const key = t.category_name || 'Uncategorized';
      map[key] = (map[key] || 0) + t.amount;
    });
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .map(([name, amount]) => ({ name, amount }));
};

const calculateSavingsRate = (income, expenses) => {
  if (income === 0) return 0;
  return Math.round(((income - expenses) / income) * 10000) / 100;
};

const calculateBudgetUtilization = (spent, limit) => {
  if (limit === 0) return 0;
  return Math.round((spent / limit) * 10000) / 100;
};

const getBudgetStatus = (utilization, thresholds = { normal: 70, approaching: 90 }) => {
  if (utilization > 100) return 'over';
  if (utilization >= thresholds.approaching) return 'near_limit';
  if (utilization >= thresholds.normal) return 'approaching';
  return 'normal';
};

const calculateGoalProgress = (current, target) => {
  if (target === 0) return 0;
  return Math.round((current / target) * 10000) / 100;
};

const generateInsights = (currentMonth, previousMonth, budgets, goals) => {
  const insights = [];

  if (previousMonth && currentMonth) {
    const expenseChange = ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100;
    if (expenseChange > 10) {
      insights.push({
        type: 'warning',
        title: 'Spending Increase',
        message: `Your expenses increased by ${expenseChange.toFixed(1)}% compared with the previous month.`
      });
    } else if (expenseChange < -10) {
      insights.push({
        type: 'positive',
        title: 'Spending Decrease',
        message: `Good job! Your expenses decreased by ${Math.abs(expenseChange).toFixed(1)}% compared with the previous month.`
      });
    }

    if (currentMonth.savings > previousMonth.savings) {
      insights.push({
        type: 'positive',
        title: 'Savings Improved',
        message: `Your savings increased by ₹${(currentMonth.savings - previousMonth.savings).toLocaleString('en-IN')} compared with the previous month.`
      });
    }
  }

  if (budgets && budgets.length > 0) {
    budgets.forEach(b => {
      if (b.utilization >= 90) {
        insights.push({
          type: 'warning',
          title: 'Budget Warning',
          message: `You have used ${b.utilization.toFixed(1)}% of your ${b.category_name} budget.`
        });
      }
    });
  }

  if (goals && goals.length > 0) {
    goals.forEach(g => {
      if (g.progress >= 75 && g.progress < 100) {
        insights.push({
          type: 'info',
          title: 'Goal Progress',
          message: `You are ${g.progress.toFixed(0)}% of the way to your ${g.name} goal.`
        });
      }
    });
  }

  return insights;
};

module.exports = {
  getMonthlyTotals,
  getCategoryTotals,
  calculateSavingsRate,
  calculateBudgetUtilization,
  getBudgetStatus,
  calculateGoalProgress,
  generateInsights
};
