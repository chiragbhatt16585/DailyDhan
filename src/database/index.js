import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

let dbInstance = null;

// Shared default categories so we can safely re-use them
const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', type: 'income', icon: 'cash-multiple', color: '#34A853' },
  { name: 'Freelance', type: 'income', icon: 'briefcase', color: '#1A73E8' },
  { name: 'Investment', type: 'income', icon: 'chart-line', color: '#4CAF50' },
  { name: 'Gift', type: 'income', icon: 'gift', color: '#E91E63' },
  { name: 'Business', type: 'income', icon: 'store', color: '#FB8C00' },
  { name: 'Other Income', type: 'income', icon: 'wallet', color: '#9C27B0' },
];

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food & Dining', type: 'expense', icon: 'food-fork-drink', color: '#F4B400' },
  { name: 'Transportation', type: 'expense', icon: 'car', color: '#1A73E8' },
  { name: 'Shopping', type: 'expense', icon: 'shopping', color: '#E91E63' },
  { name: 'Bills & Utilities', type: 'expense', icon: 'file-invoice-dollar', color: '#FF9800' },
  { name: 'Entertainment', type: 'expense', icon: 'movie', color: '#9C27B0' },
  { name: 'Healthcare', type: 'expense', icon: 'medical-bag', color: '#E91E63' },
  { name: 'Education', type: 'expense', icon: 'school', color: '#3F51B5' },
  { name: 'Travel', type: 'expense', icon: 'airplane', color: '#00BCD4' },
  { name: 'Groceries', type: 'expense', icon: 'cart', color: '#4CAF50' },
  { name: 'Rent', type: 'expense', icon: 'home', color: '#795548' },
  { name: 'Insurance', type: 'expense', icon: 'shield-check', color: '#607D8B' },
  { name: 'Personal Care', type: 'expense', icon: 'account', color: '#FF5722' },
  { name: 'Subscriptions', type: 'expense', icon: 'credit-card', color: '#009688' },
  { name: 'Other Expense', type: 'expense', icon: 'dots-horizontal', color: '#9E9E9E' },
];

export const getDB = async () => {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await SQLite.openDatabase({
    name: 'dailydhan.db',
    location: 'default',
  });

  // 1) Make sure schema exists
  await initSchema(dbInstance);
  // 1.5) Clean up any old duplicates just in case
  await removeDuplicateCategories(dbInstance);
  // 2) Upsert defaults without duplicates
  await initDefaultCategories(dbInstance);
  // 3) Absolute safety net: if somehow still empty, insert everything
  await ensureDefaultCategoriesIfEmpty(dbInstance);
  // 4) Fix any missing colors / icons for existing rows
  await assignColorsToCategories(dbInstance);
  await assignIconsToCategories(dbInstance);

  return dbInstance;
};

// Remove duplicate categories keeping the oldest id per (name, type)
const removeDuplicateCategories = async db => {
  try {
    await db.executeSql(
      `
        DELETE FROM categories
        WHERE id NOT IN (
          SELECT MIN(id) FROM categories GROUP BY name, type
        );
      `,
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to remove duplicate categories', e);
  }
};

// Initialize / upsert default categories on first launch
const initDefaultCategories = async db => {
  try {
    const allCategories = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];

    await db.transaction(async tx => {
      for (const category of allCategories) {
        // Check if category already exists before inserting
        const [existing] = await tx.executeSql(
          'SELECT id, icon, color FROM categories WHERE name = ? AND type = ? LIMIT 1',
          [category.name, category.type],
        );

        if (existing.rows.length === 0) {
          // Insert new category if it doesn't exist
          await tx.executeSql(
            'INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)',
            [category.name, category.type, category.icon, category.color],
          );
        } else {
          // Update existing category if it's missing icon or color
          const existingCategory = existing.rows.item(0);
          const needsUpdate =
            !existingCategory.icon ||
            !existingCategory.color ||
            existingCategory.icon === '' ||
            existingCategory.color === '';

          if (needsUpdate) {
            const updateIcon =
              existingCategory.icon && existingCategory.icon !== ''
                ? existingCategory.icon
                : category.icon;
            const updateColor =
              existingCategory.color && existingCategory.color !== ''
                ? existingCategory.color
                : category.color;

            await tx.executeSql('UPDATE categories SET icon = ?, color = ? WHERE id = ?', [
              updateIcon,
              updateColor,
              existingCategory.id,
            ]);
          }
        }
      }
    });

    // eslint-disable-next-line no-console
    console.log('✅ Default categories initialized/updated');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to initialize default categories', e);
  }
};

// Extra safety: if table is completely empty, insert all defaults
const ensureDefaultCategoriesIfEmpty = async db => {
  try {
    const [result] = await db.executeSql('SELECT COUNT(*) as count FROM categories');
    const count = result.rows.item(0)?.count ?? 0;

    if (count > 0) {
      return;
    }

    const allCategories = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];

    for (const category of allCategories) {
      await db.executeSql(
        'INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)',
        [category.name, category.type, category.icon, category.color],
      );
    }

    // eslint-disable-next-line no-console
    console.log('✅ Default categories inserted because table was empty');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to ensure default categories when table is empty', e);
  }
};

// Assign distinct colors to categories that don't have colors
const assignColorsToCategories = async db => {
  const colorPalette = [
    '#1A73E8', // Blue
    '#F4B400', // Gold
    '#34A853', // Green
    '#E91E63', // Pink
    '#FB8C00', // Orange
    '#9C27B0', // Purple
    '#00BCD4', // Cyan
    '#FF5722', // Deep Orange
    '#795548', // Brown
    '#607D8B', // Blue Grey
    '#4CAF50', // Light Green
    '#FF9800', // Amber
    '#3F51B5', // Indigo
    '#009688', // Teal
    '#CDDC39', // Lime
  ];

  try {
    // Get all categories without colors
    const [result] = await db.executeSql(
      'SELECT id, name FROM categories WHERE color IS NULL OR color = "" ORDER BY id ASC',
    );
    
    const rows = [];
    for (let i = 0; i < result.rows.length; i += 1) {
      rows.push(result.rows.item(i));
    }

    // Assign colors to categories without colors
    for (let i = 0; i < rows.length; i += 1) {
      const category = rows[i];
      const colorIndex = category.id % colorPalette.length;
      const assignedColor = colorPalette[colorIndex];
      
      await db.executeSql('UPDATE categories SET color = ? WHERE id = ?', [
        assignedColor,
        category.id,
      ]);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to assign colors to categories', e);
  }
};

// Assign default icons to categories that don't have icons
const assignIconsToCategories = async db => {
  // Default icon mapping based on category name and type
  const defaultIconMap = {
    // Income icons
    'salary': 'cash-multiple',
    'freelance': 'briefcase',
    'investment': 'chart-line',
    'gift': 'gift',
    'business': 'store',
    'other income': 'wallet',
    // Expense icons
    'food & dining': 'food-fork-drink',
    'transportation': 'car',
    'shopping': 'shopping',
    'bills & utilities': 'file-invoice-dollar',
    'entertainment': 'movie',
    'healthcare': 'medical-bag',
    'education': 'school',
    'travel': 'airplane',
    'groceries': 'cart',
    'rent': 'home',
    'insurance': 'shield-check',
    'personal care': 'account',
    'subscriptions': 'credit-card',
    'other expense': 'dots-horizontal',
  };

  try {
    // Get all categories without icons
    const [result] = await db.executeSql(
      'SELECT id, name, type FROM categories WHERE icon IS NULL OR icon = "" ORDER BY id ASC',
    );
    
    const rows = [];
    for (let i = 0; i < result.rows.length; i += 1) {
      rows.push(result.rows.item(i));
    }

    // Assign icons to categories without icons
    for (let i = 0; i < rows.length; i += 1) {
      const category = rows[i];
      const categoryNameLower = category.name.toLowerCase().trim();
      
      // Try to find matching icon from default map
      let assignedIcon = defaultIconMap[categoryNameLower];
      
      // If no match found, assign default icon based on type
      if (!assignedIcon) {
        assignedIcon = category.type === 'income' ? 'wallet' : 'dots-horizontal';
      }
      
      await db.executeSql('UPDATE categories SET icon = ? WHERE id = ?', [
        assignedIcon,
        category.id,
      ]);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to assign icons to categories', e);
  }
};

export const getMonthlySummary = async (year, month) => {
  const db = await getDB();
  // month is 1-12
  const monthStr = String(month).padStart(2, '0');
  const start = `${year}-${monthStr}-01`;
  const end = `${year}-${monthStr}-31`;

  const [result] = await db.executeSql(
    `
      SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
      FROM transactions
      WHERE date >= ? AND date <= ?
    `,
    [start, end],
  );

  const row = result.rows.length > 0 ? result.rows.item(0) : {};

  const income = row.income || 0;
  const expense = row.expense || 0;

  return {
    income,
    expense,
    balance: income - expense,
  };
};

// Get monthly income and expense data for multiple months (for line chart)
export const getMonthlyIncomeExpenseData = async (numberOfMonths = 6) => {
  const db = await getDB();
  const data = [];
  const currentDate = new Date();
  
  for (let i = numberOfMonths - 1; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const monthStr = String(month).padStart(2, '0');
    const start = `${year}-${monthStr}-01`;
    const end = `${year}-${monthStr}-31`;

    try {
      const [result] = await db.executeSql(
        `
          SELECT
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
          FROM transactions
          WHERE date >= ? AND date <= ?
        `,
        [start, end],
      );

      const row = result.rows.length > 0 ? result.rows.item(0) : {};
      const income = row.income || 0;
      const expense = row.expense || 0;

      data.push({
        month: month,
        year: year,
        monthName: date.toLocaleString('default', { month: 'short' }),
        income: income,
        expense: expense,
      });
    } catch (e) {
      console.warn(`Failed to load data for ${year}-${month}`, e);
      data.push({
        month: month,
        year: year,
        monthName: date.toLocaleString('default', { month: 'short' }),
        income: 0,
        expense: 0,
      });
    }
  }

  return data;
};

export const getExpenseBreakdownByCategory = async (year, month) => {
  const db = await getDB();
  const monthStr = String(month).padStart(2, '0');
  const monthStart = `${year}-${monthStr}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonthStr = String(nextMonth).padStart(2, '0');
  const monthEnd = `${nextYear}-${nextMonthStr}-01`;

  const [result] = await db.executeSql(
    `
      SELECT 
        c.id,
        c.name,
        c.color,
        c.icon,
        COALESCE(SUM(t.amount), 0) AS total_amount
      FROM categories c
      LEFT JOIN transactions t ON t.category_id = c.id 
        AND t.type = 'expense'
        AND t.date >= ? AND t.date < ?
      WHERE c.type = 'expense'
      GROUP BY c.id, c.name, c.color, c.icon
      HAVING total_amount > 0
      ORDER BY total_amount DESC
    `,
    [monthStart, monthEnd],
  );

  const rows = [];
  for (let i = 0; i < result.rows.length; i += 1) {
    rows.push(result.rows.item(i));
  }
  return rows;
};

// Get yearly summary data
export const getYearlySummary = async (year) => {
  const db = await getDB();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const [result] = await db.executeSql(
    `
      SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense,
        COUNT(CASE WHEN type = 'income' THEN 1 END) AS income_count,
        COUNT(CASE WHEN type = 'expense' THEN 1 END) AS expense_count
      FROM transactions
      WHERE date >= ? AND date <= ?
    `,
    [yearStart, yearEnd],
  );

  const row = result.rows.length > 0 ? result.rows.item(0) : {};
  return {
    income: row.income || 0,
    expense: row.expense || 0,
    balance: (row.income || 0) - (row.expense || 0),
    incomeCount: row.income_count || 0,
    expenseCount: row.expense_count || 0,
  };
};

// Get monthly data for a year
export const getYearlyMonthlyData = async (year) => {
  const db = await getDB();
  const data = [];

  for (let month = 1; month <= 12; month += 1) {
    const monthStr = String(month).padStart(2, '0');
    const start = `${year}-${monthStr}-01`;
    const end = `${year}-${monthStr}-31`;

    try {
      const [result] = await db.executeSql(
        `
          SELECT
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
          FROM transactions
          WHERE date >= ? AND date <= ?
        `,
        [start, end],
      );

      const row = result.rows.length > 0 ? result.rows.item(0) : {};
      const date = new Date(year, month - 1, 1);
      data.push({
        month: month,
        year: year,
        monthName: date.toLocaleString('default', { month: 'short' }),
        income: row.income || 0,
        expense: row.expense || 0,
      });
    } catch (e) {
      console.warn(`Failed to load data for ${year}-${month}`, e);
      const date = new Date(year, month - 1, 1);
      data.push({
        month: month,
        year: year,
        monthName: date.toLocaleString('default', { month: 'short' }),
        income: 0,
        expense: 0,
      });
    }
  }

  return data;
};

// Get wallet-wise transaction data
export const getWalletWiseData = async (year, month) => {
  const db = await getDB();
  const monthStr = String(month).padStart(2, '0');
  const monthStart = `${year}-${monthStr}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonthStr = String(nextMonth).padStart(2, '0');
  const monthEnd = `${nextYear}-${nextMonthStr}-01`;

  const [result] = await db.executeSql(
    `
      SELECT 
        w.id,
        w.name,
        w.type,
        w.bank_name,
        w.last_4_digits,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expense,
        COUNT(t.id) AS transaction_count
      FROM wallets w
      LEFT JOIN transactions t ON t.wallet_id = w.id 
        AND t.date >= ? AND t.date < ?
      GROUP BY w.id, w.name, w.type, w.bank_name, w.last_4_digits
      HAVING total_income > 0 OR total_expense > 0
      ORDER BY (total_income + total_expense) DESC
    `,
    [monthStart, monthEnd],
  );

  const rows = [];
  for (let i = 0; i < result.rows.length; i += 1) {
    rows.push(result.rows.item(i));
  }
  return rows;
};

// Get top spending categories (all time or for a period)
export const getTopSpendingCategories = async (limit = 10, year = null, month = null) => {
  const db = await getDB();
  let query = `
    SELECT 
      c.id,
      c.name,
      c.color,
      c.icon,
      COALESCE(SUM(t.amount), 0) AS total_amount,
      COUNT(t.id) AS transaction_count
    FROM categories c
    INNER JOIN transactions t ON t.category_id = c.id 
    WHERE c.type = 'expense'
  `;
  const params = [];

  if (year && month) {
    const monthStr = String(month).padStart(2, '0');
    const monthStart = `${year}-${monthStr}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonthStr = String(nextMonth).padStart(2, '0');
    const monthEnd = `${nextYear}-${nextMonthStr}-01`;
    query += ` AND t.date >= ? AND t.date < ?`;
    params.push(monthStart, monthEnd);
  }

  query += `
    GROUP BY c.id, c.name, c.color, c.icon
    HAVING total_amount > 0
    ORDER BY total_amount DESC
    LIMIT ?
  `;
  params.push(limit);

  const [result] = await db.executeSql(query, params);

  const rows = [];
  for (let i = 0; i < result.rows.length; i += 1) {
    rows.push(result.rows.item(i));
  }
  return rows;
};

// Get income breakdown by category
export const getIncomeBreakdownByCategory = async (year, month) => {
  const db = await getDB();
  const monthStr = String(month).padStart(2, '0');
  const monthStart = `${year}-${monthStr}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonthStr = String(nextMonth).padStart(2, '0');
  const monthEnd = `${nextYear}-${nextMonthStr}-01`;

  const [result] = await db.executeSql(
    `
      SELECT 
        c.id,
        c.name,
        c.color,
        c.icon,
        COALESCE(SUM(t.amount), 0) AS total_amount
      FROM categories c
      LEFT JOIN transactions t ON t.category_id = c.id 
        AND t.type = 'income'
        AND t.date >= ? AND t.date < ?
      WHERE c.type = 'income'
      GROUP BY c.id, c.name, c.color, c.icon
      HAVING total_amount > 0
      ORDER BY total_amount DESC
    `,
    [monthStart, monthEnd],
  );

  const rows = [];
  for (let i = 0; i < result.rows.length; i += 1) {
    rows.push(result.rows.item(i));
  }
  return rows;
};

// Get category analysis (all categories with spending over time)
export const getCategoryAnalysis = async (limit = 20) => {
  const db = await getDB();
  const [result] = await db.executeSql(
    `
      SELECT 
        c.id,
        c.name,
        c.type,
        c.color,
        c.icon,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expense,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS total_income,
        COUNT(t.id) AS transaction_count
      FROM categories c
      LEFT JOIN transactions t ON t.category_id = c.id
      GROUP BY c.id, c.name, c.type, c.color, c.icon
      HAVING total_expense > 0 OR total_income > 0
      ORDER BY (total_expense + total_income) DESC
      LIMIT ?
    `,
    [limit],
  );

  const rows = [];
  for (let i = 0; i < result.rows.length; i += 1) {
    rows.push(result.rows.item(i));
  }
  return rows;
};

// ==================== BUDGET MANAGEMENT FUNCTIONS ====================

// Create or update a budget
export const saveBudget = async (categoryId, amount, period, year, month) => {
  const db = await getDB();
  
  // Check if budget already exists
  let query, params;
  if (period === 'monthly') {
    query = 'SELECT id FROM budgets WHERE category_id = ? AND period = ? AND year = ? AND month = ?';
    params = [categoryId, period, year, month];
  } else {
    query = 'SELECT id FROM budgets WHERE category_id = ? AND period = ? AND year = ?';
    params = [categoryId, period, year];
  }
  
  const [existing] = await db.executeSql(query, params);
  
  if (existing.rows.length > 0) {
    // Update existing budget
    const budgetId = existing.rows.item(0).id;
    if (period === 'monthly') {
      await db.executeSql(
        'UPDATE budgets SET amount = ? WHERE id = ?',
        [amount, budgetId]
      );
    } else {
      await db.executeSql(
        'UPDATE budgets SET amount = ? WHERE id = ?',
        [amount, budgetId]
      );
    }
    return budgetId;
  } else {
    // Create new budget
    const [result] = await db.executeSql(
      'INSERT INTO budgets (category_id, amount, period, year, month) VALUES (?, ?, ?, ?, ?)',
      [categoryId, amount, period, year, month]
    );
    return result.insertId;
  }
};

// Get all budgets for a specific period
export const getBudgets = async (period, year, month = null) => {
  const db = await getDB();
  let query, params;
  
  if (period === 'monthly' && month !== null) {
    query = `
      SELECT 
        b.id,
        b.category_id,
        b.amount,
        b.period,
        b.year,
        b.month,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        c.type AS category_type
      FROM budgets b
      JOIN categories c ON c.id = b.category_id
      WHERE b.period = ? AND b.year = ? AND b.month = ?
      ORDER BY c.name ASC
    `;
    params = [period, year, month];
  } else if (period === 'yearly') {
    query = `
      SELECT 
        b.id,
        b.category_id,
        b.amount,
        b.period,
        b.year,
        b.month,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        c.type AS category_type
      FROM budgets b
      JOIN categories c ON c.id = b.category_id
      WHERE b.period = ? AND b.year = ?
      ORDER BY c.name ASC
    `;
    params = [period, year];
  } else {
    return [];
  }
  
  const [result] = await db.executeSql(query, params);
  const rows = [];
  for (let i = 0; i < result.rows.length; i += 1) {
    rows.push(result.rows.item(i));
  }
  return rows;
};

// Get budget vs actual spending for a period
export const getBudgetVsActual = async (period, year, month = null) => {
  const db = await getDB();
  let monthStart, monthEnd, yearStart, yearEnd, query, params;
  
  if (period === 'monthly' && month !== null) {
    monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    
    query = `
      SELECT 
        b.id AS budget_id,
        b.category_id,
        b.amount AS budget_amount,
        b.period,
        b.year,
        b.month,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS actual_spending,
        COUNT(t.id) AS transaction_count
      FROM budgets b
      JOIN categories c ON c.id = b.category_id
      LEFT JOIN transactions t ON t.category_id = b.category_id AND t.date >= ? AND t.date < ?
      WHERE b.period = ? AND b.year = ? AND b.month = ?
      GROUP BY b.id, b.category_id, b.amount, b.period, b.year, b.month, c.name, c.icon, c.color
      ORDER BY c.name ASC
    `;
    params = [monthStart, monthEnd, period, year, month];
  } else if (period === 'yearly') {
    yearStart = `${year}-01-01`;
    yearEnd = `${year + 1}-01-01`;
    
    query = `
      SELECT 
        b.id AS budget_id,
        b.category_id,
        b.amount AS budget_amount,
        b.period,
        b.year,
        b.month,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS actual_spending,
        COUNT(t.id) AS transaction_count
      FROM budgets b
      JOIN categories c ON c.id = b.category_id
      LEFT JOIN transactions t ON t.category_id = b.category_id AND t.date >= ? AND t.date < ?
      WHERE b.period = ? AND b.year = ?
      GROUP BY b.id, b.category_id, b.amount, b.period, b.year, b.month, c.name, c.icon, c.color
      ORDER BY c.name ASC
    `;
    params = [yearStart, yearEnd, period, year];
  } else {
    return [];
  }
  
  const [result] = await db.executeSql(query, params);
  const rows = [];
  for (let i = 0; i < result.rows.length; i += 1) {
    const row = result.rows.item(i);
    const budgetAmount = row.budget_amount || 0;
    const actualSpending = row.actual_spending || 0;
    const remaining = budgetAmount - actualSpending;
    const percentage = budgetAmount > 0 ? (actualSpending / budgetAmount) * 100 : 0;
    const isOverBudget = actualSpending > budgetAmount;
    
    rows.push({
      ...row,
      remaining,
      percentage: Math.min(percentage, 100),
      isOverBudget,
    });
  }
  return rows;
};

// Delete a budget
export const deleteBudget = async (budgetId) => {
  const db = await getDB();
  await db.executeSql('DELETE FROM budgets WHERE id = ?', [budgetId]);
};

// Get all budgets (for management screen)
export const getAllBudgets = async () => {
  const db = await getDB();
  const [result] = await db.executeSql(
    `
      SELECT 
        b.id,
        b.category_id,
        b.amount,
        b.period,
        b.year,
        b.month,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        c.type AS category_type
      FROM budgets b
      JOIN categories c ON c.id = b.category_id
      ORDER BY b.year DESC, b.month DESC, c.name ASC
    `
  );
  
  const rows = [];
  for (let i = 0; i < result.rows.length; i += 1) {
    rows.push(result.rows.item(i));
  }
  return rows;
};

// ==================== RECURRING TRANSACTIONS FUNCTIONS ====================

// Calculate next due date based on frequency
const calculateNextDueDate = (currentDate, frequency) => {
  const date = new Date(currentDate);
  
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setDate(date.getDate() + 1);
  }
  
  return date.toISOString().split('T')[0];
};

// Create or update a recurring transaction
export const saveRecurringTransaction = async (recurringData) => {
  const db = await getDB();
  const {
    id,
    amount,
    type,
    categoryId,
    walletId,
    frequency,
    startDate,
    note,
    isActive = 1,
  } = recurringData;
  
  const nextDueDate = calculateNextDueDate(startDate, frequency);
  
  if (id) {
    // Update existing
    await db.executeSql(
      `UPDATE recurring_transactions 
       SET amount = ?, type = ?, category_id = ?, wallet_id = ?, frequency = ?, 
           start_date = ?, next_due_date = ?, note = ?, is_active = ?
       WHERE id = ?`,
      [amount, type, categoryId, walletId, frequency, startDate, nextDueDate, note, isActive, id]
    );
    return id;
  } else {
    // Create new
    const [result] = await db.executeSql(
      `INSERT INTO recurring_transactions 
       (amount, type, category_id, wallet_id, frequency, start_date, next_due_date, note, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [amount, type, categoryId, walletId, frequency, startDate, nextDueDate, note, isActive]
    );
    return result.insertId;
  }
};

// Get all recurring transactions
export const getAllRecurringTransactions = async () => {
  const db = await getDB();
  const [result] = await db.executeSql(
    `
      SELECT 
        r.id,
        r.amount,
        r.type,
        r.category_id,
        r.wallet_id,
        r.frequency,
        r.start_date,
        r.next_due_date,
        r.note,
        r.is_active,
        r.last_created_date,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        w.name AS wallet_name
      FROM recurring_transactions r
      LEFT JOIN categories c ON c.id = r.category_id
      LEFT JOIN wallets w ON w.id = r.wallet_id
      ORDER BY r.next_due_date ASC, r.created_at DESC
    `
  );
  
  const rows = [];
  for (let i = 0; i < result.rows.length; i += 1) {
    rows.push(result.rows.item(i));
  }
  return rows;
};

// Get active recurring transactions that are due
export const getDueRecurringTransactions = async () => {
  const db = await getDB();
  const today = new Date().toISOString().split('T')[0];
  
  const [result] = await db.executeSql(
    `
      SELECT 
        r.id,
        r.amount,
        r.type,
        r.category_id,
        r.wallet_id,
        r.frequency,
        r.start_date,
        r.next_due_date,
        r.note,
        r.last_created_date,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        w.name AS wallet_name
      FROM recurring_transactions r
      LEFT JOIN categories c ON c.id = r.category_id
      LEFT JOIN wallets w ON w.id = r.wallet_id
      WHERE r.is_active = 1 AND r.next_due_date <= ?
      ORDER BY r.next_due_date ASC
    `,
    [today]
  );
  
  const rows = [];
  for (let i = 0; i < result.rows.length; i += 1) {
    rows.push(result.rows.item(i));
  }
  return rows;
};

// Create a transaction from a recurring template
export const createTransactionFromRecurring = async (recurringId) => {
  const db = await getDB();
  
  // Get the recurring transaction
  const [recurringResult] = await db.executeSql(
    'SELECT * FROM recurring_transactions WHERE id = ?',
    [recurringId]
  );
  
  if (recurringResult.rows.length === 0) {
    throw new Error('Recurring transaction not found');
  }
  
  const recurring = recurringResult.rows.item(0);
  
  // Create the transaction
  const [transactionResult] = await db.executeSql(
    `INSERT INTO transactions (amount, type, category_id, wallet_id, date, note)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      recurring.amount,
      recurring.type,
      recurring.category_id,
      recurring.wallet_id,
      recurring.next_due_date,
      recurring.note || `Recurring: ${recurring.frequency}`,
    ]
  );
  
  // Update next due date and last created date
  const nextDueDate = calculateNextDueDate(recurring.next_due_date, recurring.frequency);
  const today = new Date().toISOString().split('T')[0];
  
  await db.executeSql(
    'UPDATE recurring_transactions SET next_due_date = ?, last_created_date = ? WHERE id = ?',
    [nextDueDate, today, recurringId]
  );
  
  return transactionResult.insertId;
};

// Process all due recurring transactions
export const processDueRecurringTransactions = async () => {
  const dueRecurring = await getDueRecurringTransactions();
  const createdTransactions = [];
  
  for (const recurring of dueRecurring) {
    try {
      const transactionId = await createTransactionFromRecurring(recurring.id);
      createdTransactions.push({
        recurringId: recurring.id,
        transactionId,
        categoryName: recurring.category_name,
        amount: recurring.amount,
      });
    } catch (error) {
      console.warn(`Failed to create transaction from recurring ${recurring.id}:`, error);
    }
  }
  
  return createdTransactions;
};

// Delete a recurring transaction
export const deleteRecurringTransaction = async (recurringId) => {
  const db = await getDB();
  await db.executeSql('DELETE FROM recurring_transactions WHERE id = ?', [recurringId]);
};

// Toggle active status of recurring transaction
export const toggleRecurringTransactionStatus = async (recurringId, isActive) => {
  const db = await getDB();
  await db.executeSql(
    'UPDATE recurring_transactions SET is_active = ? WHERE id = ?',
    [isActive ? 1 : 0, recurringId]
  );
};

const initSchema = async db => {
  const schema = `
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'cash',
      bank_name TEXT,
      last_4_digits TEXT,
      balance REAL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT,
      color TEXT
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category_id INTEGER,
      wallet_id INTEGER,
      date TEXT,
      note TEXT,
      attachment TEXT,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (wallet_id) REFERENCES wallets(id)
    );
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      period TEXT NOT NULL,
      year INTEGER,
      month INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category_id INTEGER,
      wallet_id INTEGER,
      frequency TEXT NOT NULL,
      start_date TEXT NOT NULL,
      next_due_date TEXT NOT NULL,
      note TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_created_date TEXT,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (wallet_id) REFERENCES wallets(id)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_type
      ON categories(name, type);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_category_period
      ON budgets(category_id, period, year, month);
  `;

  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);

  await db.transaction(tx => {
    statements.forEach(stmt => {
      tx.executeSql(stmt + ';');
    });
  });

  // Migrate wallets table to add new columns if they don't exist
  try {
    await db.executeSql(`
      ALTER TABLE wallets ADD COLUMN type TEXT DEFAULT 'cash';
    `);
  } catch (e) {
    // Column might already exist, ignore
  }
  
  try {
    await db.executeSql(`
      ALTER TABLE wallets ADD COLUMN bank_name TEXT;
    `);
  } catch (e) {
    // Column might already exist, ignore
  }
  
  try {
    await db.executeSql(`
      ALTER TABLE wallets ADD COLUMN last_4_digits TEXT;
    `);
  } catch (e) {
    // Column might already exist, ignore
  }
  
  // Create budgets table if it doesn't exist (for existing databases)
  try {
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        period TEXT NOT NULL,
        year INTEGER,
        month INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );
    `);
  } catch (e) {
    // Table might already exist, ignore
  }
  
  try {
    await db.executeSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_category_period
      ON budgets(category_id, period, year, month);
    `);
  } catch (e) {
    // Index might already exist, ignore
  }
  
  // Create recurring_transactions table if it doesn't exist (for existing databases)
  try {
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS recurring_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        category_id INTEGER,
        wallet_id INTEGER,
        frequency TEXT NOT NULL,
        start_date TEXT NOT NULL,
        next_due_date TEXT NOT NULL,
        note TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_created_date TEXT,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (wallet_id) REFERENCES wallets(id)
      );
    `);
  } catch (e) {
    // Table might already exist, ignore
  }
};


